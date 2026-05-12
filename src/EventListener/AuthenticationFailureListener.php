<?php

namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

class AuthenticationFailureListener implements AuthenticationFailureHandlerInterface
{
    // Este método se ejecuta automáticamente cuando el login falla
    public function onAuthenticationFailure(
        Request $request,
        AuthenticationException $exception
    ): JsonResponse {
        // Devolvemos un mensaje claro en JSON
        return new JsonResponse([
            'mensaje' => 'Correo electrónico o contraseña incorrectos',
            'codigo' => 401
        ], 401);
    }
}