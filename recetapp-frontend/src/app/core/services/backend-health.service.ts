import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

// Servicio que vigila si el backend Symfony está disponible.
//
// Estrategia:
//   1. Al arrancar la app un APP_INITIALIZER llama a check() y hace ping
//      a un endpoint público (GET /api/recipes). Si responde, isUp = true.
//      Si la petición falla (status 0 o 5xx), isUp = false y la app
//      muestra una pantalla de "servidor no disponible" en lugar de la UI.
//   2. Si durante la sesión cualquier request falla con status 0
//      (red caída, XAMPP detenido), el interceptor llama a markDown()
//      para volver a bloquear la UI inmediatamente.
//   3. Botón "Reintentar" → llama de nuevo a check().
@Injectable({ providedIn: 'root' })
export class BackendHealthService {
  private http = inject(HttpClient);

  // Signal expuesto. Empieza en `null` para indicar "todavía no se sabe":
  // el shell esconde la UI hasta que el ping inicial responde.
  private readonly _isUp = signal<boolean | null>(null);
  readonly isUp = this._isUp.asReadonly();

  // Hace el ping. Devuelve Observable<boolean> para poder consumirlo
  // tanto desde provideAppInitializer como desde un botón "Reintentar".
  //
  // Importante: consideramos el backend "vivo" si responde CUALQUIER
  // status HTTP (200, 401, 404, 500…). Solo marcamos como caído cuando
  // la petición no llega al servidor (status === 0: red caída, CORS
  // bloqueado, Apache apagado). Un 401 significa "auth requerida" pero
  // el servidor responde, así que está vivo.
  check(): Observable<boolean> {
    // /api/recetas es público (GET) en el backend Symfony.
    return this.http
      .get(`${environment.apiUrl}/recetas`, { observe: 'response' })
      .pipe(
        map(() => true),
        catchError((err: HttpErrorResponse) => of(err.status > 0)),
        tap((up) => this._isUp.set(up))
      );
  }

  // Marca el backend como caído. Lo invoca el interceptor cuando una
  // petición devuelve status 0 (= no hubo respuesta del servidor).
  markDown(): void {
    this._isUp.set(false);
  }

  // Marca el backend como recuperado. Útil tras un reintento exitoso.
  markUp(): void {
    this._isUp.set(true);
  }
}
