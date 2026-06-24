<?php
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
                                        <a href="autorisations.php?retirer=<?= $a['id'] ?>" class="btn btn-danger" onclick="return confirm('Confirmer la révocation d'accès ?')" style="padding:4px 8px; font-size:11px;">Révoquer</a>
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
</html>