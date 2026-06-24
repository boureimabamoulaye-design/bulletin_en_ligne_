<?php
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
</html>