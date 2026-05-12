import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="notfound">
      <div class="notfound__inner">
        <span class="notfound__icon" aria-hidden="true">
          <i class="bi bi-cup-hot"></i>
        </span>
        <h1 class="notfound__code">404</h1>
        <p class="notfound__msg">Esta página no existe</p>
        <p class="notfound__hint">
          Puede que el enlace esté roto o que la receta haya sido eliminada.
        </p>
        <a routerLink="/" class="notfound__btn">
          <i class="bi bi-house" aria-hidden="true"></i>
          Volver al inicio
        </a>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .notfound {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-7) var(--space-4);
        background: var(--color-bg);
      }

      .notfound__inner {
        text-align: center;
        background: var(--color-surface);
        padding: var(--space-8) var(--space-6);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-lg);
        max-width: 480px;
        width: 100%;
      }

      .notfound__icon {
        font-size: 3rem;
        color: var(--color-primary);
        display: block;
        margin-bottom: var(--space-2);
      }

      .notfound__code {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(4rem, 18vw, 7rem);
        font-weight: 800;
        line-height: 1;
        letter-spacing: -0.04em;
        background: linear-gradient(
          135deg,
          var(--color-primary) 0%,
          var(--color-primary-hover) 100%
        );
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .notfound__msg {
        margin: var(--space-3) 0 var(--space-2);
        font-family: var(--font-display);
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-text);
      }

      .notfound__hint {
        margin: 0 0 var(--space-6);
        color: var(--color-text-soft);
        font-size: var(--font-size-base);
        line-height: 1.5;
      }

      .notfound__btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-5);
        background: var(--color-primary);
        color: #fff;
        text-decoration: none;
        border-radius: var(--radius-pill);
        font-weight: 600;
        transition: all var(--transition-fast);
      }

      .notfound__btn:hover {
        background: var(--color-primary-hover);
        color: #fff;
        transform: translateY(-1px);
      }
    `
  ]
})
export class NotFoundComponent {}
