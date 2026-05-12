import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BackendHealthService } from '../services/backend-health.service';

// Lista de rutas privadas. Si una petición devuelve 401 mientras el
// usuario está en una de estas, lo redirigimos al login con returnUrl.
// En rutas públicas (/, /search, /recipes/:id) solo limpiamos el token
// caducado y dejamos al usuario seguir navegando como invitado.
const PRIVATE_ROUTE_PATTERNS = [
  /^\/profile/,
  /^\/saved/,
  /^\/recipes\/new/,
  /^\/recipes\/\d+\/edit/
];

function isPrivateRoute(url: string): boolean {
  // Quitamos query string y hash para que /profile?x=1 también encaje.
  const path = url.split('?')[0].split('#')[0];
  return PRIVATE_ROUTE_PATTERNS.some((re) => re.test(path));
}

// Interceptor funcional aplicado a todas las peticiones HTTP:
//   1. Añade el JWT en Authorization si existe.
//   2. status 0 (sin respuesta) → marca el backend como caído.
//   3. status 401 con token caducado:
//      - Limpia la sesión SIEMPRE.
//      - Solo redirige al login si el usuario estaba en una ruta privada.
//      - Si estaba en una ruta pública (home, búsqueda, detalle de receta)
//        lo dejamos seguir navegando como invitado.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const health = inject(BackendHealthService);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        health.markDown();
      }

      if (err.status === 401 && token) {
        // Token caducado o inválido → limpiar sesión.
        auth.logout();

        // Redirigir solo si estaba en una zona que necesita auth.
        const currentUrl = router.url;
        if (isPrivateRoute(currentUrl)) {
          router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
        }
        // En cualquier otra ruta (home, search, detalle…) no hacemos
        // navegación: el usuario continúa donde estaba como invitado.
      }

      return throwError(() => err);
    })
  );
};
