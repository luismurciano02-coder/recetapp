import { Component, inject, signal } from '@angular/core';
import { BackendHealthService } from '../../core/services/backend-health.service';

// Pantalla de bloqueo cuando el backend no responde. Mensaje breve
// y botón "Reintentar" — sin detalles técnicos para el usuario final.
@Component({
  selector: 'app-server-down',
  standalone: true,
  template: `
    <section class="down">
      <div class="down__inner">
        <span class="down__icon" aria-hidden="true">
          <i class="bi bi-cloud-slash"></i>
        </span>
        <h1>Servicio no disponible</h1>
        <p>RecetApp no está disponible en este momento.</p>

        <button
          type="button"
          class="down__btn"
          (click)="retry()"
          [disabled]="checking()"
        >
          @if (checking()) {
            <i class="bi bi-arrow-repeat spin" aria-hidden="true"></i>
            <span>Comprobando...</span>
          } @else {
            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
            <span>Reintentar</span>
          }
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .down {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-7) var(--space-4);
        background:
          radial-gradient(circle at 30% 30%, var(--color-danger-light) 0%, transparent 50%),
          radial-gradient(circle at 70% 70%, var(--color-bg-soft) 0%, transparent 50%),
          var(--color-bg);
      }

      .down__inner {
        background: var(--color-surface);
        padding: var(--space-7) var(--space-6);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-lg);
        max-width: 440px;
        width: 100%;
        text-align: center;
      }

      .down__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: var(--color-danger-light);
        color: var(--color-danger);
        font-size: 2rem;
        margin-bottom: var(--space-4);
      }

      .down__inner h1 {
        margin: 0 0 var(--space-2);
        font-family: var(--font-display);
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-text);
      }

      .down__inner p {
        margin: 0 0 var(--space-5);
        color: var(--color-text-soft);
      }

      .down__btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-6);
        background: var(--color-primary);
        color: #fff;
        border: 0;
        border-radius: var(--radius-pill);
        font-weight: 600;
        font-size: var(--font-size-base);
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .down__btn:hover:not(:disabled) {
        background: var(--color-primary-hover);
      }

      .down__btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class ServerDownComponent {
  private health = inject(BackendHealthService);
  checking = signal(false);

  retry(): void {
    this.checking.set(true);
    this.health.check().subscribe({
      next: () => this.checking.set(false),
      error: () => this.checking.set(false)
    });
  }
}
