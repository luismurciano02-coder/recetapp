<?php

namespace App\Controller;

use App\Entity\Categoria;
use App\Entity\Receta;
use App\Repository\CategoriaRepository;
use App\Repository\RecetaRepository;
use App\Repository\IngredienteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/recetas')]
class RecetaController extends AbstractController
{
    // Lógica de autorización compartida con IngredienteController y
    // PasoController: el autor o el admin "recetaapp@recetapp.com" pueden
    // modificar la receta.
    use RecetaAuthorizationTrait;

    // Función privada para convertir una receta a array
    private function recetaToArray(Receta $receta): array
    {
        $categoria = $receta->getCategoria();

        return [
            'id'          => $receta->getId(),
            'nombre'      => $receta->getNombreReceta(),
            'descripcion' => $receta->getDescripcion(),
            'tiempo'      => $receta->getTiempo(),
            'raciones'    => $receta->getRaciones(),
            'imagen_url'  => $receta->getImagenUrl(),
            'dificultad'  => $receta->getDificultad(),
            'created_at'  => $receta->getCreatedAt() ? $receta->getCreatedAt()->format('Y-m-d H:i:s') : null,
            'usuario'     => $receta->getUsuario()->getGmail(),
            'categoria'   => $categoria !== null ? [
                'id'     => $categoria->getId(),
                'nombre' => $categoria->getTipo(),
                'slug'   => $categoria->getSlug(),
            ] : null,
        ];
    }

    /**
     * GET /api/recetas               → todas las recetas
     * GET /api/recetas?categoria=X   → filtra por categoría (slug o nombre).
     * GET /api/recetas?categoria_id=N → filtra por id de categoría.
     *
     * IMPORTANTE: la condición `!request.query.get('q')` impide que esta
     * ruta capture peticiones con `?q=X` — así, esas peticiones llegan
     * a `buscar()` que es quien las gestiona realmente.
     *
     * Si se pasa categoría y no existe, devuelve 404 con un mensaje claro.
     */
    #[Route('', name: 'api_recetas_listar', methods: ['GET'], condition: "!request.query.get('q')")]
    public function listar(
        Request $request,
        RecetaRepository $recetaRepository,
        CategoriaRepository $categoriaRepository
    ): JsonResponse {
        $categoria = $request->query->get('categoria');
        $categoriaId = $request->query->get('categoria_id');

        // Si se pasa filtro de categoría, lo aplicamos a nivel de BD
        // (más eficiente que cargar todo y filtrar en PHP).
        if ($categoria !== null || $categoriaId !== null) {
            $cat = null;

            if ($categoriaId !== null) {
                $cat = $categoriaRepository->find((int) $categoriaId);
            } elseif ($categoria !== null) {
                // Probamos por slug (en minúsculas) y luego por tipo (case-insensitive).
                $slug = strtolower($categoria);
                $cat = $categoriaRepository->findOneBy(['slug' => $slug]);
                if (!$cat) {
                    $cat = $categoriaRepository->createQueryBuilder('c')
                        ->where('LOWER(c.tipo) = :tipo')
                        ->setParameter('tipo', strtolower($categoria))
                        ->getQuery()
                        ->getOneOrNullResult();
                }
            }

            if (!$cat) {
                return $this->json(['mensaje' => 'Categoría no encontrada'], 404);
            }

            $recetas = $recetaRepository->findBy(['categoria' => $cat]);
        } else {
            $recetas = $recetaRepository->findAll();
        }

        if (empty($recetas)) {
            return $this->json(['mensaje' => 'No hay recetas disponibles'], 404);
        }

        $datos = [];
        foreach ($recetas as $receta) {
            $datos[] = $this->recetaToArray($receta);
        }

        return $this->json($datos);
    }

    /**
     * GET /api/categorias → lista de todas las categorías existentes,
     * útil para que el frontend pinte las pills sin hardcodearlas.
     */
    #[Route('/categorias-disponibles', name: 'api_categorias_listar', methods: ['GET'])]
    public function categoriasDisponibles(CategoriaRepository $categoriaRepository): JsonResponse
    {
        $categorias = $categoriaRepository->findAll();
        $datos = [];
        foreach ($categorias as $cat) {
            $datos[] = [
                'id'     => $cat->getId(),
                'nombre' => $cat->getTipo(),
                'slug'   => $cat->getSlug(),
                'icono'  => $cat->getIcono(),
            ];
        }
        return $this->json($datos);
    }

    /**
     * GET /api/recetas?q=tortilla            → busca "tortilla" en nombre o ingrediente
     * GET /api/recetas?q=huevo,patata         → busca recetas con AMBOS (huevo Y patata)
     *                                            en nombre o ingredientes (AND).
     *
     * El parámetro q acepta términos separados por comas. Una receta se
     * considera coincidente cuando, para cada término, hay match por
     * nombre de receta o por nombre de algún ingrediente.
     */
    #[Route('', name: 'api_recetas_buscar', methods: ['GET'], condition: "request.query.get('q')")]
    public function buscar(Request $request, RecetaRepository $recetaRepository, IngredienteRepository $ingredienteRepository): JsonResponse
    {
        $q = trim((string) $request->query->get('q', ''));

        if ($q === '') {
            return $this->json(['mensaje' => 'Introduce un termino de busqueda'], 400);
        }

        // Separar términos por coma. Filtra vacíos y duplicados (case-insensitive).
        $terms = array_values(array_unique(array_filter(
            array_map(static fn(string $t): string => trim($t), explode(',', $q)),
            static fn(string $t): bool => $t !== ''
        )));

        if (empty($terms)) {
            return $this->json(['mensaje' => 'Introduce un termino de busqueda'], 400);
        }

        // Para cada término, calculamos el conjunto de ids de recetas que
        // hacen match en nombre o en algún ingrediente. La receta final
        // debe estar presente en TODOS los conjuntos (intersección = AND).
        $matchedSetsIds = [];
        foreach ($terms as $term) {
            $like = '%' . $term . '%';

            $recetasPorNombre = $recetaRepository->createQueryBuilder('r')
                ->select('r.id')
                ->where('r.nombre_receta LIKE :q')
                ->setParameter('q', $like)
                ->getQuery()
                ->getScalarResult();

            $ingredientes = $ingredienteRepository->createQueryBuilder('i')
                ->select('IDENTITY(i.receta) AS receta_id')
                ->where('i.nombre LIKE :q')
                ->setParameter('q', $like)
                ->getQuery()
                ->getScalarResult();

            $idsTermino = array_unique(array_merge(
                array_map(static fn($row) => (int) $row['id'], $recetasPorNombre),
                array_map(static fn($row) => (int) $row['receta_id'], $ingredientes)
            ));

            $matchedSetsIds[] = $idsTermino;
        }

        // Intersección de todos los conjuntos.
        $idsFinales = array_shift($matchedSetsIds) ?? [];
        foreach ($matchedSetsIds as $set) {
            $idsFinales = array_values(array_intersect($idsFinales, $set));
            if (empty($idsFinales)) {
                break;
            }
        }

        if (empty($idsFinales)) {
            return $this->json(['mensaje' => 'No se encontraron recetas con ese termino'], 404);
        }

        $recetas = $recetaRepository->findBy(['id' => $idsFinales]);

        $datos = [];
        foreach ($recetas as $receta) {
            $datos[] = $this->recetaToArray($receta);
        }

        return $this->json($datos);
    }

    #[Route('/{id}', name: 'api_recetas_ver', methods: ['GET'])]
    public function ver(int $id, RecetaRepository $recetaRepository): JsonResponse
    {
        $receta = $recetaRepository->find($id);

        if (!$receta) {
            return $this->json(['mensaje' => 'Receta no encontrada'], 404);
        }

        return $this->json($this->recetaToArray($receta));
    }

    #[Route('', name: 'api_recetas_crear', methods: ['POST'])]
    public function crear(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $datos = json_decode($request->getContent(), true);

        if (empty($datos['nombre_receta'])) {
            return $this->json(['mensaje' => 'El nombre de la receta es obligatorio'], 400);
        }

        $receta = new Receta();
        $receta->setNombreReceta($datos['nombre_receta']);
        $receta->setDescripcion(isset($datos['descripcion']) ? $datos['descripcion'] : null);
        $receta->setTiempo(isset($datos['tiempo']) ? $datos['tiempo'] : null);
        $receta->setRaciones(isset($datos['raciones']) ? $datos['raciones'] : null);
        $receta->setImagenUrl(isset($datos['imagen_url']) ? $datos['imagen_url'] : null);
        // dificultad: validamos que solo acepte easy/medium/hard.
        if (isset($datos['dificultad']) && in_array($datos['dificultad'], ['easy', 'medium', 'hard'], true)) {
            $receta->setDificultad($datos['dificultad']);
        }
        $receta->setCreatedAt(new \DateTime());
        $receta->setUsuario($this->getUser());

        $entityManager->persist($receta);
        $entityManager->flush();

        return $this->json(['mensaje' => 'Receta creada correctamente', 'id' => $receta->getId()], 201);
    }

    #[Route('/{id}', name: 'api_recetas_editar', methods: ['PUT'])]
    public function editar(int $id, RecetaRepository $recetaRepository, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $receta = $recetaRepository->find($id);

        if (!$receta) {
            return $this->json(['mensaje' => 'Receta no encontrada'], 404);
        }

        if (!$this->puedeModificarReceta($receta)) {
            return $this->json(['mensaje' => 'No tienes permiso para editar esta receta'], 403);
        }

        $datos = json_decode($request->getContent(), true);

        if (isset($datos['nombre_receta'])) {
            $receta->setNombreReceta($datos['nombre_receta']);
        }
        if (isset($datos['descripcion'])) {
            $receta->setDescripcion($datos['descripcion']);
        }
        if (isset($datos['tiempo'])) {
            $receta->setTiempo($datos['tiempo']);
        }
        if (isset($datos['raciones'])) {
            $receta->setRaciones($datos['raciones']);
        }
        if (isset($datos['imagen_url'])) {
            $receta->setImagenUrl($datos['imagen_url']);
        }
        if (isset($datos['dificultad']) && in_array($datos['dificultad'], ['easy', 'medium', 'hard'], true)) {
            $receta->setDificultad($datos['dificultad']);
        }

        $entityManager->flush();

        return $this->json(['mensaje' => 'Receta actualizada correctamente']);
    }

    #[Route('/{id}', name: 'api_recetas_borrar', methods: ['DELETE'])]
    public function borrar(int $id, RecetaRepository $recetaRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $receta = $recetaRepository->find($id);

        if (!$receta) {
            return $this->json(['mensaje' => 'Receta no encontrada'], 404);
        }

        if (!$this->puedeModificarReceta($receta)) {
            return $this->json(['mensaje' => 'No tienes permiso para borrar esta receta'], 403);
        }

        $entityManager->remove($receta);
        $entityManager->flush();

        return $this->json(['mensaje' => 'Receta eliminada correctamente']);
    }
}