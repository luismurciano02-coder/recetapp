import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeSummary } from '../../core/models/recipe.model';

// Tarjeta reutilizable usada en home, search, profile, saved.
// Diseño limpio: foto cuadrada 4:3, badge dificultad arriba, título Playfair,
// meta (tiempo, likes, autor) debajo.
@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a class="card" [routerLink]="['/recipes', recipe().id]">
      <div class="card__image">
        @if (recipe().imageUrl) {
          <img [src]="recipe().imageUrl" [alt]="recipe().title" loading="lazy" />
        } @else {
          <div class="card__placeholder" aria-hidden="true">
            <i class="bi bi-egg-fried"></i>
          </div>
        }

        <span class="card__badge" [attr.data-difficulty]="recipe().difficulty">
          {{ difficultyLabel() }}
        </span>

        @if (recipe().isSaved) {
          <span class="card__saved" aria-label="Guardada">
            <i class="bi bi-bookmark-fill" aria-hidden="true"></i>
          </span>
        }
      </div>

      <div class="card__body">
        @if (recipe().category) {
          <span class="card__category">{{ recipe().category!.name }}</span>
        }
        <h3 class="card__title">{{ recipe().title }}</h3>
        <p class="card__desc">{{ recipe().description }}</p>

        <div class="card__meta">
          <span class="card__meta-item" title="Tiempo total">
            <i class="bi bi-clock" aria-hidden="true"></i>
            {{ totalTime() }} min
          </span>
          <span class="card__meta-item" title="Likes">
            <i class="bi bi-heart" aria-hidden="true"></i>
            {{ recipe().likesCount }}
          </span>
          <span class="card__meta-author">
            por &#64;{{ recipe().author.username }}
          </span>
        </div>
      </div>
    </a>
  `,
  styles: [
    `
      :host {
        display: block;
        /* Entrada suave de cada card al renderizarse. */
        animation: slide-up 0.45s cubic-bezier(0.22, 0.61, 0.36, 1) both;
      }

      .card {
        display: flex;
        flex-direction: column;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        box-shadow: var(--shadow-sm);
        transition: transform var(--transition-base), box-shadow var(--transition-base);
        height: 100%;
      }

      .card:hover {
        transform: translateY(-6px);
        box-shadow: var(--shadow-lg);
      }

      .card:active {
        transform: translateY(-2px);
        transition-duration: 0.1s;
      }

      .card__image {
        position: relative;
        aspect-ratio: 4 / 3;
        background: var(--color-bg-soft);
        overflow: hidden;
      }

      .card__image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--transition-slow);
      }

      .card:hover .card__image img {
        transform: scale(1.04);
      }

      .card__placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        color: var(--color-primary);
      }

      .card__badge {
        position: absolute;
        top: var(--space-3);
        left: var(--space-3);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-pill);
        font-size: var(--font-size-xs);
        font-weight: 600;
        background: var(--color-surface);
        color: var(--color-text);
        box-shadow: var(--shadow-sm);
      }

      .card__badge[data-difficulty='easy'] {
        background: var(--color-success-light);
        color: var(--color-success);
      }
      .card__badge[data-difficulty='medium'] {
        background: var(--color-accent-light);
        color: var(--color-accent);
      }
      .card__badge[data-difficulty='hard'] {
        background: var(--color-danger-light);
        color: var(--color-danger);
      }

      .card__saved {
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        width: 32px;
        height: 32px;
        background: var(--color-surface);
        color: var(--color-primary);
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-sm);
      }

      .card__body {
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        flex: 1;
      }

      .card__category {
        align-self: flex-start;
        background: var(--color-primary-light);
        color: var(--color-primary);
        padding: 2px var(--space-2);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .card__title {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--color-text);
        line-height: 1.25;
      }

      .card__desc {
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-soft);
        line-height: 1.45;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card__meta {
        margin-top: auto;
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-size-xs);
        color: var(--color-text-soft);
        padding-top: var(--space-2);
        border-top: 1px solid var(--color-border);
      }

      .card__meta-item {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
      }

      .card__meta-author {
        margin-left: auto;
        font-style: italic;
        color: var(--color-text-muted);
      }
    `
  ]
})
export class RecipeCardComponent {
  recipe = input.required<RecipeSummary>();

  totalTime = computed(() => this.recipe().prepTime + this.recipe().cookTime);

  difficultyLabel = computed(() => {
    switch (this.recipe().difficulty) {
      case 'easy':
        return 'Fácil';
      case 'medium':
        return 'Media';
      case 'hard':
        return 'Difícil';
    }
  });
}
