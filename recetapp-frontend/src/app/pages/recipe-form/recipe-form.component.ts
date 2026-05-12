import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { RecipeService } from '../../core/services/recipe.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { Recipe } from '../../core/models/recipe.model';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    @if (initialLoading()) {
      <app-loading-spinner />
    } @else {
      <section class="form-page">
        <div class="form-page__inner">
          <header class="form-page__header">
            <span class="form-page__eyebrow">{{ isEditMode() ? 'Editando' : 'Nueva' }}</span>
            <h1>{{ isEditMode() ? 'Editar receta' : 'Crear nueva receta' }}</h1>
            <p>Completa los detalles para que otros puedan cocinarla.</p>
          </header>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <!-- Sección 1: Información general. -->
            <section class="card">
              <header class="card__header">
                <span class="card__icon"><i class="bi bi-info-circle" aria-hidden="true"></i></span>
                <div>
                  <h2>Información general</h2>
                  <p>Lo básico de tu receta.</p>
                </div>
              </header>

              <div class="card__body">
                <label class="field">
                  <span class="field__label">Título</span>
                  <input type="text" formControlName="title" placeholder="Ej: Tortilla de patatas" />
                  @if (showError('title', 'required')) {
                    <span class="field__error">El título es obligatorio.</span>
                  }
                </label>

                <label class="field">
                  <span class="field__label">Descripción</span>
                  <textarea
                    formControlName="description"
                    rows="3"
                    placeholder="Describe brevemente la receta..."
                  ></textarea>
                  @if (showError('description', 'required')) {
                    <span class="field__error">La descripción es obligatoria.</span>
                  }
                </label>

                <label class="field">
                  <span class="field__label">URL de la imagen</span>
                  <input type="url" formControlName="imageUrl" placeholder="https://..." />
                </label>

                <div class="row row--3">
                  <label class="field">
                    <span class="field__label">Preparación</span>
                    <div class="field__suffix-wrapper">
                      <input type="number" min="0" formControlName="prepTime" />
                      <span class="field__suffix">min</span>
                    </div>
                  </label>
                  <label class="field">
                    <span class="field__label">Cocción</span>
                    <div class="field__suffix-wrapper">
                      <input type="number" min="0" formControlName="cookTime" />
                      <span class="field__suffix">min</span>
                    </div>
                  </label>
                  <label class="field">
                    <span class="field__label">Raciones</span>
                    <input type="number" min="1" formControlName="servings" />
                  </label>
                </div>

                <label class="field">
                  <span class="field__label">Dificultad</span>
                  <select formControlName="difficulty">
                    <option value="easy">Fácil</option>
                    <option value="medium">Media</option>
                    <option value="hard">Difícil</option>
                  </select>
                </label>
              </div>
            </section>

            <!-- Sección 2: Ingredientes. -->
            <section class="card" formArrayName="ingredients">
              <header class="card__header">
                <span class="card__icon"><i class="bi bi-basket3" aria-hidden="true"></i></span>
                <div>
                  <h2>Ingredientes</h2>
                  <p>Lista todos los ingredientes con cantidad y unidad.</p>
                </div>
                <span class="card__count">{{ ingredients.length }}</span>
              </header>

              <div class="card__body">
                @if (ingredients.length === 0) {
                  <p class="empty-list">Aún no has añadido ingredientes.</p>
                }

                @for (ing of ingredients.controls; track $index; let i = $index) {
                  <div class="ing-row" [formGroupName]="i">
                    <label class="field field--name">
                      <span class="field__label">Ingrediente</span>
                      <input type="text" formControlName="name" placeholder="Patata" />
                    </label>
                    <label class="field field--qty">
                      <span class="field__label">Cantidad</span>
                      <input type="text" formControlName="quantity" placeholder="500" />
                    </label>
                    <label class="field field--unit">
                      <span class="field__label">Unidad</span>
                      <input type="text" formControlName="unit" placeholder="g, ml, ud..." />
                    </label>
                    <button
                      type="button"
                      class="btn-remove"
                      (click)="removeIngredient(i)"
                      aria-label="Eliminar ingrediente"
                      title="Eliminar"
                    >
                      <i class="bi bi-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                }

                <button type="button" class="btn-add" (click)="addIngredient()">
                  <i class="bi bi-plus-lg" aria-hidden="true"></i>
                  <span>Añadir ingrediente</span>
                </button>
              </div>
            </section>

            <!-- Sección 3: Pasos. -->
            <section class="card" formArrayName="steps">
              <header class="card__header">
                <span class="card__icon"><i class="bi bi-list-ol" aria-hidden="true"></i></span>
                <div>
                  <h2>Pasos de preparación</h2>
                  <p>Numerados en orden de ejecución.</p>
                </div>
                <span class="card__count">{{ steps.length }}</span>
              </header>

              <div class="card__body">
                @if (steps.length === 0) {
                  <p class="empty-list">Aún no has añadido pasos.</p>
                }

                @for (step of steps.controls; track $index; let i = $index) {
                  <div class="step-row" [formGroupName]="i">
                    <span class="step-number" aria-hidden="true">{{ i + 1 }}</span>
                    <label class="field field--grow">
                      <span class="field__label">Paso {{ i + 1 }}</span>
                      <textarea
                        formControlName="description"
                        rows="2"
                        placeholder="Pelar y cortar las patatas..."
                      ></textarea>
                    </label>
                    <button
                      type="button"
                      class="btn-remove"
                      (click)="removeStep(i)"
                      aria-label="Eliminar paso"
                      title="Eliminar"
                    >
                      <i class="bi bi-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                }

                <button type="button" class="btn-add" (click)="addStep()">
                  <i class="bi bi-plus-lg" aria-hidden="true"></i>
                  <span>Añadir paso</span>
                </button>
              </div>
            </section>

            @if (apiError()) {
              <div class="alert">
                <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
                {{ apiError() }}
              </div>
            }

            <!-- Barra sticky inferior. -->
            <div class="sticky-actions">
              <div class="sticky-actions__inner">
                <button type="button" class="btn-ghost" (click)="cancel()" [disabled]="saving()">
                  <i class="bi bi-x-lg" aria-hidden="true"></i>
                  <span>Cancelar</span>
                </button>
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  @if (saving()) {
                    <app-loading-spinner />
                  } @else {
                    <i class="bi bi-check-lg" aria-hidden="true"></i>
                    <span>{{ isEditMode() ? 'Guardar cambios' : 'Publicar receta' }}</span>
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .form-page {
        background: var(--color-bg);
        min-height: 100vh;
        padding: var(--space-6) var(--space-4);
        /* Espacio para que la sticky bar no tape el último input. */
        padding-bottom: 120px;
      }

      .form-page__inner {
        max-width: 760px;
        margin: 0 auto;
      }

      /* ─── Cabecera de la página ──────────────────────────────────── */
      .form-page__header {
        margin-bottom: var(--space-6);
      }

      .form-page__eyebrow {
        display: inline-block;
        background: var(--color-primary-light);
        color: var(--color-primary);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-pill);
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .form-page__header h1 {
        margin: var(--space-2) 0 var(--space-1);
        font-family: var(--font-display);
        font-size: var(--font-size-3xl);
        font-weight: 700;
      }

      .form-page__header p {
        margin: 0;
        color: var(--color-text-soft);
      }

      /* ─── Tarjeta de sección ─────────────────────────────────────── */
      .card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-4);
        overflow: hidden;
        padding: 0;
      }

      .card__header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--color-border);
        background: var(--color-bg-soft);
      }

      .card__icon {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-md);
        background: var(--color-primary-light);
        color: var(--color-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        flex-shrink: 0;
      }

      .card__header h2 {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--font-size-lg);
        font-weight: 700;
      }

      .card__header p {
        margin: 0;
        color: var(--color-text-soft);
        font-size: var(--font-size-sm);
      }

      .card__count {
        margin-left: auto;
        background: var(--color-surface);
        color: var(--color-text-soft);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-pill);
        font-size: var(--font-size-xs);
        font-weight: 700;
        border: 1px solid var(--color-border);
      }

      .card__body {
        padding: var(--space-5);
      }

      /* ─── Campos genéricos ───────────────────────────────────────── */
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }

      .field:last-child {
        margin-bottom: 0;
      }

      .field--grow {
        flex: 1;
      }

      .field__label {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--color-text);
      }

      .field input,
      .field textarea,
      .field select {
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg-soft);
        font-size: var(--font-size-base);
        font-family: inherit;
        color: var(--color-text);
        transition: all var(--transition-fast);
        width: 100%;
      }

      .field input:focus,
      .field textarea:focus,
      .field select:focus {
        outline: none;
        border-color: var(--color-primary);
        background: var(--color-surface);
        box-shadow: var(--shadow-focus);
      }

      .field textarea {
        resize: vertical;
        min-height: 80px;
      }

      .field__error {
        color: var(--color-danger);
        font-size: var(--font-size-xs);
      }

      /* Wrapper para inputs con sufijo "min". */
      .field__suffix-wrapper {
        position: relative;
      }

      .field__suffix-wrapper input {
        padding-right: 50px;
      }

      .field__suffix {
        position: absolute;
        right: var(--space-3);
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
        font-weight: 500;
        pointer-events: none;
      }

      .row {
        display: grid;
        gap: var(--space-3);
      }

      .row--3 {
        grid-template-columns: repeat(3, 1fr);
      }

      /* ─── Filas de ingredientes ──────────────────────────────────── */
      .ing-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 44px;
        gap: var(--space-3);
        align-items: end;
        padding: var(--space-3);
        margin-bottom: var(--space-2);
        background: var(--color-bg-soft);
        border-radius: var(--radius-md);
        border: 1px solid transparent;
        transition: border-color var(--transition-fast);
      }

      .ing-row:hover {
        border-color: var(--color-border);
      }

      .ing-row .field {
        margin-bottom: 0;
      }

      .ing-row .field input {
        background: var(--color-surface);
      }

      /* ─── Filas de pasos ─────────────────────────────────────────── */
      .step-row {
        display: grid;
        grid-template-columns: 44px 1fr 44px;
        gap: var(--space-3);
        align-items: start;
        padding: var(--space-3);
        margin-bottom: var(--space-2);
        background: var(--color-bg-soft);
        border-radius: var(--radius-md);
        border: 1px solid transparent;
        transition: border-color var(--transition-fast);
      }

      .step-row:hover {
        border-color: var(--color-border);
      }

      .step-row .field {
        margin-bottom: 0;
      }

      .step-row .field textarea {
        background: var(--color-surface);
      }

      .step-number {
        margin-top: 28px; /* alinear con el primer renglón del textarea */
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--color-primary);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-weight: 700;
        font-size: var(--font-size-base);
        flex-shrink: 0;
      }

      /* ─── Botones de acción dentro de las filas ──────────────────── */
      .btn-remove {
        align-self: end;
        background: transparent;
        border: 1px solid transparent;
        color: var(--color-text-muted);
        width: 44px;
        height: 44px;
        border-radius: var(--radius-md);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.05rem;
        transition: all var(--transition-fast);
      }

      .btn-remove:hover {
        background: var(--color-danger-light);
        color: var(--color-danger);
        border-color: var(--color-danger);
      }

      /* En step-row, alineamos el botón al primer renglón del textarea. */
      .step-row .btn-remove {
        align-self: start;
        margin-top: 24px;
      }

      .btn-add {
        background: transparent;
        border: 2px dashed var(--color-border);
        color: var(--color-primary);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        font-weight: 600;
        font-size: var(--font-size-sm);
        cursor: pointer;
        width: 100%;
        margin-top: var(--space-3);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        transition: all var(--transition-fast);
      }

      .btn-add:hover {
        border-color: var(--color-primary);
        background: var(--color-primary-light);
        border-style: solid;
      }

      .empty-list {
        color: var(--color-text-muted);
        font-style: italic;
        margin: 0 0 var(--space-2);
        text-align: center;
        padding: var(--space-3);
      }

      .alert {
        background: var(--color-danger-light);
        color: var(--color-danger);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-4);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      /* ─── Barra sticky inferior ──────────────────────────────────── */
      .sticky-actions {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--color-surface);
        border-top: 1px solid var(--color-border);
        padding: var(--space-3) var(--space-4);
        box-shadow: var(--shadow-lg);
        z-index: var(--z-sticky);
      }

      .sticky-actions__inner {
        max-width: 760px;
        margin: 0 auto;
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
      }

      @media (min-width: 992px) {
        .sticky-actions {
          left: var(--sidebar-width);
        }
      }

      @media (max-width: 991px) {
        .sticky-actions {
          bottom: var(--bottom-nav-height);
        }
      }

      .btn-primary,
      .btn-ghost {
        padding: var(--space-3) var(--space-5);
        border-radius: var(--radius-pill);
        font-weight: 600;
        font-size: var(--font-size-sm);
        border: 0;
        cursor: pointer;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        transition: all var(--transition-fast);
      }

      .btn-primary {
        background: var(--color-primary);
        color: #fff;
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--color-primary-hover);
      }

      .btn-ghost {
        background: transparent;
        border: 1px solid var(--color-border);
        color: var(--color-text);
      }

      .btn-ghost:hover {
        border-color: var(--color-text-soft);
      }

      .btn-primary:disabled,
      .btn-ghost:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* ─── Responsive ─────────────────────────────────────────────── */
      @media (max-width: 720px) {
        .form-page {
          padding: var(--space-4) var(--space-3);
          padding-bottom: 140px;
        }

        .card__header {
          padding: var(--space-3) var(--space-4);
        }

        .card__body {
          padding: var(--space-4);
        }

        .row--3 {
          grid-template-columns: 1fr;
        }

        .ing-row {
          grid-template-columns: 1fr 1fr 44px;
        }

        .ing-row .field--name {
          grid-column: 1 / -1;
        }

        .ing-row .btn-remove {
          grid-column: 3;
          grid-row: 1;
          align-self: start;
        }

        .sticky-actions__inner {
          flex-direction: column-reverse;
        }

        .btn-primary,
        .btn-ghost {
          width: 100%;
        }
      }
    `
  ]
})
export class RecipeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private router = inject(Router);

  id = input<string | undefined>(undefined);
  isEditMode = computed(() => !!this.id());

  initialLoading = signal(false);
  saving = signal(false);
  apiError = signal<string | null>(null);

  private originalIngredientIds = new Set<number>();
  private originalStepIds = new Set<number>();

  form: FormGroup = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    imageUrl: [''],
    prepTime: [10, [Validators.required, Validators.min(0)]],
    cookTime: [20, [Validators.required, Validators.min(0)]],
    servings: [4, [Validators.required, Validators.min(1)]],
    difficulty: ['easy' as 'easy' | 'medium' | 'hard', [Validators.required]],
    ingredients: this.fb.array<FormGroup>([]),
    steps: this.fb.array<FormGroup>([])
  });

  get ingredients(): FormArray<FormGroup> {
    return this.form.get('ingredients') as FormArray<FormGroup>;
  }

  get steps(): FormArray<FormGroup> {
    return this.form.get('steps') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    if (this.isEditMode()) {
      this.loadForEdit(Number(this.id()));
    } else {
      this.addIngredient();
      this.addStep();
    }
  }

  private loadForEdit(recipeId: number): void {
    this.initialLoading.set(true);
    this.recipeService.getById(recipeId).subscribe({
      next: (r: Recipe) => {
        this.form.patchValue({
          title: r.title,
          description: r.description,
          imageUrl: r.imageUrl ?? '',
          prepTime: r.prepTime,
          cookTime: r.cookTime,
          servings: r.servings,
          difficulty: r.difficulty
        });

        r.ingredients.forEach((ing) => {
          this.originalIngredientIds.add(ing.id);
          this.ingredients.push(
            this.fb.nonNullable.group({
              id: [ing.id],
              name: [ing.name, Validators.required],
              quantity: [ing.quantity, Validators.required],
              unit: [ing.unit ?? '']
            })
          );
        });

        [...r.steps]
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .forEach((step) => {
            this.originalStepIds.add(step.id);
            this.steps.push(
              this.fb.nonNullable.group({
                id: [step.id],
                stepNumber: [step.stepNumber],
                description: [step.description, Validators.required]
              })
            );
          });

        this.initialLoading.set(false);
      },
      error: () => {
        this.initialLoading.set(false);
        this.apiError.set('No se pudo cargar la receta para editar.');
      }
    });
  }

  addIngredient(): void {
    this.ingredients.push(
      this.fb.nonNullable.group({
        id: [null as number | null],
        name: ['', Validators.required],
        quantity: ['', Validators.required],
        unit: ['']
      })
    );
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  addStep(): void {
    this.steps.push(
      this.fb.nonNullable.group({
        id: [null as number | null],
        stepNumber: [this.steps.length + 1],
        description: ['', Validators.required]
      })
    );
  }

  removeStep(index: number): void {
    this.steps.removeAt(index);
    this.steps.controls.forEach((ctrl, i) => {
      ctrl.get('stepNumber')?.setValue(i + 1);
    });
  }

  showError(controlName: string, errorKey: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.touched && ctrl.hasError(errorKey);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.apiError.set(null);

    const value = this.form.getRawValue();
    const payload = {
      title: value.title,
      description: value.description,
      imageUrl: value.imageUrl || undefined,
      prepTime: Number(value.prepTime),
      cookTime: Number(value.cookTime),
      servings: Number(value.servings),
      difficulty: value.difficulty
    };

    if (this.isEditMode()) {
      this.updateExisting(Number(this.id()), payload, value.ingredients, value.steps);
    } else {
      this.createNew(payload, value.ingredients, value.steps);
    }
  }

  private createNew(payload: any, ingredients: any[], steps: any[]): void {
    this.recipeService.create(payload).subscribe({
      next: (created) => {
        const ingObs = ingredients.map((i) =>
          this.recipeService.addIngredient(created.id, {
            name: i.name,
            quantity: i.quantity,
            unit: i.unit || undefined
          })
        );
        const stepObs = steps.map((s, idx) =>
          this.recipeService.addStep(created.id, {
            stepNumber: idx + 1,
            description: s.description
          })
        );

        const all$ = [...ingObs, ...stepObs];
        forkJoin(all$.length ? all$ : [of(null)]).subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/recipes', created.id]);
          },
          error: () => {
            this.saving.set(false);
            this.router.navigate(['/recipes', created.id, 'edit']);
          }
        });
      },
      error: () => {
        this.saving.set(false);
        this.apiError.set('No se pudo crear la receta. Revisa los datos.');
      }
    });
  }

  private updateExisting(recipeId: number, payload: any, ingredients: any[], steps: any[]): void {
    this.recipeService.update(recipeId, payload).subscribe({
      next: () => {
        const currentIngIds = new Set<number>(
          ingredients.filter((i) => i.id != null).map((i) => i.id as number)
        );
        const currentStepIds = new Set<number>(
          steps.filter((s) => s.id != null).map((s) => s.id as number)
        );

        const ingsToDelete = [...this.originalIngredientIds].filter((id) => !currentIngIds.has(id));
        const stepsToDelete = [...this.originalStepIds].filter((id) => !currentStepIds.has(id));

        const ops = [
          ...ingsToDelete.map((id) =>
            this.recipeService.deleteIngredientFromRecipe(recipeId, id)
          ),
          ...stepsToDelete.map((id) => this.recipeService.deleteStepFromRecipe(recipeId, id)),
          ...ingredients
            .filter((i) => i.id == null)
            .map((i) =>
              this.recipeService.addIngredient(recipeId, {
                name: i.name,
                quantity: i.quantity,
                unit: i.unit || undefined
              })
            ),
          ...steps
            .filter((s) => s.id == null)
            .map((s, idx) =>
              this.recipeService.addStep(recipeId, {
                stepNumber: idx + 1,
                description: s.description
              })
            )
        ];

        forkJoin(ops.length ? ops : [of(null)]).subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/recipes', recipeId]);
          },
          error: () => {
            this.saving.set(false);
            this.apiError.set(
              'La receta se guardó pero algún ingrediente o paso no se pudo actualizar.'
            );
          }
        });
      },
      error: () => {
        this.saving.set(false);
        this.apiError.set('No se pudo guardar la receta.');
      }
    });
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/recipes', Number(this.id())]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
