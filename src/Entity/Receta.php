<?php

namespace App\Entity;

use App\Repository\RecetaRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RecetaRepository::class)]
class Receta
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nombre_receta = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $descripcion = null;

    #[ORM\Column(nullable: true)]
    private ?int $tiempo = null;

    #[ORM\Column(nullable: true)]
    private ?int $raciones = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $imagen_url = null;

    /**
     * Dificultad de la receta. Acepta 'easy', 'medium' o 'hard' (los
     * mismos valores que usa el frontend). Nullable por retrocompat con
     * recetas antiguas que no la tengan asignada.
     */
    #[ORM\Column(length: 10, nullable: true)]
    private ?string $dificultad = null;

    #[ORM\Column]
    private ?\DateTime $created_at = null;

    #[ORM\ManyToOne]
    private ?Usuario $usuario = null;

    #[ORM\ManyToOne(inversedBy: 'recetas')]
    private ?Categoria $categoria = null;

    /**
     * @var Collection<int, Ingrediente>
     */
    #[ORM\OneToMany(targetEntity: Ingrediente::class, mappedBy: 'receta', orphanRemoval: true)]
    private Collection $ingredientes;

    /**
     * @var Collection<int, Paso>
     */
    #[ORM\OneToMany(targetEntity: Paso::class, mappedBy: 'receta', orphanRemoval: true)]
    private Collection $pasos;

    /**
     * @var Collection<int, Comentario>
     */
    #[ORM\OneToMany(targetEntity: Comentario::class, mappedBy: 'receta')]
    private Collection $comentarios;

    /**
     * @var Collection<int, Like>
     */
    #[ORM\OneToMany(targetEntity: Like::class, mappedBy: 'receta')]
    private Collection $likes;

    /**
     * @var Collection<int, RecetaGuardada>
     */
    #[ORM\OneToMany(targetEntity: RecetaGuardada::class, mappedBy: 'receta')]
    private Collection $recetaGuardadas;

    public function __construct()
    {
        $this->ingredientes = new ArrayCollection();
        $this->pasos = new ArrayCollection();
        $this->comentarios = new ArrayCollection();
        $this->likes = new ArrayCollection();
        $this->recetaGuardadas = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNombreReceta(): ?string
    {
        return $this->nombre_receta;
    }

    public function setNombreReceta(string $nombre_receta): static
    {
        $this->nombre_receta = $nombre_receta;

        return $this;
    }

    public function getDescripcion(): ?string
    {
        return $this->descripcion;
    }

    public function setDescripcion(?string $descripcion): static
    {
        $this->descripcion = $descripcion;

        return $this;
    }

    public function getTiempo(): ?int
    {
        return $this->tiempo;
    }

    public function setTiempo(?int $tiempo): static
    {
        $this->tiempo = $tiempo;

        return $this;
    }

    public function getRaciones(): ?int
    {
        return $this->raciones;
    }

    public function setRaciones(?int $raciones): static
    {
        $this->raciones = $raciones;

        return $this;
    }

    public function getImagenUrl(): ?string
    {
        return $this->imagen_url;
    }

    public function setImagenUrl(?string $imagen_url): static
    {
        $this->imagen_url = $imagen_url;

        return $this;
    }

    public function getDificultad(): ?string
    {
        return $this->dificultad;
    }

    public function setDificultad(?string $dificultad): static
    {
        $this->dificultad = $dificultad;

        return $this;
    }

    public function getCreatedAt(): ?\DateTime
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTime $created_at): static
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function getUsuario(): ?Usuario
    {
        return $this->usuario;
    }

    public function setUsuario(?Usuario $usuario): static
    {
        $this->usuario = $usuario;

        return $this;
    }

    public function getCategoria(): ?Categoria
    {
        return $this->categoria;
    }

    public function setCategoria(?Categoria $categoria): static
    {
        $this->categoria = $categoria;

        return $this;
    }

    /**
     * @return Collection<int, Ingrediente>
     */
    public function getIngredientes(): Collection
    {
        return $this->ingredientes;
    }

    public function addIngrediente(Ingrediente $ingrediente): static
    {
        if (!$this->ingredientes->contains($ingrediente)) {
            $this->ingredientes->add($ingrediente);
            $ingrediente->setReceta($this);
        }

        return $this;
    }

    public function removeIngrediente(Ingrediente $ingrediente): static
    {
        if ($this->ingredientes->removeElement($ingrediente)) {
            // set the owning side to null (unless already changed)
            if ($ingrediente->getReceta() === $this) {
                $ingrediente->setReceta(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Paso>
     */
    public function getPasos(): Collection
    {
        return $this->pasos;
    }

    public function addPaso(Paso $paso): static
    {
        if (!$this->pasos->contains($paso)) {
            $this->pasos->add($paso);
            $paso->setReceta($this);
        }

        return $this;
    }

    public function removePaso(Paso $paso): static
    {
        if ($this->pasos->removeElement($paso)) {
            // set the owning side to null (unless already changed)
            if ($paso->getReceta() === $this) {
                $paso->setReceta(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Comentario>
     */
    public function getComentarios(): Collection
    {
        return $this->comentarios;
    }

    public function addComentario(Comentario $comentario): static
    {
        if (!$this->comentarios->contains($comentario)) {
            $this->comentarios->add($comentario);
            $comentario->setReceta($this);
        }

        return $this;
    }

    public function removeComentario(Comentario $comentario): static
    {
        if ($this->comentarios->removeElement($comentario)) {
            // set the owning side to null (unless already changed)
            if ($comentario->getReceta() === $this) {
                $comentario->setReceta(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Like>
     */
    public function getLikes(): Collection
    {
        return $this->likes;
    }

    public function addLike(Like $like): static
    {
        if (!$this->likes->contains($like)) {
            $this->likes->add($like);
            $like->setReceta($this);
        }

        return $this;
    }

    public function removeLike(Like $like): static
    {
        if ($this->likes->removeElement($like)) {
            // set the owning side to null (unless already changed)
            if ($like->getReceta() === $this) {
                $like->setReceta(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, RecetaGuardada>
     */
    public function getRecetaGuardadas(): Collection
    {
        return $this->recetaGuardadas;
    }

    public function addRecetaGuardada(RecetaGuardada $recetaGuardada): static
    {
        if (!$this->recetaGuardadas->contains($recetaGuardada)) {
            $this->recetaGuardadas->add($recetaGuardada);
            $recetaGuardada->setReceta($this);
        }

        return $this;
    }

    public function removeRecetaGuardada(RecetaGuardada $recetaGuardada): static
    {
        if ($this->recetaGuardadas->removeElement($recetaGuardada)) {
            // set the owning side to null (unless already changed)
            if ($recetaGuardada->getReceta() === $this) {
                $recetaGuardada->setReceta(null);
            }
        }

        return $this;
    }
}
