import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { RecipeService } from '../../core/services/recipe.service';
import { RecipeSummary } from '../../core/models/recipe.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { RecipeCardComponent } from '../../shared/recipe-card/recipe-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, RecipeCardComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <section class="profile">
        <!-- Cabecera con avatar grande circular + stats. -->
        <div class="profile__header">
          <div class="profile__avatar">
            @if (auth.currentUser()?.avatar; as avatar) {
              <img [src]="avatar" alt="Avatar" />
            } @else {
              <span class="profile__avatar-fallback">{{ initials() }}</span>
            }
          </div>

          <div class="profile__meta">
            <h1>&#64;{{ auth.currentUser()?.username }}</h1>
            <p class="profile__email">{{ auth.currentUser()?.email }}</p>
            @if (auth.currentUser()?.bio) {
              <p class="profile__bio">{{ auth.currentUser()?.bio }}</p>
            } @else {
              <p class="profile__bio profile__bio--empty">
                Aún no has añadido una biografía.
              </p>
            }

            <div class="profile__stats">
              <div class="profile__stat">
                <span class="profile__stat-value">{{ myRecipes().length }}</span>
                <span class="profile__stat-label">Recetas</span>
              </div>
              <div class="profile__stat">
                <span class="profile__stat-value">{{ totalLikes() }}</span>
                <span class="profile__stat-label">Likes</span>
              </div>
              <div class="profile__stat">
                <span class="profile__stat-value">{{ memberSince() }}</span>
                <span class="profile__stat-label">Miembro</span>
              </div>
            </div>

            <div class="profile__actions">
              <button type="button" class="btn-secondary" (click)="toggleEdit()">
                <i [class]="editing() ? 'bi bi-x-lg' : 'bi bi-pencil'" aria-hidden="true"></i>
                {{ editing() ? 'Cancelar' : 'Editar perfil' }}
              </button>

              <button type="button" class="btn-danger" (click)="onLogout()">
                <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        <!-- Form de edición. -->
        @if (editing()) {
          <form
            [formGroup]="form"
            (ngSubmit)="onSubmit()"
            class="profile__form"
            novalidate
          >
            <h2>Editar perfil</h2>

            <label class="field">
              <span>Nombre de usuario</span>
              <input type="text" formControlName="username" />
            </label>

            <label class="field">
              <span>URL del avatar</span>
              <input type="url" formControlName="avatar" placeholder="https://..." />
            </label>

            <label class="field">
              <span>Biografía</span>
              <textarea formControlName="bio" rows="3" placeholder="Cuéntanos algo sobre ti..."></textarea>
            </label>

            @if (saveError()) {
              <div class="alert">{{ saveError() }}</div>
            }
            @if (saveSuccess()) {
              <div class="alert alert--success">
                <i class="bi bi-check-circle" aria-hidden="true"></i>
                Perfil actualizado.
              </div>
            }

            <div class="profile__form-actions">
              <button type="submit" class="btn-primary" [disabled]="saving() || form.invalid">
                @if (saving()) {
                  <app-loading-spinner />
                } @else {
                  <span>Guardar cambios</span>
                }
              </button>
            </div>
          </form>
        }

        <!-- Tabs simples. (Hoy solo "Mis recetas"; queda preparado para
             "Guardadas" en el futuro.) -->
        <nav class="profile__tabs" role="tablist">
          <button type="button" class="profile__tab active" role="tab" aria-selected="true">
            <i class="bi bi-journal-text" aria-hidden="true"></i>
            Mis recetas
          </button>
        </nav>

        <section class="profile__recipes">
          @if (recipesLoading()) {
            <app-loading-spinner />
          } @else if (myRecipes().length === 0) {
            <div class="empty-state">
              <i class="bi bi-egg" aria-hidden="true"></i>
              <h3>Aún no tienes recetas</h3>
              <p>Comparte tu primera receta con la comunidad.</p>
              <a routerLink="/recipes/new" class="btn-primary">
                <i class="bi bi-plus-lg" aria-hidden="true"></i>
                Crear receta
              </a>
            </div>
          } @else {
            <div class="grid">
              @for (recipe of myRecipes(); track recipe.id) {
                <app-recipe-card [recipe]="recipe" />
              }
            </div>
          }
        </section>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: var(--container-max);
        margin: 0 auto;
        padding: var(--space-6) var(--space-4) var(--space-9);
      }

      .profile__header {
        display: flex;
        gap: var(--space-6);
        align-items: flex-start;
        background: var(--color-surface);
        padding: var(--space-6);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
        margin-bottom: var(--space-5);
      }

      .profile__avatar img,
      .profile__avatar-fallback {
        width: 128px;
        height: 128px;
        border-radius: 50%;
        flex-shrink: 0;
        border: 4px solid var(--color-primary-light);
      }

      .profile__avatar img {
        object-fit: cover;
      }

      .profile__avatar-fallback {
        background: var(--color-primary);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 2.5rem;
      }

      .profile__meta {
        flex: 1;
        min-width: 0;
      }

      .profile__meta h1 {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--font-size-3xl);
        font-weight: 700;
      }

      .profile__email {
        margin: var(--space-1) 0 var(--space-3);
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .profile__bio {
        margin: 0 0 var(--space-4);
        color: var(--color-text);
        line-height: 1.5;
      }

      .profile__bio--empty {
        color: var(--color-text-muted);
        font-style: italic;
      }

      /* Stats inline. */
      .profile__stats {
        display: flex;
        gap: var(--space-5);
        margin-bottom: var(--space-4);
        padding: var(--space-3) 0;
        border-top: 1px solid var(--color-border);
        border-bottom: 1px solid var(--color-border);
      }

      .profile__stat {
        display: flex;
        flex-direction: column;
      }

      .profile__stat-value {
        font-family: var(--font-display);
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-primary);
      }

      .profile__stat-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .profile__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      /* Botones. */
      .btn-primary,
      .btn-secondary,
      .btn-danger {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-pill);
        font-weight: 600;
        font-size: var(--font-size-sm);
        cursor: pointer;
        text-decoration: none;
        border: 1px solid transparent;
        transition: all var(--transition-fast);
      }

      .btn-primary {
        background: var(--color-primary);
        color: #fff;
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--color-primary-hover);
        color: #fff;
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: var(--color-surface);
        border-color: var(--color-border);
        color: var(--color-text);
      }

      .btn-secondary:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .btn-danger {
        background: var(--color-surface);
        border-color: var(--color-danger);
        color: var(--color-danger);
      }

      .btn-danger:hover {
        background: var(--color-danger-light);
      }

      /* Form de edición. */
      .profile__form {
        background: var(--color-surface);
        padding: var(--space-5);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        margin-bottom: var(--space-5);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .profile__form h2 {
        margin: 0 0 var(--space-2);
        font-family: var(--font-display);
        font-size: var(--font-size-xl);
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .field span {
        font-weight: 600;
        font-size: var(--font-size-sm);
      }

      .field input,
      .field textarea {
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg-soft);
        font-family: inherit;
        font-size: var(--font-size-base);
        color: var(--color-text);
      }

      .field input:focus,
      .field textarea:focus {
        outline: none;
        border-color: var(--color-primary);
        background: var(--color-surface);
        box-shadow: var(--shadow-focus);
      }

      .profile__form-actions {
        display: flex;
        justify-content: flex-end;
      }

      .alert {
        background: var(--color-danger-light);
        color: var(--color-danger);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .alert--success {
        background: var(--color-success-light);
        color: var(--color-success);
      }

      /* Tabs. */
      .profile__tabs {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-5);
        border-bottom: 1px solid var(--color-border);
      }

      .profile__tab {
        background: transparent;
        border: 0;
        padding: var(--space-3) var(--space-4);
        font-weight: 600;
        color: var(--color-text-soft);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        border-bottom: 2px solid transparent;
        transition: color var(--transition-fast), border-color var(--transition-fast);
      }

      .profile__tab.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
      }

      .profile__tab:hover {
        color: var(--color-text);
      }

      .grid {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      }

      .empty-state {
        text-align: center;
        padding: var(--space-8) var(--space-4);
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }

      .empty-state i {
        font-size: 3rem;
        color: var(--color-text-muted);
        display: block;
        margin-bottom: var(--space-3);
      }

      .empty-state h3 {
        margin: 0 0 var(--space-2);
        font-family: var(--font-display);
      }

      .empty-state p {
        margin: 0 0 var(--space-4);
        color: var(--color-text-soft);
      }

      @media (max-width: 720px) {
        .profile__header {
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .profile__stats {
          justify-content: center;
        }

        .profile__actions {
          justify-content: center;
        }
      }
    `
  ]
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  private userService = inject(UserService);
  private recipeService = inject(RecipeService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loading = signal(false);
  recipesLoading = signal(false);
  saving = signal(false);
  saveError = signal<string | null>(null);
  saveSuccess = signal(false);

  editing = signal(false);

  myRecipes = signal<RecipeSummary[]>([]);

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    bio: [''],
    avatar: ['']
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.userService.getProfile().subscribe({
      next: () => {
        this.loading.set(false);
        this.syncFormFromUser();
        this.loadMyRecipes();
      },
      error: () => {
        this.loading.set(false);
        this.syncFormFromUser();
        this.loadMyRecipes();
      }
    });
  }

  private syncFormFromUser(): void {
    const u = this.auth.currentUser();
    if (!u) return;
    this.form.patchValue({
      username: u.username,
      bio: u.bio ?? '',
      avatar: u.avatar ?? ''
    });
  }

  // Carga las recetas del usuario logueado. El backend no expone un
  // endpoint /api/perfil/recetas, así que pedimos el listado completo
  // y filtramos por autor en el cliente comparando por username
  // (derivado del gmail). Comparar por id no funcionaba porque el
  // backend no devuelve el id del autor en el listado.
  private loadMyRecipes(): void {
    const me = this.auth.currentUser();
    if (!me) return;

    this.recipesLoading.set(true);
    this.recipeService.getFeatured().subscribe({
      next: (all) => {
        this.myRecipes.set(
          all.filter((r) => r.author.username === me.username)
        );
        this.recipesLoading.set(false);
      },
      error: () => {
        this.myRecipes.set([]);
        this.recipesLoading.set(false);
      }
    });
  }

  toggleEdit(): void {
    if (this.editing()) {
      this.editing.set(false);
      this.syncFormFromUser();
      this.saveError.set(null);
      this.saveSuccess.set(false);
    } else {
      this.editing.set(true);
    }
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  initials(): string {
    return (this.auth.currentUser()?.username ?? '').slice(0, 2).toUpperCase();
  }

  // Total de likes en todas mis recetas (cálculo local).
  totalLikes(): number {
    return this.myRecipes().reduce((sum, r) => sum + r.likesCount, 0);
  }

  // Texto "miembro desde" (placeholder estático, requiere fecha de
  // alta del usuario en la API para ser dinámico).
  memberSince(): string {
    return '2024';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const value = this.form.getRawValue();
    this.userService
      .updateProfile({
        username: value.username,
        bio: value.bio || undefined,
        avatar: value.avatar || undefined
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saveSuccess.set(true);
          setTimeout(() => {
            this.editing.set(false);
            this.saveSuccess.set(false);
          }, 1200);
        },
        error: () => {
          this.saving.set(false);
          this.saveError.set('No se pudo guardar el perfil.');
        }
      });
  }
}
