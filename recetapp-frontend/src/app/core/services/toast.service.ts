import { Injectable, signal } from '@angular/core';

// Tipos de toast soportados. Determina el color y el icono mostrados.
export type ToastKind = 'success' | 'error' | 'info';

// Estructura de cada toast en cola.
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

// Servicio global de notificaciones. Cualquier parte de la app puede
// hacer toast.success('...') / .error('...') / .info('...') y un
// único <app-toast/> situado en el componente raíz se encarga de
// renderizar la cola y autodescartarla.
@Injectable({ providedIn: 'root' })
export class ToastService {
  // Contador monotónico para identificar cada toast de forma única.
  // Usar un contador (en vez de Date.now()) evita colisiones si se
  // disparan varios toasts en el mismo milisegundo.
  private nextId = 0;

  // Estado privado mutable. Solo expone una versión readonly fuera.
  private readonly _toasts = signal<Toast[]>([]);

  // Signal público de solo lectura. El componente lo lee directamente.
  readonly toasts = this._toasts.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  // Elimina manualmente un toast (botón "×" del componente).
  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  // Añade un nuevo toast a la cola y programa su descarte tras 3s.
  private push(kind: ToastKind, message: string): void {
    const id = ++this.nextId;
    this._toasts.update((list) => [...list, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), 3000);
  }
}
