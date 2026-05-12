<?php

namespace App\Controller;

use App\Entity\Usuario;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

class RegistroController extends AbstractController
{
    #[Route('/api/registro', name: 'api_registro', methods: ['POST'])]
    public function registro(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Recogemos los datos que nos manda Angular en formato JSON
        $datos = json_decode($request->getContent(), true);

        // Comprobamos que los campos obligatorios están presentes
        if (!isset($datos['gmail']) || !isset($datos['password'])) {
            return $this->json([
                'mensaje' => 'El gmail y la contraseña son obligatorios'
            ], 400);
        }

        // Comprobamos que el gmail no está ya registrado
        $usuarioExistente = $entityManager->getRepository(Usuario::class)
            ->findOneBy(['gmail' => $datos['gmail']]);

        if ($usuarioExistente) {
            return $this->json([
                'mensaje' => 'Este gmail ya está registrado'
            ], 400);
        }

        // Creamos el nuevo usuario
        $usuario = new Usuario();
        $usuario->setGmail($datos['gmail']);

        // Encriptamos la contraseña como dice el PDF del profesor
        $passwordEncriptada = $passwordHasher->hashPassword($usuario, $datos['password']);
        $usuario->setPassword($passwordEncriptada);

        // Asignamos el rol de usuario normal
        $usuario->setRoles(['ROLE_USER']);

        // Asignamos la fecha de creación
        $usuario->setCreatedAt(new \DateTime());

        // Si nos mandan el perfil lo guardamos
        if (isset($datos['perfil'])) {
            $usuario->setPerfil($datos['perfil']);
        }

        // Guardamos el usuario en la base de datos
        $entityManager->persist($usuario);
        $entityManager->flush();

        return $this->json([
            'mensaje' => 'Usuario registrado correctamente'
        ], 201);
    }
}