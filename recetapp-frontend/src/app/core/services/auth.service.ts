import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';
import {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User
} from '../models/user.model';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

const TOKEN_KEY = 'recetapp_token';
const USER_KEY = 'recetapp_user';

// Tipos que reflejan la API real del backend Symfony.
// El backend usa "gmail" en vez de "email" y no tiene campo "username":
// derivamos el username de la parte del gmail antes de la "@".
interface BackendLoginResponse {
  token: string;
}

interface BackendProfileResponse {
  gmail: string;
  roles: string[];
  perfil: string;
  created_at: string;
}

// Mapper: convierte la respuesta de /api/perfil al modelo User
// que usa el resto del frontend.
function mapProfileToUser(profile: BackendProfileResponse): User {
  return {
    id: 0, // el backend no devuelve id en /perfil; lo dejamos en 0
    username: (profile.gmail ?? '').split('@')[0] || profile.gmail,
    email: profile.gmail,
    avatar: profile.perfil && profile.perfil.length > 0 ? profile.perfil : undefined
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private readonly apiUrl = environment.apiUrl;

  private readonly _currentUser = signal<User | null>(this.loadStoredUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  // POST /api/login → { token }
  // Tras obtener el token hacemos GET /api/perfil para tener los datos
  // del usuario. El interceptor ya añade Authorization: Bearer al perfil.
  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<BackendLoginResponse>(`${this.apiUrl}/login`, {
        gmail: payload.email,
        password: payload.password
      })
      .pipe(
        // Guardamos el token de inmediato para que la siguiente petición
        // (perfil) salga ya con la cabecera Authorization.
        tap((res) => localStorage.setItem(TOKEN_KEY, res.token)),
        switchMap((res) =>
          this.http
            .get<BackendProfileResponse>(`${this.apiUrl}/perfil`)
            .pipe(
              map((profile) => {
                const user = mapProfileToUser(profile);
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                this._currentUser.set(user);
                this.toast.success(`¡Bienvenido, @${user.username}!`);
                return { token: res.token, user } as LoginResponse;
              })
            )
        ),
        catchError((err: HttpErrorResponse) => {
          // Si el login falló limpiamos el token que pudimos haber guardado.
          localStorage.removeItem(TOKEN_KEY);
          this.toast.error(
            err.status === 401
              ? 'Email o contraseña incorrectos.'
              : 'No se pudo iniciar sesión. Inténtalo de nuevo.'
          );
          return throwError(() => err);
        })
      );
  }

  // POST /api/registro → { mensaje: '...' } (status 201)
  //
  // Tras crear la cuenta correctamente iniciamos sesión automáticamente
  // con las mismas credenciales para que el usuario entre directo a la
  // app sin tener que pasar por /login otra vez.
  //
  // Encadenamos: POST /registro → POST /login → GET /perfil. Si alguno
  // falla, el catchError limpia la sesión y propaga el error al componente.
  register(payload: RegisterPayload): Observable<User> {
    return this.http
      .post<{ mensaje: string }>(`${this.apiUrl}/registro`, {
        gmail: payload.email,
        password: payload.password
      })
      .pipe(
        // Auto-login con las mismas credenciales que acaba de registrar.
        switchMap(() =>
          this.login({ email: payload.email, password: payload.password })
        ),
        // login() devuelve LoginResponse → exponemos solo el User.
        map((res) => res.user)
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setCurrentUser(user: User): void {
    this._currentUser.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Carga el usuario persistido. Comprueba en orden:
  //   1. Estado inconsistente (user sin token, o token sin user) → limpia.
  //   2. Token JWT caducado (campo `exp` en el payload) → limpia.
  //   3. JSON corrupto → limpia.
  // Si todo está bien, devuelve el User para que la app arranque ya
  // logueada y sin redirects fantasmas a /login.
  private loadStoredUser(): User | null {
    const rawUser = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);

    if ((rawUser && !token) || (!rawUser && token)) {
      this.clearStorage();
      return null;
    }

    if (!rawUser || !token) return null;

    // Verificamos que el token JWT no esté caducado. Si lo está,
    // limpiamos para que la app arranque como invitado en lugar de
    // intentar peticiones autenticadas que devolverían 401.
    if (this.isTokenExpired(token)) {
      this.clearStorage();
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      this.clearStorage();
      return null;
    }
  }

  // Decodifica el payload del JWT (parte central, base64) y comprueba
  // el campo `exp` (timestamp Unix en segundos).
  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof payload.exp !== 'number') return false;
      // Si exp ya pasó, el token no sirve.
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
