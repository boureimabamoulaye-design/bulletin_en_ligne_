<?php
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
</html>
