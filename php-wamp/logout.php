<?php
/**
 * Script de déconnexion sécurisé
 */
session_start();
session_unset();
session_destroy();
header('Location: login.php');
exit();
?>
