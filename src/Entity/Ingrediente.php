<?php

namespace App\Entity;

use App\Repository\IngredienteRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: IngredienteRepository::class)]
class Ingrediente
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nombre = null;

    #[ORM\Column(nullable: true)]
    private ?float $cantidad = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $unidad = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $tipo_ingrediente = null;

    #[ORM\ManyToOne(inversedBy: 'ingredientes')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Receta $receta = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNombre(): ?string
    {
        return $this->nombre;
    }

    public function setNombre(string $nombre): static
    {
        $this->nombre = $nombre;

        return $this;
    }

    public function getCantidad(): ?float
    {
        return $this->cantidad;
    }

    public function setCantidad(?float $cantidad): static
    {
        $this->cantidad = $cantidad;

        return $this;
    }

    public function getUnidad(): ?string
    {
        return $this->unidad;
    }

    public function setUnidad(?string $unidad): static
    {
        $this->unidad = $unidad;

        return $this;
    }

    public function getTipoIngrediente(): ?string
    {
        return $this->tipo_ingrediente;
    }

    public function setTipoIngrediente(?string $tipo_ingrediente): static
    {
        $this->tipo_ingrediente = $tipo_ingrediente;

        return $this;
    }

    public function getReceta(): ?Receta
    {
        return $this->receta;
    }

    public function setReceta(?Receta $receta): static
    {
        $this->receta = $receta;

        return $this;
    }
}
