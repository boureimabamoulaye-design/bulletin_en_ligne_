<?php
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
?>
