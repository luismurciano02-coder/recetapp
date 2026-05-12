import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Comment, CommentPayload } from '../models/comment.model';
import { environment } from '../../../environments/environment';

interface BackendComment {
  id: number;
  texto: string;
  valoracion: number | null;
  usuario: string; // gmail
  created_at: string;
}

function mapComment(c: BackendComment): Comment {
  const username = (c.usuario ?? '').split('@')[0] || c.usuario;
  return {
    id: c.id,
    content: c.texto,
    createdAt: c.created_at,
    author: {
      id: 0,
      username
    }
  };
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // GET /api/comentarios/receta/{id}
  list(recipeId: number): Observable<Comment[]> {
    return this.http
      .get<BackendComment[]>(`${this.apiUrl}/comentarios/receta/${recipeId}`)
      .pipe(map((arr) => arr.map(mapComment)));
  }

  // POST /api/comentarios/receta/{id} — el backend espera `texto`,
  // no `content`.
  add(recipeId: number, payload: CommentPayload): Observable<Comment> {
    return this.http
      .post<{ mensaje: string; id: number }>(`${this.apiUrl}/comentarios/receta/${recipeId}`, {
        texto: payload.content
      })
      .pipe(
        map((res) => ({
          id: res.id,
          content: payload.content,
          createdAt: new Date().toISOString(),
          author: { id: 0, username: 'tú' }
        }))
      );
  }
}
