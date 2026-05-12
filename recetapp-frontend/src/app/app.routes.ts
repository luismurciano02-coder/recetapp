import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

// El orden importa: las rutas más específicas (recipes/new, recipes/:id/edit)
// deben ir ANTES que la genérica recipes/:id, si no Angular las captura como
// si "new" o "edit" fueran ids.
export const routes: Routes = [
  // ─── Públicas (sin auth) ────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'RecetApp — Inicio'
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./pages/search/search.component').then((m) => m.SearchComponent),
    title: 'Buscar recetas — RecetApp'
  },

  // ─── Solo invitados ─────────────────────────────────────────────────
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar sesión — RecetApp'
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
    title: 'Crear cuenta — RecetApp'
  },

  // ─── Privadas (requieren sesión) ────────────────────────────────────
  // ⚠ recipes/new debe ir ANTES de recipes/:id para que :id no lo capture.
  {
    path: 'recipes/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
    title: 'Nueva receta — RecetApp'
  },
  {
    path: 'recipes/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
    title: 'Editar receta — RecetApp'
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
    title: 'Mi perfil — RecetApp'
  },
  {
    path: 'saved',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/saved-recipes/saved-recipes.component').then((m) => m.SavedRecipesComponent),
    title: 'Recetas guardadas — RecetApp'
  },

  // ─── Pública (sin auth) ──── ir DESPUÉS de las específicas ──────────
  {
    path: 'recipes/:id',
    loadComponent: () =>
      import('./pages/recipe-detail/recipe-detail.component').then((m) => m.RecipeDetailComponent),
    title: 'Receta — RecetApp'
  },

  // ─── Comodín 404 ────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Página no encontrada — RecetApp'
  }
];
