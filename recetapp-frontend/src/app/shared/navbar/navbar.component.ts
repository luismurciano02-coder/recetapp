import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

// Navbar adaptativo:
//   · ≥992px → sidebar fijo a la izquierda (240px) con marca + enlaces
//             verticales + buscador inline.
//   · <992px → bottom nav fija con iconos.
// El layout principal (app.ts) deja un padding-left: 240px en desktop
// y un padding-bottom: 64px en móvil para no quedar ocultos.
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule],
  template: `
    <!-- ═══════════════ Sidebar (desktop ≥992px) ═══════════════ -->
    <aside class="sidebar d-none d-lg-flex flex-column">
      <!-- Marca con logo + Playfair Display. -->
      <a class="sidebar__brand" routerLink="/">
        <span class="sidebar__brand-icon" aria-hidden="true">
          <!-- Gorro de chef (toque blanche). SVG inline para evitar
               dependencia de iconos externos: bootstrap-icons no incluye
               uno y queremos coherencia visual con la marca. -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="logo-svg">
            <path d="M17 21H7c-.55 0-1-.45-1-1v-3h12v3c0 .55-.45 1-1 1zm0-6H7c-2.76 0-5-2.24-5-5 0-2.21 1.79-4 4-4 .07 0 .13.01.2.01.84-2.3 3.08-4.01 5.8-4.01s4.96 1.71 5.8 4.01c.07 0 .13-.01.2-.01 2.21 0 4 1.79 4 4 0 2.76-2.24 5-5 5z"/>
          </svg>
        </span>
        <span class="sidebar__brand-text">RecetApp</span>
      </a>

      @if (auth.isLoggedIn()) {
        <!-- Buscador inline siempre visible en sidebar. -->
        <form class="sidebar__search" (ngSubmit)="submitSearch()">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input
            type="search"
            [(ngModel)]="searchTerm"
            (keyup.enter)="submitSearch()"
            placeholder="Buscar recetas..."
            name="navbarSearch"
            aria-label="Buscar recetas"
          />
        </form>

        <nav class="sidebar__nav" aria-label="Navegación principal">
          <a
            class="sidebar__link"
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <i class="bi bi-house-door" aria-hidden="true"></i>
            <span>Inicio</span>
          </a>
          <a class="sidebar__link" routerLink="/search" routerLinkActive="active">
            <i class="bi bi-compass" aria-hidden="true"></i>
            <span>Explorar</span>
          </a>
          <a class="sidebar__link" routerLink="/saved" routerLinkActive="active">
            <i class="bi bi-bookmark" aria-hidden="true"></i>
            <span>Guardadas</span>
          </a>
          <a class="sidebar__link" routerLink="/recipes/new" routerLinkActive="active">
            <i class="bi bi-plus-circle" aria-hidden="true"></i>
            <span>Nueva receta</span>
          </a>
          <a class="sidebar__link" routerLink="/profile" routerLinkActive="active">
            <i class="bi bi-person-circle" aria-hidden="true"></i>
            <span>Perfil</span>
          </a>
        </nav>

        <!-- Footer del sidebar con info del usuario. -->
        <div class="sidebar__footer">
          <div class="sidebar__user">
            @if (auth.currentUser()?.avatar; as avatar) {
              <img [src]="avatar" alt="" />
            } @else {
              <span class="sidebar__user-fallback">{{ initials() }}</span>
            }
            <div class="sidebar__user-meta">
              <span class="sidebar__user-name">&#64;{{ auth.currentUser()?.username }}</span>
              <button type="button" class="sidebar__logout" (click)="onLogout()">
                <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                Salir
              </button>
            </div>
          </div>
        </div>
      } @else {
        <!-- Sin sesión: enlaces a páginas públicas (Inicio, Explorar,
             ver detalle de receta) + CTA inferior para iniciar sesión.
             La acción de "Nueva receta", "Guardadas" o "Perfil" no
             aparecen porque requieren auth. -->
        <nav class="sidebar__nav" aria-label="Navegación">
          <a
            class="sidebar__link"
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <i class="bi bi-house-door" aria-hidden="true"></i>
            <span>Inicio</span>
          </a>
          <a class="sidebar__link" routerLink="/search" routerLinkActive="active">
            <i class="bi bi-compass" aria-hidden="true"></i>
            <span>Explorar</span>
          </a>
        </nav>

        <div class="sidebar__footer">
          <p class="sidebar__hint">
            Inicia sesión para guardar recetas, dar likes y compartir las tuyas.
          </p>
          <a class="sidebar__cta" routerLink="/login">
            <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
            Iniciar sesión
          </a>
          <a class="sidebar__cta-ghost" routerLink="/register">
            Crear cuenta
          </a>
        </div>
      }
    </aside>

    <!-- ═══════════════ Bottom nav (móvil <992px) ═══════════════ -->
    @if (auth.isLoggedIn()) {
      <nav class="bottom-nav d-lg-none" aria-label="Navegación móvil">
        <a
          class="bottom-nav__link"
          routerLink="/"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <i class="bi bi-house-door" aria-hidden="true"></i>
          <span>Inicio</span>
        </a>
        <a class="bottom-nav__link" routerLink="/search" routerLinkActive="active">
          <i class="bi bi-search" aria-hidden="true"></i>
          <span>Buscar</span>
        </a>
        <a class="bottom-nav__link bottom-nav__link--cta" routerLink="/recipes/new" routerLinkActive="active">
          <i class="bi bi-plus-lg" aria-hidden="true"></i>
          <span class="visually-hidden">Nueva</span>
        </a>
        <a class="bottom-nav__link" routerLink="/saved" routerLinkActive="active">
          <i class="bi bi-bookmark" aria-hidden="true"></i>
          <span>Guardadas</span>
        </a>
        <a class="bottom-nav__link" routerLink="/profile" routerLinkActive="active">
          <i class="bi bi-person-circle" aria-hidden="true"></i>
          <span>Perfil</span>
        </a>
      </nav>
    } @else {
      <!-- Bottom nav móvil para visitantes (sin sesión): solo páginas
           públicas + CTA para iniciar sesión. -->
      <nav class="bottom-nav d-lg-none" aria-label="Navegación móvil">
        <a
          class="bottom-nav__link"
          routerLink="/"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <i class="bi bi-house-door" aria-hidden="true"></i>
          <span>Inicio</span>
        </a>
        <a class="bottom-nav__link" routerLink="/search" routerLinkActive="active">
          <i class="bi bi-search" aria-hidden="true"></i>
          <span>Buscar</span>
        </a>
        <a class="bottom-nav__link bottom-nav__link--cta" routerLink="/login" routerLinkActive="active">
          <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
          <span class="visually-hidden">Entrar</span>
        </a>
        <a class="bottom-nav__link" routerLink="/register" routerLinkActive="active">
          <i class="bi bi-person-plus" aria-hidden="true"></i>
          <span>Cuenta</span>
        </a>
      </nav>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* ═══════════════════════════ SIDEBAR ═══════════════════════════ */
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: var(--sidebar-width);
        background: var(--color-surface);
        border-right: 1px solid var(--color-border);
        padding: var(--space-5) var(--space-4);
        z-index: var(--z-sidebar);
        gap: var(--space-4);
      }

      .sidebar__brand {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        text-decoration: none;
        color: var(--color-text);
        margin-bottom: var(--space-2);
        padding: 0 var(--space-2);
      }

      .sidebar__brand-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-md);
        background: var(--color-primary);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      /* SVG del gorro de chef. Se adapta al tamaño del contenedor.
         Hace un pequeño bounce cuando se pasa el ratón por la marca. */
      .logo-svg {
        width: 24px;
        height: 24px;
        transition: transform var(--transition-base);
      }

      .sidebar__brand:hover .logo-svg {
        animation: float 1s ease-in-out infinite;
      }

      .sidebar__brand:hover .sidebar__brand-icon {
        transform: rotate(-8deg);
        transition: transform var(--transition-base);
      }

      .sidebar__brand-text {
        font-family: var(--font-display);
        font-size: var(--font-size-2xl);
        font-weight: 700;
        letter-spacing: -0.01em;
      }

      .sidebar__search {
        position: relative;
        display: flex;
        align-items: center;
      }

      .sidebar__search i {
        position: absolute;
        left: var(--space-3);
        color: var(--color-text-muted);
        pointer-events: none;
      }

      .sidebar__search input {
        width: 100%;
        padding: var(--space-3) var(--space-3) var(--space-3) var(--space-7);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-pill);
        background: var(--color-bg-soft);
        font-size: var(--font-size-sm);
        color: var(--color-text);
        transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
      }

      .sidebar__search input::placeholder {
        color: var(--color-text-muted);
      }

      .sidebar__search input:focus {
        outline: none;
        border-color: var(--color-primary);
        background: var(--color-surface);
        box-shadow: var(--shadow-focus);
      }

      /* Quitar la X nativa de Chrome/Edge en input type="search". */
      .sidebar__search input::-webkit-search-cancel-button,
      .sidebar__search input::-webkit-search-decoration {
        -webkit-appearance: none;
        appearance: none;
      }
      .sidebar__search input::-ms-clear {
        display: none;
      }

      .sidebar__nav {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        flex: 1;
      }

      .sidebar__link {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-3);
        border-radius: var(--radius-md);
        color: var(--color-text-soft);
        text-decoration: none;
        font-weight: 500;
        font-size: var(--font-size-sm);
        transition: background var(--transition-fast), color var(--transition-fast);
      }

      .sidebar__link i {
        font-size: 1.15rem;
        width: 20px;
        text-align: center;
      }

      .sidebar__link:hover {
        background: var(--color-bg-soft);
        color: var(--color-text);
        transform: translateX(3px);
      }

      .sidebar__link:hover i {
        transform: scale(1.1);
        transition: transform var(--transition-fast);
      }

      .sidebar__link.active {
        background: var(--color-primary-light);
        color: var(--color-primary);
        font-weight: 600;
      }

      .sidebar__footer {
        border-top: 1px solid var(--color-border);
        padding-top: var(--space-4);
      }

      .sidebar__user {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2);
      }

      .sidebar__user img,
      .sidebar__user-fallback {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .sidebar__user img {
        object-fit: cover;
      }

      .sidebar__user-fallback {
        background: var(--color-primary);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: var(--font-size-sm);
      }

      .sidebar__user-meta {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
      }

      .sidebar__user-name {
        font-weight: 600;
        font-size: var(--font-size-sm);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sidebar__logout {
        background: none;
        border: 0;
        padding: 0;
        margin: 0;
        color: var(--color-text-muted);
        font-size: var(--font-size-xs);
        cursor: pointer;
        text-align: left;
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        transition: color var(--transition-fast);
      }

      .sidebar__logout:hover {
        color: var(--color-danger);
      }

      /* Texto de bienvenida en el sidebar cuando no hay sesión. */
      .sidebar__hint {
        margin: 0 0 var(--space-3);
        color: var(--color-text-soft);
        font-size: var(--font-size-sm);
        line-height: 1.5;
      }

      /* CTAs del footer del sidebar para visitantes. */
      .sidebar__cta {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        background: var(--color-primary);
        color: #fff;
        padding: var(--space-3);
        border-radius: var(--radius-pill);
        font-weight: 600;
        font-size: var(--font-size-sm);
        text-decoration: none;
        margin-bottom: var(--space-2);
        transition: background var(--transition-fast);
      }

      .sidebar__cta:hover {
        background: var(--color-primary-hover);
        color: #fff;
      }

      .sidebar__cta-ghost {
        display: block;
        text-align: center;
        color: var(--color-text-soft);
        font-size: var(--font-size-sm);
        font-weight: 600;
        text-decoration: none;
        padding: var(--space-2);
        transition: color var(--transition-fast);
      }

      .sidebar__cta-ghost:hover {
        color: var(--color-primary);
      }

      /* ═══════════════════════════ BOTTOM NAV (móvil con sesión) ════ */
      .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: var(--bottom-nav-height);
        background: var(--color-surface);
        border-top: 1px solid var(--color-border);
        z-index: var(--z-sticky);
        display: flex;
        justify-content: space-around;
        align-items: stretch;
        padding: 0 var(--space-2);
        box-shadow: var(--shadow-lg);
      }

      .bottom-nav__link {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        color: var(--color-text-muted);
        text-decoration: none;
        font-size: var(--font-size-xs);
        font-weight: 500;
        transition: color var(--transition-fast);
      }

      .bottom-nav__link i {
        font-size: 1.4rem;
      }

      .bottom-nav__link.active {
        color: var(--color-primary);
      }

      .bottom-nav__link:hover {
        color: var(--color-primary);
      }

      /* CTA central (botón "+") destacado tipo FAB. */
      .bottom-nav__link--cta {
        position: relative;
      }

      .bottom-nav__link--cta i {
        background: var(--color-primary);
        color: #fff;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        margin-top: -20px;
        box-shadow: var(--shadow-md);
        transition: background var(--transition-fast), transform var(--transition-fast);
      }

      .bottom-nav__link--cta:hover i,
      .bottom-nav__link--cta.active i {
        background: var(--color-primary-hover);
        transform: scale(1.05);
      }

      .bottom-nav__link--cta:active i {
        transform: scale(0.95);
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `
  ]
})
export class NavbarComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  searchTerm = '';

  // (El sidebar tiene el input siempre visible; ya no necesitamos
  // showSearch ni viewChild, pero los dejamos disponibles si más
  // adelante hace falta colapsar.)
  showSearch = signal(false);
  private searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  submitSearch(): void {
    const term = this.searchTerm.trim();
    if (term) {
      this.router.navigate(['/search'], { queryParams: { search: term } });
      this.searchTerm = '';
    }
  }

  initials(): string {
    return (this.auth.currentUser()?.username ?? '').slice(0, 2).toUpperCase();
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
