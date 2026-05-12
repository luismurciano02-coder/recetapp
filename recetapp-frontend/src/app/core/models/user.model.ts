// Representa al usuario tal y como lo devuelve la API en /api/profile y /api/login.
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  recipesCount?: number;
}

// Payload para registrar un nuevo usuario en POST /api/register.
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

// Payload para iniciar sesión en POST /api/login.
export interface LoginPayload {
  email: string;
  password: string;
}

// Estructura exacta de la respuesta del endpoint de login.
// El token JWT se almacena en localStorage para añadirlo al interceptor.
export interface LoginResponse {
  token: string;
  user: User;
}

// Payload para actualizar el perfil desde la pantalla de edición.
export interface UpdateProfilePayload {
  username: string;
  bio?: string;
  avatar?: string;
}
