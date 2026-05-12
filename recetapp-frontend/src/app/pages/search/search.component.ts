import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { RecipeService } from '../../core/services/recipe.service';
import { RecipeSummary, Difficulty } from '../../core/models/recipe.model';
import { RecipeCardComponent } from '../../shared/recipe-card/recipe-card.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

// Categorías disponibles para filtrar. Coinciden con las del seed del
// backend. Mostradas como chips multi-select en la barra lateral.
const CATEGORIES = [
  'Desayunos',
  'Postres',
  'Pasta',
  'Carnes',
  'Ensaladas',
  'Sopas',
  'Arroces',
  'Vegetariano'
];

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, RecipeCardComponent, LoadingSpinnerComponent],
  template: `
    <section class="search">
      <header class="search__header">
        <h1>Buscar recetas</h1>
        <p>
          Busca por nombre, por ingrediente o por varios ingredientes a la vez
          separándolos con comas (ej: <em>tomate, cebolla, ajo</em>).
        </p>

        <div class="search__bar">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input
            type="search"
            [(ngModel)]="term"
            (ngModelChange)="onTermChange($event)"
            placeholder="ej: tortilla · pollo, garbanzos · tomate, cebolla..."
            aria-label="Término de búsqueda"
          />
          @if (term) {
            <button type="button" class="search__clear" (click)="clear()" aria-label="Limpiar">
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          }
        </div>
      </header>

      <div class="search__layout">
        <!-- Sidebar de filtros. -->
        <aside class="filters">
          <h2>Filtros</h2>

          <!-- ─── Categorías ──────────────────────────────────────── -->
          <div class="filter-group">
            <h3>Categorías</h3>
            <div class="chips">
              @for (cat of categories; track cat) {
                <button
                  type="button"
                  class="chip"
                  [class.chip--active]="selectedCategories().includes(cat)"
                  (click)="toggleCategory(cat)"
                >
                  {{ cat }}
                </button>
              }
            </div>
          </div>

          <!-- ─── Dificultad ─────────────────────────────────────── -->
          <div class="filter-group">
            <h3>Dificultad</h3>
            @for (opt of difficultyOptions; track opt.value) {
              <label class="filter-check">
                <input
                  type="checkbox"
                  [checked]="selectedDifficulties().includes(opt.value)"
                  (change)="toggleDifficulty(opt.value)"
                />
                <span>{{ opt.label }}</span>
              </label>
            }
          </div>

          <!-- ─── Tiempo total ───────────────────────────────────── -->
          <div class="filter-group">
            <h3>Tiempo total</h3>
            @for (t of timeOptions; track t.value) {
              <label class="filter-radio">
                <input
                  type="radio"
                  name="time"
                  [value]="t.value"
                  [checked]="maxTime() === t.value"
                  (change)="setMaxTime(t.value)"
                />
                <span>{{ t.label }}</span>
              </label>
            }
          </div>

          @if (hasActiveFilters()) {
            <button type="button" class="filter-reset" (click)="resetFilters()">
              <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
              Limpiar filtros
            </button>
          }
        </aside>

        <!-- Resultados. -->
        <div class="results">
          @if (loading()) {
            <app-loading-spinner />
          } @else if (error()) {
            <div class="alert">{{ error() }}</div>
          } @else if (filtered().length === 0 && (hasSearched() || hasActiveFilters())) {
            <div class="empty-state">
              <i class="bi bi-search" aria-hidden="true"></i>
              <h3>Sin resultados</h3>
              <p>
                No hemos encontrado recetas
                @if (term) {
                  para <strong>"{{ term }}"</strong>
                }
                @if (activeFiltersText()) {
                  {{ activeFiltersText() }}
                }.
              </p>
            </div>
          } @else if (filtered().length > 0) {
            <p class="results__count">
              {{ filtered().length }} {{ filtered().length === 1 ? 'resultado' : 'resultados' }}
              @if (term) {
                para "<strong>{{ term }}</strong>"
              }
            </p>
            <div class="grid">
              @for (recipe of filtered(); track recipe.id) {
                <app-recipe-card [recipe]="recipe" />
              }
            </div>
          } @else {
            <p class="empty">Empieza escribiendo en el buscador o aplica un filtro.</p>
          }
        </div>
      </div>
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

      .search__header {
        margin-bottom: var(--space-5);
      }

      .search__header h1 {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--font-size-3xl);
        font-weight: 700;
      }

      .search__header p {
        margin: var(--space-1) 0 var(--space-4);
        color: var(--color-text-soft);
      }

      .search__header em {
        font-style: italic;
        color: var(--color-primary);
      }

      .search__bar {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        background: var(--color-surface);
        padding: var(--space-2) var(--space-4);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-pill);
        max-width: 640px;
        transition: all var(--transition-fast);
      }

      .search__bar:focus-within {
        border-color: var(--color-primary);
        box-shadow: var(--shadow-focus);
      }

      .search__bar > i {
        color: var(--color-text-muted);
      }

      .search__bar input {
        flex: 1;
        border: 0;
        outline: none;
        background: transparent;
        font-size: var(--font-size-base);
        padding: var(--space-2) 0;
        color: var(--color-text);
      }

      .search__bar input::-webkit-search-cancel-button,
      .search__bar input::-webkit-search-decoration {
        -webkit-appearance: none;
        appearance: none;
      }

      .search__bar input::-ms-clear {
        display: none;
      }

      .search__clear {
        background: transparent;
        border: 0;
        cursor: pointer;
        color: var(--color-text-muted);
        padding: var(--space-1);
      }

      .search__layout {
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: var(--space-6);
      }

      .filters {
        background: var(--color-surface);
        padding: var(--space-5);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        align-self: start;
        position: sticky;
        top: var(--space-5);
      }

      .filters h2 {
        margin: 0 0 var(--space-4);
        font-family: var(--font-display);
        font-size: var(--font-size-xl);
      }

      .filter-group {
        margin-bottom: var(--space-5);
      }

      .filter-group h3 {
        margin: 0 0 var(--space-3);
        font-family: var(--font-body);
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        color: var(--color-text-muted);
        letter-spacing: 0.06em;
        font-weight: 700;
      }

      /* Chips de categorías. */
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .chip {
        padding: 4px var(--space-3);
        border-radius: var(--radius-pill);
        background: var(--color-bg-soft);
        border: 1px solid var(--color-border);
        color: var(--color-text-soft);
        font-size: var(--font-size-xs);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .chip:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .chip--active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #fff;
      }

      .chip--active:hover {
        background: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
        color: #fff;
      }

      .filter-check,
      .filter-radio {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) 0;
        cursor: pointer;
        font-size: var(--font-size-sm);
      }

      .filter-check input,
      .filter-radio input {
        accent-color: var(--color-primary);
        width: 16px;
        height: 16px;
      }

      .filter-reset {
        background: var(--color-bg-soft);
        border: 0;
        color: var(--color-text-soft);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-pill);
        font-size: var(--font-size-xs);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
      }

      .filter-reset:hover {
        background: var(--color-border);
      }

      .results__count {
        margin: 0 0 var(--space-4);
        color: var(--color-text-soft);
        font-size: var(--font-size-sm);
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

      .empty {
        text-align: center;
        color: var(--color-text-muted);
        padding: var(--space-7);
        font-style: italic;
      }

      @media (max-width: 820px) {
        .search__layout {
          grid-template-columns: 1fr;
        }

        .filters {
          position: static;
        }
      }
    `
  ]
})
export class SearchComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private termInput$ = new Subject<string>();

  term = '';
  results = signal<RecipeSummary[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  hasSearched = signal(false);

  // ─── Estado de filtros (todos como signals para que computed reaccione) ─
  categories = CATEGORIES;
  selectedCategories = signal<string[]>([]);

  difficultyOptions = [
    { label: 'Fácil', value: 'easy' as Difficulty },
    { label: 'Media', value: 'medium' as Difficulty },
    { label: 'Difícil', value: 'hard' as Difficulty }
  ];
  selectedDifficulties = signal<Difficulty[]>([]);

  timeOptions = [
    { label: 'Cualquiera', value: 0 },
    { label: '≤ 30 min', value: 30 },
    { label: '≤ 60 min', value: 60 },
    { label: '≤ 2 horas', value: 120 }
  ];
  // ⚠ ANTES era una variable normal, por eso el filtro nunca disparaba
  // el computed. Ahora es un signal y el filtrado se recalcula al cambiar.
  maxTime = signal(0);

  // Filtro derivado: aplica categorías + dificultad + tiempo sobre los
  // resultados que devolvió la API. Se recalcula automáticamente al
  // cambiar cualquier signal involucrado.
  filtered = computed(() => {
    let list = this.results();

    const cats = this.selectedCategories();
    if (cats.length > 0) {
      const lowered = cats.map((c) => c.toLowerCase());
      list = list.filter((r) =>
        lowered.includes((r.category?.name ?? '').toLowerCase())
      );
    }

    const diffs = this.selectedDifficulties();
    if (diffs.length > 0) {
      list = list.filter((r) => diffs.includes(r.difficulty));
    }

    const max = this.maxTime();
    if (max > 0) {
      list = list.filter((r) => r.prepTime + r.cookTime <= max);
    }

    return list;
  });

  hasActiveFilters = computed(
    () =>
      this.selectedCategories().length > 0 ||
      this.selectedDifficulties().length > 0 ||
      this.maxTime() > 0
  );

  ngOnInit(): void {
    this.termInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.loading.set(true);
          this.error.set(null);
          // Si no hay término pero hay filtros, traemos toda la lista
          // y dejamos que el computed los aplique.
          if (!term.trim()) {
            return this.recipeService.getFeatured();
          }
          return this.recipeService.search(term);
        })
      )
      .subscribe({
        next: (data) => {
          this.results.set(data);
          this.loading.set(false);
          this.hasSearched.set(true);
        },
        error: () => {
          this.error.set('Error al buscar recetas. Inténtalo más tarde.');
          this.loading.set(false);
        }
      });

    const initial = this.route.snapshot.queryParamMap.get('search') ?? '';
    this.term = initial;
    // Dispara la primera carga: con término o sin él (lista completa).
    this.termInput$.next(initial);
  }

  onTermChange(value: string): void {
    this.term = value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.termInput$.next(value);
  }

  clear(): void {
    this.onTermChange('');
  }

  toggleCategory(cat: string): void {
    this.selectedCategories.update((curr) =>
      curr.includes(cat) ? curr.filter((x) => x !== cat) : [...curr, cat]
    );
  }

  toggleDifficulty(d: Difficulty): void {
    this.selectedDifficulties.update((curr) =>
      curr.includes(d) ? curr.filter((x) => x !== d) : [...curr, d]
    );
  }

  setMaxTime(value: number): void {
    this.maxTime.set(value);
  }

  resetFilters(): void {
    this.selectedCategories.set([]);
    this.selectedDifficulties.set([]);
    this.maxTime.set(0);
  }

  // Construye un texto descriptivo de los filtros activos para mostrar
  // en el empty state.
  activeFiltersText(): string {
    const parts: string[] = [];
    const cats = this.selectedCategories();
    if (cats.length === 1) parts.push(`en ${cats[0]}`);
    if (cats.length > 1) parts.push(`en ${cats.join(', ')}`);
    if (this.selectedDifficulties().length > 0) parts.push('con esa dificultad');
    if (this.maxTime() > 0) parts.push(`con tiempo ≤ ${this.maxTime()} min`);
    return parts.length ? ' ' + parts.join(' y ') : '';
  }
}
