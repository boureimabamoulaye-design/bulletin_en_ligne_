<?php
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
</html>