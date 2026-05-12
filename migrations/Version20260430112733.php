<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260430112733 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE categoria CHANGE icono icono VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE ingrediente CHANGE cantidad cantidad DOUBLE PRECISION DEFAULT NULL, CHANGE unidad unidad VARCHAR(255) DEFAULT NULL, CHANGE tipo_ingrediente tipo_ingrediente VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE paso CHANGE imagen_url imagen_url VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE receta ADD dificultad VARCHAR(10) DEFAULT NULL, CHANGE imagen_url imagen_url VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE usuario CHANGE roles roles JSON NOT NULL, CHANGE perfil perfil VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE categoria CHANGE icono icono VARCHAR(255) DEFAULT \'NULL\'');
        $this->addSql('ALTER TABLE ingrediente CHANGE cantidad cantidad DOUBLE PRECISION DEFAULT \'NULL\', CHANGE unidad unidad VARCHAR(255) DEFAULT \'NULL\', CHANGE tipo_ingrediente tipo_ingrediente VARCHAR(255) DEFAULT \'NULL\'');
        $this->addSql('ALTER TABLE paso CHANGE imagen_url imagen_url VARCHAR(255) DEFAULT \'NULL\'');
        $this->addSql('ALTER TABLE receta DROP dificultad, CHANGE imagen_url imagen_url VARCHAR(255) DEFAULT \'NULL\'');
        $this->addSql('ALTER TABLE usuario CHANGE roles roles LONGTEXT NOT NULL COLLATE `utf8mb4_bin`, CHANGE perfil perfil VARCHAR(255) DEFAULT \'NULL\'');
    }
}
