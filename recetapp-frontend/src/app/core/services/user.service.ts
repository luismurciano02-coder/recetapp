import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { UpdateProfilePayload, User } from '../models/user.model';
import { AuthService } from './auth.service';
import { RecipeSummary } from '../models/recipe.model';
import { environment } from '../../../environments/environment';

interface BackendProfileResponse {
  gmail: string;
  roles: string[];
  perfil: string;
  created_at: string;
}

function mapProfileToUser(p: BackendProfileResponse): User {
  return {
    id: 0,
    username: (p.gmail ?? '').split('@')[0] || p.gmail,
    email: p.gmail,
    avatar: p.perfil && p.perfil.length > 0 ? p.perfil : undefined
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  // GET /api/perfil
  getProfile(): Observable<User> {
    return this.http.get<BackendProfileResponse>(`${this.apiUrl}/perfil`).pipe(
      map(mapProfileToUser),
      tap((user) => this.auth.setCurrentUser(user))
    );
  }

  // PUT /api/perfil — el backend solo soporta cambiar `perfil` (avatar)
  // y `password`. El username no se guarda en BD (se deriva del gmail).
  updateProfile(payload: UpdateProfilePayload): Observable<User> {
    const body: Record<string, string> = {};
    if (payload.avatar !== undefined) body['perfil'] = payload.avatar;
    return this.http
      .put<{ mensaje: string }>(`${this.apiUrl}/perfil`, body)
      .pipe(
        // Tras editar, recargamos el perfil para tener los datos al día.
        // Si no hay endpoint para devolverlo, sintetizamos el User a mano.
        map(() => {
          const current = this.auth.currentUser();
          const merged: User = {
            id: current?.id ?? 0,
            username: payload.username ?? current?.username ?? '',
            email: current?.email ?? '',
            avatar: payload.avatar ?? current?.avatar,
            bio: payload.bio ?? current?.bio
          };
          this.auth.setCurrentUser(merged);
          return merged;
        })
      );
  }

  // El backend no expone "mis recetas" como tal. Devolvemos lista vacía
  // y dejamos que el componente caiga al fallback (filtrar destacadas
  // por autor).
  getMyRecipes(): Observable<RecipeSummary[]> {
    return of([] as RecipeSummary[]);
  }
}
