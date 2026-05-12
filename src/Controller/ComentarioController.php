<?php

namespace App\Controller;

use App\Entity\Comentario;
use App\Entity\Receta;
use App\Repository\ComentarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/comentarios')]
class ComentarioController extends AbstractController
{
    #[Route('/receta/{id}', name: 'api_comentarios_listar', methods: ['GET'])]
    public function listar(Receta $receta, ComentarioRepository $comentarioRepository): JsonResponse
    {
        $comentarios = $comentarioRepository->findBy(['receta' => $receta]);
        $datos = [];

        foreach ($comentarios as $comentario) {
            $datos[] = [
                'id'         => $comentario->getId(),
                'texto'      => $comentario->getTexto(),
                'valoracion' => $comentario->getValoracion(),
                'usuario'    => $comentario->getUsuario()->getGmail(),
                'created_at' => $comentario->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }

        return $this->json($datos);
    }

    #[Route('/receta/{id}', name: 'api_comentarios_crear', methods: ['POST'])]
    public function crear(Receta $receta, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $datos = json_decode($request->getContent(), true);

        if (empty($datos['texto'])) {
            return $this->json(['mensaje' => 'El texto del comentario es obligatorio'], 400);
        }

        $valoracion = isset($datos['valoracion']) ? $datos['valoracion'] : null;

        if ($valoracion !== null && ($valoracion < 1 || $valoracion > 5)) {
            return $this->json(['mensaje' => 'La valoracion debe ser entre 1 y 5'], 400);
        }

        $comentario = new Comentario();
        $comentario->setTexto($datos['texto']);
        $comentario->setValoracion($valoracion);
        $comentario->setUsuario($this->getUser());
        $comentario->setReceta($receta);
        $comentario->setCreatedAt(new \DateTime());

        $entityManager->persist($comentario);
        $entityManager->flush();

        return $this->json(['mensaje' => 'Comentario creado correctamente', 'id' => $comentario->getId()], 201);
    }

    #[Route('/{id}', name: 'api_comentarios_borrar', methods: ['DELETE'])]
    public function borrar(Comentario $comentario, EntityManagerInterface $entityManager): JsonResponse
    {
        if ($comentario->getUsuario() !== $this->getUser()) {
            return $this->json(['mensaje' => 'No tienes permiso para borrar este comentario'], 403);
        }

        $entityManager->remove($comentario);
        $entityManager->flush();

        return $this->json(['mensaje' => 'Comentario eliminado correctamente']);
    }
}