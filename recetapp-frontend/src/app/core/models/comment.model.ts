// Comentario de una receta tal y como lo devuelve la API.
export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
}

// Payload para publicar un nuevo comentario.
export interface CommentPayload {
  content: string;
}
