import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrapper" role="status" aria-live="polite">
      <div class="spinner"></div>
      <span class="visually-hidden">Cargando...</span>
    </div>
  `,
  styles: [
    `
      .spinner-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: var(--space-6);
      }

      .spinner {
        width: 44px;
        height: 44px;
        border: 3px solid var(--color-border);
        border-top-color: var(--color-primary);
        border-radius: 50%;
        animation: spin 0.9s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `
  ]
})
export class LoadingSpinnerComponent {}
