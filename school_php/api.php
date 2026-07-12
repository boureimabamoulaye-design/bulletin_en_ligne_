<?php
/**
 * API REST pour synchroniser l'application React avec la base de données WAMP (MySQL)
 * Gère le CORS et l'import/export temps réel de toutes les tables scolaires.
 */

// Configuration CORS pour permettre à l'application React d'accéder à l'API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Répondre aux requêtes OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'includes/db.php';

// Action demandée (?action=...)
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. Initialisation défensive des tables manquantes (comme paiements, trash ou matieres)
try {
    // Table matieres si absente
    $pdo->exec("CREATE TABLE IF NOT EXISTS matieres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom_matiere VARCHAR(100) NOT NULL,
        code_matiere VARCHAR(30) NOT NULL UNIQUE,
        credits INT NOT NULL DEFAULT 1,
        filiere_id INT NOT NULL,
        semestre_id INT NULL
    ) ENGINE=InnoDB;");

    // Table paiements si absente
    $pdo->exec("CREATE TABLE IF NOT EXISTS paiements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        etudiant_id INT NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        date_paiement DATE NOT NULL,
        type_frais VARCHAR(50) NOT NULL,
        methode VARCHAR(50) NOT NULL,
        statut VARCHAR(30) NOT NULL,
        recu_numero VARCHAR(50) NOT NULL UNIQUE,
        annee_scolaire VARCHAR(20) NOT NULL,
        notes TEXT NULL
    ) ENGINE=InnoDB;");

    // Table trash (Corbeille) pour sauvegarder les éléments supprimés
    $pdo->exec("CREATE TABLE IF NOT EXISTS corbeille (
        id VARCHAR(100) PRIMARY KEY,
        item_type VARCHAR(50) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        original_data LONGTEXT NOT NULL,
        deleted_at VARCHAR(50) NOT NULL
    ) ENGINE=InnoDB;");

    // Mettre à jour la table des notes au cas où
    $pdo->exec("ALTER TABLE notes ADD COLUMN IF NOT EXISTS note_classe DECIMAL(5,2) NULL;");
    $pdo->exec("ALTER TABLE notes ADD COLUMN IF NOT EXISTS note_examen DECIMAL(5,2) NULL;");

} catch (PDOException $e) {
    // On ignore si déjà existant ou autre erreur non critique
}

// ROUTAGE DES ACTIONS
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'ping') {
        echo json_encode([
            "status" => "success",
            "message" => "Connexion réussie avec la base MySQL de WAMP !",
            "database" => $dbname,
            "server_time" => date('Y-m-d H:i:s')
        ]);
        exit();
    }

    if ($action === 'get') {
        try {
            // Lecture ordonnée de toutes les tables pour peupler le state React
            
            // Filieres
            $stmt = $pdo->query("SELECT * FROM filieres ORDER BY id ASC");
            $filieres = $stmt->fetchAll();
            
            // Matieres
            $stmt = $pdo->query("SELECT * FROM matieres ORDER BY id ASC");
            $matieres = $stmt->fetchAll();

            // Classes
            $stmt = $pdo->query("SELECT * FROM classes ORDER BY id ASC");
            $classes = $stmt->fetchAll();

            // Semestres (semesters)
            $stmt = $pdo->query("SELECT * FROM semesters ORDER BY id ASC");
            $semestres = [];
            foreach ($stmt->fetchAll() as $row) {
                $semestres[] = [
                    "id" => (int)$row['id'],
                    "nom_semestre" => $row['nom_semestre'],
                    "annee_scolaire" => $row['annee_scolaire']
                ];
            }

            // Etudiants (on s'assure d'avoir la photo par défaut)
            $stmt = $pdo->query("SELECT * FROM etudiants ORDER BY id ASC");
            $etudiants = [];
            foreach ($stmt->fetchAll() as $row) {
                $etudiants[] = [
                    "id" => (int)$row['id'],
                    "matricule" => $row['matricule'],
                    "nom" => $row['nom'],
                    "prenom" => $row['prenom'],
                    "sexe" => $row['sexe'],
                    "date_naissance" => $row['date_naissance'],
                    "telephone" => $row['telephone'] ?? '',
                    "email" => $row['email'],
                    "adresse" => $row['adresse'] ?? '',
                    "photo" => $row['photo'] ?? 'default_student.png',
                    "filiere_id" => (int)$row['filiere_id'],
                    "classe_id" => (int)$row['classe_id'],
                    "mot_de_passe" => $row['mot_de_passe']
                ];
            }

            // Cours
            $stmt = $pdo->query("SELECT * FROM cours ORDER BY id ASC");
            $cours = [];
            foreach ($stmt->fetchAll() as $row) {
                $cours[] = [
                    "id" => (int)$row['id'],
                    "titre" => $row['titre'],
                    "description" => $row['description'] ?? '',
                    "fichier" => $row['fichier'] ?? '',
                    "filiere_id" => (int)$row['filiere_id'],
                    "classe_id" => (int)$row['classe_id'],
                    "semestre_id" => (int)$row['semestre_id'],
                    "enseignant" => $row['enseignant'],
                    "date_ajout" => $row['date_ajout']
                ];
            }

            // Notes
            $stmt = $pdo->query("SELECT * FROM notes ORDER BY id ASC");
            $notes = [];
            foreach ($stmt->fetchAll() as $row) {
                $notes[] = [
                    "id" => (int)$row['id'],
                    "etudiant_id" => (int)$row['etudiant_id'],
                    "cours_id" => (int)$row['cours_id'],
                    "semestre_id" => (int)$row['semestre_id'],
                    "note" => (float)$row['note'],
                    "credits" => (int)($row['coefficient'] ?? 1),
                    "date_ajout" => $row['date_note'],
                    "note_classe" => isset($row['note_classe']) ? (float)$row['note_classe'] : null,
                    "note_examen" => isset($row['note_examen']) ? (float)$row['note_examen'] : null
                ];
            }

            // Autorisations
            $stmt = $pdo->query("SELECT * FROM autorisations_filieres ORDER BY id ASC");
            $autorisations = [];
            foreach ($stmt->fetchAll() as $row) {
                $autorisations[] = [
                    "id" => (int)$row['id'],
                    "etudiant_id" => (int)$row['etudiant_id'],
                    "filiere_id" => (int)$row['filiere_id'],
                    "date_autorisation" => $row['date_autorisation'],
                    "autorise_par" => $row['autorise_par']
                ];
            }

            // Paiements
            $stmt = $pdo->query("SELECT * FROM paiements ORDER BY id ASC");
            $paiements = [];
            foreach ($stmt->fetchAll() as $row) {
                $paiements[] = [
                    "id" => (int)$row['id'],
                    "etudiant_id" => (int)$row['etudiant_id'],
                    "montant" => (float)$row['montant'],
                    "date_paiement" => $row['date_paiement'],
                    "type_frais" => $row['type_frais'],
                    "methode" => $row['methode'],
                    "statut" => $row['statut'],
                    "recu_numero" => $row['recu_numero'],
                    "annee_scolaire" => $row['annee_scolaire'],
                    "notes" => $row['notes'] ?? ''
                ];
            }

            // Corbeille (Trash)
            $stmt = $pdo->query("SELECT * FROM corbeille ORDER BY deleted_at DESC");
            $trash = [];
            foreach ($stmt->fetchAll() as $row) {
                $trash[] = [
                    "id" => $row['id'],
                    "itemType" => $row['item_type'],
                    "itemName" => $row['item_name'],
                    "originalData" => json_decode($row['original_data'], true),
                    "deletedAt" => $row['deleted_at']
                ];
            }

            // Retourner toutes les données structurées pour React
            echo json_encode([
                "status" => "success",
                "data" => [
                    "filieres" => $filieres,
                    "matieres" => $matieres,
                    "classes" => $classes,
                    "semestres" => $semestres,
                    "etudiants" => $etudiants,
                    "cours" => $cours,
                    "notes" => $notes,
                    "autorisations" => $autorisations,
                    "paiements" => $paiements,
                    "trash" => $trash
                ]
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Impossible de lire les données MySQL : " . $e->getMessage()
            ]);
        }
        exit();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'save') {
        // Lecture du flux d'entrée JSON envoyé par React
        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        if (!$payload) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Corps de requête JSON invalide."]);
            exit();
        }

        try {
            $pdo->beginTransaction();

            // 1. Synchronisation de la table FILIERES
            if (isset($payload['filieres']) && is_array($payload['filieres'])) {
                // Supprimer les anciennes filières non présentes pour éviter les désynchronisations, 
                // mais attention aux contraintes d'intégrité. On préfère un UPSERT.
                foreach ($payload['filieres'] as $f) {
                    $stmt = $pdo->prepare("INSERT INTO filieres (id, nom_filiere, description) 
                        VALUES (?, ?, ?) 
                        ON DUPLICATE KEY UPDATE nom_filiere = VALUES(nom_filiere), description = VALUES(description)");
                    $stmt->execute([$f['id'], $f['nom_filiere'], $f['description'] ?? '']);
                }
            }

            // 2. Synchronisation de la table CLASSES
            if (isset($payload['classes']) && is_array($payload['classes'])) {
                foreach ($payload['classes'] as $c) {
                    $stmt = $pdo->prepare("INSERT INTO classes (id, nom_classe) 
                        VALUES (?, ?) 
                        ON DUPLICATE KEY UPDATE nom_classe = VALUES(nom_classe)");
                    $stmt->execute([$c['id'], $c['nom_classe']]);
                }
            }

            // 3. Synchronisation de la table MATIERES
            if (isset($payload['matieres']) && is_array($payload['matieres'])) {
                foreach ($payload['matieres'] as $m) {
                    $stmt = $pdo->prepare("INSERT INTO matieres (id, nom_matiere, code_matiere, credits, filiere_id, semestre_id) 
                        VALUES (?, ?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE nom_matiere = VALUES(nom_matiere), code_matiere = VALUES(code_matiere), credits = VALUES(credits), filiere_id = VALUES(filiere_id), semestre_id = VALUES(semestre_id)");
                    $stmt->execute([$m['id'], $m['nom_matiere'], $m['code_matiere'], $m['credits'], $m['filiere_id'], $m['semestre_id'] ?? null]);
                }
            }

            // 4. Synchronisation de la table SEMESTRES (semesters)
            if (isset($payload['semestres']) && is_array($payload['semestres'])) {
                foreach ($payload['semestres'] as $s) {
                    $stmt = $pdo->prepare("INSERT INTO semesters (id, nom_semestre, annee_scolaire) 
                        VALUES (?, ?, ?) 
                        ON DUPLICATE KEY UPDATE nom_semestre = VALUES(nom_semestre), annee_scolaire = VALUES(annee_scolaire)");
                    $stmt->execute([$s['id'], $s['nom_semestre'], $s['annee_scolaire']]);
                }
            }

            // 5. Synchronisation de la table ETUDIANTS
            if (isset($payload['etudiants']) && is_array($payload['etudiants'])) {
                foreach ($payload['etudiants'] as $e) {
                    // Si le mot de passe est en clair dans React (ex: "pass123"), on s'assure de le hacher en PHP
                    $mdp = $e['mot_de_passe'];
                    if (strlen($mdp) < 40 && !str_starts_with($mdp, '$2y$')) {
                        $mdp = password_hash($mdp, PASSWORD_BCRYPT);
                    }

                    $stmt = $pdo->prepare("INSERT INTO etudiants (id, matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, photo, filiere_id, classe_id, mot_de_passe) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                            matricule = VALUES(matricule), nom = VALUES(nom), prenom = VALUES(prenom), 
                            sexe = VALUES(sexe), date_naissance = VALUES(date_naissance), telephone = VALUES(telephone), 
                            email = VALUES(email), adresse = VALUES(adresse), photo = VALUES(photo), 
                            filiere_id = VALUES(filiere_id), classe_id = VALUES(classe_id), mot_de_passe = VALUES(mot_de_passe)");
                    $stmt->execute([
                        $e['id'], $e['matricule'], $e['nom'], $e['prenom'], $e['sexe'], $e['date_naissance'], 
                        $e['telephone'] ?? '', $e['email'], $e['adresse'] ?? '', $e['photo'] ?? 'default_student.png', 
                        $e['filiere_id'], $e['classe_id'], $mdp
                    ]);
                }
            }

            // 6. Synchronisation de la table COURS
            if (isset($payload['cours']) && is_array($payload['cours'])) {
                foreach ($payload['cours'] as $c) {
                    $stmt = $pdo->prepare("INSERT INTO cours (id, titre, description, fichier, filiere_id, classe_id, semestre_id, enseignant, date_ajout) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                            titre = VALUES(titre), description = VALUES(description), fichier = VALUES(fichier), 
                            filiere_id = VALUES(filiere_id), classe_id = VALUES(classe_id), semestre_id = VALUES(semestre_id), 
                            enseignant = VALUES(enseignant), date_ajout = VALUES(date_ajout)");
                    $stmt->execute([
                        $c['id'], $c['titre'], $c['description'] ?? '', $c['fichier'] ?? '', 
                        $c['filiere_id'], $c['classe_id'], $c['semestre_id'], $c['enseignant'], $c['date_ajout']
                    ]);
                }
            }

            // 7. Synchronisation de la table NOTES
            if (isset($payload['notes']) && is_array($payload['notes'])) {
                foreach ($payload['notes'] as $n) {
                    $stmt = $pdo->prepare("INSERT INTO notes (id, etudiant_id, cours_id, note, coefficient, semestre_id, date_note, note_classe, note_examen) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                            etudiant_id = VALUES(etudiant_id), cours_id = VALUES(cours_id), note = VALUES(note), 
                            coefficient = VALUES(coefficient), semestre_id = VALUES(semestre_id), date_note = VALUES(date_note),
                            note_classe = VALUES(note_classe), note_examen = VALUES(note_examen)");
                    $stmt->execute([
                        $n['id'], $n['etudiant_id'], $n['cours_id'], $n['note'], $n['credits'] ?? 1, 
                        $n['semestre_id'], $n['date_ajout'], $n['note_classe'] ?? null, $n['note_examen'] ?? null
                    ]);
                }
            }

            // 8. Synchronisation de la table AUTORISATIONS
            if (isset($payload['autorisations']) && is_array($payload['autorisations'])) {
                foreach ($payload['autorisations'] as $a) {
                    $stmt = $pdo->prepare("INSERT INTO autorisations_filieres (id, etudiant_id, filiere_id, date_autorisation, autorise_par) 
                        VALUES (?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                            etudiant_id = VALUES(etudiant_id), filiere_id = VALUES(filiere_id), 
                            date_autorisation = VALUES(date_autorisation), autorise_par = VALUES(autorise_par)");
                    $stmt->execute([
                        $a['id'], $a['etudiant_id'], $a['filiere_id'], $a['date_autorisation'], $a['autorise_par']
                    ]);
                }
            }

            // 9. Synchronisation de la table PAIEMENTS
            if (isset($payload['paiements']) && is_array($payload['paiements'])) {
                foreach ($payload['paiements'] as $p) {
                    $stmt = $pdo->prepare("INSERT INTO paiements (id, etudiant_id, montant, date_paiement, type_frais, methode, statut, recu_numero, annee_scolaire, notes) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                            etudiant_id = VALUES(etudiant_id), montant = VALUES(montant), date_paiement = VALUES(date_paiement), 
                            type_frais = VALUES(type_frais), methode = VALUES(methode), statut = VALUES(statut), 
                            recu_numero = VALUES(recu_numero), annee_scolaire = VALUES(annee_scolaire), notes = VALUES(notes)");
                    $stmt->execute([
                        $p['id'], $p['etudiant_id'], $p['montant'], $p['date_paiement'], $p['type_frais'], 
                        $p['methode'], $p['statut'], $p['recu_numero'], $p['annee_scolaire'], $p['notes'] ?? ''
                    ]);
                }
            }

            // 10. Synchronisation de la table CORBEILLE
            if (isset($payload['trash']) && is_array($payload['trash'])) {
                foreach ($payload['trash'] as $t) {
                    $serialized_data = json_encode($t['originalData']);
                    $stmt = $pdo->prepare("INSERT INTO corbeille (id, item_type, item_name, original_data, deleted_at) 
                        VALUES (?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                            item_type = VALUES(item_type), item_name = VALUES(item_name), 
                            original_data = VALUES(original_data), deleted_at = VALUES(deleted_at)");
                    $stmt->execute([
                        $t['id'], $t['itemType'], $t['itemName'], $serialized_data, $t['deletedAt']
                    ]);
                }
            }

            // Si des IDs ont été supprimés côté client, on gère les délétions physiques sur MySQL
            if (isset($payload['deletions']) && is_array($payload['deletions'])) {
                foreach ($payload['deletions'] as $del) {
                    $type = $del['type'];
                    $id = (int)$del['id'];

                    if ($type === 'filiere') {
                        $pdo->prepare("DELETE FROM filieres WHERE id = ?")->execute([$id]);
                    } else if ($type === 'matiere') {
                        $pdo->prepare("DELETE FROM matieres WHERE id = ?")->execute([$id]);
                    } else if ($type === 'semestre') {
                        $pdo->prepare("DELETE FROM semesters WHERE id = ?")->execute([$id]);
                    } else if ($type === 'etudiant') {
                        $pdo->prepare("DELETE FROM etudiants WHERE id = ?")->execute([$id]);
                    } else if ($type === 'cours') {
                        $pdo->prepare("DELETE FROM cours WHERE id = ?")->execute([$id]);
                    } else if ($type === 'note') {
                        $pdo->prepare("DELETE FROM notes WHERE id = ?")->execute([$id]);
                    } else if ($type === 'autorisation') {
                        $pdo->prepare("DELETE FROM autorisations_filieres WHERE id = ?")->execute([$id]);
                    } else if ($type === 'paiement') {
                        $pdo->prepare("DELETE FROM paiements WHERE id = ?")->execute([$id]);
                    }
                }
            }

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Données synchronisées avec succès sur WAMP !"]);

        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Erreur lors de l'écriture en base de données : " . $e->getMessage()
            ]);
        }
        exit();
    }
}

// Action inconnue
http_response_code(400);
echo json_encode(["status" => "error", "message" => "Action invalide."]);
?>
