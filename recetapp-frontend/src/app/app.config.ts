import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { BackendHealthService } from './core/services/backend-health.service';

// Configuración raíz de la app. Lo nuevo aquí es provideAppInitializer:
// dispara un ping al backend al arrancar Angular y bloquea el bootstrap
// hasta que sepamos si el servidor está vivo. Si está caído, el shell
// muestra <app-server-down/> en lugar de la UI normal.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),

    // Ping inicial al backend antes de pintar nada.
    provideAppInitializer(() => {
      const health = inject(BackendHealthService);
      return health.check();
    })
  ]
};
