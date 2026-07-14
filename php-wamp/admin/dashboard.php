<?php
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
</html>