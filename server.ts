import express from "express";
import path from "path";
import sqlite3 from "sqlite3";
import fs from "fs";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "database.sqlite");

// Enable JSON parser and urlencoded parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize SQLite database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to SQLite relational database:", DB_PATH);
  }
});

// Helper to run raw SQL queries as promises (for clean async/await)
const dbRun = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Database Schema Initialization (Real SQL)
async function initDatabase() {
  try {
    // Enable Foreign Keys
    await dbRun("PRAGMA foreign_keys = ON;");

    // 1. Semesters / Semestres table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS semesters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom_semestre TEXT NOT NULL,
        annee_scolaire TEXT NOT NULL,
        filiere_id INTEGER
      );
    `);

    // 2. Administrateurs table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS administrateurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        mot_de_passe TEXT NOT NULL
      );
    `);

    // 3. Filieres table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS filieres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom_filiere TEXT NOT NULL UNIQUE,
        description TEXT
      );
    `);

    // 4. Classes table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom_classe TEXT NOT NULL UNIQUE
      );
    `);

    // 5. Etudiants table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS etudiants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        matricule TEXT NOT NULL UNIQUE,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        sexe TEXT NOT NULL CHECK (sexe IN ('M', 'F')),
        date_naissance TEXT NOT NULL,
        telephone TEXT,
        email TEXT NOT NULL UNIQUE,
        adresse TEXT,
        photo TEXT DEFAULT 'default_student.png',
        filiere_id INTEGER NOT NULL,
        classe_id INTEGER NOT NULL,
        mot_de_passe TEXT NOT NULL,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE RESTRICT,
        FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE RESTRICT
      );
    `);

    // 6. Cours table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS cours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        description TEXT,
        fichier TEXT,
        filiere_id INTEGER NOT NULL,
        classe_id INTEGER NOT NULL,
        semestre_id INTEGER NOT NULL,
        enseignant TEXT NOT NULL,
        date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE,
        FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (semestre_id) REFERENCES semesters(id) ON DELETE CASCADE
      );
    `);

    // 7. Notes table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        etudiant_id INTEGER NOT NULL,
        cours_id INTEGER NOT NULL,
        note REAL NOT NULL CHECK (note BETWEEN 0 AND 20),
        coefficient INTEGER NOT NULL DEFAULT 1,
        semestre_id INTEGER NOT NULL,
        credits INTEGER NOT NULL DEFAULT 3,
        date_note TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
        FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
        FOREIGN KEY (semestre_id) REFERENCES semesters(id) ON DELETE CASCADE
      );
    `);

    // 8. Paiements table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS paiements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        etudiant_id INTEGER NOT NULL,
        montant INTEGER NOT NULL,
        date_paiement TEXT NOT NULL,
        type_paiement TEXT NOT NULL,
        recu TEXT NOT NULL,
        FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE
      );
    `);

    // 9. Autorisations de filieres
    await dbRun(`
      CREATE TABLE IF NOT EXISTS autorisations_filieres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        etudiant_id INTEGER NOT NULL,
        filiere_id INTEGER NOT NULL,
        date_autorisation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        autorise_par TEXT NOT NULL,
        motif TEXT,
        FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE,
        UNIQUE (etudiant_id, filiere_id)
      );
    `);

    // 10. Historique d'accès
    await dbRun(`
      CREATE TABLE IF NOT EXISTS historique_acces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        utilisateur TEXT NOT NULL,
        action TEXT NOT NULL,
        date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. Trash can table for temporary deletes
    await dbRun(`
      CREATE TABLE IF NOT EXISTS trash (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 12. Global configuration table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    console.log("SQL schema initialized successfully!");

    // --- SEED SEED DATA IF THE DATABASE IS NEW OR EMPTY ---
    const semestersCount = await dbGet("SELECT COUNT(*) as count FROM semesters;");
    if (semestersCount.count === 0) {
      console.log("Seeding initial relational database data...");

      // Semestres
      await dbRun("INSERT INTO semesters (id, nom_semestre, annee_scolaire, filiere_id) VALUES (1, 'Semestre 1 (IG)', '2025-2026', 1);");
      await dbRun("INSERT INTO semesters (id, nom_semestre, annee_scolaire, filiere_id) VALUES (2, 'Semestre 2 (IG)', '2025-2026', 1);");
      await dbRun("INSERT INTO semesters (id, nom_semestre, annee_scolaire, filiere_id) VALUES (3, 'Semestre 1 (RT)', '2025-2026', 2);");
      await dbRun("INSERT INTO semesters (id, nom_semestre, annee_scolaire, filiere_id) VALUES (4, 'Semestre 2 (RT)', '2025-2026', 2);");
      await dbRun("INSERT INTO semesters (id, nom_semestre, annee_scolaire, filiere_id) VALUES (5, 'Semestre 1 (CF)', '2025-2026', 3);");
      await dbRun("INSERT INTO semesters (id, nom_semestre, annee_scolaire, filiere_id) VALUES (6, 'Semestre 2 (CF)', '2025-2026', 3);");
      await dbRun("INSERT INTO semesters (id, nom_semestre, annee_scolaire, filiere_id) VALUES (7, 'Semestre 1 (MD)', '2025-2026', 4);");
      await dbRun("INSERT INTO semesters (id, nom_semestre, annee_scolaire, filiere_id) VALUES (8, 'Semestre 2 (MD)', '2025-2026', 4);");

      // Administrateurs (including the user email as an admin!)
      await dbRun("INSERT INTO administrateurs (id, nom, email, mot_de_passe) VALUES (1, 'Bourekane Admin', 'bourekane223@gmail.com', 'admin123');");
      await dbRun("INSERT INTO administrateurs (id, nom, email, mot_de_passe) VALUES (2, 'Directeur Général', 'admin@ecole.com', 'admin123');");

      // Filières
      await dbRun("INSERT INTO filieres (id, nom_filiere, description) VALUES (1, 'Informatique de Gestion', 'Développement web, d''applications et bases de données.');");
      await dbRun("INSERT INTO filieres (id, nom_filiere, description) VALUES (2, 'Réseaux et Télécommunications', 'Installation et administration de réseaux informatiques.');");
      await dbRun("INSERT INTO filieres (id, nom_filiere, description) VALUES (3, 'Comptabilité et Finance', 'Finances, audit et comptabilité générale.');");
      await dbRun("INSERT INTO filieres (id, nom_filiere, description) VALUES (4, 'Marketing Digital & Communication', 'Stratégies d''acquisition, création de contenu de marque et gestion des médias sociaux.');");

      // Classes
      await dbRun("INSERT INTO classes (id, nom_classe) VALUES (1, 'Niveau 1 (N1)');");
      await dbRun("INSERT INTO classes (id, nom_classe) VALUES (2, 'Niveau 2 (N2)');");
      await dbRun("INSERT INTO classes (id, nom_classe) VALUES (3, 'Niveau 3 (N3)');");

      // Étudiants (admin123 as default password)
      await dbRun(`
        INSERT INTO etudiants (id, matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, filiere_id, classe_id, mot_de_passe) VALUES 
        (1, 'ETU20250001', 'DUBOIS', 'Jean', 'M', '2004-05-12', '0601020304', 'jean.dubois@ecole.com', '12 rue des Fleurs, Paris', 1, 1, 'admin123'),
        (2, 'ETU20250002', 'MARTIN', 'Sophie', 'F', '2005-09-23', '0602030405', 'sophie.martin@ecole.com', '45 avenue Foch, Lyon', 1, 1, 'admin123'),
        (3, 'ETU20250003', 'KOFFI', 'Amandine', 'F', '2004-11-02', '0707080910', 'amandine.koffi@ecole.com', 'Rue du Commerce, Abidjan', 2, 2, 'admin123'),
        (4, 'ETU20250004', 'TALL', 'Awa', 'F', '2003-03-15', '0645781290', 'awa.tall@ecole.com', 'Plateau, Dakar', 3, 3, 'admin123'),
        (5, 'ETU20250005', 'DIALLO', 'Mamadou', 'M', '2005-01-30', '0689432109', 'mamadou.diallo@ecole.com', 'Ratoma, Conakry', 4, 1, 'admin123');
      `);

      // Cours
      await dbRun(`
        INSERT INTO cours (id, titre, description, fichier, filiere_id, classe_id, semestre_id, enseignant) VALUES
        (1, 'Algorithmique & structures de données', 'Introduction aux structures de données et à l''analyse d''algorithmes complexes.', 'cours_algo.pdf', 1, 1, 1, 'Dr. Traoré'),
        (2, 'Développement Web PHP-MySQL', 'Apprendre à concevoir un site dynamique avec PHP et MySQL sous WAMP.', 'cours_php_mysql.pdf', 1, 1, 2, 'M. Bouré'),
        (3, 'Administration Système Linux', 'Prise en main de Debian, gestion des utilisateurs, des droits et des services.', 'cours_linux.pdf', 2, 2, 3, 'Mme. Colin'),
        (4, 'Comptabilité Générale Intermédiaire', 'Maîtrise des bilans, comptes de résultats et écritures complexes.', 'cours_compta.pdf', 3, 3, 5, 'Prof. Sissoko'),
        (5, 'SEO & Growth Hacking', 'Optimisation pour les moteurs de recherche et techniques d''acquisition rapides.', 'cours_seo.pdf', 4, 1, 7, 'Mme. Sy');
      `);

      // Notes
      await dbRun(`
        INSERT INTO notes (id, etudiant_id, cours_id, note, coefficient, semestre_id, credits) VALUES
        (1, 1, 1, 14.5, 2, 1, 3),
        (2, 1, 2, 16.0, 3, 2, 4),
        (3, 2, 1, 15.5, 2, 1, 3),
        (4, 2, 2, 11.0, 3, 2, 4),
        (5, 3, 3, 13.0, 2, 3, 3),
        (6, 4, 4, 15.0, 4, 5, 4),
        (7, 5, 5, 12.5, 3, 7, 3);
      `);

      // Paiements
      await dbRun(`
        INSERT INTO paiements (id, etudiant_id, montant, date_paiement, type_paiement, recu) VALUES
        (1, 1, 500000, '2025-10-15', 'Virement Bancaire', 'REC-2025-001'),
        (2, 1, 500000, '2026-01-10', 'Espèces', 'REC-2026-002'),
        (3, 2, 750000, '2025-09-20', 'Chèque', 'REC-2025-003'),
        (4, 3, 1000000, '2025-10-01', 'Virement Bancaire', 'REC-2025-004'),
        (5, 4, 1500000, '2025-09-15', 'Virement Bancaire', 'REC-2025-005');
      `);

      // Global tuition fee & years config
      await dbRun("INSERT INTO config (key, value) VALUES ('scolarite_annuelle', '1500000');");
      await dbRun("INSERT INTO config (key, value) VALUES ('annees_scolaires', '[\"2025-2026\", \"2026-2027\", \"2024-2025\"]');");

      // Historique
      await dbRun("INSERT INTO historique_acces (utilisateur, action) VALUES ('Système', 'Initialisation de la base de données SQL et chargement du jeu de test.');");

      console.log("Relational database seeded successfully with test records!");
    }
  } catch (err) {
    console.error("Error seeding database schema:", err);
  }
}

initDatabase();

// --- REST API ENDPOINTS ---

// Log Action Helper
async function logAction(user: string, action: string) {
  try {
    await dbRun("INSERT INTO historique_acces (utilisateur, action) VALUES (?, ?);", [user, action]);
  } catch (err) {
    console.error("Failed to write log:", err);
  }
}

// 1. Authentication
app.post("/api/auth/login", async (req, res) => {
  const { role, username, password } = req.body;
  try {
    if (role === "admin") {
      const admin = await dbGet("SELECT * FROM administrateurs WHERE email = ? AND mot_de_passe = ?;", [username, password]);
      if (admin) {
        await logAction(admin.nom, `Connexion réussie à l'espace administration.`);
        return res.json({ status: "success", role: "admin", name: admin.nom, email: admin.email });
      }
    } else {
      const student = await dbGet("SELECT * FROM etudiants WHERE (email = ? OR matricule = ?) AND mot_de_passe = ?;", [username, username, password]);
      if (student) {
        await logAction(`${student.nom} ${student.prenom}`, `Connexion réussie au portail étudiant.`);
        return res.json({ status: "success", role: "student", student });
      }
    }
    res.status(401).json({ error: "Identifiants incorrects." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Global statistics for dashboard
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const students = await dbGet("SELECT COUNT(*) as count FROM etudiants;");
    const courses = await dbGet("SELECT COUNT(*) as count FROM cours;");
    const filieres = await dbGet("SELECT COUNT(*) as count FROM filieres;");
    const grades = await dbAll("SELECT note, coefficient, credits FROM notes;");
    const totalPayments = await dbGet("SELECT SUM(montant) as total FROM paiements;");

    // Calculate dynamic average grade across school
    let sumGrades = 0;
    let sumCoefs = 0;
    grades.forEach((g) => {
      sumGrades += g.note * g.coefficient;
      sumCoefs += g.coefficient;
    });
    const avgGrade = sumCoefs > 0 ? sumGrades / sumCoefs : 0;

    res.json({
      totalStudents: students.count,
      totalCourses: courses.count,
      totalFilieres: filieres.count,
      averageGrade: avgGrade,
      totalPayments: totalPayments.total || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Etudiants CRUD
app.get("/api/etudiants", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM etudiants;");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/etudiants", async (req, res) => {
  const { matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, filiere_id, classe_id, mot_de_passe } = req.body;
  try {
    const result = await dbRun(
      `INSERT INTO etudiants (matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, filiere_id, classe_id, mot_de_passe) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, filiere_id, classe_id, mot_de_passe || "admin123"]
    );
    await logAction("Administrateur", `Ajout de l'étudiant ${prenom} ${nom} (${matricule}).`);
    res.json({ id: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/etudiants/:id", async (req, res) => {
  const { id } = req.params;
  const { matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, filiere_id, classe_id, mot_de_passe } = req.body;
  try {
    await dbRun(
      `UPDATE etudiants SET matricule=?, nom=?, prenom=?, sexe=?, date_naissance=?, telephone=?, email=?, adresse=?, filiere_id=?, classe_id=?, mot_de_passe=?
       WHERE id=?;`,
      [matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, filiere_id, classe_id, mot_de_passe, id]
    );
    await logAction("Administrateur", `Modification de l'étudiant ${prenom} ${nom} (${matricule}).`);
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/etudiants/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const student = await dbGet("SELECT * FROM etudiants WHERE id=?;", [id]);
    if (student) {
      // Put in trash first
      await dbRun("INSERT INTO trash (type, data) VALUES ('etudiant', ?);", [JSON.stringify(student)]);
      await dbRun("DELETE FROM etudiants WHERE id=?;", [id]);
      await logAction("Administrateur", `Suppression temporaire de l'étudiant ${student.prenom} ${student.nom}.`);
    }
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Filieres CRUD
app.get("/api/filieres", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM filieres;");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/filieres", async (req, res) => {
  const { nom_filiere, description } = req.body;
  try {
    const result = await dbRun("INSERT INTO filieres (nom_filiere, description) VALUES (?, ?);", [nom_filiere, description]);
    await logAction("Administrateur", `Création de la filière ${nom_filiere}.`);
    res.json({ id: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/filieres/:id", async (req, res) => {
  const { id } = req.params;
  const { nom_filiere, description } = req.body;
  try {
    await dbRun("UPDATE filieres SET nom_filiere=?, description=? WHERE id=?;", [nom_filiere, description, id]);
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/filieres/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const filiere = await dbGet("SELECT * FROM filieres WHERE id=?;", [id]);
    if (filiere) {
      await dbRun("INSERT INTO trash (type, data) VALUES ('filiere', ?);", [JSON.stringify(filiere)]);
      await dbRun("DELETE FROM filieres WHERE id=?;", [id]);
      await logAction("Administrateur", `Suppression temporaire de la filière ${filiere.nom_filiere}.`);
    }
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Semestres CRUD
app.get("/api/semestres", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM semesters;");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/semestres", async (req, res) => {
  const { nom_semestre, annee_scolaire, filiere_id } = req.body;
  try {
    const result = await dbRun("INSERT INTO semesters (nom_semestre, annee_scolaire, filiere_id) VALUES (?, ?, ?);", [nom_semestre, annee_scolaire, filiere_id]);
    await logAction("Administrateur", `Création du semestre ${nom_semestre}.`);
    res.json({ id: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/semestres/:id", async (req, res) => {
  const { id } = req.params;
  const { nom_semestre, annee_scolaire, filiere_id } = req.body;
  try {
    await dbRun("UPDATE semesters SET nom_semestre=?, annee_scolaire=?, filiere_id=? WHERE id=?;", [nom_semestre, annee_scolaire, filiere_id, id]);
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/semestres/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const sem = await dbGet("SELECT * FROM semesters WHERE id=?;", [id]);
    if (sem) {
      await dbRun("INSERT INTO trash (type, data) VALUES ('semester', ?);", [JSON.stringify(sem)]);
      await dbRun("DELETE FROM semesters WHERE id=?;", [id]);
      await logAction("Administrateur", `Suppression temporaire du semestre ${sem.nom_semestre}.`);
    }
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Cours CRUD
app.get("/api/cours", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM cours;");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cours", async (req, res) => {
  const { titre, description, fichier, filiere_id, classe_id, semestre_id, enseignant } = req.body;
  try {
    const result = await dbRun(
      "INSERT INTO cours (titre, description, fichier, filiere_id, classe_id, semestre_id, enseignant) VALUES (?, ?, ?, ?, ?, ?, ?);",
      [titre, description, fichier || "cours_support.pdf", filiere_id, classe_id, semestre_id, enseignant]
    );
    await logAction("Administrateur", `Ajout du cours ${titre} dispensé par ${enseignant}.`);
    res.json({ id: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/cours/:id", async (req, res) => {
  const { id } = req.params;
  const { titre, description, fichier, filiere_id, classe_id, semestre_id, enseignant } = req.body;
  try {
    await dbRun(
      "UPDATE cours SET titre=?, description=?, fichier=?, filiere_id=?, classe_id=?, semestre_id=?, enseignant=? WHERE id=?;",
      [titre, description, fichier, filiere_id, classe_id, semestre_id, enseignant, id]
    );
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/cours/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const cour = await dbGet("SELECT * FROM cours WHERE id=?;", [id]);
    if (cour) {
      await dbRun("INSERT INTO trash (type, data) VALUES ('cours', ?);", [JSON.stringify(cour)]);
      await dbRun("DELETE FROM cours WHERE id=?;", [id]);
      await logAction("Administrateur", `Suppression temporaire du support de cours ${cour.titre}.`);
    }
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Notes / Grades CRUD
app.get("/api/notes", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM notes;");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/notes", async (req, res) => {
  const { etudiant_id, cours_id, note, coefficient, semestre_id, credits } = req.body;
  try {
    const result = await dbRun(
      "INSERT INTO notes (etudiant_id, cours_id, note, coefficient, semestre_id, credits) VALUES (?, ?, ?, ?, ?, ?);",
      [etudiant_id, cours_id, note, coefficient, semestre_id, credits || 3]
    );
    await logAction("Administrateur", `Saisie d'une note de ${note}/20 pour un étudiant.`);
    res.json({ id: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  const { etudiant_id, cours_id, note, coefficient, semestre_id, credits } = req.body;
  try {
    await dbRun(
      "UPDATE notes SET etudiant_id=?, cours_id=?, note=?, coefficient=?, semestre_id=?, credits=? WHERE id=?;",
      [etudiant_id, cours_id, note, coefficient, semestre_id, credits, id]
    );
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const noteRec = await dbGet("SELECT * FROM notes WHERE id=?;", [id]);
    if (noteRec) {
      await dbRun("INSERT INTO trash (type, data) VALUES ('note', ?);", [JSON.stringify(noteRec)]);
      await dbRun("DELETE FROM notes WHERE id=?;", [id]);
      await logAction("Administrateur", `Suppression temporaire de la note d'id ${id}.`);
    }
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Classes endpoint (read only helper)
app.get("/api/classes", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM classes;");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Paiements CRUD
app.get("/api/paiements", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM paiements;");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/paiements", async (req, res) => {
  const { etudiant_id, montant, date_paiement, type_paiement, recu } = req.body;
  try {
    const result = await dbRun(
      "INSERT INTO paiements (etudiant_id, montant, date_paiement, type_paiement, recu) VALUES (?, ?, ?, ?, ?);",
      [etudiant_id, montant, date_paiement, type_paiement, recu]
    );
    await logAction("Administrateur", `Enregistrement du paiement ${recu} d'un montant de ${montant} FCFA.`);
    res.json({ id: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/paiements/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pay = await dbGet("SELECT * FROM paiements WHERE id=?;", [id]);
    if (pay) {
      await dbRun("INSERT INTO trash (type, data) VALUES ('paiement', ?);", [JSON.stringify(pay)]);
      await dbRun("DELETE FROM paiements WHERE id=?;", [id]);
      await logAction("Administrateur", `Suppression temporaire du paiement ${pay.recu}.`);
    }
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Access log & Inter-filière authorizations
app.get("/api/autorisations", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM autorisations_filieres;");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/autorisations", async (req, res) => {
  const { etudiant_id, filiere_id, autorise_par, motif } = req.body;
  try {
    const result = await dbRun(
      "INSERT OR REPLACE INTO autorisations_filieres (etudiant_id, filiere_id, autorise_par, motif) VALUES (?, ?, ?, ?);",
      [etudiant_id, filiere_id, autorise_par, motif]
    );
    await logAction("Administrateur", `Ajout d'une autorisation d'accès inter-filière pour l'étudiant ${etudiant_id}.`);
    res.json({ id: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/autorisations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun("DELETE FROM autorisations_filieres WHERE id=?;", [id]);
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/historique", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM historique_acces ORDER BY id DESC LIMIT 100;");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Config parameters
app.get("/api/config", async (req, res) => {
  try {
    const scolarite = await dbGet("SELECT value FROM config WHERE key = 'scolarite_annuelle';");
    const years = await dbGet("SELECT value FROM config WHERE key = 'annees_scolaires';");
    res.json({
      scolariteAnnuelle: scolarite ? Number(scolarite.value) : 1500000,
      anneesScolaires: years ? JSON.parse(years.value) : ["2025-2026", "2026-2027", "2024-2025"],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/config", async (req, res) => {
  const { scolariteAnnuelle, anneesScolaires } = req.body;
  try {
    await dbRun("INSERT OR REPLACE INTO config (key, value) VALUES ('scolarite_annuelle', ?);", [String(scolariteAnnuelle)]);
    await dbRun("INSERT OR REPLACE INTO config (key, value) VALUES ('annees_scolaires', ?);", [JSON.stringify(anneesScolaires)]);
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Trash CRUD
app.get("/api/trash", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM trash;");
    const parsed = rows.map((row) => ({
      id: row.id,
      type: row.type,
      data: JSON.parse(row.data),
      deleted_at: row.deleted_at,
    }));
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/trash/restore/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const row = await dbGet("SELECT * FROM trash WHERE id=?;", [id]);
    if (!row) {
      return res.status(404).json({ error: "Item not found in trash" });
    }
    const itemData = JSON.parse(row.data);
    if (row.type === "etudiant") {
      await dbRun(
        `INSERT INTO etudiants (id, matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, photo, filiere_id, classe_id, mot_de_passe) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          itemData.id,
          itemData.matricule,
          itemData.nom,
          itemData.prenom,
          itemData.sexe,
          itemData.date_naissance,
          itemData.telephone,
          itemData.email,
          itemData.adresse,
          itemData.photo,
          itemData.filiere_id,
          itemData.classe_id,
          itemData.mot_de_passe,
        ]
      );
    } else if (row.type === "cours") {
      await dbRun(
        `INSERT INTO cours (id, titre, description, fichier, filiere_id, classe_id, semestre_id, enseignant) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [itemData.id, itemData.titre, itemData.description, itemData.fichier, itemData.filiere_id, itemData.classe_id, itemData.semestre_id, itemData.enseignant]
      );
    } else if (row.type === "note") {
      await dbRun(
        `INSERT INTO notes (id, etudiant_id, cours_id, note, coefficient, semestre_id, credits) 
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [itemData.id, itemData.etudiant_id, itemData.cours_id, itemData.note, itemData.coefficient, itemData.semestre_id, itemData.credits]
      );
    } else if (row.type === "filiere") {
      await dbRun(
        `INSERT INTO filieres (id, nom_filiere, description) VALUES (?, ?, ?);`,
        [itemData.id, itemData.nom_filiere, itemData.description]
      );
    } else if (row.type === "semester") {
      await dbRun(
        `INSERT INTO semesters (id, nom_semestre, annee_scolaire, filiere_id) VALUES (?, ?, ?, ?);`,
        [itemData.id, itemData.nom_semestre, itemData.annee_scolaire, itemData.filiere_id]
      );
    } else if (row.type === "paiement") {
      await dbRun(
        `INSERT INTO paiements (id, etudiant_id, montant, date_paiement, type_paiement, recu) VALUES (?, ?, ?, ?, ?, ?);`,
        [itemData.id, itemData.etudiant_id, itemData.montant, itemData.date_paiement, itemData.type_paiement, itemData.recu]
      );
    }

    await dbRun("DELETE FROM trash WHERE id=?;", [id]);
    await logAction("Administrateur", `Restauration d'un élément de type ${row.type} depuis la corbeille.`);
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/trash/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun("DELETE FROM trash WHERE id=?;", [id]);
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static folder
app.use(express.static(path.join(process.cwd(), "public")));

// Fallback to index.html for Single Page App
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// Launch server on Port 3000
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
