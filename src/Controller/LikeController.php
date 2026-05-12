<?php

namespace App\Controller;

use App\Entity\Like;
use App\Entity\Receta;
use App\Repository\LikeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/likes')]
class LikeController extends AbstractController
{
    // Dar o quitar like a una receta
    #[Route('/{id}', name: 'api_like_toggle', methods: ['POST'])]
    public function toggle(
        Receta $receta,
        LikeRepository $likeRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $usuario = $this->getUser();

        // Comprobamos si ya existe el like
        $likeExistente = $likeRepository->findOneBy([
            'usuario' => $usuario,
            'receta'  => $receta
        ]);

        // Si ya existe lo quitamos
        if ($likeExistente) {
            $entityManager->remove($likeExistente);
            $entityManager->flush();
            return $this->json(['mensaje' => 'Like eliminado', 'likes' => $this->contarLikes($receta, $likeRepository)]);
        }

        // Si no existe lo creamos
        $like = new Like();
        $like->setUsuario($usuario);
        $like->setReceta($receta);
        $like->setCreatedAt(new \DateTime());

        $entityManager->persist($like);
        $entityManager->flush();

        return $this->json(['mensaje' => 'Like añadido', 'likes' => $this->contarLikes($receta, $likeRepository)]);
    }

    // Contar los likes de una receta
    private function contarLikes(Receta $receta, LikeRepository $likeRepository): int
    {
        return count($likeRepository->findBy(['receta' => $receta]));
    }
}