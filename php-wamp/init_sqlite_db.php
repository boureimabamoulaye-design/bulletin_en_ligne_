<?php
/**
 * Initialisation de la base de données de démo SQLite pour l'environnement d'AI Studio
 */

$dbPath = __DIR__ . '/database.sqlite';

try {
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Activer les clés étrangères
    $pdo->exec("PRAGMA foreign_keys = ON;");

    // 1. Semestres
    $pdo->exec("CREATE TABLE IF NOT EXISTS semesters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom_semestre TEXT NOT NULL,
        annee_scolaire TEXT NOT NULL
    );");

    // 2. Administrateurs
    $pdo->exec("CREATE TABLE IF NOT EXISTS administrateurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        mot_de_passe TEXT NOT NULL
    );");

    // 3. Filières
    $pdo->exec("CREATE TABLE IF NOT EXISTS filieres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom_filiere TEXT NOT NULL UNIQUE,
        description TEXT
    );");

    // 4. Classes
    $pdo->exec("CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom_classe TEXT NOT NULL UNIQUE
    );");

    // 5. Étudiants
    $pdo->exec("CREATE TABLE IF NOT EXISTS etudiants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        matricule TEXT NOT NULL UNIQUE,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        sexe TEXT NOT NULL CHECK (sexe IN ('M', 'F')),
        date_naissance TEXT NOT NULL,
        telephone TEXT,
        email TEXT NOT NULL UNIQUE,
        adresse TEXT,
        photo TEXT DEFAULT 'default_student.png',
        filiere_id INTEGER NOT NULL,
        classe_id INTEGER NOT NULL,
        mot_de_passe TEXT NOT NULL,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE RESTRICT,
        FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE RESTRICT
    );");

    // 6. Cours
    $pdo->exec("CREATE TABLE IF NOT EXISTS cours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        description TEXT,
        fichier TEXT,
        filiere_id INTEGER NOT NULL,
        classe_id INTEGER NOT NULL,
        semestre_id INTEGER NOT NULL,
        enseignant TEXT NOT NULL,
        date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE,
        FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (semestre_id) REFERENCES semesters(id) ON DELETE CASCADE
    );");

    // 7. Notes
    $pdo->exec("CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        etudiant_id INTEGER NOT NULL,
        cours_id INTEGER NOT NULL,
        note REAL NOT NULL CHECK (note BETWEEN 0 AND 20),
        coefficient INTEGER NOT NULL DEFAULT 1,
        semestre_id INTEGER NOT NULL,
        date_note TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
        FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
        FOREIGN KEY (semestre_id) REFERENCES semesters(id) ON DELETE CASCADE
    );");

    // 8. Bulletins
    $pdo->exec("CREATE TABLE IF NOT EXISTS bulletins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        etudiant_id INTEGER NOT NULL,
        semestre_id INTEGER NOT NULL,
        moyenne_generale REAL NOT NULL,
        rang INTEGER,
        mention TEXT NOT NULL,
        decision TEXT NOT NULL CHECK (decision IN ('Admis', 'Ajourné')),
        date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
        FOREIGN KEY (semestre_id) REFERENCES semesters(id) ON DELETE CASCADE,
        UNIQUE (etudiant_id, semestre_id)
    );");

    // 9. Autorisations de Filières Inter-Filière
    $pdo->exec("CREATE TABLE IF NOT EXISTS autorisations_filieres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        etudiant_id INTEGER NOT NULL,
        filiere_id INTEGER NOT NULL,
        date_autorisation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        autorise_par TEXT NOT NULL,
        FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE,
        UNIQUE (etudiant_id, filiere_id)
    );");

    // 10. Historique d'accès
    $pdo->exec("CREATE TABLE IF NOT EXISTS historique_acces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        etudiant_id INTEGER NOT NULL,
        filiere_id INTEGER NOT NULL,
        date_acces TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE
    );");

    echo "Tables créées avec succès.\n";

    // --- SEED DE DONNÉES ---
    
    // Semestres
    $pdo->exec("INSERT OR IGNORE INTO semesters (id, nom_semestre, annee_scolaire) VALUES 
    (1, 'Semestre 1', '2025-2026'),
    (2, 'Semestre 2', '2025-2026');");

    // Administrateurs
    $pdo->exec("INSERT OR IGNORE INTO administrateurs (id, nom, email, mot_de_passe) VALUES 
    (1, 'Directeur Général', 'admin@ecole.com', '\$2y\$10\$R9n5Iu7Fj1b8GgUpIieFneO6BvW3n66pAnq7ZgP4iF/I7uNlDzeh2');");

    // Filières
    $pdo->exec("INSERT OR IGNORE INTO filieres (id, nom_filiere, description) VALUES
    (1, 'Informatique de Gestion', 'Développement web, d''applications et bases de données.'),
    (2, 'Réseaux et Télécommunications', 'Installation et administration de réseaux informatiques.'),
    (3, 'Comptabilité', 'Finances, audit et comptabilité générale.');");

    // Classes
    $pdo->exec("INSERT OR IGNORE INTO classes (id, nom_classe) VALUES
    (1, 'Niveau 1 (N1)'),
    (2, 'Niveau 2 (N2)'),
    (3, 'Niveau 3 (N3)');");

    // Étudiants (admin123 comme mot de passe par défaut)
    $pdo->exec("INSERT OR IGNORE INTO etudiants (id, matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, filiere_id, classe_id, mot_de_passe) VALUES 
    (1, 'ETU20250001', 'DUBOIS', 'Jean', 'M', '2004-05-12', '0601020304', 'jean.dubois@ecole.com', '12 rue des Fleurs, Paris', 1, 1, '\$2y\$10\$R9n5Iu7Fj1b8GgUpIieFneO6BvW3n66pAnq7ZgP4iF/I7uNlDzeh2'),
    (2, 'ETU20250002', 'MARTIN', 'Sophie', 'F', '2005-09-23', '0602030405', 'sophie.martin@ecole.com', '45 avenue Foch, Lyon', 2, 1, '\$2y\$10\$R9n5Iu7Fj1b8GgUpIieFneO6BvW3n66pAnq7ZgP4iF/I7uNlDzeh2');");

    // Cours
    $pdo->exec("INSERT OR IGNORE INTO cours (id, titre, description, fichier, filiere_id, classe_id, semestre_id, enseignant) VALUES
    (1, 'Développement Web PHP', 'Introduction au langage PHP et à la programmation de serveurs web.', 'cours_php.pdf', 1, 1, 1, 'M. Bouré'),
    (2, 'Bases de Réseaux', 'Concepts de base des protocoles TCP/IP et routage.', 'cours_reseaux.pdf', 2, 1, 1, 'Mme. Colin');");

    // Notes
    $pdo->exec("INSERT OR IGNORE INTO notes (id, etudiant_id, cours_id, note, coefficient, semestre_id) VALUES
    (1, 1, 1, 15.5, 2, 1),
    (2, 2, 2, 14.0, 3, 1);");

    echo "Base de données SQLite initialisée avec succès avec les jeux de données de test.\n";

} catch (PDOException $e) {
    die("Erreur d'initialisation SQLite : " . $e->getMessage() . "\n");
}
