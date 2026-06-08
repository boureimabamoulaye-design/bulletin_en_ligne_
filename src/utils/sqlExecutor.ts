import { Filiere, Matiere, Classe, Semestre, Etudiant, Cours, Note, AutorisationFiliere, HistoriqueAcces, Administrateur, Paiement } from '../types';

export interface SQLResult {
  success: boolean;
  message: string;
  columns?: string[];
  rows?: any[][];
  rowCount?: number;
  timeMs: number;
}

export interface DatabaseState {
  filieres: Filiere[];
  matieres: Matiere[];
  classes: Classe[];
  semestres: Semestre[];
  etudiants: Etudiant[];
  cours: Cours[];
  notes: Note[];
  autorisations: AutorisationFiliere[];
  logs: HistoriqueAcces[];
  admins: Administrateur[];
  paiements: Paiement[];
}

export interface DatabaseSetters {
  setFilieres: (f: Filiere[]) => void;
  setMatieres: (m: Matiere[]) => void;
  setClasses?: (c: Classe[]) => void;
  setSemestres: (s: Semestre[]) => void;
  setEtudiants: (e: Etudiant[]) => void;
  setCours: (c: Cours[]) => void;
  setNotes: (n: Note[]) => void;
  setAutorisations: (a: AutorisationFiliere[]) => void;
  setLogs: (l: HistoriqueAcces[]) => void;
  setAdmins: (ad: Administrateur[]) => void;
  setPaiements?: (p: Paiement[]) => void;
}

// Map logical SQL tables to db keys and schemas
const TABLE_SCHEMA: Record<string, { key: keyof DatabaseState; columns: string[] }> = {
  filieres: { key: 'filieres', columns: ['id', 'nom_filiere', 'description'] },
  matieres: { key: 'matieres', columns: ['id', 'nom_matiere', 'code_matiere', 'credits', 'filiere_id'] },
  classes: { key: 'classes', columns: ['id', 'nom_classe'] },
  semestres: { key: 'semestres', columns: ['id', 'nom_semestre', 'annee_scolaire'] },
  etudiants: { key: 'etudiants', columns: ['id', 'matricule', 'nom', 'prenom', 'sexe', 'date_naissance', 'telephone', 'email', 'adresse', 'filiere_id', 'classe_id', 'mot_de_passe'] },
  cours: { key: 'cours', columns: ['id', 'titre', 'description', 'fichier', 'filiere_id', 'classe_id', 'semestre_id', 'enseignant', 'date_ajout'] },
  notes: { key: 'notes', columns: ['id', 'etudiant_id', 'cours_id', 'semestre_id', 'note', 'note_classe', 'note_examen', 'credits', 'date_ajout'] },
  autorisations: { key: 'autorisations', columns: ['id', 'etudiant_id', 'filiere_id', 'date_autorisation', 'autorise_par'] },
  logs: { key: 'logs', columns: ['id', 'etudiant_id', 'filiere_id', 'date_acces'] },
  historique_acces: { key: 'logs', columns: ['id', 'etudiant_id', 'filiere_id', 'date_acces'] },
  administrateurs: { key: 'admins', columns: ['id', 'nom', 'email', 'mot_de_passe'] },
  admins: { key: 'admins', columns: ['id', 'nom', 'email', 'mot_de_passe'] },
  paiements: { key: 'paiements', columns: ['id', 'etudiant_id', 'montant', 'date_paiement', 'type_frais', 'methode', 'statut', 'recu_numero', 'notes'] },
};

export function executeSQLQuery(
  rawQuery: string,
  db: DatabaseState,
  setters: DatabaseSetters
): SQLResult {
  const startTime = performance.now();
  
  // Basic normalization
  let sql = rawQuery.trim();
  // Remove trailing semicolon if any
  if (sql.endsWith(';')) {
    sql = sql.slice(0, -1).trim();
  }

  const getResult = (success: boolean, message: string, extras?: { columns?: string[]; rows?: any[][] }) => {
    return {
      success,
      message,
      columns: extras?.columns,
      rows: extras?.rows,
      rowCount: extras?.rows ? extras.rows.length : undefined,
      timeMs: Math.round((performance.now() - startTime) * 10) / 10
    };
  };

  try {
    const uppercaseSql = sql.toUpperCase();

    // 1. SHOW TABLES
    if (uppercaseSql === 'SHOW TABLES') {
      const rows = Object.keys(TABLE_SCHEMA).map(table => [table]);
      return getResult(true, "Tables de la base de données récupérées successfully.", {
        columns: ['Tables_in_scolaire_db'],
        rows
      });
    }

    // 2. DESCRIBE or DESC table
    const describeMatch = sql.match(/^(DESCRIBE|DESC)\s+([a-zA-Z0-9_]+)$/i);
    if (describeMatch) {
      const tableName = describeMatch[2].toLowerCase();
      const schema = TABLE_SCHEMA[tableName];
      if (!schema) {
        return getResult(false, `Erreur : La table '${tableName}' n'existe pas.`);
      }
      const rows = schema.columns.map(col => {
        let type = 'VARCHAR(255)';
        if (col === 'id' || col.endsWith('_id') || col === 'credits' || col === 'montant') type = 'INT';
        if (col.startsWith('note')) type = 'DECIMAL(5,2)';
        if (col === 'date_naissance' || col === 'date_ajout' || col === 'date_autorisation' || col === 'date_acces' || col === 'date_paiement') type = 'DATE';
        if (col === 'sexe') type = 'CHAR(1)';
        return [col, type, col === 'id' ? 'PRI' : ''];
      });
      return getResult(true, `Structure de la table '${tableName}'`, {
        columns: ['Champ', 'Type', 'Clé'],
        rows
      });
    }

    // 3. SELECT query
    if (uppercaseSql.startsWith('SELECT')) {
      // Very basic parser for select
      // Regex detects simple selects: SELECT (cols) FROM <table> [WHERE <condition>] [LIMIT <n>]
      // Or detects SELECT with implicit/explicit joins
      
      const selectParts = sql.match(/^SELECT\s+(.*?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:INNER\s+)?JOIN\s+([a-zA-Z0-9_]+)\s+ON\s+(.*?))?(?:\s+WHERE\s+(.*?))?(?:\s+LIMIT\s+(\d+))?$/i);
      
      if (!selectParts) {
        return getResult(false, "Commande SELECT complexe ou non supportée par l'interpréteur de démonstration.");
      }

      const columnsPart = selectParts[1].trim();
      const tableName = selectParts[2].toLowerCase().trim();
      const joinTable = selectParts[3]?.toLowerCase().trim();
      const joinCondition = selectParts[4]?.trim();
      const whereCondition = selectParts[5]?.trim();
      const limitVal = selectParts[6] ? parseInt(selectParts[6], 10) : null;

      const mainSchema = TABLE_SCHEMA[tableName];
      if (!mainSchema) {
        return getResult(false, `Erreur : La table '${tableName}' n'existe pas dans la base.`);
      }

      // Load main table records
      let items = [...(db[mainSchema.key] as any[])];

      // Perform Join (simple support)
      let joinedItems: any[] = [];
      if (joinTable && joinCondition) {
        const joinSchema = TABLE_SCHEMA[joinTable];
        if (!joinSchema) {
          return getResult(false, `Erreur : Impossible de joindre la table '${joinTable}' qui n'existe pas.`);
        }
        const joinSource = db[joinSchema.key] as any[];
        
        // Parse join condition e.g. "etudiants.filiere_id = filieres.id"
        const condMatch = joinCondition.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i);
        if (condMatch) {
          const t1 = condMatch[1].toLowerCase();
          const col1 = condMatch[2].toLowerCase();
          const t2 = condMatch[3].toLowerCase();
          const col2 = condMatch[4].toLowerCase();

          joinedItems = items.map(item1 => {
            const matchRow = joinSource.find(item2 => {
              const val1 = t1 === tableName ? item1[col1] : item2[col1];
              const val2 = t2 === joinTable ? item2[col2] : item1[col2];
              return String(val1) === String(val2);
            });
            
            // Merge attributes with prefixing if duplicated
            const merged: Record<string, any> = {};
            // Main table values
            Object.keys(item1).forEach(k => {
              merged[`${tableName}.${k}`] = item1[k];
              // default backup for simple columns
              if (!merged[k]) merged[k] = item1[k];
            });
            // Joined values
            if (matchRow) {
              Object.keys(matchRow).forEach(k => {
                merged[`${joinTable}.${k}`] = matchRow[k];
                if (!merged[k]) merged[k] = matchRow[k];
              });
            }
            return merged;
          });
        } else {
          return getResult(false, "Syntaxe de jointure non supportée.");
        }
      } else {
        joinedItems = items.map(item1 => {
          const merged: Record<string, any> = {};
          Object.keys(item1).forEach(k => {
            merged[k] = item1[k];
            merged[`${tableName}.${k}`] = item1[k];
          });
          return merged;
        });
      }

      // Filter with WHERE
      let filtered = joinedItems;
      if (whereCondition) {
        // e.g. "id = 3", "matricule = 'ETU001'", "filiere_id = 1", "nom LIKE '%KOU%'"
        // simple evaluation
        const conditionMatch = whereCondition.match(/([a-zA-Z0-9_\.]+)\s*(=|LIKE)\s*(.*)/i);
        if (conditionMatch) {
          const rawCol = conditionMatch[1].trim();
          const op = conditionMatch[2].toUpperCase().trim();
          let rawVal = conditionMatch[3].trim();

          // strip quotes from rawVal
          if ((rawVal.startsWith("'") && rawVal.endsWith("'")) || (rawVal.startsWith('"') && rawVal.endsWith('"'))) {
            rawVal = rawVal.slice(1, -1);
          }

          filtered = joinedItems.filter(row => {
            // resolve actual property
            const rowVal = row[rawCol] !== undefined ? row[rawCol] : row[rawCol.split('.').pop() || ''];
            if (rowVal === undefined) return false;

            if (op === '=') {
              return String(rowVal).toLowerCase() === String(rawVal).toLowerCase();
            } else if (op === 'LIKE') {
              // support '%abc%'
              const searchString = rawVal.replace(/%/g, '').toLowerCase();
              return String(rowVal).toLowerCase().includes(searchString);
            }
            return false;
          });
        } else {
          // Fallback if complicated where condition, don't break, just log
          return getResult(false, `Interpréteur SQL : Filtre WHERE '${whereCondition}' trop complexe.`);
        }
      }

      // Limit
      if (limitVal !== null) {
        filtered = filtered.slice(0, limitVal);
      }

      // Resolve columns to output
      let finalCols: string[] = [];
      if (columnsPart === '*') {
        if (joinTable) {
          // show columns from both
          finalCols = [
            ...mainSchema.columns.map(c => `${tableName}.${c}`),
            ...(TABLE_SCHEMA[joinTable]?.columns.map(c => `${joinTable}.${c}`) || [])
          ];
        } else {
          finalCols = mainSchema.columns;
        }
      } else {
        finalCols = columnsPart.split(',').map(s => s.trim());
      }

      // Map rows to values arrays
      const rows = filtered.map(row => {
        return finalCols.map(col => {
          let val = row[col];
          if (val === undefined) {
            // try by suffix
            val = row[col.split('.').pop() || ''];
          }
          return val !== undefined ? val : null;
        });
      });

      return getResult(true, `Exécuté : ${filtered.length} ligne(s) trouvée(s).`, {
        columns: finalCols,
        rows
      });
    }

    // 4. INSERT INTO table (cols) VALUES (vals)
    if (uppercaseSql.startsWith('INSERT INTO')) {
      const insertMatch = sql.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)$/i);
      if (!insertMatch) {
        return getResult(false, "Syntaxe INSERT INTO invalide ou non reconnue.");
      }

      const tableName = insertMatch[1].toLowerCase().trim();
      const rawCols = insertMatch[2].split(',').map(c => c.trim().toLowerCase());
      const rawValues = insertMatch[3].split(',').map(v => {
        let clean = v.trim();
        if ((clean.startsWith("'") && clean.endsWith("'")) || (clean.startsWith('"') && clean.endsWith('"'))) {
          return clean.slice(1, -1);
        }
        return clean;
      });

      const schema = TABLE_SCHEMA[tableName];
      if (!schema) {
        return getResult(false, `La table '${tableName}' n'existe pas.`);
      }

      if (rawCols.length !== rawValues.length) {
        return getResult(false, "Erreur SQL : Le nombre de valeurs ne correspond pas au nombre de colonnes.");
      }

      // Create new record object
      const newRecord: any = {};
      
      // Determine max id
      const tableData = db[schema.key] as any[];
      const nextId = tableData.length > 0 ? Math.max(...tableData.map((x: any) => x.id)) + 1 : 1;
      newRecord.id = nextId;

      schema.columns.forEach(col => {
        if (col === 'id') return;
        const index = rawCols.indexOf(col.toLowerCase());
        if (index !== -1) {
          const val = rawValues[index];
          // parse numbers
          if (col.endsWith('_id') || col === 'credits' || col === 'montant') {
            newRecord[col] = parseInt(val, 10) || 0;
          } else if (col.startsWith('note')) {
            newRecord[col] = parseFloat(val) || 0;
          } else {
            newRecord[col] = val;
          }
        } else {
          // defaults
          if (col === 'matricule' && tableName === 'etudiants') {
            newRecord[col] = `ETU2026${String(nextId).padStart(4, '0')}`;
          } else if (col === 'date_ajout' || col === 'date_autorisation' || col === 'date_acces' || col === 'date_paiement') {
            newRecord[col] = new Date().toISOString().split('T')[0];
          } else if (col === 'montant') {
            newRecord[col] = 100000;
          } else if (col === 'recu_numero' && tableName === 'paiements') {
            newRecord[col] = `REC-2026-${String(nextId).padStart(3, '0')}`;
          } else if (col === 'statut' && tableName === 'paiements') {
            newRecord[col] = 'Payé';
          } else if (col === 'type_frais' && tableName === 'paiements') {
            newRecord[col] = 'Scolarité';
          } else if (col === 'methode' && tableName === 'paiements') {
            newRecord[col] = 'Mobile Money';
          } else if (col.endsWith('_id') || col === 'credits') {
            newRecord[col] = 1;
          } else if (col.startsWith('note')) {
            newRecord[col] = 0;
          } else {
            newRecord[col] = '';
          }
        }
      });

      // Special action to commit states
      const updatedList = [...tableData, newRecord];
      const setter = setters[`set${schema.key.charAt(0).toUpperCase()}${schema.key.slice(1)}` as keyof DatabaseSetters];
      
      if (setter) {
        setter(updatedList);
        return getResult(true, `Query OK, 1 ligne insérée dans '${tableName}' (id généré : ${nextId}).`);
      } else {
        return getResult(false, `Impossible d'affecter la table '${schema.key}'.`);
      }
    }

    // 5. UPDATE table SET col=val [, col2=val2] [WHERE condition]
    if (uppercaseSql.startsWith('UPDATE')) {
      const updateParts = sql.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.*?)(?:\s+WHERE\s+(.*?))?$/i);
      if (!updateParts) {
        return getResult(false, "Syntaxe de requête UPDATE incorrecte.");
      }

      const tableName = updateParts[1].toLowerCase().trim();
      const rawAssignments = updateParts[2].split(',').map(a => a.trim());
      const whereCondition = updateParts[3]?.trim();

      const schema = TABLE_SCHEMA[tableName];
      if (!schema) {
        return getResult(false, `La table '${tableName}' n'existe pas.`);
      }

      // Parse assignments
      const assignments: Record<string, any> = {};
      rawAssignments.forEach(clause => {
        const parts = clause.split('=');
        if (parts.length === 2) {
          const colName = parts[0].trim();
          let val = parts[1].trim();
          if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
            val = val.slice(1, -1);
          }
          assignments[colName] = val;
        }
      });

      // Parse where
      if (!whereCondition) {
        return getResult(false, "Erreur : La clause WHERE est obligatoire pour les requêtes de mise à jour dans cette console Web.");
      }

      const conditionMatch = whereCondition.match(/([a-zA-Z0-9_]+)\s*=\s*(.*)/i);
      if (!conditionMatch) {
         return getResult(false, "Clause de filtre WHERE non reconnue (seul de type 'colonne = valeur' est supporté).");
      }

      const whereCol = conditionMatch[1].trim();
      let whereVal = conditionMatch[2].trim();
      if ((whereVal.startsWith("'") && whereVal.endsWith("'")) || (whereVal.startsWith('"') && whereVal.endsWith('"'))) {
        whereVal = whereVal.slice(1, -1);
      }

      const tableData = db[schema.key] as any[];
      let affectedCount = 0;

      const updatedList = tableData.map(item => {
        if (String(item[whereCol]).toLowerCase() === String(whereVal).toLowerCase()) {
          affectedCount++;
          const modified = { ...item };
          Object.keys(assignments).forEach(col => {
            const valStr = assignments[col];
            if (col === 'id' || col.endsWith('_id') || col === 'credits' || col === 'montant') {
              modified[col] = parseInt(valStr, 10);
            } else if (col.startsWith('note')) {
              modified[col] = parseFloat(valStr);
            } else {
              modified[col] = valStr;
            }
          });
          return modified;
        }
        return item;
      });

      const setter = setters[`set${schema.key.charAt(0).toUpperCase()}${schema.key.slice(1)}` as keyof DatabaseSetters];
      if (setter) {
        setter(updatedList);
        return getResult(true, `Query OK, ${affectedCount} ligne(s) modifiée(s) dans '${tableName}'.`);
      } else {
        return getResult(false, `Erreur structurelle de mappage de setter.`);
      }
    }

    // 6. DELETE FROM table [WHERE condition]
    if (uppercaseSql.startsWith('DELETE FROM')) {
      const deleteParts = sql.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.*?))?$/i);
      if (!deleteParts) {
        return getResult(false, "Syntaxe DELETE FROM invalide ou non supportée.");
      }

      const tableName = deleteParts[1].toLowerCase().trim();
      const whereCondition = deleteParts[2]?.trim();

      const schema = TABLE_SCHEMA[tableName];
      if (!schema) {
        return getResult(false, `La table '${tableName}' n'existe pas.`);
      }

      if (!whereCondition) {
        return getResult(false, "Mise en garde de sécurité : La clause WHERE est obligatoire pour supprimer des lignes.");
      }

      const conditionMatch = whereCondition.match(/([a-zA-Z0-9_]+)\s*=\s*(.*)/i);
      if (!conditionMatch) {
         return getResult(false, "Clause WHERE non reconnue ou trop complexe.");
      }

      const whereCol = conditionMatch[1].trim();
      let whereVal = conditionMatch[2].trim();
      if ((whereVal.startsWith("'") && whereVal.endsWith("'")) || (whereVal.startsWith('"') && whereVal.endsWith('"'))) {
        whereVal = whereVal.slice(1, -1);
      }

      const tableData = db[schema.key] as any[];
      const preCount = tableData.length;
      
      const updatedList = tableData.filter(item => {
        return String(item[whereCol]).toLowerCase() !== String(whereVal).toLowerCase();
      });

      const affectedCount = preCount - updatedList.length;

      const setter = setters[`set${schema.key.charAt(0).toUpperCase()}${schema.key.slice(1)}` as keyof DatabaseSetters];
      if (setter) {
        setter(updatedList);
        return getResult(true, `Query OK, ${affectedCount} ligne(s) supprimée(s) de '${tableName}'.`);
      } else {
        return getResult(false, "Erreur interne lors de la mise à jour de la mémoire.");
      }
    }

    return getResult(false, "Requête non supportée ou commande SQL inconnue (Mots clés reconnus : SHOW TABLES, DESCRIBE, SELECT, INSERT, UPDATE, DELETE).");

  } catch (err: any) {
    return getResult(false, `Erreur lors de la compilation SQL : ${err?.message || err}`);
  }
}
