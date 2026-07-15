<?php
/**
 * Connexion sécurisée à la base de données avec PDO
 */

// Si on est dans l'environnement de démo (AI Studio ou conteneur sans MySQL ou avec database.sqlite existant)
if (file_exists(__DIR__ . '/../database.sqlite') || !extension_loaded('pdo_mysql')) {
    try {
        $pdo = new PDO("sqlite:" . __DIR__ . "/../database.sqlite", null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        // Activation des clés étrangères pour SQLite
        $pdo->exec("PRAGMA foreign_keys = ON;");
    } catch (PDOException $e) {
        die("Erreur de connexion SQLite : " . $e->getMessage());
    }
} else {
    // Environnement de production WAMP/XAMPP
    $host = 'localhost';
    $dbname = 'gestio_scolaire';
    $username = 'root';
    $password = ''; // À adapter selon votre serveur (vide pour WAMP/XAMPP, 'root' pour MAMP)

    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        die("Erreur de connexion à la base de données MySQL : " . $e->getMessage());
    }
}
?>