import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <section class="auth">
      <div class="auth__card">
        <div class="auth__brand">
          <span class="auth__brand-icon" aria-hidden="true">
            <!-- Gorro de chef SVG inline (mismo logo que la navbar). -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="auth__brand-svg">
              <path d="M17 21H7c-.55 0-1-.45-1-1v-3h12v3c0 .55-.45 1-1 1zm0-6H7c-2.76 0-5-2.24-5-5 0-2.21 1.79-4 4-4 .07 0 .13.01.2.01.84-2.3 3.08-4.01 5.8-4.01s4.96 1.71 5.8 4.01c.07 0 .13-.01.2-.01 2.21 0 4 1.79 4 4 0 2.76-2.24 5-5 5z"/>
            </svg>
          </span>
          <span class="auth__brand-text">RecetApp</span>
        </div>

        <h1 class="auth__title">Bienvenido de nuevo</h1>
        <p class="auth__subtitle">Inicia sesión para guardar tus recetas favoritas.</p>

        <!-- Toggle entre Iniciar sesión y Registro. -->
        <div class="auth__toggle" role="tablist">
          <button type="button" class="auth__toggle-btn active" role="tab" aria-selected="true">
            Iniciar sesión
          </button>
          <a routerLink="/register" class="auth__toggle-btn" role="tab">
            Crear cuenta
          </a>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth__form" novalidate>
          <label class="field">
            <span class="field__label">Email</span>
            <div class="field__input">
              <i class="bi bi-envelope" aria-hidden="true"></i>
              <input
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
            @if (showError('email', 'required')) {
              <span class="field__error">El email es obligatorio.</span>
            }
            @if (showError('email', 'email')) {
              <span class="field__error">Introduce un email válido.</span>
            }
          </label>

          <label class="field">
            <span class="field__label">Contraseña</span>
            <div class="field__input">
              <i class="bi bi-lock" aria-hidden="true"></i>
              <input
                type="password"
                formControlName="password"
                autocomplete="current-password"
                placeholder="••••••••"
              />
            </div>
            @if (showError('password', 'required')) {
              <span class="field__error">La contraseña es obligatoria.</span>
            }
          </label>

          @if (errorMsg()) {
            <div class="alert" role="alert">
              <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
              <span>{{ errorMsg() }}</span>
            </div>
          }

          <button type="submit" class="btn btn--primary" [disabled]="loading()">
            @if (loading()) {
              <app-loading-spinner />
            } @else {
              <span>Entrar</span>
              <i class="bi bi-arrow-right" aria-hidden="true"></i>
            }
          </button>
        </form>

        <p class="auth__footer">
          ¿No tienes cuenta?
          <a routerLink="/register">Crear una</a>
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .auth {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-5) var(--space-4);
        background:
          radial-gradient(circle at 20% 20%, var(--color-primary-light) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, var(--color-accent-light) 0%, transparent 50%),
          var(--color-bg);
      }

      .auth__card {
        background: var(--color-surface);
        padding: var(--space-7) var(--space-6);
        border-radius: var(--radius-xl);
        width: 100%;
        max-width: 420px;
        box-shadow: var(--shadow-xl);
        animation: scale-in 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) both;
      }

      .auth__brand {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-5);
      }

      .auth__brand-icon {
        width: 36px;
        height: 36px;
        border-radius: var(--radius-md);
        background: var(--color-primary);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
      }

      .auth__brand-svg {
        width: 22px;
        height: 22px;
      }

      .auth__brand-text {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: var(--font-size-xl);
        color: var(--color-text);
      }

      .auth__title {
        margin: 0 0 var(--space-2);
        font-family: var(--font-display);
        font-size: var(--font-size-3xl);
        font-weight: 700;
      }

      .auth__subtitle {
        margin: 0 0 var(--space-5);
        color: var(--color-text-soft);
        font-size: var(--font-size-sm);
      }

      /* Toggle entre login y register. */
      .auth__toggle {
        display: flex;
        background: var(--color-bg-soft);
        padding: var(--space-1);
        border-radius: var(--radius-pill);
        margin-bottom: var(--space-5);
      }

      .auth__toggle-btn {
        flex: 1;
        text-align: center;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-pill);
        background: transparent;
        border: 0;
        color: var(--color-text-soft);
        font-size: var(--font-size-sm);
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        transition: all var(--transition-fast);
      }

      .auth__toggle-btn.active {
        background: var(--color-surface);
        color: var(--color-primary);
        box-shadow: var(--shadow-sm);
      }

      .auth__toggle-btn:not(.active):hover {
        color: var(--color-text);
      }

      .auth__form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .field__label {
        font-size: var(--font-size-sm);
        font-weight: 600;
      }

      .field__input {
        position: relative;
        display: flex;
        align-items: center;
      }

      .field__input i {
        position: absolute;
        left: var(--space-3);
        color: var(--color-text-muted);
        pointer-events: none;
      }

      .field__input input {
        width: 100%;
        padding: var(--space-3) var(--space-3) var(--space-3) var(--space-7);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg-soft);
        font-size: var(--font-size-base);
        color: var(--color-text);
        transition: all var(--transition-fast);
      }

      .field__input input:focus {
        outline: none;
        border-color: var(--color-primary);
        background: var(--color-surface);
        box-shadow: var(--shadow-focus);
      }

      .field__error {
        color: var(--color-danger);
        font-size: var(--font-size-xs);
      }

      .alert {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        background: var(--color-danger-light);
        color: var(--color-danger);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
      }

      /* Alert verde mostrado cuando el usuario llega al login tras
         haberse registrado correctamente (?registered=1 en la URL). */
      .alert--success {
        background: var(--color-success-light);
        color: var(--color-success);
      }

      .btn {
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-pill);
        font-weight: 600;
        font-size: var(--font-size-base);
        border: 0;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        min-height: 48px;
        transition: all var(--transition-fast);
      }

      .btn--primary {
        background: var(--color-primary);
        color: #fff;
      }

      .btn--primary:hover:not(:disabled) {
        background: var(--color-primary-hover);
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .auth__footer {
        margin: var(--space-5) 0 0;
        text-align: center;
        font-size: var(--font-size-sm);
        color: var(--color-text-soft);
      }

      .auth__footer a {
        color: var(--color-primary);
        font-weight: 600;
      }

      @media (max-width: 480px) {
        .auth__card {
          padding: var(--space-6) var(--space-4);
        }
      }
    `
  ]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  errorMsg = signal('');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  showError(controlName: string, errorKey: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.touched && ctrl.hasError(errorKey);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        switch (err.status) {
          case 401:
            this.errorMsg.set('El correo o la contraseña son incorrectos');
            break;
          case 400:
          case 422:
            this.errorMsg.set('Por favor revisa los datos introducidos');
            break;
          case 0:
            this.errorMsg.set('No se puede conectar con el servidor. Inténtalo más tarde');
            break;
          default:
            this.errorMsg.set('No se pudo iniciar sesión. Inténtalo de nuevo.');
        }
      }
    });
  }
}
