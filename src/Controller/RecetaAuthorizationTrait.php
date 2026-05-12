<?php

namespace App\Controller;

use App\Entity\Receta;

/**
 * Trait reutilizable con la lógica de autorización para modificar una
 * receta. Lo usan RecetaController, IngredienteController y PasoController
 * para que solo el autor de la receta pueda crear, editar o borrar
 * recursos asociados (la receta en sí, sus ingredientes y sus pasos).
 *
 * El controller que lo importe debe extender de AbstractController
 * (para tener disponible $this->getUser()).
 */
trait RecetaAuthorizationTrait
{
    /**
     * Devuelve true si el usuario actualmente autenticado puede modificar
     * la receta — solo el autor puede.
     */
    private function puedeModificarReceta(Receta $receta): bool
    {
        $user = $this->getUser();
        if (!$user) {
            return false;
        }
        return $receta->getUsuario() === $user;
    }
}
