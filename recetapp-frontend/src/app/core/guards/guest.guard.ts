import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Guard funcional para rutas exclusivas de usuarios anónimos (login y registro).
// Si ya hay sesión iniciada, redirige al inicio: no tiene sentido
// volver al formulario de login estando ya logueado.
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
