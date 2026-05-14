import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../../core/services/recipe.service';
import { RecipeSummary } from '../../core/models/recipe.model';
import { RecipeCardComponent } from '../../shared/recipe-card/recipe-card.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

// Categorías mostradas como pills bajo el hero. Filtran el grid local
// (sin llamar a la API) buscando por nombre de categoría incluido en
// el campo recipe.category.name.
const CATEGORIES: { label: string; icon: string }[] = [
  { label: 'Todas',       icon: 'bi-stars' },
  { label: 'Desayunos',   icon: 'bi-cup-hot' },
  { label: 'Postres',     icon: 'bi-cake2' },
  { label: 'Pasta',       icon: 'bi-egg-fried' },
  { label: 'Carnes',      icon: 'bi-fire' },
  { label: 'Ensaladas',   icon: 'bi-flower1' },
  { label: 'Sopas',       icon: 'bi-droplet' },
  { label: 'Arroces',     icon: 'bi-grid-3x3-gap' },
  { label: 'Vegetariano', icon: 'bi-tree' }
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, RecipeCardComponent, LoadingSpinnerComponent],
  template: `
    <!-- Hero crema con búsqueda grande. -->
    <section class="hero">
      <!-- Decoración: gorro de chef grande semi-transparente en la esquina
           derecha (el mismo SVG que la marca, en versión XL como watermark). -->
      <svg
        class="hero__decoration hero__decoration--hat"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17 21H7c-.55 0-1-.45-1-1v-3h12v3c0 .55-.45 1-1 1zm0-6H7c-2.76 0-5-2.24-5-5 0-2.21 1.79-4 4-4 .07 0 .13.01.2.01.84-2.3 3.08-4.01 5.8-4.01s4.96 1.71 5.8 4.01c.07 0 .13-.01.2-.01 2.21 0 4 1.79 4 4 0 2.76-2.24 5-5 5z"/>
      </svg>

      <!-- Decoración secundaria: ramita de albahaca/laurel en la esquina
           opuesta para equilibrar la composición visual. -->
      <svg
        class="hero__decoration hero__decoration--leaf"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
      </svg>

      <div class="hero__inner">
        <h1 class="hero__title">
          ¿Qué te apetece <em>cocinar</em> hoy?
        </h1>
        <p class="hero__subtitle">
          Descubre, comparte y guarda recetas hechas por la comunidad.
        </p>

        <form class="hero__search" (ngSubmit)="goToSearch()">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input
            type="search"
            placeholder="Busca por nombre o ingrediente (ej: pollo)"
            [(ngModel)]="searchTerm"
            name="search"
            aria-label="Buscar recetas"
          />
          <button type="submit">
            <span>Buscar</span>
            <i class="bi bi-arrow-right" aria-hidden="true"></i>
          </button>
        </form>
      </div>
    </section>

    <!-- Pills de categorías en scroll horizontal. -->
    <section class="categories" aria-label="Categorías">
      <div class="categories__scroll">
        @for (cat of categories; track cat.label) {
          <button
            type="button"
            class="pill"
            [class.pill--active]="activeCategory() === cat.label"
            (click)="setCategory(cat.label)"
          >
            <i class="bi {{ cat.icon }}" aria-hidden="true"></i>
            <span>{{ cat.label }}</span>
          </button>
        }
      </div>
    </section>

    <!-- Sección destacada. -->
    <section class="featured">
      <header class="featured__header">
        <div>
          <h2>{{ activeCategory() === 'Todas' ? 'Recetas destacadas' : activeCategory() }}</h2>
          <p>
            @if (activeCategory() === 'Todas') {
              Las favoritas de la comunidad esta semana.
            } @else {
              Recetas de la categoría {{ activeCategory() }}.
            }
          </p>
        </div>
        <span class="featured__count">{{ visibleRecipes().length }} recetas</span>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (error()) {
        <div class="alert">{{ error() }}</div>
      } @else if (visibleRecipes().length === 0) {
        <div class="empty-state">
          <i class="bi bi-egg" aria-hidden="true"></i>
          <h3>Sin recetas en esta categoría</h3>
          <p>Prueba con otra categoría o crea la primera tú mismo.</p>
        </div>
      } @else {
        <div class="grid">
          @for (recipe of visibleRecipes(); track recipe.id) {
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
        padding: var(--space-5) var(--space-4) var(--space-9);
      }

      /* ─── Hero ────────────────────────────────────────────────────── */
      .hero {
        background: linear-gradient(
          135deg,
          var(--color-primary-light) 0%,
          var(--color-bg-soft) 100%
        );
        border-radius: var(--radius-xl);
        padding: var(--space-8) var(--space-5);
        margin-bottom: var(--space-7);
        position: relative;
        overflow: hidden;
      }

      .hero::before {
        content: '';
        position: absolute;
        top: -80px;
        right: -80px;
        width: 240px;
        height: 240px;
        background: radial-gradient(circle, var(--color-accent-light) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
      }

      .hero__inner {
        max-width: 720px;
        margin: 0 auto;
        text-align: center;
        position: relative;
      }

      /* ─── Decoraciones SVG flotantes ──────────────────────────────────
         Watermarks visuales para dar carácter al hero sin competir con el
         texto. Posición absoluta y baja opacidad para que se sientan como
         "fondo" decorativo. */
      .hero__decoration {
        position: absolute;
        color: var(--color-primary);
        opacity: 0.12;
        pointer-events: none;
        animation: fade-in 0.8s ease both;
        animation-delay: 200ms;
      }

      .hero__decoration--hat {
        top: -20px;
        right: 40px;
        width: 200px;
        height: 200px;
        transform: rotate(12deg);
      }

      .hero__decoration--leaf {
        bottom: -10px;
        left: 30px;
        width: 140px;
        height: 140px;
        transform: rotate(-18deg);
        color: var(--color-accent);
        opacity: 0.15;
      }

      .hero__title {
        margin: 0 0 var(--space-3);
        font-family: var(--font-display);
        font-size: clamp(var(--font-size-3xl), 4.5vw, var(--font-size-5xl));
        font-weight: 700;
        line-height: 1.1;
        color: var(--color-text);
        animation: slide-up 0.5s ease both;
        animation-delay: 0ms;
      }

      .hero__title em {
        color: var(--color-primary);
        font-style: italic;
      }

      .hero__subtitle {
        margin: 0 0 var(--space-6);
        color: var(--color-text-soft);
        font-size: var(--font-size-lg);
        animation: slide-up 0.5s ease both;
        animation-delay: 160ms;
      }

      .hero__search {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        background: var(--color-surface);
        padding: var(--space-2);
        padding-left: var(--space-4);
        border-radius: var(--radius-pill);
        box-shadow: var(--shadow-md);
        max-width: 600px;
        margin: 0 auto;
        animation: scale-in 0.5s ease both;
        animation-delay: 240ms;
      }

      .hero__search i.bi-search {
        color: var(--color-text-muted);
        font-size: var(--font-size-lg);
      }

      .hero__search input {
        flex: 1;
        border: 0;
        outline: none;
        background: transparent;
        font-size: var(--font-size-base);
        padding: var(--space-3) var(--space-2);
        color: var(--color-text);
        min-width: 0;
      }

      .hero__search input::placeholder {
        color: var(--color-text-muted);
      }

      .hero__search button {
        background: var(--color-primary);
        color: #fff;
        border: 0;
        padding: var(--space-3) var(--space-5);
        border-radius: var(--radius-pill);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        transition: background var(--transition-fast);
      }

      .hero__search button:hover {
        background: var(--color-primary-hover);
      }

      /* ─── Categorías (pills horizontales) ─────────────────────────── */
      .categories {
        margin-bottom: var(--space-6);
      }

      .categories__scroll {
        display: flex;
        gap: var(--space-2);
        overflow-x: auto;
        padding-bottom: var(--space-2);
        scrollbar-width: none;
      }

      .categories__scroll::-webkit-scrollbar {
        display: none;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-pill);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        color: var(--color-text-soft);
        font-size: var(--font-size-sm);
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: all var(--transition-fast);
      }

      .pill:hover {
        transform: translateY(-2px);
      }

      .pill:active {
        transform: translateY(0);
      }

      .pill:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .pill--active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #fff;
      }

      .pill--active:hover {
        background: var(--color-primary-hover);
        color: #fff;
      }

      /* ─── Sección destacada ───────────────────────────────────────── */
      .featured__header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: var(--space-4);
        margin-bottom: var(--space-5);
        flex-wrap: wrap;
      }

      .featured__header h2 {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--font-size-3xl);
        font-weight: 700;
      }

      .featured__header p {
        margin: var(--space-1) 0 0;
        color: var(--color-text-soft);
      }

      .featured__count {
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .grid {
        display: grid;
        gap: var(--space-5);
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }

      /* Stagger en cascada para que las cards entren una a una. */
      .grid > app-recipe-card:nth-child(1)  { animation-delay: 0ms; }
      .grid > app-recipe-card:nth-child(2)  { animation-delay: 60ms; }
      .grid > app-recipe-card:nth-child(3)  { animation-delay: 120ms; }
      .grid > app-recipe-card:nth-child(4)  { animation-delay: 180ms; }
      .grid > app-recipe-card:nth-child(5)  { animation-delay: 240ms; }
      .grid > app-recipe-card:nth-child(6)  { animation-delay: 300ms; }
      .grid > app-recipe-card:nth-child(7)  { animation-delay: 360ms; }
      .grid > app-recipe-card:nth-child(8)  { animation-delay: 420ms; }
      .grid > app-recipe-card:nth-child(n+9) { animation-delay: 480ms; }

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
        margin: 0;
        color: var(--color-text-soft);
      }

      @media (max-width: 540px) {
        :host {
          padding: var(--space-3) var(--space-3) var(--space-9);
        }

        .hero {
          padding: var(--space-6) var(--space-4);
        }

        /* Reducimos las decoraciones en móvil para no robar protagonismo. */
        .hero__decoration--hat {
          width: 130px;
          height: 130px;
          right: 10px;
          top: -10px;
        }

        .hero__decoration--leaf {
          width: 90px;
          height: 90px;
          left: 10px;
        }

        .hero__search {
          flex-direction: column;
          padding: var(--space-3);
          border-radius: var(--radius-lg);
        }

        .hero__search input,
        .hero__search button {
          width: 100%;
          justify-content: center;
        }
      }
    `
  ]
})
export class HomeComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private router = inject(Router);

  recipes = signal<RecipeSummary[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  searchTerm = '';

  // Categorías: estado local con signal para poder filtrar el grid sin
  // pegar otra petición a la API.
  categories = CATEGORIES;
  activeCategory = signal<string>('Todas');

  // Lista filtrada por la categoría activa.
  visibleRecipes = computed(() => {
    const list = this.recipes();
    const cat = this.activeCategory();
    if (cat === 'Todas') return list;
    return list.filter((r) =>
      (r.category?.name ?? '').toLowerCase().includes(cat.toLowerCase())
    );
  });

  ngOnInit(): void {
    this.loadFeatured();
  }

  setCategory(cat: string): void {
    this.activeCategory.set(cat);
  }

  private loadFeatured(): void {
    this.loading.set(true);
    this.error.set(null);

    this.recipeService.getFeatured().subscribe({
      next: (data) => {
        this.recipes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las recetas. Inténtalo más tarde.');
        this.loading.set(false);
      }
    });
  }

  goToSearch(): void {
    const term = this.searchTerm.trim();
    if (!term) {
      this.router.navigate(['/search']);
      return;
    }
    this.router.navigate(['/search'], { queryParams: { search: term } });
  }
}
