-- ==========================================
-- STRUCTURE DE LA BASE DE DONNÉES SCOLAIRE
-- ==========================================

CREATE DATABASE IF NOT EXISTS gestion_scolaire DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_scolaire;

-- 1. Table des Semestres (demandée)
CREATE TABLE IF NOT EXISTS semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_semestre VARCHAR(50) NOT NULL, -- Ex: 'Semestre 1', 'Semestre 2'
    annee_scolaire VARCHAR(20) NOT NULL -- Ex: '2025-2026'
) ENGINE=InnoDB;

-- 2. Table des Administrateurs
CREATE TABLE IF NOT EXISTS administrateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- 3. Table des Filières
CREATE TABLE IF NOT EXISTS filieres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_filiere VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB;

-- 4. Table des Classes
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_classe VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 5. Table des Étudiants
CREATE TABLE IF NOT EXISTS etudiants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricule VARCHAR(30) NOT NULL UNIQUE,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    sexe CHAR(1) NOT NULL CHECK (sexe IN ('M', 'F')),
    date_naissance DATE NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(100) NOT NULL UNIQUE,
    adresse TEXT,
    photo VARCHAR(255) DEFAULT 'default_student.png',
    filiere_id INT NOT NULL,
    classe_id INT NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE RESTRICT,
    FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. Table des Cours
CREATE TABLE IF NOT EXISTS cours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(150) NOT NULL,
    description TEXT,
    fichier VARCHAR(255) NULL, -- Lien vers le cours PDF
    filiere_id INT NOT NULL,
    classe_id INT NOT NULL,
    semestre_id INT NOT NULL, -- Lié à la table semesters
    enseignant VARCHAR(100) NOT NULL,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE,
    FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (semestre_id) REFERENCES semesters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Table des Notes
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT NOT NULL,
    cours_id INT NOT NULL,
    note DECIMAL(5,2) NOT NULL CHECK (note BETWEEN 0 AND 20),
    coefficient INT NOT NULL DEFAULT 1,
    semestre_id INT NOT NULL,
    date_note TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
    FOREIGN KEY (semestre_id) REFERENCES semesters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Table des Bulletins
CREATE TABLE IF NOT EXISTS bulletins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT NOT NULL,
    semestre_id INT NOT NULL,
    moyenne_generale DECIMAL(5,2) NOT NULL,
    rang INT,
    mention VARCHAR(50) NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('Admis', 'Ajourné')),
    date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
    FOREIGN KEY (semestre_id) REFERENCES semesters(id) ON DELETE CASCADE,
    UNIQUE KEY uq_etudiant_semestre (etudiant_id, semestre_id)
) ENGINE=InnoDB;

-- 9. Table des Autorisations de Filières Inter-Filière (Fonctionnalité spéciale)
CREATE TABLE IF NOT EXISTS autorisations_filieres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT NOT NULL,
    filiere_id INT NOT NULL,
    date_autorisation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    autorise_par VARCHAR(100) NOT NULL,
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
    FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE,
    UNIQUE KEY uq_etudiant_filiere (etudiant_id, filiere_id)
) ENGINE=InnoDB;

-- 10. Table de l'Historique d'accès
CREATE TABLE IF NOT EXISTS historique_acces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT NOT NULL,
    filiere_id INT NOT NULL,
    date_acces TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
    FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- INSERTS DE DÉPART (JEU DE DONNÉES MINIMUM)
INSERT INTO semesters (id, nom_semestre, annee_scolaire) VALUES 
(1, 'Semestre 1', '2025-2026'),
(2, 'Semestre 2', '2025-2026');

INSERT INTO administrateurs (nom, email, mot_de_passe) VALUES 
('Directeur Général', 'admin@ecole.com', '$2y$10$R9n5Iu7Fj1b8GgUpIieFneO6BvW3n66pAnq7ZgP4iF/I7uNlDzeh2'); -- MDP: admin123

INSERT INTO filieres (id, nom_filiere, description) VALUES
(1, 'Informatique de Gestion', 'Développement web, d''applications et bases de données.'),
(2, 'Réseaux et Télécommunications', 'Installation et administration de réseaux informatiques.'),
(3, 'Comptabilité', 'Finances, audit et comptabilité générale.');

INSERT INTO classes (id, nom_classe) VALUES
(1, 'Niveau 1 (N1)'),
(2, 'Niveau 2 (N2)'),
(3, 'Niveau 3 (N3)');
