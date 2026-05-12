import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import {
  Ingredient,
  IngredientPayload,
  Recipe,
  RecipePayload,
  RecipeSummary,
  Step,
  StepPayload
} from '../models/recipe.model';
import { environment } from '../../../environments/environment';

// Adaptador entre el backend Symfony (en español) y los modelos del
// frontend (en inglés). El backend devuelve nombre/descripcion/tiempo/...,
// aquí lo convertimos a title/description/prepTime/cookTime/...

interface BackendRecipeListItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  tiempo: number | null;
  raciones: number | null;
  imagen_url: string | null;
  dificultad: string | null;
  created_at: string | null;
  usuario: string; // gmail del autor
  categoria?: {
    id: number;
    nombre: string;
    slug: string;
  } | null;
}

// Devuelve una dificultad válida ('easy'/'medium'/'hard'). Si el backend
// devuelve null o un valor inesperado, asumimos 'easy' como por defecto.
function mapDificultad(d: string | null | undefined): 'easy' | 'medium' | 'hard' {
  if (d === 'medium' || d === 'hard') return d;
  return 'easy';
}

interface BackendIngredient {
  id: number;
  nombre: string;
  cantidad: number | null;
  unidad: string | null;
}

interface BackendStep {
  id: number;
  numero_paso: number;
  descripcion: string;
  imagen_url?: string | null;
  duracion?: number | null;
}

// Convierte un autor (string gmail) en el author del frontend.
function authorFromGmail(gmail: string) {
  const username = (gmail ?? '').split('@')[0] || gmail;
  return {
    id: 0,
    username
  };
}

// Mapper para el listado / búsqueda. El backend solo expone el tiempo
// como un único entero — lo metemos en cookTime y dejamos prepTime en 0.
function mapToSummary(b: BackendRecipeListItem): RecipeSummary {
  return {
    id: b.id,
    title: b.nombre,
    description: b.descripcion ?? '',
    imageUrl: b.imagen_url ?? undefined,
    prepTime: 0,
    cookTime: b.tiempo ?? 0,
    difficulty: mapDificultad(b.dificultad),
    likesCount: 0, // el backend no la devuelve en el listado
    isLiked: false,
    isSaved: false,
    author: authorFromGmail(b.usuario),
    category: b.categoria
      ? { id: b.categoria.id, name: b.categoria.nombre }
      : undefined
  };
}

function mapIngredient(i: BackendIngredient): Ingredient {
  return {
    id: i.id,
    name: i.nombre,
    quantity: i.cantidad != null ? String(i.cantidad) : '',
    unit: i.unidad ?? undefined
  };
}

function mapStep(s: BackendStep): Step {
  return {
    id: s.id,
    stepNumber: s.numero_paso,
    description: s.descripcion
  };
}

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // GET /api/recetas — listado destacadas. El backend devuelve 404
  // cuando no hay recetas; lo tratamos como lista vacía.
  getFeatured(): Observable<RecipeSummary[]> {
    return this.http.get<BackendRecipeListItem[]>(`${this.apiUrl}/recetas`).pipe(
      map((arr) => arr.map(mapToSummary)),
      catchError((err) => (err?.status === 404 ? of([] as RecipeSummary[]) : of([] as RecipeSummary[])))
    );
  }

  // GET /api/recetas?q=... — el backend usa el parámetro `q`, no `search`.
  search(term: string): Observable<RecipeSummary[]> {
    if (!term.trim()) return this.getFeatured();
    const params = new HttpParams().set('q', term);
    return this.http.get<BackendRecipeListItem[]>(`${this.apiUrl}/recetas`, { params }).pipe(
      map((arr) => arr.map(mapToSummary)),
      catchError(() => of([] as RecipeSummary[]))
    );
  }

  // GET /api/recetas?categoria=X — filtrado server-side por categoría
  // (slug o nombre, ej: "postres", "Postres", "pasta").
  getByCategoria(categoria: string): Observable<RecipeSummary[]> {
    const params = new HttpParams().set('categoria', categoria);
    return this.http.get<BackendRecipeListItem[]>(`${this.apiUrl}/recetas`, { params }).pipe(
      map((arr) => arr.map(mapToSummary)),
      catchError(() => of([] as RecipeSummary[]))
    );
  }

  // GET /api/recetas/{id} (solo cabecera) + ingredientes + pasos en
  // peticiones paralelas. El detalle del frontend espera todo junto.
  getById(id: number): Observable<Recipe> {
    return forkJoin({
      header: this.http.get<BackendRecipeListItem>(`${this.apiUrl}/recetas/${id}`),
      ingredients: this.http
        .get<BackendIngredient[]>(`${this.apiUrl}/recetas/${id}/ingredientes`)
        .pipe(catchError(() => of([] as BackendIngredient[]))),
      steps: this.http
        .get<BackendStep[]>(`${this.apiUrl}/recetas/${id}/pasos`)
        .pipe(catchError(() => of([] as BackendStep[])))
    }).pipe(
      map(({ header, ingredients, steps }) => ({
        id: header.id,
        title: header.nombre,
        description: header.descripcion ?? '',
        imageUrl: header.imagen_url ?? undefined,
        prepTime: 0,
        cookTime: header.tiempo ?? 0,
        servings: header.raciones ?? 1,
        difficulty: mapDificultad(header.dificultad),
        likesCount: 0,
        isLiked: false,
        isSaved: false,
        category: header.categoria
          ? { id: header.categoria.id, name: header.categoria.nombre }
          : undefined,
        author: authorFromGmail(header.usuario),
        ingredients: ingredients.map(mapIngredient),
        steps: steps.map(mapStep),
        createdAt: header.created_at ?? ''
      }) as Recipe)
    );
  }

  // POST /api/recetas — el backend espera nombre_receta, descripcion,
  // tiempo, raciones, imagen_url, dificultad. Mapeamos desde el payload
  // del frontend.
  create(payload: RecipePayload): Observable<Recipe> {
    const body = {
      nombre_receta: payload.title,
      descripcion: payload.description,
      tiempo: payload.prepTime + payload.cookTime,
      raciones: payload.servings,
      imagen_url: payload.imageUrl,
      dificultad: payload.difficulty
    };
    return this.http
      .post<{ mensaje: string; id: number }>(`${this.apiUrl}/recetas`, body)
      .pipe(
        map((res) => ({ id: res.id }) as unknown as Recipe)
      );
  }

  update(id: number, payload: RecipePayload): Observable<Recipe> {
    const body = {
      nombre_receta: payload.title,
      descripcion: payload.description,
      tiempo: payload.prepTime + payload.cookTime,
      raciones: payload.servings,
      imagen_url: payload.imageUrl,
      dificultad: payload.difficulty
    };
    return this.http
      .put<{ mensaje: string }>(`${this.apiUrl}/recetas/${id}`, body)
      .pipe(map(() => ({ id }) as unknown as Recipe));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<{ mensaje: string }>(`${this.apiUrl}/recetas/${id}`)
      .pipe(map(() => undefined));
  }

  // ─── Ingredientes (POST y DELETE; el backend no expone PUT) ─────────
  addIngredient(recipeId: number, payload: IngredientPayload): Observable<Ingredient> {
    const body = {
      nombre: payload.name,
      cantidad: Number(payload.quantity) || 0,
      unidad: payload.unit ?? null
    };
    return this.http
      .post<{ mensaje: string; id?: number }>(`${this.apiUrl}/recetas/${recipeId}/ingredientes`, body)
      .pipe(
        map((res) => ({
          id: res.id ?? 0,
          name: payload.name,
          quantity: payload.quantity,
          unit: payload.unit
        }))
      );
  }

  // El backend no soporta PUT de ingredientes. Para "editar" hay que
  // borrar y volver a crear. Aquí mantenemos la firma usada por el
  // frontend pero hacemos delete + post.
  updateIngredient(id: number, _payload: IngredientPayload): Observable<Ingredient> {
    // No tenemos el recipeId aquí; sin él no podemos recrear el ingrediente.
    // Devolvemos un observable vacío y dejamos un aviso.
    console.warn('updateIngredient: el backend no expone PUT, usa addIngredient + deleteIngredient.');
    return of({ id, name: _payload.name, quantity: _payload.quantity, unit: _payload.unit });
  }

  // El backend espera DELETE /api/recetas/{recipeId}/ingredientes/{id}.
  // Solo recibimos el id del ingrediente, así que aquí no podemos borrarlo
  // sin el recipeId. Mantenemos la API por compatibilidad pero no hace nada.
  deleteIngredient(_id: number): Observable<void> {
    console.warn('deleteIngredient: requiere recipeId. No-op.');
    return of(undefined);
  }

  // Versión correcta que SÍ funciona contra el backend.
  deleteIngredientFromRecipe(recipeId: number, ingredientId: number): Observable<void> {
    return this.http
      .delete<{ mensaje: string }>(
        `${this.apiUrl}/recetas/${recipeId}/ingredientes/${ingredientId}`
      )
      .pipe(map(() => undefined));
  }

  // ─── Pasos (mismo patrón) ──────────────────────────────────────────
  addStep(recipeId: number, payload: StepPayload): Observable<Step> {
    const body = {
      numero_paso: payload.stepNumber,
      descripcion: payload.description
    };
    return this.http
      .post<{ mensaje: string; id?: number }>(`${this.apiUrl}/recetas/${recipeId}/pasos`, body)
      .pipe(
        map((res) => ({
          id: res.id ?? 0,
          stepNumber: payload.stepNumber,
          description: payload.description
        }))
      );
  }

  updateStep(id: number, _payload: StepPayload): Observable<Step> {
    console.warn('updateStep: el backend no expone PUT, usa addStep + deleteStep.');
    return of({ id, stepNumber: _payload.stepNumber, description: _payload.description });
  }

  deleteStep(_id: number): Observable<void> {
    console.warn('deleteStep: requiere recipeId. No-op.');
    return of(undefined);
  }

  deleteStepFromRecipe(recipeId: number, stepId: number): Observable<void> {
    return this.http
      .delete<{ mensaje: string }>(`${this.apiUrl}/recetas/${recipeId}/pasos/${stepId}`)
      .pipe(map(() => undefined));
  }

  // ─── Likes (toggle) ─────────────────────────────────────────────────
  // El backend usa un único endpoint POST que alterna el like.
  // Para encajar con la API del frontend (like / unlike) ambos invocan
  // el mismo endpoint.
  like(recipeId: number): Observable<void> {
    return this.http
      .post<{ mensaje: string }>(`${this.apiUrl}/likes/${recipeId}`, {})
      .pipe(map(() => undefined));
  }

  unlike(recipeId: number): Observable<void> {
    return this.like(recipeId);
  }

  // ─── Guardadas (toggle) ─────────────────────────────────────────────
  save(recipeId: number): Observable<void> {
    return this.http
      .post<{ mensaje: string }>(`${this.apiUrl}/guardadas/${recipeId}`, {})
      .pipe(map(() => undefined));
  }

  unsave(recipeId: number): Observable<void> {
    return this.save(recipeId);
  }

  // GET /api/guardadas — recetas guardadas por el usuario logueado.
  getSaved(): Observable<RecipeSummary[]> {
    return this.http.get<BackendRecipeListItem[]>(`${this.apiUrl}/guardadas`).pipe(
      map((arr) => arr.map(mapToSummary)),
      catchError(() => of([] as RecipeSummary[]))
    );
  }
}
