<?php
/**
 * Routeur principal redirigeant selon le rôle de session
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
?>
