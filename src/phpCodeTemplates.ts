export const PHP_FILES = {
  // Database SQL Schema
  "database/db.sql": `-- ==========================================
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
`,

  // DB Connection script PHP
  "includes/db.php": `<?php
/**
 * Connexion sécurisée à la base de données MySQL avec PDO
 */

$host = 'localhost';
$dbname = 'gestion_scolaire';
$username = 'root';
$password = ''; // À adapter selon votre serveur (vide pour WAMP/XAMPP, 'root' pour MAMP)

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    die("Erreur de connexion à la base de données : " . $e->getMessage());
}
?>`,

  // Core CSS Style (vanilla elegant modern CSS)
  "assets/css/style.css": `/* ==========================================================================
   CSS UNIFIÉ : GESTION SCOLAIRE MODERNE (BLEU, BLANC, GRIS)
   ========================================================================== */

:root {
    --primary-color: #1e3a8a;       /* Deep Blue */
    --primary-light: #3b82f6;      /* Sky Blue */
    --accent-color: #2563eb;       /* Royal Blue */
    --bg-color: #f3f4f6;           /* Gray 100 */
    --card-bg: #ffffff;
    --text-color: #1f2937;         /* Gray 800 */
    --text-muted: #6b7280;         /* Gray 500 */
    --border-color: #e5e7eb;       /* Gray 200 */
    --success: #10b981;            /* Emerald */
    --danger: #ef4444;             /* Red */
    --warning: #f59e0b;            /* Amber */
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --radius: 8px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background-color: var(--bg-color);
    color: var(--text-color);
    min-height: 100vh;
    display: flex;
}

/* LOGIN LAYOUT */
.login-container {
    width: 100%;
    max-width: 450px;
    margin: auto;
    padding: 2rem;
    background: var(--card-bg);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    border-top: 5px solid var(--primary-color);
    margin-top: 5rem;
}

.login-header {
    text-align: center;
    margin-bottom: 2rem;
}

.login-header h1 {
    color: var(--primary-color);
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
}

.login-header p {
    color: var(--text-muted);
}

/* APP LAYOUT - SYSTEM PANELS */
.app-wrapper {
    display: flex;
    width: 100%;
    min-height: 100vh;
}

/* SIDEBAR */
.sidebar {
    width: 260px;
    background: var(--primary-color);
    color: #ffffff;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.logo-area {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 1.5rem;
}

.logo-icon {
    font-size: 1.8rem;
    font-weight: bold;
    background: #ffffff;
    color: var(--primary-color);
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-text {
    font-size: 1.2rem;
    font-weight: 700;
}

.nav-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.nav-item a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
    font-weight: 500;
    transition: all 0.2s ease;
}

.nav-item a:hover, .nav-item.active a {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
}

.user-badge {
    margin-top: auto;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--radius);
    font-size: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

/* MAIN CONTENT */
.main-layout {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.header-bar {
    background: #ffffff;
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-bar h2 {
    color: var(--primary-color);
    font-size: 1.4rem;
}

.btn-signout {
    background: var(--danger);
    color: white;
    padding: 0.5rem 1rem;
    text-decoration: none;
    border-radius: var(--radius);
    font-size: 0.9rem;
    font-weight: 500;
}

.content-body {
    padding: 2rem;
}

/* CARDS / CONTAINERS */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: var(--card-bg);
    padding: 1.5rem;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    border-left: 4px solid var(--primary-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stat-card.stats-bulletin {
    border-left-color: var(--success);
}

.stat-card.stats-major {
    border-left-color: var(--warning);
}

.stat-val {
    font-size: 1.8rem;
    font-weight: bold;
    color: var(--text-color);
    margin-top: 0.25rem;
}

.stat-label {
    font-size: 0.9rem;
    color: var(--text-muted);
}

/* DATA CONTAINERS */
.table-card {
    background: var(--card-bg);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
    margin-bottom: 2rem;
}

.card-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h3 {
    color: var(--primary-color);
}

/* TABLES */
.custom-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

.custom-table th {
    background: #f9fafb;
    padding: 1rem 1.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted);
    border-bottom: 2px solid var(--border-color);
}

.custom-table td {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    font-size: 0.95rem;
}

.custom-table tbody tr:hover {
    background: #f9fafb;
}

/* BUTTONS */
.btn {
    border: none;
    outline: none;
    cursor: pointer;
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: var(--radius);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    transition: all 0.2s ease;
}

.btn-primary {
    background: var(--primary-color);
    color: #ffffff;
}

.btn-primary:hover {
    background: var(--accent-color);
}

.btn-danger {
    background: var(--danger);
    color: white;
}

.btn-warning {
    background: var(--warning);
    color: white;
}

.btn-success {
    background: var(--success);
    color: white;
}

/* FORMS */
.form-group {
    margin-bottom: 1.25rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    font-size: 0.95rem;
}

.form-control {
    width: 100%;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    font-size: 1rem;
    outline: none;
    transition: border 0.2s;
}

.form-control:focus {
    border-color: var(--primary-light);
}

/* ALERT MESSAGES */
.alert {
    padding: 1rem;
    border-radius: var(--radius);
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
}

.alert-success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}

.alert-danger {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
}

/* BULLETIN VISUAL PRINT / DOWNLOAD styles */
.bulletin-container {
    background: #ffffff;
    border: 2px solid var(--primary-color);
    padding: 2.5rem;
    border-radius: 12px;
    max-width: 800px;
    margin: 1.5rem auto;
    position: relative;
    box-shadow: var(--shadow);
}

.bulletin-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 1.5rem;
}

.school-info h2 {
    color: var(--primary-color);
    font-size: 1.6rem;
    font-weight: 800;
}

.school-info p {
    color: var(--text-muted);
    font-size: 0.9rem;
}

.bulletin-title {
    text-align: center;
    background: var(--primary-color);
    color: #ffffff;
    padding: 0.5rem;
    border-radius: 4px;
    font-weight: bold;
    font-size: 1.2rem;
    margin-bottom: 2rem;
}

.student-identity {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.student-identity img {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    border: 2px solid var(--border-color);
    object-fit: cover;
}

.student-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    flex-grow: 1;
}

.student-details div {
    font-size: 0.95rem;
}

.student-details span {
    font-weight: 600;
}

.seal-logo {
    position: absolute;
    bottom: 2.5rem;
    right: 2.5rem;
    border: 2px solid var(--primary-color);
    border-radius: 50%;
    width: 90px;
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-color);
    font-weight: bold;
    font-size: 0.75rem;
    opacity: 0.5;
    text-align: center;
    transform: rotate(-15deg);
}

@media print {
    body * {
        visibility: hidden;
    }
    .bulletin-container, .bulletin-container * {
        visibility: visible;
    }
    .bulletin-container {
        position: absolute;
        left: 0;
        top: 0;
        border: none;
        box-shadow: none;
    }
}
`,

  // Login backend routing PHP
  "login.php": `<?php
/**
 * Script d'authentification sécurisé et routage de session PHP
 */
session_start();
require_once 'includes/db.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email_or_matricule = trim($_POST['username']);
    $password = trim($_POST['password']);
    $role = $_POST['role']; // 'admin' ou 'student'

    if (empty($email_or_matricule) || empty($password)) {
        $error = 'Veuillez remplir tous les champs.';
    } else {
        if ($role === 'admin') {
            // Requête préparée - Empêche l'injection SQL
            $stmt = $pdo->prepare("SELECT * FROM administrateurs WHERE email = ?");
            $stmt->execute([$email_or_matricule]);
            $admin = $stmt->fetch();

            if ($admin && password_verify($password, $admin['mot_de_passe'])) {
                $_SESSION['admin_id'] = $admin['id'];
                $_SESSION['admin_nom'] = $admin['nom'];
                $_SESSION['role'] = 'admin';
                header('Location: admin/dashboard.php');
                exit();
            } else {
                $error = 'Identifiants administrateur incorrects.';
            }
        } else {
            // Authentification Étudiant (via matricule unique)
            $stmt = $pdo->prepare("SELECT * FROM etudiants WHERE matricule = ?");
            $stmt->execute([$email_or_matricule]);
            $student = $stmt->fetch();

            if ($student && password_verify($password, $student['mot_de_passe'])) {
                $_SESSION['student_id'] = $student['id'];
                $_SESSION['student_nom'] = $student['nom'] . ' ' . $student['prenom'];
                $_SESSION['filiere_id'] = $student['filiere_id'];
                $_SESSION['role'] = 'student';
                header('Location: etudiant/dashboard.php');
                exit();
            } else {
                $error = 'Matricule ou mot de passe incorrect.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Connexion - Portail Scolaire</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body style="display: block;">
    <div class="login-container">
        <div class="login-header">
            <h1>Gestion Scolaire</h1>
            <p>Connectez-vous à votre espace sécurisé</p>
        </div>
        
        <?php if (!empty($error)): ?>
            <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form action="login.php" method="POST">
            <div class="form-group">
                <label class="form-label">Type d'utilisateur</label>
                <select name="role" class="form-control" required>
                    <option value="student">Étudiant (Matricule)</option>
                    <option value="admin">Administrateur (Email)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Identifiant (Email / Matricule)</label>
                <input type="text" name="username" class="form-control" placeholder="Ex: admin@ecole.com ou ETU20250001" required>
            </div>

            <div class="form-group">
                <label class="form-label">Mot de passe</label>
                <input type="password" name="password" class="form-control" required>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; display: block; text-align: center; justify-content: center;"> Se connecter</button>
        </form>
    </div>
</body>
</html>`,

  // index.php
  "index.php": `<?php
/**
 * Page d'accueil / Routeur principal vers les espaces
 */
session_start();
if (isset($_SESSION['role'])) {
    if ($_SESSION['role'] === 'admin') {
        header('Location: admin/dashboard.php');
    } else {
        header('Location: etudiant/dashboard.php');
    }
    exit();
} else {
    header('Location: login.php');
    exit();
}
?>`,

  // Admin Dashboard PHP code
  "admin/dashboard.php": `<?php
/**
 * Tableau de bord principal administrative
 */
session_start();
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../login.php');
    exit();
}
require_once '../includes/db.php';

// Statistiques
$total_etudiants = $pdo->query("SELECT COUNT(*) FROM etudiants")->fetchColumn();
$total_filieres = $pdo->query("SELECT COUNT(*) FROM filieres")->fetchColumn();
$total_cours = $pdo->query("SELECT COUNT(*) FROM cours")->fetchColumn();
$total_bulletins = $pdo->query("SELECT COUNT(*) FROM bulletins")->fetchColumn();

// Moyenne générale de l'établissement
$moyenne_generale = $pdo->query("SELECT AVG(note) FROM notes")->fetchColumn();
$moyenne_generale = $moyenne_generale !== null ? number_format($moyenne_generale, 2) : "N/A";

// Dernières notes ajoutées
$recent_notes_stmt = $pdo->query("
    SELECT n.note, n.date_note, e.nom, e.prenom, c.titre 
    FROM notes n
    JOIN etudiants e ON n.etudiant_id = e.id
    JOIN cours c ON n.cours_id = c.id
    ORDER BY n.date_note DESC LIMIT 5
");
$recent_notes = $recent_notes_stmt->fetchAll();

// Derniers accès enregistrés (Autorisations)
$logs_stmt = $pdo->query("
    SELECT h.date_acces, e.nom, e.prenom, f.nom_filiere
    FROM historique_acces h
    JOIN etudiants e ON h.etudiant_id = e.id
    JOIN filieres f ON h.filiere_id = f.id
    ORDER BY h.date_acces DESC LIMIT 5
");
$logs = $logs_stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Tableau de bord Admin - Plateforme Scolaire</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="app-wrapper">
        <div class="sidebar">
            <div class="logo-area">
                <div class="logo-icon">GS</div>
                <div class="logo-text">Portail Scolaire</div>
            </div>
            <ul class="nav-links">
                <li class="nav-item active"><a href="dashboard.php">Dashboard</a></li>
                <li class="nav-item"><a href="etudiants.php">Étudiants</a></li>
                <li class="nav-item"><a href="filieres.php">Filières</a></li>
                <li class="nav-item"><a href="cours.php">Cours / Supports</a></li>
                <li class="nav-item"><a href="notes.php">Saisie Notes</a></li>
                <li class="nav-item"><a href="bulletins.php">Bulletins</a></li>
                <li class="nav-item"><a href="autorisations.php">Autorisations</a></li>
            </ul>
            <div class="user-badge">
                <span>Connecté en tant que :</span>
                <strong><?= htmlspecialchars($_SESSION['admin_nom']) ?></strong>
            </div>
        </div>

        <div class="main-layout">
            <div class="header-bar">
                <h2>Vue d'ensemble - Administration</h2>
                <a href="../logout.php" class="btn-signout">Déconnexion</a>
            </div>

            <div class="content-body">
                <!-- Grid de statistiques -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div>
                            <div class="stat-label">Total Étudiants</div>
                            <div class="stat-val"><?= $total_etudiants ?></div>
                        </div>
                    </div>
                    <div class="stat-card stats-major">
                        <div>
                            <div class="stat-label">Total Filières</div>
                            <div class="stat-val"><?= $total_filieres ?></div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div>
                            <div class="stat-label">Total Cours</div>
                            <div class="stat-val"><?= $total_cours ?></div>
                        </div>
                    </div>
                    <div class="stat-card stats-bulletin">
                        <div>
                            <div class="stat-label">Moyenne Établissement</div>
                            <div class="stat-val"><?= $moyenne_generale ?>/20</div>
                        </div>
                    </div>
                </div>

                <!-- Grid de tableaux rapides -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <!-- Dernières notes -->
                    <div class="table-card">
                        <div class="card-header">
                            <h3>Dernières Notes Ajoutées</h3>
                        </div>
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Étudiant</th>
                                    <th>Cours</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach($recent_notes as $n): ?>
                                <tr>
                                    <td><?= htmlspecialchars($n['nom'].' '.$n['prenom']) ?></td>
                                    <td><?= htmlspecialchars($n['titre']) ?></td>
                                    <td><strong style="color:var(--primary-color)"><?= $n['note'] ?>/20</strong></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Historique Accès Inter-filières -->
                    <div class="table-card">
                        <div class="card-header">
                            <h3>Derniers Accès aux Filières</h3>
                        </div>
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Étudiant</th>
                                    <th>Filière Visité</th>
                                    <th>Date d'Accès</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach($logs as $l): ?>
                                <tr>
                                    <td><?= htmlspecialchars($l['nom'].' '.$l['prenom']) ?></td>
                                    <td><span class="badge" style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:4px; font-size:12px;"><?= htmlspecialchars($l['nom_filiere']) ?></span></td>
                                    <td><?= date('d/m/Y H:i', strtotime($l['date_acces'])) ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`,

  // Manage students PHP file
  "admin/etudiants.php": `<?php
/**
 * Gestion complète des étudiants avec matricule automatique et critères de filtres
 */
session_start();
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../login.php');
    exit();
}
require_once '../includes/db.php';

$success_msg = '';
$error_msg = '';

// Liste des filières et des classes pour les sélections de formulaires
$filieresList = $pdo->query("SELECT * FROM filieres ORDER BY nom_filiere")->fetchAll();
$classesList = $pdo->query("SELECT * FROM classes ORDER BY nom_classe")->fetchAll();

// Traitement de la création / modification d'un étudiant
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sauvegarder'])) {
    $id = !empty($_POST['id']) ? (int)$_POST['id'] : null;
    $nom = strtoupper(trim($_POST['nom']));
    $prenom = trim($_POST['prenom']);
    $sexe = $_POST['sexe'];
    $date_naissance = $_POST['date_naissance'];
    $telephone = trim($_POST['telephone']);
    $email = trim($_POST['email']);
    $adresse = trim($_POST['adresse']);
    $filiere_id = (int)$_POST['filiere_id'];
    $classe_id = (int)$_POST['classe_id'];
    $mot_de_passe = trim($_POST['mot_de_passe']);

    if (empty($nom) || empty($prenom) || empty($email) || empty($filiere_id) || empty($classe_id)) {
        $error_msg = 'Veuillez remplir les informations obligatoires.';
    } else {
        if ($id === null) {
            // Création automatique de matricule unique (Ex: ETUI202610214)
            $compteur = $pdo->query("SELECT COUNT(*) FROM etudiants")->fetchColumn() + 1;
            $matricule = "ETU" . date('Y') . str_pad($compteur, 4, '0', STR_PAD_LEFT);
            
            // Hachage sécurisé du mot de passe
            $password_hashed = password_hash(!empty($mot_de_passe) ? $mot_de_passe : 'student123', PASSWORD_DEFAULT);

            try {
                $stmt = $pdo->prepare("
                    INSERT INTO etudiants (matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, filiere_id, classe_id, mot_de_passe) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$matricule, $nom, $prenom, $sexe, $date_naissance, $telephone, $email, $adresse, $filiere_id, $classe_id, $password_hashed]);
                $success_msg = "L'étudiant $prenom $nom a été inscrit avec le matricule $matricule.";
            } catch (PDOException $e) {
                $error_msg = "Erreur : " . $e->getMessage();
            }
        } else {
            // Modification de l'étudiant
            try {
                if (!empty($mot_de_passe)) {
                    $password_hashed = password_hash($mot_de_passe, PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare("
                        UPDATE etudiants SET nom = ?, prenom = ?, sexe = ?, date_naissance = ?, telephone = ?, email = ?, adresse = ?, filiere_id = ?, classe_id = ?, mot_de_passe = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$nom, $prenom, $sexe, $date_naissance, $telephone, $email, $adresse, $filiere_id, $classe_id, $password_hashed, $id]);
                } else {
                    $stmt = $pdo->prepare("
                        UPDATE etudiants SET nom = ?, prenom = ?, sexe = ?, date_naissance = ?, telephone = ?, email = ?, adresse = ?, filiere_id = ?, classe_id = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$nom, $prenom, $sexe, $date_naissance, $telephone, $email, $adresse, $filiere_id, $classe_id, $id]);
                }
                $success_msg = "Les informations de l'étudiant ont été mises à jour.";
            } catch (PDOException $e) {
                $error_msg = "Erreur : " . $e->getMessage();
            }
        }
    }
}

// Suppression d'un étudiant
if (isset($_GET['supprimer'])) {
    $id_del = (int)$_GET['supprimer'];
    try {
        $stmt = $pdo->prepare("DELETE FROM etudiants WHERE id = ?");
        $stmt->execute([$id_del]);
        $success_msg = "Étudiant supprimé avec succès.";
    } catch(PDOException $e) {
        $error_msg = "Suppression impossible (contraintes relationnelles existantes).";
    }
}

// Recherche & Filtres
$search = isset($_GET['recherche']) ? trim($_GET['recherche']) : '';
$filiere_filter = isset($_GET['filiere_id_filter']) ? (int)$_GET['filiere_id_filter'] : 0;

$queryStr = "
    SELECT e.*, f.nom_filiere, c.nom_classe 
    FROM etudiants e
    JOIN filieres f ON e.filiere_id = f.id
    JOIN classes c ON e.classe_id = c.id
    WHERE 1=1
";
$params = [];

if (!empty($search)) {
    $queryStr .= " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($filiere_filter > 0) {
    $queryStr .= " AND e.filiere_id = ?";
    $params[] = $filiere_filter;
}

$queryStr .= " ORDER BY e.id DESC";
$etudiants_stmt = $pdo->prepare($queryStr);
$etudiants_stmt->execute($params);
$etudiants = $etudiants_stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Gestion des Étudiants</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="app-wrapper">
        <div class="sidebar">
            <div class="logo-area">
                <div class="logo-icon">GS</div>
                <div class="logo-text">Portail Scolaire</div>
            </div>
            <ul class="nav-links">
                <li class="nav-item"><a href="dashboard.php">Dashboard</a></li>
                <li class="nav-item active"><a href="etudiants.php">Étudiants</a></li>
                <li class="nav-item"><a href="filieres.php">Filières</a></li>
                <li class="nav-item"><a href="cours.php">Cours / Supports</a></li>
                <li class="nav-item"><a href="notes.php">Saisie Notes</a></li>
                <li class="nav-item"><a href="bulletins.php">Bulletins</a></li>
                <li class="nav-item"><a href="autorisations.php">Autorisations</a></li>
            </ul>
        </div>

        <div class="main-layout">
            <div class="header-bar">
                <h2>Gestion des Étudiants</h2>
                <a href="../logout.php" class="btn-signout">Déconnexion</a>
            </div>

            <div class="content-body">
                <?php if (!empty($success_msg)): ?><div class="alert alert-success"><?= $success_msg ?></div><?php endif; ?>
                <?php if (!empty($error_msg)): ?><div class="alert alert-danger"><?= $error_msg ?></div><?php endif; ?>

                <!-- Formulaire d'ajout rapide -->
                <div class="table-card" style="margin-bottom: 2rem; padding: 1.5rem;">
                    <h3 style="margin-bottom:1rem; color:var(--primary-color);">Inscription / Modification Éditeur</h3>
                    <form action="etudiants.php" method="POST" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <input type="hidden" name="id" id="edit-id" value="">
                        
                        <div class="form-group">
                            <label class="form-label">Nom</label>
                            <input type="text" name="nom" id="edit-nom" class="form-control" placeholder="Entrez le nom" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Prénom(s)</label>
                            <input type="text" name="prenom" id="edit-prenom" class="form-control" placeholder="Entrez le prénom" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" id="edit-email" class="form-control" placeholder="email@exemple.com" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nouveau Mot de Passe (laisser vide si inchangé)</label>
                            <input type="password" name="mot_de_passe" class="form-control" placeholder="Mot de passe">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Téléphone</label>
                            <input type="text" name="telephone" id="edit-phone" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label flex-col">Filière d'inscription principale</label>
                            <select name="filiere_id" id="edit-filiere" class="form-control" required>
                                <option value="">Choisir la filière...</option>
                                <?php foreach($filieresList as $f): ?>
                                    <option value="<?= $f['id'] ?>"><?= htmlspecialchars($f['nom_filiere']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Niveau de Classe</label>
                            <select name="classe_id" id="edit-classe" class="form-control" required>
                                <option value="">Choisir la classe...</option>
                                <?php foreach($classesList as $c): ?>
                                    <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['nom_classe']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Sexe</label>
                            <select name="sexe" id="edit-sexe" class="form-control" required>
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date de Naissance</label>
                            <input type="date" name="date_naissance" id="edit-dob" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Adresse de domicile</label>
                            <input type="text" name="adresse" id="edit-adresse" class="form-control">
                        </div>
                        
                        <div style="grid-column: span 2; text-align: right; margin-top: 1rem;">
                            <button type="submit" name="sauvegarder" class="btn btn-primary">Enregistrer l'Étudiant</button>
                        </div>
                    </form>
                </div>

                <!-- Section filtre de recherche -->
                <div class="table-card" style="padding: 1.5rem; margin-bottom: 2rem;">
                    <form action="etudiants.php" method="GET" style="display: flex; gap: 1rem; align-items: flex-end;">
                        <div class="form-group" style="flex-grow: 1; margin: 0;">
                            <label class="form-label">Recherche libre (Nom, Matricule...)</label>
                            <input type="text" name="recherche" value="<?= htmlspecialchars($search) ?>" class="form-control" placeholder="Rechercher...">
                        </div>
                        <div class="form-group" style="width: 250px; margin: 0;">
                            <label class="form-label">Filtrer par Filière</label>
                            <select name="filiere_id_filter" class="form-control">
                                <option value="0">Toutes les filières</option>
                                <?php foreach($filieresList as $f): ?>
                                    <option value="<?= $f['id'] ?>" <?= $f['id'] == $filiere_filter ? 'selected':'' ?>><?= htmlspecialchars($f['nom_filiere']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary" style="height: 42px;">Filtrer</button>
                    </form>
                </div>

                <!-- Tableau liste des étudiants -->
                <div class="table-card">
                    <div class="card-header">
                        <h3>Liste des Étudiants Actifs (<?= count($etudiants) ?>)</h3>
                    </div>
                    <table class="custom-table">
                        <thead>
                            <tr>
                                <th>Photo</th>
                                <th>Matricule</th>
                                <th>Nom Complet</th>
                                <th>Sexe</th>
                                <th>Filière de base</th>
                                <th>Classe actuelle</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($etudiants as $e): ?>
                            <tr>
                                <td><img src="../assets/uploads/<?= htmlspecialchars($e['photo']) ?>" alt="Photo" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                                <td><strong><?= htmlspecialchars($e['matricule']) ?></strong></td>
                                <td><?= htmlspecialchars($e['nom'] . ' ' . $e['prenom']) ?></td>
                                <td><?= $e['sexe'] ?></td>
                                <td><?= htmlspecialchars($e['nom_filiere']) ?></td>
                                <td><?= htmlspecialchars($e['nom_classe']) ?></td>
                                <td>
                                    <!-- Script Javascript simple pour distribuer les données pour modification -->
                                    <button class="btn btn-warning" onclick="fillForm(<?= htmlspecialchars(json_encode($e)) ?>)" style="padding: 4px 8px; font-size: 11px;">Éditer</button>
                                    <a href="etudiants.php?supprimer=<?= $e['id'] ?>" class="btn btn-danger" onclick="return confirm('Confirmer la suppression ?')" style="padding: 4px 8px; font-size: 11px;">Supr</a>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
    function fillForm(data) {
        document.getElementById('edit-id').value = data.id;
        document.getElementById('edit-nom').value = data.nom;
        document.getElementById('edit-prenom').value = data.prenom;
        document.getElementById('edit-email').value = data.email;
        document.getElementById('edit-phone').value = data.telephone;
        document.getElementById('edit-filiere').value = data.filiere_id;
        document.getElementById('edit-classe').value = data.classe_id;
        document.getElementById('edit-sexe').value = data.sexe;
        document.getElementById('edit-dob').value = data.date_naissance;
        document.getElementById('edit-adresse').value = data.adresse;
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
    </script>
</body>
</html>`,

  // Manage notes PHP file
  "admin/notes.php": `<?php
/**
 * Bulletin d'enregistrement des notes des étudiants par cours et semestre
 */
session_start();
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../login.php');
    exit();
}
require_once '../includes/db.php';

$success_msg = '';
$error_msg = '';

$etudiants = $pdo->query("SELECT id, matricule, nom, prenom FROM etudiants ORDER BY nom")->fetchAll();
$cours = $pdo->query("SELECT id, titre, coefficient FROM cours ORDER BY titre")->fetchAll();
$semestres = $pdo->query("SELECT id, nom_semestre, annee_scolaire FROM semesters ORDER BY id")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ajouter_note'])) {
    $etudiant_id = (int)$_POST['etudiant_id'];
    $cours_id = (int)$_POST['cours_id'];
    $semestre_id = (int)$_POST['semestre_id'];
    $note = (float)$_POST['note'];
    $coefficient = (int)$_POST['coefficient'];

    if ($note < 0 || $note > 20) {
        $error_msg = 'Le barême des notes obligatoires doit se situer entre 0 et 20.';
    } else {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO notes (etudiant_id, cours_id, note, coefficient, semestre_id) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$etudiant_id, $cours_id, $note, $coefficient, $semestre_id]);
            $success_msg = 'La note a été validée avec succès.';
        } catch (PDOException $e) {
            $error_msg = "Erreur d'ajout de note : " . $e->getMessage();
        }
    }
}

// Récupération des notes générales
$notesList = $pdo->query("
    SELECT n.*, e.matricule, e.nom, e.prenom, c.titre as cours_titre, s.nom_semestre
    FROM notes n
    JOIN etudiants e ON n.etudiant_id = e.id
    JOIN cours c ON n.cours_id = c.id
    JOIN semesters s ON n.semestre_id = s.id
    ORDER BY n.id DESC LIMIT 30
")->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Saisie des Notes Scolaires</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="app-wrapper">
        <div class="sidebar">
            <div class="logo-area">
                <div class="logo-icon">GS</div>
                <div class="logo-text">Portail Scolaire</div>
            </div>
            <ul class="nav-links">
                <li class="nav-item"><a href="dashboard.php">Dashboard</a></li>
                <li class="nav-item"><a href="etudiants.php">Étudiants</a></li>
                <li class="nav-item"><a href="filieres.php">Filières</a></li>
                <li class="nav-item"><a href="cours.php">Cours / Supports</a></li>
                <li class="nav-item active"><a href="notes.php">Saisie Notes</a></li>
                <li class="nav-item"><a href="bulletins.php">Bulletins</a></li>
                <li class="nav-item"><a href="autorisations.php">Autorisations</a></li>
            </ul>
        </div>

        <div class="main-layout">
            <div class="header-bar">
                <h2>Enregistrement des Évaluations</h2>
                <a href="../logout.php" class="btn-signout font-600">Déconnexion</a>
            </div>

            <div class="content-body">
                <?php if (!empty($success_msg)): ?><div class="alert alert-success"><?= $success_msg ?></div><?php endif; ?>
                <?php if (!empty($error_msg)): ?><div class="alert alert-danger"><?= $error_msg ?></div><?php endif; ?>

                <div style="display: grid; grid-template-columns: 350px 1fr; gap: 1.5rem; align-items: start;">
                    <!-- Saisie de note -->
                    <div class="table-card" style="padding: 1.5rem;">
                        <h3 style="color:var(--primary-color); margin-bottom:1.5rem;">Nouvelle Note</h3>
                        <form action="notes.php" method="POST">
                            <div class="form-group">
                                <label class="form-label">Sélect. Étudiant</label>
                                <select name="etudiant_id" class="form-control" required>
                                    <option value="">Sélectionner...</option>
                                    <?php foreach($etudiants as $e): ?>
                                        <option value="<?= $e['id'] ?>"><?= htmlspecialchars($e['nom'].' '.$e['prenom']) ?> (<?= $e['matricule'] ?>)</option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Module / Cours</label>
                                <select name="cours_id" class="form-control" required>
                                    <option value="">Sélectionner...</option>
                                    <?php foreach($cours as $c): ?>
                                        <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['titre']) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Semestre</label>
                                <select name="semestre_id" class="form-control" required>
                                    <option value="">Sélectionner...</option>
                                    <?php foreach($semestres as $s): ?>
                                        <option value="<?= $s['id'] ?>"><?= htmlspecialchars($s['nom_semestre'] . ' - ' . $s['annee_scolaire']) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap:0.5rem">
                                <div>
                                    <label class="form-label">Note / 20</label>
                                    <input type="number" step="0.25" min="0" max="20" name="note" class="form-control" required>
                                </div>
                                <div>
                                    <label class="form-label">Coefficient</label>
                                    <input type="number" min="1" max="10" name="coefficient" value="1" class="form-control" required>
                                </div>
                            </div>

                            <button type="submit" name="ajouter_note" class="btn btn-primary" style="width: 100%; border-radius:4px; text-align: center; justify-content: center; margin-top:1rem;"> Valider la Note</button>
                        </form>
                    </div>

                    <!-- Historique récent -->
                    <div class="table-card">
                        <div class="card-header">
                            <h3>Historique Récent des Évaluations</h3>
                        </div>
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Matricule</th>
                                    <th>Étudiant</th>
                                    <th>Cours / Matière</th>
                                    <th>Semestre</th>
                                    <th>Note</th>
                                    <th>Coef</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if(empty($notesList)): ?><tr><td colspan="6" style="text-align: center; color: var(--text-muted)">Aucune note enregistrée pour le moment.</td></tr><?php endif ?>
                                <?php foreach($notesList as $nl): ?>
                                <tr>
                                    <td><?= htmlspecialchars($nl['matricule']) ?></td>
                                    <td><?= htmlspecialchars($nl['nom'].' '.$nl['prenom']) ?></td>
                                    <td><?= htmlspecialchars($nl['cours_titre']) ?></td>
                                    <td><?= htmlspecialchars($nl['nom_semestre']) ?></td>
                                    <td><strong><?= number_format($nl['note'], 2) ?>/20</strong></td>
                                    <td><?= $nl['coefficient'] ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`,

  // Manage major resource permissions dynamic authorizations PHP
  "admin/autorisations.php": `<?php
/**
 * Autorisations d'accès inter-filières pour les étudiants
 */
session_start();
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../login.php');
    exit();
}
require_once '../includes/db.php';

$success_msg = '';
$error_msg = '';

$etudiants = $pdo->query("SELECT id, matricule, nom, prenom FROM etudiants ORDER BY nom")->fetchAll();
$filieres = $pdo->query("SELECT id, nom_filiere FROM filieres ORDER BY nom_filiere")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accorder'])) {
    $etudiant_id = (int)$_POST['etudiant_id'];
    $filiere_id = (int)$_POST['filiere_id'];
    $autorise_par = $_SESSION['admin_nom'];

    try {
        $stmt = $pdo->prepare("
            INSERT INTO autorisations_filieres (etudiant_id, filiere_id, autorise_par) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$etudiant_id, $filiere_id, $autorise_par]);
        $success_msg = "Autorisation accordée d'accès temporaire ou complémentaire.";
    } catch(PDOException $e) {
        $error_msg = "L'étudiant possède déjà cette accréditation.";
    }
}

if (isset($_GET['retirer'])) {
    $id_del = (int)$_GET['retirer'];
    $stmt = $pdo->prepare("DELETE FROM autorisations_filieres WHERE id = ?");
    $stmt->execute([$id_del]);
    $success_msg = "Autorisation révoquée d'accès inter-filière.";
}

// Récupérer les accréditations courantes
$auths = $pdo->query("
    SELECT a.*, e.nom, e.prenom, e.matricule, f.nom_filiere 
    FROM autorisations_filieres a
    JOIN etudiants e ON a.etudiant_id = e.id
    JOIN filieres f ON a.filiere_id = f.id
    ORDER BY a.date_autorisation DESC
")->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Autorisations Inter-Filières</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="app-wrapper">
        <div class="sidebar">
            <div class="logo-area">
                <div class="logo-icon">GS</div>
                <div class="logo-text font-italic">Portail Scolaire</div>
            </div>
            <ul class="nav-links">
                <li class="nav-item"><a href="dashboard.php">Dashboard</a></li>
                <li class="nav-item"><a href="etudiants.php">Étudiants</a></li>
                <li class="nav-item"><a href="filieres.php">Filières</a></li>
                <li class="nav-item"><a href="cours.php">Cours / Supports</a></li>
                <li class="nav-item"><a href="notes.php">Saisie Notes</a></li>
                <li class="nav-item"><a href="bulletins.php">Bulletins</a></li>
                <li class="nav-item active"><a href="autorisations.php">Autorisations</a></li>
            </ul>
        </div>

        <div class="main-layout">
            <div class="header-bar">
                <h2>Autorisations & Inter-Disciplinaire</h2>
                <a href="../logout.php" class="btn-signout">Déconnexion</a>
            </div>

            <div class="content-body">
                <?php if (!empty($success_msg)): ?><div class="alert alert-success"><?= $success_msg ?></div><?php endif; ?>
                <?php if (!empty($error_msg)): ?><div class="alert alert-danger"><?= $error_msg ?></div><?php endif; ?>

                <div style="display:grid; grid-template-columns: 350px 1fr; gap:1.5rem; align-items: start;">
                    <!-- Accorder Autorisation -->
                    <div class="table-card" style="padding:1.5rem">
                        <h3 style="color:var(--primary-color); margin-bottom:1.25rem;">Accréditer un Élève</h3>
                        <form action="autorisations.php" method="POST">
                            <div class="form-group">
                                <label class="form-label">Sélect. Étudiant</label>
                                <select name="etudiant_id" class="form-control" required>
                                    <option value="">Sélectionner l'étudiant...</option>
                                    <?php foreach($etudiants as $e): ?>
                                        <option value="<?= $e['id'] ?>"><?= htmlspecialchars($e['nom'].' '.$e['prenom']) ?> (<?= $e['matricule'] ?>)</option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Filière Additionnelle</label>
                                <select name="filiere_id" class="form-control" required>
                                    <option value="">Sélectionner la filière...</option>
                                    <?php foreach($filieres as $f): ?>
                                        <option value="<?= $f['id'] ?>"><?= htmlspecialchars($f['nom_filiere']) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <button type="submit" name="accorder" class="btn btn-primary" style="width:100%; justify-content:center; text-align:center;"> Accorder l'Accès</button>
                        </form>
                    </div>

                    <!-- Liste active -->
                    <div class="table-card">
                        <div class="card-header">
                            <h3>Droits d'Accès Actifs</h3>
                        </div>
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Matricule</th>
                                    <th>Étudiant</th>
                                    <th>Accès Autorisé à</th>
                                    <th>Accordée Le</th>
                                    <th>Par Admin</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if(empty($auths)): ?><tr><td colspan="6" style="text-align: center; color: var(--text-muted)">Aucune autorisation spéciale paramétrée.</td></tr><?php endif ?>
                                <?php foreach($auths as $a): ?>
                                <tr>
                                    <td><?= htmlspecialchars($a['matricule']) ?></td>
                                    <td><?= htmlspecialchars($a['nom'] . ' ' . $a['prenom']) ?></td>
                                    <td><strong><?= htmlspecialchars($a['nom_filiere']) ?></strong></td>
                                    <td><?= date('d/m/Y', strtotime($a['date_autorisation'])) ?></td>
                                    <td><?= htmlspecialchars($a['autorise_par']) ?></td>
                                    <td>
                                        <a href="autorisations.php?retirer=<?= $a['id'] ?>" class="btn btn-danger" onclick="return confirm('Confirmer la révocation d\'accès ?')" style="padding:4px 8px; font-size:11px;">Révoquer</a>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`,

  // Student Dashboard PHP
  "etudiant/dashboard.php": `<?php
/**
 * Espace étudiant sécurisé présentant les filières d'origines et celles autorisées
 */
session_start();
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    header('Location: ../login.php');
    exit();
}
require_once '../includes/db.php';

$student_id = $_SESSION['student_id'];

// Charger les détails de l'étudiant
$stmt = $pdo->prepare("
    SELECT e.*, f.nom_filiere, c.nom_classe 
    FROM etudiants e
    JOIN filieres f ON e.filiere_id = f.id
    JOIN classes c ON e.classe_id = c.id
    WHERE e.id = ?
");
$stmt->execute([$student_id]);
$student = $stmt->fetch();

// Filières additionnelles autorisées
$auth_stmt = $pdo->prepare("
    SELECT f.id, f.nom_filiere, f.description 
    FROM autorisations_filieres a
    JOIN filieres f ON a.filiere_id = f.id
    WHERE a.etudiant_id = ?
");
$auth_stmt->execute([$student_id]);
$filières_autorisees = $auth_stmt->fetchAll();

// Modifier le mot de passe
$success_msg = '';
$error_msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['modifier_mdp'])) {
    $ancien = $_POST['ancien_mdp'];
    $nouveau = $_POST['nouveau_mdp'];

    if (password_verify($ancien, $student['mot_de_passe'])) {
        $nouveau_hash = password_hash($nouveau, PASSWORD_DEFAULT);
        $p_up = $pdo->prepare("UPDATE etudiants SET mot_de_passe = ? WHERE id = ?");
        $p_up->execute([$nouveau_hash, $student_id]);
        $success_msg = "Mot de passe modifié avec succès.";
        // Refresh local student password hash representation
        $student['mot_de_passe'] = $nouveau_hash;
    } else {
        $error_msg = "L'ancien mot de passe est erroné.";
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mon Espace Étudiant</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="app-wrapper">
        <div class="sidebar">
            <div class="logo-area">
                <div class="logo-icon">GS</div>
                <div class="logo-text">Mon Bureau</div>
            </div>
            <ul class="nav-links">
                <li class="nav-item active"><a href="dashboard.php">Mon Profil</a></li>
                <li class="nav-item"><a href="cours.php">Supports de Cours</a></li>
                <li class="nav-item"><a href="notes.php">Mes Notes</a></li>
                <li class="nav-item"><a href="bulletins.php">Mes Bulletins</a></li>
            </ul>
            <div class="user-badge">
                <span>Profil étudiant :</span>
                <strong><?= htmlspecialchars($student['nom'].' '.$student['prenom']) ?></strong>
                <span style="font-size: 11px; opacity:0.8"><?= htmlspecialchars($student['matricule']) ?></span>
            </div>
        </div>

        <div class="main-layout">
            <div class="header-bar">
                <h2>Bienvenue, <?= htmlspecialchars($student['prenom']) ?> !</h2>
                <a href="../logout.php" class="btn-signout">Déconnexion</a>
            </div>

            <div class="content-body">
                <?php if (!empty($success_msg)): ?><div class="alert alert-success"><?= $success_msg ?></div><?php endif; ?>
                <?php if (!empty($error_msg)): ?><div class="alert alert-danger"><?= $error_msg ?></div><?php endif; ?>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                    <!-- Profil Détails -->
                    <div class="table-card" style="padding:1.5rem">
                        <div style="display:flex; gap:1.5rem; align-items:center;">
                            <img src="../assets/uploads/<?= htmlspecialchars($student['photo']) ?>" alt="Photo Profil" style="width:100px; height:100px; border-radius:12px; object-fit:cover; border:3px solid var(--primary-color)">
                            <div>
                                <h3 style="color:var(--primary-color);"><?= htmlspecialchars($student['nom'].' '.$student['prenom']) ?></h3>
                                <p style="color:var(--text-muted); font-weight:600; font-size:14px; margin-top:2px;">Matricule : <?= htmlspecialchars($student['matricule']) ?></p>
                                <p style="font-size:13px; margin-top:4px;"><span class="badge" style="background: rgba(30,58,138,0.1); color: var(--primary-color); padding: 2px 6px; border-radius: 4px;"><?= htmlspecialchars($student['nom_classe']) ?></span></p>
                            </div>
                        </div>

                        <div style="margin-top:2rem; display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:14px; border-top:1px solid var(--border-color); padding-top:1.5rem;">
                            <div>
                                <strong style="color:var(--text-muted)">Téléphone :</strong>
                                <p><?= htmlspecialchars($student['telephone']) ?></p>
                            </div>
                            <div>
                                <strong style="color:var(--text-muted)">E-mail :</strong>
                                <p><?= htmlspecialchars($student['email']) ?></p>
                            </div>
                            <div>
                                <strong style="color:var(--text-muted)">Date de Naissance :</strong>
                                <p><?= date('d/m/Y', strtotime($student['date_naissance'])) ?></p>
                            </div>
                            <div>
                                <strong style="color:var(--text-muted)">Filière de Base :</strong>
                                <p style="color: var(--primary-color); font-weight:600;"><?= htmlspecialchars($student['nom_filiere']) ?></p>
                            </div>
                        </div>
                    </div>

                    <!-- Sécuritaire : Modifier mot de passe -->
                    <div class="table-card" style="padding:1.5rem">
                        <h3 style="color:var(--primary-color); margin-bottom:1rem;">Modifier mon Mot de Passe</h3>
                        <form action="dashboard.php" method="POST">
                            <div class="form-group">
                                <label class="form-label">Ancien mot de passe</label>
                                <input type="password" name="ancien_mdp" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nouveau mot de passe</label>
                                <input type="password" name="nouveau_mdp" class="form-control" required>
                            </div>
                            <button type="submit" name="modifier_mdp" class="btn btn-primary" style="margin-top:0.5rem">Changer le mot de passe</button>
                        </form>
                    </div>

                    <!-- Accréditations Inter-Filières Spéciales -->
                    <div class="table-card" style="grid-column: span 2; padding:1.5rem">
                        <h3 style="color:var(--primary-color); margin-bottom:1rem;">Mes Accréditations & Disciplines Autorisées</h3>
                        <p style="color: var(--text-muted); font-size:13px; margin-bottom:1.5rem">L'Administration peut vous accréditer un accès temporaire à d'autres parcours pour enrichir vos bibliothèques d'études.</p>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
                            <div style="border: 2px dashed var(--primary-light); padding:1rem; border-radius: var(--radius)">
                                <strong style="color:var(--primary-color);">Filière Principale :</strong>
                                <h4 style="margin: 4px 0 8px 0"><?= htmlspecialchars($student['nom_filiere']) ?></h4>
                                <p style="font-size:12px; color: var(--text-muted)"><?= htmlspecialchars($student['nom_filiere']) ?> est votre inscription primaire certifiée.</p>
                            </div>

                            <?php foreach($filières_autorisees as $auth): ?>
                                <div style="border: 2px solid var(--success); padding:1rem; border-radius: var(--radius); background: #f0fdf4">
                                    <strong style="color:var(--success)">Filière Partagée & Accréditée :</strong>
                                    <h4 style="margin: 4px 0 8px 0; color:#166534"><?= htmlspecialchars($auth['nom_filiere']) ?></h4>
                                    <p style="font-size:12px; color: #166534"><?= htmlspecialchars($auth['description']) ?></p>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`
};
