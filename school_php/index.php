<?php
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
?>