import express from "express";
import path from "path";
import fs from "fs";
import initSqlJs from "sql.js";
import { createServer as createViteServer } from "vite";

import { 
  INITIAL_FILIERES, 
  INITIAL_MATIERES, 
  INITIAL_CLASSES, 
  INITIAL_SEMESTRES, 
  INITIAL_ADMINS, 
  INITIAL_ETUDIANTS, 
  INITIAL_COURS, 
  INITIAL_NOTES, 
  INITIAL_AUTORISATIONS, 
  INITIAL_PAIEMENTS 
} from "./src/mockData";

class SqlJsDatabase {
  private db: any;
  private filepath: string;
  private inTransaction: boolean = false;

  constructor(db: any, filepath: string) {
    this.db = db;
    this.filepath = filepath;
  }

  async exec(sql: string) {
    try {
      const sqlUpper = sql.toUpperCase().trim();
      if (sqlUpper.includes("BEGIN TRANSACTION") || sqlUpper.includes("BEGIN")) {
        this.inTransaction = true;
      }

      this.db.exec(sql);

      if (sqlUpper.includes("COMMIT") || sqlUpper.includes("ROLLBACK")) {
        this.inTransaction = false;
      }

      if (!this.inTransaction) {
        this.save();
      }
    } catch (err) {
      console.error("SQL exec error for query:", sql, err);
      throw err;
    }
  }

  async run(sql: string, params: any[] = []) {
    try {
      const sqlUpper = sql.toUpperCase().trim();
      if (sqlUpper.includes("BEGIN TRANSACTION") || sqlUpper.includes("BEGIN")) {
        this.inTransaction = true;
      }

      this.db.run(sql, params);

      if (sqlUpper.includes("COMMIT") || sqlUpper.includes("ROLLBACK")) {
        this.inTransaction = false;
      }

      if (!this.inTransaction) {
        this.save();
      }
    } catch (err) {
      console.error("SQL run error for query:", sql, "with params:", params, err);
      throw err;
    }
  }

  async get(sql: string, params: any[] = []) {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      let result = undefined;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    } catch (err) {
      console.error("SQL get error for query:", sql, "with params:", params, err);
      throw err;
    }
  }

  async all(sql: string, params: any[] = []) {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (err) {
      console.error("SQL all error for query:", sql, "with params:", params, err);
      throw err;
    }
  }

  private save() {
    try {
      const data = this.db.export();
      const tmpPath = this.filepath + ".tmp";
      fs.writeFileSync(tmpPath, Buffer.from(data));
      fs.renameSync(tmpPath, this.filepath);
    } catch (err) {
      console.error("Error saving SQLite database to disk:", err);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large file uploads (e.g., base64 student photos and course files)
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));

  // --- SQLITE DATABASE INITIALIZATION ---
  console.log("Initializing SQLite database 'school.db' using sql.js...");
  const SQL = await initSqlJs();
  const dbFilepath = path.join(process.cwd(), "school.db");
  let rawDb: any;
  let db!: SqlJsDatabase;

  const tryLoadAndInitialize = async (filepath: string): Promise<boolean> => {
    try {
      if (fs.existsSync(filepath)) {
        console.log("Loading existing database file...");
        const fileBuffer = fs.readFileSync(filepath);
        rawDb = new SQL.Database(fileBuffer);
      } else {
        console.log("Creating new empty database...");
        rawDb = new SQL.Database();
      }
      db = new SqlJsDatabase(rawDb, filepath);

      // Verify integrity by running a fast query on SQLite master or creating settings
      await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      return true;
    } catch (err) {
      console.error("Database loading or verification failed:", err);
      return false;
    }
  };

  let initSuccess = await tryLoadAndInitialize(dbFilepath);

  if (!initSuccess) {
    console.warn("⚠️ ALERTE : Le fichier de base de données 'school.db' est corrompu ou illisible (database disk image is malformed).");
    try {
      const backupPath = path.join(process.cwd(), `school.db.corrupted_${Date.now()}`);
      if (fs.existsSync(dbFilepath)) {
        console.log(`Sauvegarde de la base corrompue vers : ${backupPath}`);
        fs.renameSync(dbFilepath, backupPath);
      }
    } catch (backupErr) {
      console.error("Impossible de sauvegarder la base de données corrompue :", backupErr);
    }
    console.log("Création d'une nouvelle base de données SQLite saine...");
    rawDb = new SQL.Database();
    db = new SqlJsDatabase(rawDb, dbFilepath);
  }

  // Create Relational Tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS filieres (
      id INTEGER PRIMARY KEY,
      nom_filiere TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS matieres (
      id INTEGER PRIMARY KEY,
      nom_matiere TEXT,
      code_matiere TEXT,
      credits INTEGER,
      filiere_id INTEGER,
      semestre_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY,
      nom_classe TEXT
    );

    CREATE TABLE IF NOT EXISTS semestres (
      id INTEGER PRIMARY KEY,
      nom_semestre TEXT,
      annee_scolaire TEXT,
      filiere_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS etudiants (
      id INTEGER PRIMARY KEY,
      matricule TEXT UNIQUE,
      nom TEXT,
      prenom TEXT,
      sexe TEXT,
      date_naissance TEXT,
      telephone TEXT,
      email TEXT,
      adresse TEXT,
      photo TEXT,
      filiere_id INTEGER,
      classe_id INTEGER,
      mot_de_passe TEXT,
      lieu_naissance TEXT
    );

    CREATE TABLE IF NOT EXISTS cours (
      id INTEGER PRIMARY KEY,
      titre TEXT,
      description TEXT,
      fichier TEXT,
      filiere_id INTEGER,
      classe_id INTEGER,
      semestre_id INTEGER,
      enseignant TEXT,
      date_ajout TEXT,
      fichierData TEXT,
      fichierTaille TEXT
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY,
      etudiant_id INTEGER,
      cours_id INTEGER,
      semestre_id INTEGER,
      note REAL,
      credits INTEGER,
      date_ajout TEXT,
      note_classe REAL,
      note_examen REAL
    );

    CREATE TABLE IF NOT EXISTS autorisations (
      id INTEGER PRIMARY KEY,
      etudiant_id INTEGER,
      filiere_id INTEGER,
      date_autorisation TEXT,
      autorise_par TEXT
    );

    CREATE TABLE IF NOT EXISTS paiements (
      id INTEGER PRIMARY KEY,
      etudiant_id INTEGER,
      montant REAL,
      date_paiement TEXT,
      type_frais TEXT,
      methode TEXT,
      statut TEXT,
      recu_numero TEXT,
      annee_scolaire TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY,
      nom TEXT,
      email TEXT,
      mot_de_passe TEXT
    );

    CREATE TABLE IF NOT EXISTS trash (
      id TEXT PRIMARY KEY,
      itemType TEXT,
      itemName TEXT,
      originalData TEXT,
      deletedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seeding default data if database is empty
  const filieresCount = await db.get("SELECT COUNT(*) as count FROM filieres");
  if (filieresCount && filieresCount.count === 0) {
    console.log("Database is empty. Seeding default school dataset (800+ students)...");
    await db.exec("BEGIN TRANSACTION");
    try {
      // 1. Filieres
      for (const item of INITIAL_FILIERES) {
        await db.run(
          "INSERT INTO filieres (id, nom_filiere, description) VALUES (?, ?, ?)",
          [item.id, item.nom_filiere, item.description]
        );
      }

      // 2. Matieres
      for (const item of INITIAL_MATIERES) {
        await db.run(
          "INSERT INTO matieres (id, nom_matiere, code_matiere, credits, filiere_id, semestre_id) VALUES (?, ?, ?, ?, ?, ?)",
          [item.id, item.nom_matiere, item.code_matiere, item.credits, item.filiere_id, item.semestre_id || null]
        );
      }

      // 3. Classes
      for (const item of INITIAL_CLASSES) {
        await db.run("INSERT INTO classes (id, nom_classe) VALUES (?, ?)", [item.id, item.nom_classe]);
      }

      // 4. Semestres
      for (const item of INITIAL_SEMESTRES) {
        await db.run(
          "INSERT INTO semestres (id, nom_semestre, annee_scolaire, filiere_id) VALUES (?, ?, ?, ?)",
          [item.id, item.nom_semestre, item.annee_scolaire, item.filiere_id || null]
        );
      }

      // 5. Etudiants
      for (const item of INITIAL_ETUDIANTS) {
        await db.run(
          "INSERT INTO etudiants (id, matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, photo, filiere_id, classe_id, mot_de_passe, lieu_naissance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            item.id,
            item.matricule,
            item.nom,
            item.prenom,
            item.sexe,
            item.date_naissance,
            item.telephone,
            item.email,
            item.adresse,
            item.photo || "",
            item.filiere_id,
            item.classe_id,
            item.mot_de_passe,
            item.lieu_naissance || "",
          ]
        );
      }

      // 6. Cours
      for (const item of INITIAL_COURS) {
        await db.run(
          "INSERT INTO cours (id, titre, description, fichier, filiere_id, classe_id, semestre_id, enseignant, date_ajout, fichierData, fichierTaille) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            item.id,
            item.titre,
            item.description,
            item.fichier,
            item.filiere_id,
            item.classe_id,
            item.semestre_id,
            item.enseignant,
            item.date_ajout,
            item.fichierData || null,
            item.fichierTaille || null,
          ]
        );
      }

      // 7. Notes
      for (const item of INITIAL_NOTES) {
        await db.run(
          "INSERT INTO notes (id, etudiant_id, cours_id, semestre_id, note, credits, date_ajout, note_classe, note_examen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            item.id,
            item.etudiant_id,
            item.cours_id,
            item.semestre_id,
            item.note,
            item.credits,
            item.date_ajout,
            item.note_classe || null,
            item.note_examen || null,
          ]
        );
      }

      // 8. Autorisations
      for (const item of INITIAL_AUTORISATIONS) {
        await db.run(
          "INSERT INTO autorisations (id, etudiant_id, filiere_id, date_autorisation, autorise_par) VALUES (?, ?, ?, ?, ?)",
          [item.id, item.etudiant_id, item.filiere_id, item.date_autorisation, item.autorise_par]
        );
      }

      // 9. Paiements
      for (const item of INITIAL_PAIEMENTS) {
        await db.run(
          "INSERT INTO paiements (id, etudiant_id, montant, date_paiement, type_frais, methode, statut, recu_numero, annee_scolaire, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            item.id,
            item.etudiant_id,
            item.montant,
            item.date_paiement,
            item.type_frais,
            item.methode,
            item.statut,
            item.recu_numero,
            item.annee_scolaire,
            item.notes || "",
          ]
        );
      }

      // 10. Admins
      for (const item of INITIAL_ADMINS) {
        await db.run(
          "INSERT INTO admins (id, nom, email, mot_de_passe) VALUES (?, ?, ?, ?)",
          [item.id, item.nom, item.email, item.mot_de_passe]
        );
      }

      // 11. Settings
      await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('scolarite_annuelle', '1500000')");
      await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('annees_scolaires', ?)", [
        JSON.stringify(["2025-2026", "2026-2027", "2024-2025"]),
      ]);

      await db.exec("COMMIT");
      console.log("Database seeded successfully with 800+ students and all entities!");
    } catch (err) {
      console.error("Critical error while seeding database:", err);
      try {
        await db.exec("ROLLBACK");
      } catch (rollbackErr) {
        console.error("Failed to ROLLBACK seeding transaction:", rollbackErr);
      }
    }
  }

  // --- API ROUTE HANDLERS ---

  // Get all data at once for the initial state of the React application
  app.get("/api/data", async (req, res) => {
    try {
      const filieres = await db.all("SELECT * FROM filieres");
      const matieres = await db.all("SELECT * FROM matieres");
      const classes = await db.all("SELECT * FROM classes");
      const semestres = await db.all("SELECT * FROM semestres");
      const etudiants = await db.all("SELECT * FROM etudiants");
      const cours = await db.all("SELECT * FROM cours");
      const notes = await db.all("SELECT * FROM notes");
      const autorisations = await db.all("SELECT * FROM autorisations");
      const paiements = await db.all("SELECT * FROM paiements");
      const admins = await db.all("SELECT * FROM admins");
      
      const rawTrash = await db.all("SELECT * FROM trash");
      const trash = rawTrash.map(item => ({
        ...item,
        originalData: item.originalData ? JSON.parse(item.originalData) : null
      }));

      const rawSettings = await db.all("SELECT * FROM settings");
      const settingsMap: Record<string, string> = {};
      for (const s of rawSettings) {
        settingsMap[s.key] = s.value;
      }

      const scolarite_annuelle = settingsMap["scolarite_annuelle"] 
        ? Number(settingsMap["scolarite_annuelle"]) 
        : 1500000;

      const annees_scolaires = settingsMap["annees_scolaires"] 
        ? JSON.parse(settingsMap["annees_scolaires"]) 
        : ["2025-2026", "2026-2027", "2024-2025"];

      res.json({
        status: "success",
        data: {
          filieres,
          matieres,
          classes,
          semestres,
          etudiants,
          cours,
          notes,
          autorisations,
          paiements,
          admins,
          trash,
          scolarite_annuelle,
          annees_scolaires
        }
      });
    } catch (err) {
      console.error("Error reading data from SQL database:", err);
      res.status(500).json({ status: "error", message: (err as Error).message });
    }
  });

  // Synchronize fully modified collections atomically inside a SQL transaction
  app.post("/api/save", async (req, res) => {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ status: "error", message: "Payload missing" });
    }

    await db.exec("BEGIN TRANSACTION");
    try {
      // 1. Save Settings
      if (payload.scolarite_annuelle !== undefined) {
        await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('scolarite_annuelle', ?)", [
          String(payload.scolarite_annuelle)
        ]);
      }
      if (payload.annees_scolaires !== undefined) {
        await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('annees_scolaires', ?)", [
          JSON.stringify(payload.annees_scolaires)
        ]);
      }

      // 2. Save Filieres
      if (Array.isArray(payload.filieres)) {
        await db.run("DELETE FROM filieres");
        for (const item of payload.filieres) {
          await db.run(
            "INSERT INTO filieres (id, nom_filiere, description) VALUES (?, ?, ?)",
            [item.id, item.nom_filiere, item.description]
          );
        }
      }

      // 3. Save Matieres
      if (Array.isArray(payload.matieres)) {
        await db.run("DELETE FROM matieres");
        for (const item of payload.matieres) {
          await db.run(
            "INSERT INTO matieres (id, nom_matiere, code_matiere, credits, filiere_id, semestre_id) VALUES (?, ?, ?, ?, ?, ?)",
            [item.id, item.nom_matiere, item.code_matiere, item.credits, item.filiere_id, item.semestre_id || null]
          );
        }
      }

      // 4. Save Classes
      if (Array.isArray(payload.classes)) {
        await db.run("DELETE FROM classes");
        for (const item of payload.classes) {
          await db.run("INSERT INTO classes (id, nom_classe) VALUES (?, ?)", [item.id, item.nom_classe]);
        }
      }

      // 5. Save Semestres
      if (Array.isArray(payload.semestres)) {
        await db.run("DELETE FROM semestres");
        for (const item of payload.semestres) {
          await db.run(
            "INSERT INTO semestres (id, nom_semestre, annee_scolaire, filiere_id) VALUES (?, ?, ?, ?)",
            [item.id, item.nom_semestre, item.annee_scolaire, item.filiere_id || null]
          );
        }
      }

      // 6. Save Etudiants
      if (Array.isArray(payload.etudiants)) {
        await db.run("DELETE FROM etudiants");
        for (const item of payload.etudiants) {
          await db.run(
            "INSERT INTO etudiants (id, matricule, nom, prenom, sexe, date_naissance, telephone, email, adresse, photo, filiere_id, classe_id, mot_de_passe, lieu_naissance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              item.id,
              item.matricule,
              item.nom,
              item.prenom,
              item.sexe,
              item.date_naissance,
              item.telephone,
              item.email,
              item.adresse,
              item.photo || "",
              item.filiere_id,
              item.classe_id,
              item.mot_de_passe,
              item.lieu_naissance || ""
            ]
          );
        }
      }

      // 7. Save Cours
      if (Array.isArray(payload.cours)) {
        await db.run("DELETE FROM cours");
        for (const item of payload.cours) {
          await db.run(
            "INSERT INTO cours (id, titre, description, fichier, filiere_id, classe_id, semestre_id, enseignant, date_ajout, fichierData, fichierTaille) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              item.id,
              item.titre,
              item.description,
              item.fichier,
              item.filiere_id,
              item.classe_id,
              item.semestre_id,
              item.enseignant,
              item.date_ajout,
              item.fichierData || null,
              item.fichierTaille || null
            ]
          );
        }
      }

      // 8. Save Notes
      if (Array.isArray(payload.notes)) {
        await db.run("DELETE FROM notes");
        for (const item of payload.notes) {
          await db.run(
            "INSERT INTO notes (id, etudiant_id, cours_id, semestre_id, note, credits, date_ajout, note_classe, note_examen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              item.id,
              item.etudiant_id,
              item.cours_id,
              item.semestre_id,
              item.note,
              item.credits,
              item.date_ajout,
              item.note_classe || null,
              item.note_examen || null
            ]
          );
        }
      }

      // 9. Save Autorisations
      if (Array.isArray(payload.autorisations)) {
        await db.run("DELETE FROM autorisations");
        for (const item of payload.autorisations) {
          await db.run(
            "INSERT INTO autorisations (id, etudiant_id, filiere_id, date_autorisation, autorise_par) VALUES (?, ?, ?, ?, ?)",
            [item.id, item.etudiant_id, item.filiere_id, item.date_autorisation, item.autorise_par]
          );
        }
      }

      // 10. Save Paiements
      if (Array.isArray(payload.paiements)) {
        await db.run("DELETE FROM paiements");
        for (const item of payload.paiements) {
          await db.run(
            "INSERT INTO paiements (id, etudiant_id, montant, date_paiement, type_frais, methode, statut, recu_numero, annee_scolaire, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              item.id,
              item.etudiant_id,
              item.montant,
              item.date_paiement,
              item.type_frais,
              item.methode,
              item.statut,
              item.recu_numero,
              item.annee_scolaire,
              item.notes || ""
            ]
          );
        }
      }

      // 11. Save Admins
      if (Array.isArray(payload.admins)) {
        await db.run("DELETE FROM admins");
        for (const item of payload.admins) {
          await db.run(
            "INSERT INTO admins (id, nom, email, mot_de_passe) VALUES (?, ?, ?, ?)",
            [item.id, item.nom, item.email, item.mot_de_passe]
          );
        }
      }

      // 12. Save Trash
      if (Array.isArray(payload.trash)) {
        await db.run("DELETE FROM trash");
        for (const item of payload.trash) {
          await db.run(
            "INSERT INTO trash (id, itemType, itemName, originalData, deletedAt) VALUES (?, ?, ?, ?, ?)",
            [item.id, item.itemType, item.itemName, JSON.stringify(item.originalData), item.deletedAt]
          );
        }
      }

      await db.exec("COMMIT");
      res.json({ status: "success" });
    } catch (err) {
      await db.exec("ROLLBACK");
      console.error("Sync error inside SQLite transaction, changes rolled back:", err);
      res.status(500).json({ status: "error", message: (err as Error).message });
    }
  });

  // --- VITE DEV SERVER / PRODUCTION STATIC ASSET MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development mode with Vite HMR integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting production mode. Serving static assets from '/dist'...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=== SQL BACKEND RUNNING ON http://localhost:${PORT} ===`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
