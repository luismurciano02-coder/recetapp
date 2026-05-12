<?php

namespace App\Controller;

use App\Entity\RecetaGuardada;
use App\Entity\Receta;
use App\Repository\RecetaGuardadaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/guardadas')]
class RecetaGuardadaController extends AbstractController
{
    // Guardar o dejar de guardar una receta
    #[Route('/{id}', name: 'api_guardada_toggle', methods: ['POST'])]
    public function toggle(
        Receta $receta,
        RecetaGuardadaRepository $recetaGuardadaRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $usuario = $this->getUser();

        // Comprobamos si ya está guardada
        $guardadaExistente = $recetaGuardadaRepository->findOneBy([
            'usuario' => $usuario,
            'receta'  => $receta
        ]);

        // Si ya está guardada la quitamos
        if ($guardadaExistente) {
            $entityManager->remove($guardadaExistente);
            $entityManager->flush();
            return $this->json(['mensaje' => 'Receta eliminada de guardadas']);
        }

        // Si no está guardada la guardamos
        $guardada = new RecetaGuardada();
        $guardada->setUsuario($usuario);
        $guardada->setReceta($receta);
        $guardada->setSavedAt(new \DateTime());

        $entityManager->persist($guardada);
        $entityManager->flush();

        return $this->json(['mensaje' => 'Receta guardada correctamente']);
    }

    // Ver todas las recetas guardadas del usuario
    #[Route('', name: 'api_guardadas_listar', methods: ['GET'])]
    public function listar(RecetaGuardadaRepository $recetaGuardadaRepository): JsonResponse
    {
        $usuario = $this->getUser();
        $guardadas = $recetaGuardadaRepository->findBy(['usuario' => $usuario]);

        $datos = [];
        foreach ($guardadas as $guardada) {
            $receta = $guardada->getReceta();
            $datos[] = [
                'id'          => $receta->getId(),
                'nombre'      => $receta->getNombreReceta(),
                'descripcion' => $receta->getDescripcion(),
                'tiempo'      => $receta->getTiempo(),
                'raciones'    => $receta->getRaciones(),
                'imagen_url'  => $receta->getImagenUrl(),
                'saved_at'    => $guardada->getSavedAt()->format('Y-m-d H:i:s'),
            ];
        }

        return $this->json($datos);
    }
}