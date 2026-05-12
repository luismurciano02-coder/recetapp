<?php

namespace App\Controller;

use App\Entity\Paso;
use App\Repository\PasoRepository;
use App\Repository\RecetaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/recetas/{id}/pasos')]
class PasoController extends AbstractController
{
    // Mismo criterio de autorización que RecetaController:
    // autor de la receta o admin "RecetaApp".
    use RecetaAuthorizationTrait;

    // Ver pasos de una receta
    #[Route('', name: 'api_pasos_listar', methods: ['GET'])]
    public function listar(int $id, RecetaRepository $recetaRepository, PasoRepository $pasoRepository): JsonResponse
    {
        $receta = $recetaRepository->find($id);

        if (!$receta) {
            return $this->json(['mensaje' => 'Receta no encontrada'], 404);
        }

        $pasos = $pasoRepository->findBy(['receta' => $receta], ['numero_paso' => 'ASC']);

        if (empty($pasos)) {
            return $this->json(['mensaje' => 'Esta receta no tiene pasos'], 404);
        }

        $datos = [];
        foreach ($pasos as $paso) {
            $datos[] = [
                'id'          => $paso->getId(),
                'numero_paso' => $paso->getNumeroPaso(),
                'descripcion' => $paso->getDescripcion(),
                'imagen_url'  => $paso->getImagenUrl(),
                'duracion'    => $paso->getDuracion(),
            ];
        }

        return $this->json($datos);
    }

    // Añadir paso a una receta
    #[Route('', name: 'api_pasos_crear', methods: ['POST'])]
    public function crear(int $id, RecetaRepository $recetaRepository, Request $request, EntityManagerInterface $entityManager, PasoRepository $pasoRepository): JsonResponse
    {
        $receta = $recetaRepository->find($id);

        if (!$receta) {
            return $this->json(['mensaje' => 'Receta no encontrada'], 404);
        }

        if (!$this->puedeModificarReceta($receta)) {
            return $this->json(['mensaje' => 'No tienes permiso para añadir pasos a esta receta'], 403);
        }

        $datos = json_decode($request->getContent(), true);

        if (empty($datos['descripcion'])) {
            return $this->json(['mensaje' => 'La descripcion del paso es obligatoria'], 400);
        }

        // Calculamos el numero de paso automaticamente
        $ultimoPaso = $pasoRepository->findOneBy(['receta' => $receta], ['numero_paso' => 'DESC']);
        $numeroPaso = $ultimoPaso ? $ultimoPaso->getNumeroPaso() + 1 : 1;

        $paso = new Paso();
        $paso->setNumeroPaso($numeroPaso);
        $paso->setDescripcion($datos['descripcion']);
        $paso->setImagenUrl(isset($datos['imagen_url']) ? $datos['imagen_url'] : null);
        $paso->setDuracion(isset($datos['duracion']) ? $datos['duracion'] : null);
        $paso->setReceta($receta);

        $entityManager->persist($paso);
        $entityManager->flush();

        return $this->json(['mensaje' => 'Paso añadido correctamente', 'id' => $paso->getId(), 'numero_paso' => $numeroPaso], 201);
    }

    // Borrar paso
    #[Route('/{pasoId}', name: 'api_pasos_borrar', methods: ['DELETE'])]
    public function borrar(int $id, int $pasoId, RecetaRepository $recetaRepository, PasoRepository $pasoRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $receta = $recetaRepository->find($id);

        if (!$receta) {
            return $this->json(['mensaje' => 'Receta no encontrada'], 404);
        }

        $paso = $pasoRepository->find($pasoId);

        if (!$paso) {
            return $this->json(['mensaje' => 'Paso no encontrado'], 404);
        }

        if (!$this->puedeModificarReceta($receta)) {
            return $this->json(['mensaje' => 'No tienes permiso para borrar este paso'], 403);
        }

        $entityManager->remove($paso);
        $entityManager->flush();

        return $this->json(['mensaje' => 'Paso eliminado correctamente']);
    }
}