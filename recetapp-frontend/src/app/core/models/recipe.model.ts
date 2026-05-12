// Modelos relacionados con recetas. Reflejan exactamente el JSON
// que devuelve la API de Symfony para evitar mapeos innecesarios.

// Información mínima del autor que se incrusta en cada receta.
export interface RecipeAuthor {
  id: number;
  username: string;
  avatar?: string;
}

// Cada receta puede pertenecer a una categoría (opcional).
export interface RecipeCategory {
  id: number;
  name: string;
}

// Ingrediente individual de una receta.
export interface Ingredient {
  id: number;
  name: string;
  quantity: string;
  unit?: string;
}

// Paso de preparación de una receta.
export interface Step {
  id: number;
  stepNumber: number;
  description: string;
}

// Niveles de dificultad permitidos por la API.
export type Difficulty = 'easy' | 'medium' | 'hard';

// Receta completa con ingredientes y pasos (vista de detalle).
export interface Recipe {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: Difficulty;
  likesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  category?: RecipeCategory;
  author: RecipeAuthor;
  ingredients: Ingredient[];
  steps: Step[];
  createdAt: string;
}

// Versión resumida que se usa en listados y tarjetas.
// No incluye ingredientes/pasos para no cargar datos innecesarios.
export interface RecipeSummary {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  difficulty: Difficulty;
  likesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  category?: RecipeCategory;
  author: RecipeAuthor;
}

// Payload para crear o editar una receta. La API genera el id, el autor,
// likes, etc., así que solo enviamos los campos editables por el usuario.
export interface RecipePayload {
  title: string;
  description: string;
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: Difficulty;
  categoryId?: number;
}

// Payload para crear/editar un ingrediente desde el formulario.
export interface IngredientPayload {
  name: string;
  quantity: string;
  unit?: string;
}

// Payload para crear/editar un paso desde el formulario.
export interface StepPayload {
  stepNumber: number;
  description: string;
}
