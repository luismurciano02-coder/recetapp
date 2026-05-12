import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RecipeService } from '../../core/services/recipe.service';
import { CommentService } from '../../core/services/comment.service';
import { AuthService } from '../../core/services/auth.service';
import { Recipe, RecipeSummary } from '../../core/models/recipe.model';
import { Comment } from '../../core/models/comment.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { RecipeCardComponent } from '../../shared/recipe-card/recipe-card.component';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    LoadingSpinnerComponent,
    RecipeCardComponent
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <div class="container"><div class="alert">{{ error() }}</div></div>
    } @else if (recipe(); as r) {
      <article class="detail">
        <!-- Hero con foto y degradado oscuro abajo. -->
        <div class="detail__hero">
          @if (r.imageUrl) {
            <img [src]="r.imageUrl" [alt]="r.title" />
          } @else {
            <div class="detail__placeholder" aria-hidden="true">
              <i class="bi bi-egg-fried"></i>
            </div>
          }
          <div class="detail__hero-overlay"></div>
        </div>

        <div class="container">
          <header class="detail__header">
            @if (r.category) {
              <span class="detail__category">{{ r.category.name }}</span>
            }
            <h1>{{ r.title }}</h1>
            <p class="detail__desc">{{ r.description }}</p>

            <div class="detail__author">
              @if (r.author.avatar) {
                <img [src]="r.author.avatar" [alt]="r.author.username" />
              } @else {
                <span class="detail__author-fallback">{{ initials(r.author.username) }}</span>
              }
              <div>
                <span class="detail__author-by">Receta de</span>
                <strong>&#64;{{ r.author.username }}</strong>
              </div>
              <span class="detail__date">
                <i class="bi bi-calendar3" aria-hidden="true"></i>
                {{ r.createdAt | date: 'longDate' }}
              </span>
            </div>
          </header>

          <!-- Stats row con iconos. -->
          <div class="detail__stats">
            <div class="stat">
              <span class="stat__icon"><i class="bi bi-stopwatch"></i></span>
              <div>
                <span class="stat__value">{{ r.prepTime }} min</span>
                <span class="stat__label">Preparación</span>
              </div>
            </div>
            <div class="stat">
              <span class="stat__icon"><i class="bi bi-fire"></i></span>
              <div>
                <span class="stat__value">{{ r.cookTime }} min</span>
                <span class="stat__label">Cocción</span>
              </div>
            </div>
            <div class="stat">
              <span class="stat__icon"><i class="bi bi-people"></i></span>
              <div>
                <span class="stat__value">{{ r.servings }}</span>
                <span class="stat__label">Raciones</span>
              </div>
            </div>
            <div class="stat">
              <span class="stat__icon"><i class="bi bi-bar-chart"></i></span>
              <div>
                <span class="stat__value">{{ difficultyLabel() }}</span>
                <span class="stat__label">Dificultad</span>
              </div>
            </div>
          </div>

          <!-- Acciones. -->
          <div class="detail__actions">
            <button
              type="button"
              class="action"
              [class.action--active]="r.isLiked"
              (click)="toggleLike()"
              [disabled]="actionLoading()"
              [attr.aria-label]="r.isLiked ? 'Quitar like' : 'Dar like'"
            >
              <i [class]="r.isLiked ? 'bi bi-heart-fill' : 'bi bi-heart'" aria-hidden="true"></i>
              {{ r.likesCount }}
            </button>

            <button
              type="button"
              class="action"
              [class.action--active]="r.isSaved"
              (click)="toggleSave()"
              [disabled]="actionLoading()"
              [attr.aria-label]="r.isSaved ? 'Quitar de guardadas' : 'Guardar receta'"
            >
              <i [class]="r.isSaved ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'" aria-hidden="true"></i>
              <span>{{ r.isSaved ? 'Guardada' : 'Guardar' }}</span>
            </button>

            @if (isAuthor()) {
              <a class="action action--edit" [routerLink]="['/recipes', r.id, 'edit']">
                <i class="bi bi-pencil" aria-hidden="true"></i>
                <span>Editar</span>
              </a>
              <button
                type="button"
                class="action action--danger"
                (click)="onDelete()"
                [disabled]="actionLoading()"
              >
                <i class="bi bi-trash" aria-hidden="true"></i>
                <span>Eliminar</span>
              </button>
            }
          </div>

          <!-- Layout 2 columnas: ingredientes (sticky) + pasos. -->
          <div class="detail__grid">
            <aside class="detail__ingredients">
              <h2>
                <i class="bi bi-basket3" aria-hidden="true"></i>
                Ingredientes
              </h2>
              <ul>
                @for (ing of r.ingredients; track ing.id) {
                  <li>
                    <span class="ing__qty">
                      {{ ing.quantity }}{{ ing.unit ? ' ' + ing.unit : '' }}
                    </span>
                    <span class="ing__name">{{ ing.name }}</span>
                  </li>
                } @empty {
                  <li class="empty-list">Esta receta no tiene ingredientes.</li>
                }
              </ul>
            </aside>

            <section class="detail__steps">
              <h2>
                <i class="bi bi-list-ol" aria-hidden="true"></i>
                Preparación
              </h2>
              <ol>
                @for (step of sortedSteps(); track step.id) {
                  <li>
                    <span class="step__number">{{ step.stepNumber }}</span>
                    <p>{{ step.description }}</p>
                  </li>
                } @empty {
                  <li class="empty-list">Esta receta no tiene pasos.</li>
                }
              </ol>
            </section>
          </div>

          @defer (on viewport) {
            <section class="comments">
              <h2>
                <i class="bi bi-chat-dots" aria-hidden="true"></i>
                Comentarios ({{ comments().length }})
              </h2>

              @if (auth.isLoggedIn()) {
                <form class="comment-form" (ngSubmit)="postComment()">
                  <textarea
                    [(ngModel)]="newComment"
                    name="comment"
                    rows="3"
                    placeholder="Cuéntanos qué te ha parecido..."
                    required
                  ></textarea>
                  <button
                    type="submit"
                    class="btn btn--primary"
                    [disabled]="commentLoading() || !newComment.trim()"
                  >
                    Publicar comentario
                  </button>
                </form>
              } @else {
                <p class="login-hint">
                  <a routerLink="/login">Inicia sesión</a> para comentar.
                </p>
              }

              @if (commentsLoading()) {
                <app-loading-spinner />
              } @else {
                <ul class="comment-list">
                  @for (c of comments(); track c.id) {
                    <li class="comment">
                      @if (c.author.avatar) {
                        <img [src]="c.author.avatar" [alt]="c.author.username" />
                      } @else {
                        <span class="comment__avatar-fallback">
                          {{ initials(c.author.username) }}
                        </span>
                      }
                      <div class="comment__body">
                        <div class="comment__head">
                          <strong>&#64;{{ c.author.username }}</strong>
                          <span>{{ c.createdAt | date: 'short' }}</span>
                        </div>
                        <p>{{ c.content }}</p>
                      </div>
                    </li>
                  } @empty {
                    <li class="empty-list">Sé el primero en dejar un comentario.</li>
                  }
                </ul>
              }
            </section>
          } @placeholder {
            <p class="loading-text">Cargando comentarios...</p>
          }

          @if (similar().length > 0) {
            <section class="similar">
              <h2>
                <i class="bi bi-stars" aria-hidden="true"></i>
                También te puede gustar
              </h2>
              <div class="grid">
                @for (sim of similar(); track sim.id) {
                  <app-recipe-card [recipe]="sim" />
                }
              </div>
            </section>
          }
        </div>
      </article>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .container {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 var(--space-4);
      }

      .detail__hero {
        height: 380px;
        background: var(--color-bg-soft);
        position: relative;
        overflow: hidden;
      }

      .detail__hero img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .detail__hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent 50%, rgba(28, 24, 20, 0.5) 100%);
        pointer-events: none;
      }

      .detail__placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 7rem;
        color: var(--color-primary);
      }

      .detail__header {
        margin: -80px auto var(--space-6);
        background: var(--color-surface);
        padding: var(--space-6);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-lg);
        position: relative;
        z-index: 2;
      }

      .detail__category {
        display: inline-block;
        background: var(--color-primary-light);
        color: var(--color-primary);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-pill);
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .detail__header h1 {
        margin: var(--space-3) 0 var(--space-3);
        font-family: var(--font-display);
        font-size: clamp(var(--font-size-2xl), 4vw, var(--font-size-4xl));
        font-weight: 700;
        line-height: 1.15;
      }

      .detail__desc {
        margin: 0 0 var(--space-4);
        color: var(--color-text-soft);
        font-size: var(--font-size-lg);
        line-height: 1.5;
      }

      .detail__author {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        flex-wrap: wrap;
      }

      .detail__author img,
      .detail__author-fallback {
        width: 44px;
        height: 44px;
        border-radius: 50%;
      }

      .detail__author img {
        object-fit: cover;
      }

      .detail__author-fallback {
        background: var(--color-primary);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: var(--font-size-sm);
      }

      .detail__author > div {
        display: flex;
        flex-direction: column;
      }

      .detail__author-by {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .detail__author strong {
        font-size: var(--font-size-sm);
      }

      .detail__date {
        margin-left: auto;
        color: var(--color-text-soft);
        font-size: var(--font-size-sm);
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
      }

      /* Stats. */
      .detail__stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-3);
        margin-bottom: var(--space-5);
      }

      .stat {
        background: var(--color-surface);
        padding: var(--space-4);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .stat__icon {
        width: 44px;
        height: 44px;
        border-radius: var(--radius-md);
        background: var(--color-primary-light);
        color: var(--color-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .stat__value {
        display: block;
        font-weight: 700;
        font-size: var(--font-size-base);
      }

      .stat__label {
        display: block;
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      /* Acciones. */
      .detail__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-bottom: var(--space-7);
      }

      .action {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-pill);
        font-weight: 600;
        font-size: var(--font-size-sm);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        text-decoration: none;
        color: var(--color-text);
        transition: all var(--transition-fast);
      }

      .action:hover:not(:disabled) {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .action--active {
        background: var(--color-primary);
        color: #fff;
        border-color: var(--color-primary);
      }

      /* Latido del corazón cuando se acaba de marcar como liked.
         Solo afecta al icono dentro del botón activo. */
      .action--active .bi-heart-fill {
        animation: pulse-heart 0.55s ease;
      }

      .action--active .bi-bookmark-fill {
        animation: scale-in 0.3s ease;
      }

      .action--active:hover:not(:disabled) {
        background: var(--color-primary-hover);
        color: #fff;
      }

      .action--edit {
        background: var(--color-bg-soft);
      }

      .action--danger {
        color: var(--color-danger);
      }

      .action--danger:hover:not(:disabled) {
        background: var(--color-danger-light);
        border-color: var(--color-danger);
        color: var(--color-danger);
      }

      .action:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Grid de 2 columnas. */
      .detail__grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: var(--space-6);
        margin-bottom: var(--space-7);
      }

      .detail__ingredients,
      .detail__steps {
        background: var(--color-surface);
        padding: var(--space-5);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }

      .detail__ingredients {
        position: sticky;
        top: var(--space-5);
        align-self: start;
      }

      .detail__ingredients h2,
      .detail__steps h2 {
        margin: 0 0 var(--space-4);
        font-family: var(--font-display);
        font-size: var(--font-size-xl);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .detail__ingredients h2 i,
      .detail__steps h2 i {
        color: var(--color-primary);
        font-size: 1.1rem;
      }

      .detail__ingredients ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .detail__ingredients li {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-3) 0;
        border-bottom: 1px dashed var(--color-border);
        font-size: var(--font-size-sm);
      }

      .detail__ingredients li:last-child {
        border-bottom: 0;
      }

      .ing__qty {
        font-weight: 700;
        color: var(--color-primary);
        min-width: 80px;
      }

      .detail__steps ol {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .detail__steps li {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-4) 0;
        border-bottom: 1px solid var(--color-border);
      }

      .detail__steps li:last-child {
        border-bottom: 0;
      }

      .step__number {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        background: var(--color-primary);
        color: #fff;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-family: var(--font-display);
      }

      .detail__steps p {
        margin: 0;
        line-height: 1.6;
        padding-top: var(--space-1);
      }

      .empty-list {
        color: var(--color-text-soft);
        font-style: italic;
        padding: var(--space-2) 0;
      }

      /* Comentarios. */
      .comments,
      .similar {
        margin-bottom: var(--space-7);
      }

      .comments h2,
      .similar h2 {
        margin: 0 0 var(--space-4);
        font-family: var(--font-display);
        font-size: var(--font-size-2xl);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .comments h2 i,
      .similar h2 i {
        color: var(--color-primary);
      }

      .comment-form {
        background: var(--color-surface);
        padding: var(--space-4);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-4);
        box-shadow: var(--shadow-sm);
      }

      .comment-form textarea {
        width: 100%;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-3);
        font-family: inherit;
        font-size: var(--font-size-sm);
        resize: vertical;
        background: var(--color-bg-soft);
        color: var(--color-text);
      }

      .comment-form textarea:focus {
        outline: none;
        border-color: var(--color-primary);
        background: var(--color-surface);
        box-shadow: var(--shadow-focus);
      }

      .btn {
        padding: var(--space-3) var(--space-5);
        border-radius: var(--radius-pill);
        font-weight: 600;
        border: 0;
        cursor: pointer;
        margin-top: var(--space-2);
      }

      .btn--primary {
        background: var(--color-primary);
        color: #fff;
        transition: background var(--transition-fast);
      }

      .btn--primary:hover:not(:disabled) {
        background: var(--color-primary-hover);
      }

      .btn--primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .login-hint {
        background: var(--color-bg-soft);
        padding: var(--space-4);
        border-radius: var(--radius-md);
        text-align: center;
        margin-bottom: var(--space-4);
        color: var(--color-text-soft);
      }

      .login-hint a {
        color: var(--color-primary);
        font-weight: 600;
      }

      .comment-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .comment {
        display: flex;
        gap: var(--space-3);
        background: var(--color-surface);
        padding: var(--space-4);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }

      .comment img,
      .comment__avatar-fallback {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .comment img {
        object-fit: cover;
      }

      .comment__avatar-fallback {
        background: var(--color-primary);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: var(--font-size-sm);
      }

      .comment__body {
        flex: 1;
      }

      .comment__head {
        display: flex;
        gap: var(--space-2);
        align-items: center;
        margin-bottom: var(--space-1);
      }

      .comment__head span {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .comment__body p {
        margin: 0;
        line-height: 1.5;
      }

      .grid {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      }

      .alert {
        background: var(--color-danger-light);
        color: var(--color-danger);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        margin: var(--space-6) 0;
      }

      .loading-text {
        text-align: center;
        color: var(--color-text-soft);
        padding: var(--space-5);
        font-style: italic;
      }

      /* Responsive. */
      @media (max-width: 820px) {
        .detail__grid {
          grid-template-columns: 1fr;
        }

        .detail__ingredients {
          position: static;
        }

        .detail__stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .detail__hero {
          height: 240px;
        }

        .detail__header {
          margin-top: -40px;
          padding: var(--space-4);
        }
      }
    `
  ]
})
export class RecipeDetailComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private commentService = inject(CommentService);
  private router = inject(Router);
  auth = inject(AuthService);

  id = input.required<string>();

  recipe = signal<Recipe | null>(null);
  comments = signal<Comment[]>([]);
  similar = signal<RecipeSummary[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);
  actionLoading = signal(false);
  commentsLoading = signal(false);
  commentLoading = signal(false);

  newComment = '';

  // El backend identifica usuarios por gmail. En el frontend derivamos
  // el `username` del gmail (parte antes de la @), así que comparamos
  // por username. SOLO el autor de la receta puede editarla o borrarla.
  isAuthor = computed(() => {
    const r = this.recipe();
    const u = this.auth.currentUser();
    if (!r || !u) return false;
    return r.author.username === u.username;
  });

  sortedSteps = computed(() => {
    const r = this.recipe();
    if (!r) return [];
    return [...r.steps].sort((a, b) => a.stepNumber - b.stepNumber);
  });

  difficultyLabel = computed(() => {
    const d = this.recipe()?.difficulty;
    return d === 'easy' ? 'Fácil' : d === 'medium' ? 'Media' : d === 'hard' ? 'Difícil' : '';
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const recipeId = Number(this.id());
    if (!recipeId) {
      this.error.set('Receta no válida.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.recipeService.getById(recipeId).subscribe({
      next: (data) => {
        this.recipe.set(data);
        this.loading.set(false);
        this.loadComments(recipeId);
        this.loadSimilar(recipeId);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.status === 404
            ? 'Esta receta no existe o ha sido eliminada.'
            : 'No se pudo cargar la receta.'
        );
      }
    });
  }

  private loadComments(recipeId: number): void {
    this.commentsLoading.set(true);
    this.commentService.list(recipeId).subscribe({
      next: (data) => {
        this.comments.set(data);
        this.commentsLoading.set(false);
      },
      error: () => this.commentsLoading.set(false)
    });
  }

  private loadSimilar(currentId: number): void {
    this.recipeService.getFeatured().subscribe({
      next: (all) => {
        this.similar.set(all.filter((r) => r.id !== currentId).slice(0, 4));
      },
      error: () => this.similar.set([])
    });
  }

  toggleLike(): void {
    const r = this.recipe();
    if (!r) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.actionLoading.set(true);
    const op = r.isLiked ? this.recipeService.unlike(r.id) : this.recipeService.like(r.id);
    op.subscribe({
      next: () => {
        this.recipe.set({
          ...r,
          isLiked: !r.isLiked,
          likesCount: r.likesCount + (r.isLiked ? -1 : 1)
        });
        this.actionLoading.set(false);
      },
      error: () => this.actionLoading.set(false)
    });
  }

  toggleSave(): void {
    const r = this.recipe();
    if (!r) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.actionLoading.set(true);
    const op = r.isSaved ? this.recipeService.unsave(r.id) : this.recipeService.save(r.id);
    op.subscribe({
      next: () => {
        this.recipe.set({ ...r, isSaved: !r.isSaved });
        this.actionLoading.set(false);
      },
      error: () => this.actionLoading.set(false)
    });
  }

  onDelete(): void {
    const r = this.recipe();
    if (!r) return;

    if (!confirm('¿Seguro que quieres eliminar esta receta? Esta acción no se puede deshacer.')) {
      return;
    }

    this.actionLoading.set(true);
    this.recipeService.delete(r.id).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.router.navigate(['/profile']);
      },
      error: () => {
        this.actionLoading.set(false);
        this.error.set('No se pudo eliminar la receta.');
      }
    });
  }

  postComment(): void {
    const r = this.recipe();
    const content = this.newComment.trim();
    if (!r || !content) return;

    this.commentLoading.set(true);
    this.commentService.add(r.id, { content }).subscribe({
      next: (created) => {
        this.comments.set([created, ...this.comments()]);
        this.newComment = '';
        this.commentLoading.set(false);
      },
      error: () => this.commentLoading.set(false)
    });
  }

  initials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }
}
