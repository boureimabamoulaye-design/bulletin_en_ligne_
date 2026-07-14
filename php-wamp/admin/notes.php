<?php
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
</html>