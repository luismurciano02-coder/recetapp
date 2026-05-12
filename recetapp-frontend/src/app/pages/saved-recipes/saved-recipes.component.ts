import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../core/services/recipe.service';
import { RecipeSummary } from '../../core/models/recipe.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { RecipeCardComponent } from '../../shared/recipe-card/recipe-card.component';

@Component({
  selector: 'app-saved-recipes',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, RecipeCardComponent],
  template: `
    <section class="saved">
      <header class="saved__header">
        <div>
          <h1>
            <i class="bi bi-bookmark-fill" aria-hidden="true"></i>
            Recetas guardadas
          </h1>
          <p>Tu colección personal para cocinar otro día.</p>
        </div>
        @if (recipes().length > 0) {
          <span class="saved__count">{{ recipes().length }} recetas</span>
        }
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (error()) {
        <div class="alert">{{ error() }}</div>
      } @else if (recipes().length === 0) {
        <div class="empty-state">
          <i class="bi bi-bookmark" aria-hidden="true"></i>
          <h3>Aún no has guardado ninguna receta</h3>
          <p>Explora la comunidad y guarda tus recetas favoritas para tenerlas siempre a mano.</p>
          <a routerLink="/" class="btn-primary">
            <i class="bi bi-compass" aria-hidden="true"></i>
            Explorar recetas
          </a>
        </div>
      } @else {
        <div class="grid">
          @for (recipe of recipes(); track recipe.id) {
            <app-recipe-card [recipe]="recipe" />
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: var(--container-max);
        margin: 0 auto;
        padding: var(--space-6) var(--space-4) var(--space-9);
      }

      .saved__header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: var(--space-4);
        margin-bottom: var(--space-5);
        flex-wrap: wrap;
      }

      .saved__header h1 {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--font-size-3xl);
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .saved__header h1 i {
        color: var(--color-primary);
      }

      .saved__header p {
        margin: var(--space-1) 0 0;
        color: var(--color-text-soft);
      }

      .saved__count {
        background: var(--color-primary-light);
        color: var(--color-primary);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-pill);
        font-size: var(--font-size-sm);
        font-weight: 600;
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
      }

      .empty-state {
        text-align: center;
        padding: var(--space-8) var(--space-4);
        background: var(--color-surface);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
      }

      .empty-state i {
        font-size: 4rem;
        color: var(--color-text-muted);
        display: block;
        margin-bottom: var(--space-4);
      }

      .empty-state h3 {
        margin: 0 0 var(--space-2);
        font-family: var(--font-display);
        font-size: var(--font-size-2xl);
      }

      .empty-state p {
        margin: 0 0 var(--space-5);
        color: var(--color-text-soft);
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
      }

      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-5);
        border-radius: var(--radius-pill);
        background: var(--color-primary);
        color: #fff;
        font-weight: 600;
        text-decoration: none;
        transition: background var(--transition-fast);
      }

      .btn-primary:hover {
        background: var(--color-primary-hover);
        color: #fff;
      }
    `
  ]
})
export class SavedRecipesComponent implements OnInit {
  private recipeService = inject(RecipeService);

  recipes = signal<RecipeSummary[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.recipeService.getSaved().subscribe({
      next: (data) => {
        this.recipes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las recetas guardadas.');
        this.loading.set(false);
      }
    });
  }
}
