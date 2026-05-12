import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { ToastComponent } from './shared/toast/toast.component';
import { ServerDownComponent } from './shared/server-down/server-down.component';
import { BackendHealthService } from './core/services/backend-health.service';

// Shell de la app. Solo renderiza la UI normal si el backend está vivo.
// Mientras se hace el ping inicial (isUp === null) no pintamos nada para
// evitar parpadeo. Si el ping falla → <app-server-down/>.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent, ServerDownComponent],
  template: `
    @if (health.isUp() === true) {
      <app-navbar />
      <main class="app-main">
        <router-outlet />
      </main>
      <app-toast />
    } @else if (health.isUp() === false) {
      <app-server-down />
    }
    <!-- isUp === null → no se renderiza nada hasta que termine el ping. -->
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--color-bg);
      }

      .app-main {
        min-height: 100vh;
        padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
      }

      @media (min-width: 992px) {
        .app-main {
          padding-left: var(--sidebar-width);
          padding-bottom: 0;
        }
      }
    `
  ]
})
export class App {
  health = inject(BackendHealthService);
}
