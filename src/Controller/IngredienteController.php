<?php

namespace App\Controller;

use App\Entity\Ingrediente;
use App\Entity\Receta;
use App\Repository\IngredienteRepository;
use App\Repository\RecetaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/recetas/{id}/ingredientes')]
class IngredienteController extends AbstractController
{
    // Mismo criterio de autorización que RecetaController:
    // autor de la receta o admin "RecetaApp".
    use RecetaAuthorizationTrait;

    // Ver ingredientes de una receta
    #[Route('', name: 'api_ingredientes_listar', methods: ['GET'])]
    public function listar(int $id, RecetaRepository $recetaRepository, IngredienteRepository $ingredienteRepository): JsonResponse
    {
        $receta = $recetaRepository->find($id);

        if (!$receta) {
            return $this->json(['mensaje' => 'Receta no encontrada'], 404);
        }

        $ingredientes = $ingredienteRepository->findBy(['receta' => $receta]);

        if (empty($ingredientes)) {
            return $this->json(['mensaje' => 'Esta receta no tiene ingredientes'], 404);
        }

        $datos = [];
        foreach ($ingredientes as $ingrediente) {
            $datos[] = [
                'id'               => $ingrediente->getId(),
                'nombre'           => $ingrediente->getNombre(),
                'cantidad'         => $ingrediente->getCantidad(),
                'unidad'           => $ingrediente->getUnidad(),
                'tipo_ingrediente' => $ingrediente->getTipoIngrediente(),
            ];
        }

        return $this->json($datos);
    }

    // Añadir ingrediente a una receta
    #[Route('', name: 'api_ingredientes_crear', methods: ['POST'])]
    public function crear(int $id, RecetaRepository $recetaRepository, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $receta = $recetaRepository->find($id);

        if (!$receta) {
            return $this->json(['mensaje' => 'Receta no encontrada'], 404);
        }

        if (!$this->puedeModificarReceta($receta)) {
            return $this->json(['mensaje' => 'No tienes permiso para añadir ingredientes a esta receta'], 403);
        }

        $datos = json_decode($request->getContent(), true);

        if (empty($datos['nombre'])) {
            return $this->json(['mensaje' => 'El nombre del ingrediente es obligatorio'], 400);
        }

        $ingrediente = new Ingrediente();
        $ingrediente->setNombre($datos['nombre']);
        $ingrediente->setCantidad(isset($datos['cantidad']) ? $datos['cantidad'] : null);
        $ingrediente->setUnidad(isset($datos['unidad']) ? $datos['unidad'] : null);
        $ingrediente->setTipoIngrediente(isset($datos['tipo_ingrediente']) ? $datos['tipo_ingrediente'] : null);
        $ingrediente->setReceta($receta);

        $entityManager->persist($ingrediente);
        $entityManager->flush();

        return $this->json(['mensaje' => 'Ingrediente añadido correctamente', 'id' => $ingrediente->getId()], 201);
    }

    // Borrar ingrediente
    #[Route('/{ingredienteId}', name: 'api_ingredientes_borrar', methods: ['DELETE'])]
    public function borrar(int $id, int $ingredienteId, RecetaRepository $recetaRepository, IngredienteRepository $ingredienteRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $receta = $recetaRepository->find($id);

        if (!$receta) {
            return $this->json(['mensaje' => 'Receta no encontrada'], 404);
        }

        $ingrediente = $ingredienteRepository->find($ingredienteId);

        if (!$ingrediente) {
            return $this->json(['mensaje' => 'Ingrediente no encontrado'], 404);
        }

        if (!$this->puedeModificarReceta($receta)) {
            return $this->json(['mensaje' => 'No tienes permiso para borrar este ingrediente'], 403);
        }

        $entityManager->remove($ingrediente);
        $entityManager->flush();

        return $this->json(['mensaje' => 'Ingrediente eliminado correctamente']);
    }
}