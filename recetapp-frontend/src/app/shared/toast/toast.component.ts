import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-stack" role="alert" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.kind }}">
          <span class="toast__icon" aria-hidden="true">
            @switch (toast.kind) {
              @case ('success') { <i class="bi bi-check-lg"></i> }
              @case ('error')   { <i class="bi bi-x-lg"></i> }
              @default          { <i class="bi bi-info-lg"></i> }
            }
          </span>
          <span class="toast__msg">{{ toast.message }}</span>
          <button
            type="button"
            class="toast__close"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Cerrar notificación"
          >
            <i class="bi bi-x" aria-hidden="true"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        pointer-events: none;
      }

      .toast-stack {
        position: fixed;
        bottom: var(--space-5);
        right: var(--space-5);
        z-index: var(--z-toast);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        max-width: calc(100vw - var(--space-7));
        width: 360px;
      }

      .toast {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        background: var(--color-surface);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        font-size: var(--font-size-sm);
        border-left: 4px solid var(--color-primary);
        animation: toast-in 0.22s ease-out;
      }

      .toast--success {
        border-left-color: var(--color-success);
      }

      .toast--error {
        border-left-color: var(--color-danger);
      }

      .toast--info {
        border-left-color: var(--color-primary);
      }

      .toast__icon {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: #fff;
      }

      .toast--success .toast__icon {
        background: var(--color-success);
      }

      .toast--error .toast__icon {
        background: var(--color-danger);
      }

      .toast--info .toast__icon {
        background: var(--color-primary);
      }

      .toast__msg {
        flex: 1;
        line-height: 1.4;
        color: var(--color-text);
      }

      .toast__close {
        flex-shrink: 0;
        background: transparent;
        border: 0;
        cursor: pointer;
        font-size: 1.1rem;
        line-height: 1;
        color: var(--color-text-muted);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        transition: background var(--transition-fast), color var(--transition-fast);
      }

      .toast__close:hover {
        background: var(--color-bg-soft);
        color: var(--color-text);
      }

      @keyframes toast-in {
        from {
          transform: translateX(20px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @media (max-width: 540px) {
        .toast-stack {
          width: auto;
          left: var(--space-3);
          right: var(--space-3);
          /* Subir el toast por encima del bottom nav móvil. */
          bottom: calc(var(--bottom-nav-height) + var(--space-3));
          max-width: none;
        }
      }
    `
  ]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
