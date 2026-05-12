import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Guard funcional para rutas privadas.
// Si el usuario no está autenticado, lo redirige a /login y guarda
// la URL original en queryParams para volver allí tras el login.
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // returnUrl permite a la página de login redirigir al usuario al destino
  // al que intentaba acceder antes de ser interceptado.
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
