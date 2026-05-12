<?php

namespace App\Controller;

use App\Repository\UsuarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/perfil')]
class PerfilController extends AbstractController
{
    #[Route('', name: 'api_perfil_ver', methods: ['GET'])]
    public function ver(UsuarioRepository $usuarioRepository): JsonResponse
    {
        $usuarioJwt = $this->getUser();

        if (!$usuarioJwt) {
            return $this->json(['mensaje' => 'No estas autenticado'], 401);
        }

        // Recargamos el usuario desde la BD para tener los datos actualizados
        $usuario = $usuarioRepository->findOneBy(['gmail' => $usuarioJwt->getUserIdentifier()]);

        if (!$usuario) {
            return $this->json(['mensaje' => 'Usuario no encontrado'], 404);
        }

        $createdAt = $usuario->getCreatedAt();

        return $this->json([
            'gmail'      => $usuario->getGmail(),
            'roles'      => $usuario->getRoles(),
            'perfil'     => $usuario->getPerfil() !== null ? $usuario->getPerfil() : '',
            'created_at' => $createdAt !== null ? $createdAt->format('Y-m-d H:i:s') : '',
        ]);
    }

    #[Route('', name: 'api_perfil_editar', methods: ['PUT'])]
    public function editar(
        Request $request,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        UsuarioRepository $usuarioRepository
    ): JsonResponse {
        $usuarioJwt = $this->getUser();

        if (!$usuarioJwt) {
            return $this->json(['mensaje' => 'No estas autenticado'], 401);
        }

        // Recargamos el usuario desde la BD
        $usuario = $usuarioRepository->findOneBy(['gmail' => $usuarioJwt->getUserIdentifier()]);

        if (!$usuario) {
            return $this->json(['mensaje' => 'Usuario no encontrado'], 404);
        }

        $datos = json_decode($request->getContent(), true);

        if (isset($datos['perfil'])) {
            $usuario->setPerfil($datos['perfil']);
        }

        if (isset($datos['password'])) {
            if (strlen($datos['password']) < 8) {
                return $this->json(['mensaje' => 'La contrasena debe tener al menos 8 caracteres'], 400);
            }
            $nuevaContrasena = $passwordHasher->hashPassword($usuario, $datos['password']);
            $usuario->setPassword($nuevaContrasena);
        }

        $entityManager->flush();

        return $this->json(['mensaje' => 'Perfil actualizado correctamente']);
    }
}