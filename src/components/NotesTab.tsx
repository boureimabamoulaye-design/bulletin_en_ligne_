import React, { useState, useEffect } from 'react';
import { Note, Etudiant, Cours, Semestre, Matiere, Filiere } from '../types';
import { 
  Plus, Award, Trash2, ShieldAlert, Search, User, 
  BookOpen, Layers, Save, CheckCircle, GraduationCap, Clock 
} from 'lucide-react';

const getValidationInfo = (valStr: string, adminTheme: string = 'sombre-or') => {
  const trimmed = valStr.trim();
  const isDark = adminTheme === 'sombre-or';
  if (trimmed === "") {
    return {
      isValid: true,
      className: isDark 
        ? "border-[#23273e] bg-[#0d1021] text-white focus:border-[#c5a880] focus:ring-[#c5a880]/20 font-medium text-sm shadow-inner"
        : "border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-blue-500/20 font-medium text-sm shadow-sm",
      helperText: "",
      isError: false
    };
  }
  const num = parseFloat(trimmed);
  if (isNaN(num)) {
    return {
      isValid: false,
      className: isDark 
        ? "!border-rose-500 !bg-rose-950/40 !text-rose-200 focus:!ring-rose-500/20 shadow-sm shadow-rose-900/30 animate-pulse font-bold text-sm"
        : "!border-rose-500 !bg-rose-50 !text-rose-700 focus:!ring-rose-500/20 shadow-xs animate-pulse font-bold text-sm",
      helperText: "Format invalide",
      isError: true
    };
  }
  if (num < 0 || num > 20) {
    return {
      isValid: false,
      className: isDark
        ? "!border-rose-500 !bg-rose-950/40 !text-rose-200 focus:!ring-rose-500/20 shadow-sm shadow-rose-900/30 font-bold text-sm"
        : "!border-rose-500 !bg-rose-50 !text-rose-700 focus:!ring-rose-500/20 shadow-xs font-bold text-sm",
      helperText: "Hors intervalle (0-20)",
      isError: true
    };
  }
  return {
    isValid: true,
    className: isDark
      ? "!border-emerald-500 !bg-emerald-950/40 !text-emerald-300 focus:!ring-emerald-500/20 font-bold text-sm shadow-xs"
      : "!border-emerald-500 !bg-emerald-50 !text-emerald-700 focus:!ring-emerald-500/20 font-bold text-sm shadow-xs",
    helperText: "Valide ✓",
    isError: false
  };
};

interface NotesTabProps {
  notes: Note[];
  etudiants: Etudiant[];
  cours: Cours[];
  semestres: Semestre[];
  matieres: Matiere[];
  filieres: Filiere[];
  onAddNote: (note: Omit<Note, 'id' | 'date_ajout'>) => void;
  onAddNotes: (notesData: {
    etudiant_id: number;
    semestre_id: number;
    credits: number;
    note: number;
    note_classe: number;
    note_examen: number;
    matiere_nom: string;
    matiere_code: string;
  }[]) => void;
  onDeleteNote: (id: number) => void;
  onAddCours: (course: Omit<Cours, 'id' | 'date_ajout'>) => void;
  globalFiliereId?: number;
  globalSemestreId?: number;
  onSemestreChange?: (id: number) => void;
  onFiliereChange?: (id: number) => void;
  adminTheme?: string;
}

export default function NotesTab({ 
  notes, 
  etudiants, 
  cours, 
  semestres, 
  matieres, 
  filieres,
  onAddNote, 
  onAddNotes,
  onDeleteNote,
  onAddCours,
  globalFiliereId,
  globalSemestreId,
  onSemestreChange,
  onFiliereChange,
  adminTheme = 'sombre-or'
}: NotesTabProps) {
  // --- STATES ---
  const [localFiliereId, setLocalFiliereId] = useState<number>(filieres[0]?.id || 0);
  const [matriculeQuery, setMatriculeQuery] = useState("");
  const [searchedStudent, setSearchedStudent] = useState<Etudiant | null>(null);
  const [searchHasBeenRun, setSearchHasBeenRun] = useState(false);
  const [localSemesterId, setLocalSemesterId] = useState<number>(semestres[0]?.id || 0);

  const selectedFiliereId = globalFiliereId && globalFiliereId > 0 ? globalFiliereId : localFiliereId;
  const selectedSemesterId = globalSemestreId && globalSemestreId > 0 ? globalSemestreId : localSemesterId;

  // Auto-sync local semester when selected filiere changes
  useEffect(() => {
    if (selectedFiliereId > 0) {
      const filtered = semestres.filter(s => !s.filiere_id || Number(s.filiere_id) === Number(selectedFiliereId));
      if (filtered.length > 0) {
        if (!filtered.some(s => s.id === localSemesterId)) {
          setLocalSemesterId(filtered[0].id);
        }
      }
    }
  }, [selectedFiliereId, semestres, localSemesterId]);

  // --- MULTI-ENTRY STATES ---
  const [entryMode, setEntryMode] = useState<'individual' | 'collective' | 'grid' | 'bulletin' | 'paste'>('grid');

  // Collective Saisie states
  const [collectiveMatiereId, setCollectiveMatiereId] = useState<number>(0);
  const [collectiveGrades, setCollectiveGrades] = useState<Record<number, { note_classe: string; note_examen: string }>>({});

  // Grid Saisie states
  const [gridGrades, setGridGrades] = useState<Record<string, { note_classe: string; note_examen: string }>>({});
  const [gridSubMode, setGridSubMode] = useState<'card' | 'matrix'>('card');
  const [gridActiveStudentIndex, setGridActiveStudentIndex] = useState<number>(0);
  const [gridCardLayout, setGridCardLayout] = useState<'single' | 'all'>('single');

  // Reset active student index when filiere changes
  useEffect(() => {
    setGridActiveStudentIndex(0);
  }, [selectedFiliereId]);

  // Bulletin Saisie states
  const [bulletinEtudiantId, setBulletinEtudiantId] = useState<number>(0);
  const [bulletinGrades, setBulletinGrades] = useState<Record<number, { note_classe: string; note_examen: string }>>({});

  // Paste Saisie states
  const [pasteMatiereId, setPasteMatiereId] = useState<number>(0);
  const [pasteText, setPasteText] = useState<string>("");
  const [pasteAnalyzedRows, setPasteAnalyzedRows] = useState<{
    id: number;
    matricule: string;
    studentName: string;
    studentId?: number;
    noteClasse: string;
    noteExamen: string;
    isValid: boolean;
    errorReason?: string;
  }[]>([]);

  // Sync default subjects for collective/paste modes
  useEffect(() => {
    const list = matieres.filter(m => 
      Number(m.filiere_id) === Number(selectedFiliereId) &&
      (!m.semestre_id || Number(m.semestre_id) === Number(selectedSemesterId))
    );
    if (list.length > 0) {
      if (!list.some(m => m.id === collectiveMatiereId)) {
        setCollectiveMatiereId(list[0].id);
      }
      if (!list.some(m => m.id === pasteMatiereId)) {
        setPasteMatiereId(list[0].id);
      }
    } else {
      setCollectiveMatiereId(0);
      setPasteMatiereId(0);
    }
  }, [selectedFiliereId, selectedSemesterId, matieres, collectiveMatiereId, pasteMatiereId]);

  // Load existing grades into the Grid on selection change
  useEffect(() => {
    if (entryMode === 'grid' && selectedFiliereId > 0) {
      const initialGrid: Record<string, { note_classe: string; note_examen: string }> = {};
      const fStudents = etudiants.filter(e => Number(e.filiere_id) === Number(selectedFiliereId));
      const fMatieres = matieres.filter(m => 
        Number(m.filiere_id) === Number(selectedFiliereId) &&
        (!m.semestre_id || Number(m.semestre_id) === Number(selectedSemesterId))
      );

      fStudents.forEach(st => {
        fMatieres.forEach(m => {
          const existing = notes.find(n => 
            Number(n.etudiant_id) === Number(st.id) &&
            Number(n.semestre_id) === Number(selectedSemesterId) &&
            cours.find(c => c.id === n.cours_id)?.titre === m.nom_matiere
          );
          initialGrid[`${st.id}_${m.id}`] = {
            note_classe: existing?.note_classe !== undefined ? existing.note_classe.toString() : "",
            note_examen: existing?.note_examen !== undefined ? existing.note_examen.toString() : ""
          };
        });
      });
      setGridGrades(initialGrid);
    }
  }, [entryMode, selectedFiliereId, selectedSemesterId, notes, etudiants, matieres, cours]);

  // Load existing grades into the Bulletin on student selection change
  useEffect(() => {
    if (entryMode === 'bulletin' && bulletinEtudiantId > 0) {
      const student = etudiants.find(e => Number(e.id) === Number(bulletinEtudiantId));
      if (student) {
        const studentFiliereId = Number(student.filiere_id);
        const fMatieres = matieres.filter(m => 
          Number(m.filiere_id) === studentFiliereId &&
          (!m.semestre_id || Number(m.semestre_id) === Number(selectedSemesterId))
        );

        const initialBulletin: Record<number, { note_classe: string; note_examen: string }> = {};
        fMatieres.forEach(m => {
          const existing = notes.find(n => 
            Number(n.etudiant_id) === Number(bulletinEtudiantId) &&
            Number(n.semestre_id) === Number(selectedSemesterId) &&
            cours.find(c => c.id === n.cours_id)?.titre === m.nom_matiere
          );
          initialBulletin[m.id] = {
            note_classe: existing?.note_classe !== undefined ? existing.note_classe.toString() : "",
            note_examen: existing?.note_examen !== undefined ? existing.note_examen.toString() : ""
          };
        });
        setBulletinGrades(initialBulletin);
      }
    }
  }, [entryMode, bulletinEtudiantId, selectedSemesterId, notes, etudiants, matieres, cours]);

  const handleSwitchMode = (mode: 'individual' | 'collective' | 'grid' | 'bulletin' | 'paste') => {
    setEntryMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setMatriculeError("");
    setSearchedStudent(null);
    setSearchHasBeenRun(false);
    setGradesInput({});
    setCollectiveGrades({});
    setGridGrades({});
    setBulletinEtudiantId(0);
    setBulletinGrades({});
    setPasteText("");
    setPasteAnalyzedRows([]);
  };

  // States to keep class/exam scores for loaded subjects
  // Key represents matiere.id
  const [gradesInput, setGradesInput] = useState<Record<number, { note_classe: string; note_examen: string }>>({});
  const [matriculeError, setMatriculeError] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Real-time Credit status list states
  const [creditSearchQuery, setCreditSearchQuery] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState<Record<number, boolean>>({});

  const hasValidationErrors = Object.values(gradesInput).some((input: any) => {
    if (input.note_classe && input.note_classe.trim() !== "") {
      const cc = parseFloat(input.note_classe);
      if (isNaN(cc) || cc < 0 || cc > 20) return true;
    }
    if (input.note_examen && input.note_examen.trim() !== "") {
      const ds = parseFloat(input.note_examen);
      if (isNaN(ds) || ds < 0 || ds > 20) return true;
    }
    return false;
  });

  // Collective submit action handler
  const handleCollectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const activeMatiere = matieres.find(m => m.id === collectiveMatiereId);
    if (!activeMatiere) {
      setErrorMessage("Veuillez sélectionner une matière d'abord.");
      return;
    }

    const collectiveStudents = etudiants.filter(stud => Number(stud.filiere_id) === Number(selectedFiliereId));
    if (collectiveStudents.length === 0) {
      setErrorMessage("Aucun étudiant inscrit dans cette filière.");
      return;
    }

    const gradesToSubmit: {
      etudiant_id: number;
      semestre_id: number;
      credits: number;
      note: number;
      note_classe: number;
      note_examen: number;
      matiere_nom: string;
      matiere_code: string;
    }[] = [];

    let hasFormatError = false;
    let entriesCount = 0;

    collectiveStudents.forEach(st => {
      const input = collectiveGrades[st.id];
      if (!input) return;

      const ccTrimmed = input.note_classe.trim();
      const examTrimmed = input.note_examen.trim();

      // Skip row if both are empty
      if (ccTrimmed === "" && examTrimmed === "") {
        return;
      }

      const cc = parseFloat(ccTrimmed);
      const ds = parseFloat(examTrimmed);

      if (isNaN(cc) || cc < 0 || cc > 20 || isNaN(ds) || ds < 0 || ds > 20) {
        hasFormatError = true;
        return;
      }

      const weightedScore = (cc * 0.4) + (ds * 0.6);
      entriesCount++;

      gradesToSubmit.push({
        etudiant_id: st.id,
        semestre_id: selectedSemesterId,
        credits: activeMatiere.credits,
        note: Number(weightedScore.toFixed(2)),
        note_classe: cc,
        note_examen: ds,
        matiere_nom: activeMatiere.nom_matiere,
        matiere_code: activeMatiere.code_matiere
      });
    });

    if (hasFormatError) {
      setErrorMessage("Erreur de saisie : Toutes les notes saisies doivent être des nombres valides compris entre 0 et 20 (ou laisser les deux cases vides pour ignorer un étudiant).");
      return;
    }

    if (entriesCount === 0) {
      setErrorMessage("Aucune note n'a été saisie dans la grille.");
      return;
    }

    onAddNotes(gradesToSubmit);

    // Reset collective state
    setCollectiveGrades({});
    setSuccessMessage(`Félicitations ! Un lot de ${entriesCount} note(s) a été enregistré de façon collective pour la matière "${activeMatiere.nom_matiere}" avec succès.`);
  };

  // Grid submit action handler
  const handleGridSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fStudents = etudiants.filter(stud => Number(stud.filiere_id) === Number(selectedFiliereId));
    const fMatieres = matieres.filter(m => 
      Number(m.filiere_id) === Number(selectedFiliereId) &&
      (!m.semestre_id || Number(m.semestre_id) === Number(selectedSemesterId))
    );

    if (fStudents.length === 0 || fMatieres.length === 0) {
      setErrorMessage("Aucun étudiant ou aucune matière à enregistrer.");
      return;
    }

    const gradesToSubmit: {
      etudiant_id: number;
      semestre_id: number;
      credits: number;
      note: number;
      note_classe: number;
      note_examen: number;
      matiere_nom: string;
      matiere_code: string;
    }[] = [];

    let hasFormatError = false;
    let entriesCount = 0;

    fStudents.forEach(st => {
      fMatieres.forEach(m => {
        const input = gridGrades[`${st.id}_${m.id}`];
        if (!input) return;

        const ccTrimmed = input.note_classe.trim();
        const examTrimmed = input.note_examen.trim();

        // Skip cell if both are empty
        if (ccTrimmed === "" && examTrimmed === "") {
          return;
        }

        const cc = parseFloat(ccTrimmed);
        const ds = parseFloat(examTrimmed);

        if (isNaN(cc) || cc < 0 || cc > 20 || isNaN(ds) || ds < 0 || ds > 20) {
          hasFormatError = true;
          return;
        }

        // Check if unchanged from existing notes to optimize
        const existing = notes.find(n => 
          Number(n.etudiant_id) === Number(st.id) &&
          Number(n.semestre_id) === Number(selectedSemesterId) &&
          cours.find(c => c.id === n.cours_id)?.titre === m.nom_matiere
        );

        if (existing && existing.note_classe === cc && existing.note_examen === ds) {
          return;
        }

        const weightedScore = (cc * 0.4) + (ds * 0.6);
        entriesCount++;

        gradesToSubmit.push({
          etudiant_id: st.id,
          semestre_id: selectedSemesterId,
          credits: m.credits,
          note: Number(weightedScore.toFixed(2)),
          note_classe: cc,
          note_examen: ds,
          matiere_nom: m.nom_matiere,
          matiere_code: m.code_matiere
        });
      });
    });

    if (hasFormatError) {
      setErrorMessage("Erreur de saisie : Toutes les notes saisies doivent être des nombres valides compris entre 0 et 20.");
      return;
    }

    if (entriesCount === 0) {
      setErrorMessage("Aucun changement de note détecté dans la grille globale.");
      return;
    }

    onAddNotes(gradesToSubmit);
    setSuccessMessage(`Félicitations ! Un lot de ${entriesCount} note(s) a été enregistré ou mis à jour avec succès dans la grille globale.`);
  };

  // Bulletin submit action handler
  const handleBulletinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const student = etudiants.find(stud => Number(stud.id) === Number(bulletinEtudiantId));
    if (!student) {
      setErrorMessage("Veuillez sélectionner un étudiant.");
      return;
    }

    const studentFiliereId = Number(student.filiere_id);
    const fMatieres = matieres
      .filter(m => 
        Number(m.filiere_id) === studentFiliereId &&
        (!m.semestre_id || Number(m.semestre_id) === Number(selectedSemesterId))
      )
      .sort((a, b) => a.nom_matiere.localeCompare(b.nom_matiere));

    if (fMatieres.length === 0) {
      setErrorMessage("Aucune matière n'est disponible pour la filière de cet étudiant.");
      return;
    }

    const gradesToSubmit: {
      etudiant_id: number;
      semestre_id: number;
      credits: number;
      note: number;
      note_classe: number;
      note_examen: number;
      matiere_nom: string;
      matiere_code: string;
    }[] = [];

    let hasFormatError = false;
    let entriesCount = 0;

    fMatieres.forEach(m => {
      const input = bulletinGrades[m.id];
      if (!input) return;

      const ccTrimmed = input.note_classe.trim();
      const examTrimmed = input.note_examen.trim();

      // Skip if empty
      if (ccTrimmed === "" && examTrimmed === "") {
        return;
      }

      const cc = parseFloat(ccTrimmed);
      const ds = parseFloat(examTrimmed);

      if (isNaN(cc) || cc < 0 || cc > 20 || isNaN(ds) || ds < 0 || ds > 20) {
        hasFormatError = true;
        return;
      }

      // Check if unchanged
      const existing = notes.find(n => 
        Number(n.etudiant_id) === Number(bulletinEtudiantId) &&
        Number(n.semestre_id) === Number(selectedSemesterId) &&
        cours.find(c => c.id === n.cours_id)?.titre === m.nom_matiere
      );

      if (existing && existing.note_classe === cc && existing.note_examen === ds) {
        return;
      }

      const weightedScore = (cc * 0.4) + (ds * 0.6);
      entriesCount++;

      gradesToSubmit.push({
        etudiant_id: Number(bulletinEtudiantId),
        semestre_id: selectedSemesterId,
        credits: m.credits,
        note: Number(weightedScore.toFixed(2)),
        note_classe: cc,
        note_examen: ds,
        matiere_nom: m.nom_matiere,
        matiere_code: m.code_matiere
      });
    });

    if (hasFormatError) {
      setErrorMessage("Erreur de saisie : Toutes les notes saisies doivent être des nombres valides compris entre 0 et 20.");
      return;
    }

    if (entriesCount === 0) {
      setErrorMessage("Aucun changement détecté dans le bulletin de cet étudiant.");
      return;
    }

    onAddNotes(gradesToSubmit);
    setSuccessMessage(`Félicitations ! Le bulletin de l'étudiant "${student.nom} ${student.prenom}" a été enregistré ou mis à jour avec ${entriesCount} note(s) avec succès.`);
  };

  // Parser of bulk pasted table rows
  const handleAnalyzePaste = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPasteAnalyzedRows([]);

    if (!pasteText.trim()) {
      setErrorMessage("Veuillez coller du texte contenant des notes d'abord dans l'espace fourni.");
      return;
    }

    const selectedMatiere = matieres.find(m => m.id === pasteMatiereId);
    if (!selectedMatiere) {
      setErrorMessage("Veuillez d'abord sélectionner la matière d'importation correspondante.");
      return;
    }

    const lines = pasteText.split(/\r?\n/);
    const rows: typeof pasteAnalyzedRows = [];
    let lineId = 1;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // skip completely empty rows

      // Delimiters can be Tab, Semicolon, Comma, or space sequence
      const parts = trimmedLine.split(/[\t;,]/);
      
      const rawMatricule = parts[0]?.trim() || "";
      const rawCC = parts[1]?.trim() || "";
      const rawDS = parts[2]?.trim() || "";

      if (!rawMatricule) {
        rows.push({
          id: lineId++,
          matricule: "Incomplet/Manquant",
          studentName: "Inconnu",
          noteClasse: rawCC,
          noteExamen: rawDS,
          isValid: false,
          errorReason: "Format ligne incorrect (Matricule manquant)"
        });
        return;
      }

      // Check student
      const student = etudiants.find(e => e.matricule.trim().toUpperCase() === rawMatricule.toUpperCase());
      if (!student) {
        rows.push({
          id: lineId++,
          matricule: rawMatricule,
          studentName: "Élève non trouvé",
          noteClasse: rawCC,
          noteExamen: rawDS,
          isValid: false,
          errorReason: `Aucun élève identifié avec le matricule "${rawMatricule}"`
        });
        return;
      }

      // Check student's filiere belongs to selectedFiliereId
      if (student.filiere_id !== selectedFiliereId) {
        const studentFiliereName = filieres.find(f => f.id === student.filiere_id)?.nom_filiere || "Inconnue";
        rows.push({
          id: lineId++,
          matricule: rawMatricule,
          studentName: `${student.nom} ${student.prenom}`,
          studentId: student.id,
          noteClasse: rawCC,
          noteExamen: rawDS,
          isValid: false,
          errorReason: `Est rattaché(e) à la filière "${studentFiliereName}" au lieu de la filière active.`
        });
        return;
      }

      // Validate grades formats
      const cc = parseFloat(rawCC);
      const ds = parseFloat(rawDS);

      if (isNaN(cc) || cc < 0 || cc > 20 || isNaN(ds) || ds < 0 || ds > 20) {
        rows.push({
          id: lineId++,
          matricule: rawMatricule,
          studentName: `${student.nom} ${student.prenom}`,
          studentId: student.id,
          noteClasse: rawCC,
          noteExamen: rawDS,
          isValid: false,
          errorReason: "Note(s) hors limites (0-20) ou non-numériques"
        });
        return;
      }

      // Valid entry!
      rows.push({
        id: lineId++,
        matricule: rawMatricule,
        studentName: `${student.nom} ${student.prenom}`,
        studentId: student.id,
        noteClasse: cc.toString(),
        noteExamen: ds.toString(),
        isValid: true
      });
    });

    setPasteAnalyzedRows(rows);
    if (rows.length === 0) {
      setErrorMessage("Échec d'analyse : Aucun enregistrement lisible n'a été détecté.");
    }
  };

  const handleConfirmPasteImport = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const selectedMatiere = matieres.find(m => m.id === pasteMatiereId);
    if (!selectedMatiere) return;

    const validRows = pasteAnalyzedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage("Opération impossible : Aucune ligne de note valide n'a été identifiée pour l'enregistrement.");
      return;
    }

    const gradesToSubmit = validRows.map(r => {
      const cc = parseFloat(r.noteClasse);
      const ds = parseFloat(r.noteExamen);
      const weightedScore = (cc * 0.4) + (ds * 0.6);

      return {
        etudiant_id: r.studentId!,
        semestre_id: selectedSemesterId,
        credits: selectedMatiere.credits,
        note: Number(weightedScore.toFixed(2)),
        note_classe: cc,
        note_examen: ds,
        matiere_nom: selectedMatiere.nom_matiere,
        matiere_code: selectedMatiere.code_matiere
      };
    });

    onAddNotes(gradesToSubmit);
    setSuccessMessage(`Succès ! Un lot de ${gradesToSubmit.length} note(s) a été importé avec succès pour le cours "${selectedMatiere.nom_matiere}".`);
    setPasteText("");
    setPasteAnalyzedRows([]);
  };

  // Search/Load student from matricule
  const handleLoadStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setMatriculeError("");
    setErrorMessage(null);
    setSuccessMessage(null);
    setSearchHasBeenRun(true);

    if (!selectedFiliereId) {
      setMatriculeError("Veuillez sélectionner une filière d'abord.");
      setSearchedStudent(null);
      return;
    }

    const match = etudiants.find(
      e => e.matricule.trim().toUpperCase() === matriculeQuery.trim().toUpperCase()
    );

    if (match) {
      if (match.filiere_id !== selectedFiliereId) {
        const expectedFiliereObj = filieres.find(f => f.id === match.filiere_id);
        const selectedFiliereObj = filieres.find(f => f.id === selectedFiliereId);
        setSearchedStudent(null);
        setMatriculeError(
          `L'étudiant avec le matricule "${matriculeQuery}" est officiellement inscrit en "${expectedFiliereObj ? expectedFiliereObj.nom_filiere : 'Inconnue'}" et non en "${selectedFiliereObj ? selectedFiliereObj.nom_filiere : 'Inconnue'}". Veuillez sélectionner sa filière correcte.`
        );
        return;
      }

      setSearchedStudent(match);
      // Retrieve subjects of their filiere and selected semester, and reset grade input map
      const studentMatieres = matieres.filter(
        m => Number(m.filiere_id) === Number(selectedFiliereId) && 
        Number(m.semestre_id) === Number(selectedSemesterId)
      );
      
      if (studentMatieres.length === 0) {
        setMatriculeError(`Aucune matière n'est configurée pour la filière et le semestre sélectionnés. Veuillez d'abord en ajouter dans l'onglet Filières & Matières !`);
        setSearchedStudent(null);
        return;
      }

      const initialGrades: Record<number, { note_classe: string; note_examen: string }> = {};
      studentMatieres.forEach(m => {
        initialGrades[m.id] = { note_classe: "", note_examen: "" };
      });
      setGradesInput(initialGrades);
    } else {
      setSearchedStudent(null);
      setMatriculeError(`Aucun étudiant trouvé avec le matricule "${matriculeQuery}".`);
    }
  };

  // Live calculated final grade for a given subject
  const calculateLiveWeighted = (noteClasseStr: string, noteExamenStr: string) => {
    const cc = parseFloat(noteClasseStr);
    const ds = parseFloat(noteExamenStr);

    if (isNaN(cc) && isNaN(ds)) return null;
    
    const validCC = isNaN(cc) ? 0 : cc;
    const validDS = isNaN(ds) ? 0 : ds;

    // Weight formula: Class Grade counts for 40%, Exam Grade counts for 60%
    return (validCC * 0.4) + (validDS * 0.6);
  };

  // Batch insert class/exam notes for loaded matricule
  const handleSyllabusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!searchedStudent) return;

    const studentMatieres = matieres.filter(
      m => Number(m.filiere_id) === Number(searchedStudent.filiere_id) &&
      Number(m.semestre_id) === Number(selectedSemesterId)
    );
    const gradesToSubmit: {
      etudiant_id: number;
      semestre_id: number;
      credits: number;
      note: number;
      note_classe: number;
      note_examen: number;
      matiere_nom: string;
      matiere_code: string;
    }[] = [];

    let hasInvalidNumbers = false;
    let entriesFound = false;

    studentMatieres.forEach(m => {
      const inputs = gradesInput[m.id];
      if (inputs && (inputs.note_classe.trim() !== "" || inputs.note_examen.trim() !== "")) {
        const cc = parseFloat(inputs.note_classe);
        const ds = parseFloat(inputs.note_examen);

        if (isNaN(cc) || cc < 0 || cc > 20 || isNaN(ds) || ds < 0 || ds > 20) {
          hasInvalidNumbers = true;
          return;
        }

        const weightedScore = (cc * 0.4) + (ds * 0.6);
        entriesFound = true;

        gradesToSubmit.push({
          etudiant_id: searchedStudent.id,
          semestre_id: selectedSemesterId,
          credits: m.credits,
          note: Number(weightedScore.toFixed(2)),
          note_classe: cc,
          note_examen: ds,
          matiere_nom: m.nom_matiere,
          matiere_code: m.code_matiere
        });
      }
    });

    if (hasInvalidNumbers) {
      setErrorMessage("Erreur de validation : Toutes les notes saisies (de classe et d'examen) doivent être de vrais nombres compris entre 0 et 20.");
      return;
    }

    if (!entriesFound) {
      setErrorMessage("Veuillez saisir au moins des notes de classe et d'examen pour une matière.");
      return;
    }

    // Call batched state addition
    onAddNotes(gradesToSubmit);

    // Reset everything
    setSearchedStudent(null);
    setMatriculeQuery("");
    setSearchHasBeenRun(false);
    setGradesInput({});
    setSuccessMessage(`Félicitations ! Les devoirs et évaluations de l'étudiant ont été enregistrés et pondérés à 40% (classe) et 60% (examen) avec succès.`);
  };

  return (
    <div className="space-y-6" id="notes-management-container">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-150">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#c5a880] bg-[#c5a880]/10 px-2.5 py-1 rounded-md border border-[#c5a880]/20">
            Saisie & Évaluation Académique
          </span>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Saisissez les notes de contrôles continus et d'examens directement via la grille globale.</p>
        </div>
      </div>

      {/* Primary Grid View: Saisie Left, Logs Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE WORKFLOW (Full 12 columns for maximum screen coverage) */}
        <div className="xl:col-span-12">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6" id="matricule-syllabus-card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-900" />
                <div>
                  <h3 className="font-bold text-gray-950 text-sm">Saisie et Acquisition des Notes</h3>
                  <p className="text-[11px] text-gray-400">Pondération LMD de classe (40%) et d'examen (60%)</p>
                </div>
              </div>
              
              {/* Saisie par Grille unique */}
              <div className="flex items-center gap-1.5 bg-slate-100 py-1 px-3.5 rounded-lg border border-gray-200 text-[11px] font-black text-slate-800 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Grille Globale (Multi-Matières)
              </div>
            </div>

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">{successMessage}</span>
              </div>
            )}

            {/* --- MODE 1: INDIVIDUEL PAR ELEVE --- */}
            {entryMode === 'individual' && (
              <>
                {/* Matricule Entry Search Bar with Filiere selector */}
                <form onSubmit={handleLoadStudent} className="bg-slate-50 p-5 rounded-xl border border-gray-250 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Filière select dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Filière Académique *</label>
                      <select 
                        value={selectedFiliereId} 
                        onChange={e => {
                          const val = Number(e.target.value);
                          if (onFiliereChange) {
                            onFiliereChange(val);
                          } else {
                            setLocalFiliereId(val);
                          }
                          // Reset search status on filière change
                          setSearchedStudent(null);
                          setSearchHasBeenRun(false);
                          setMatriculeError("");
                        }}
                        className="form-control text-xs w-full py-2 px-3 focus:ring-1 focus:ring-blue-500 bg-white font-bold"
                        required
                      >
                        <option value="">Sélectionner une filière...</option>
                        {filieres.map(f => (
                          <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                        ))}
                      </select>
                    </div>

                    {/* Matricule input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Matricule de l'élève *</label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        <input 
                          type="text"
                          placeholder="Ex: ETU20250001"
                          value={matriculeQuery}
                          onChange={e => {
                            setMatriculeQuery(e.target.value);
                            // Reset current loaded state on edit
                            setSearchedStudent(null);
                            setSearchHasBeenRun(false);
                            setMatriculeError("");
                          }}
                          className="form-control pl-9 pr-4 py-2 w-full font-mono text-xs uppercase bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Session / Semestre select dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Session Académique *</label>
                      <select 
                        value={selectedSemesterId} 
                        onChange={e => {
                          const val = Number(e.target.value);
                          if (onSemestreChange) {
                            onSemestreChange(val);
                          } else {
                            setLocalSemesterId(val);
                          }
                          // Reset loaded student to refresh semester-based matching notes
                          setSearchedStudent(null);
                          setSearchHasBeenRun(false);
                          setMatriculeError("");
                        }}
                        className="form-control text-pivoted text-xs w-full py-2 px-3 bg-white font-bold"
                        required
                      >
                        {semestres
                          .filter(s => !selectedFiliereId || !s.filiere_id || Number(s.filiere_id) === Number(selectedFiliereId))
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.nom_semestre} ({s.annee_scolaire})</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button 
                      type="submit" 
                      className="btn btn-primary px-6 py-2 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Layers className="w-4 h-4" /> Afficher les Matières & Saisir
                    </button>
                  </div>
                </form>

                {matriculeError && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2 border border-red-200">
                    <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5" />
                    <span>{matriculeError}</span>
                  </div>
                )}

                {/* Loader Content for student matched */}
                {searchedStudent ? (
                  <div className="space-y-6" id="matricule-student-workspace">
                    {/* Student mini passport card */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-90/30 flex items-center gap-4">
                      <GraduationCap 
                        className="w-10 h-10 text-blue-900 bg-white p-2 rounded-lg border border-slate-300 shrink-0 shadow-sm" 
                      />
                      <div className="text-xs">
                        <h4 className="font-extrabold text-blue-950 uppercase text-sm leading-tight">
                          {searchedStudent.nom} {searchedStudent.prenom}
                        </h4>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
                          <span>Matricule: <strong className="font-mono text-black">{searchedStudent.matricule}</strong></span>
                          <span>Filière: <strong className="text-blue-900">
                            {filieres.find(f => Number(f.id) === Number(searchedStudent.filiere_id))?.nom_filiere || "Inconnue"}
                          </strong></span>
                        </div>
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="bg-rose-50 border border-rose-300 text-rose-850 p-4 rounded-xl text-xs flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="font-bold">{errorMessage}</span>
                      </div>
                    )}

                    {/* Real-time credits calculator for this specific loaded student */}
                    {(() => {
                      const existingNotes = notes.filter(n => 
                        Number(n.etudiant_id) === Number(searchedStudent.id) && 
                        Number(n.semestre_id) === Number(selectedSemesterId)
                      );
                      const savedValidatedCredits = existingNotes
                        .filter(n => Number(n.note) >= 10)
                        .reduce((sum, n) => sum + Number(n.credits), 0);
                      
                      const studentMatieres = matieres.filter(
                        m => Number(m.filiere_id) === Number(searchedStudent.filiere_id) &&
                        Number(m.semestre_id) === Number(selectedSemesterId)
                      );
                      let potentialNewCredits = 0;
                      const alreadySavedMatiereTitles = existingNotes.map(n => {
                        const c = cours.find(x => x.id === n.cours_id);
                        return c ? c.titre : "";
                      });

                      studentMatieres.forEach(m => {
                        if (alreadySavedMatiereTitles.includes(m.nom_matiere)) {
                          return;
                        }
                        const inputs = gradesInput[m.id];
                        if (inputs && (inputs.note_classe.trim() !== "" || inputs.note_examen.trim() !== "")) {
                          const computed = calculateLiveWeighted(inputs.note_classe, inputs.note_examen);
                          if (computed !== null && computed >= 10) {
                            potentialNewCredits += Number(m.credits);
                          }
                        }
                      });

                      const totalEstimatedCredits = savedValidatedCredits + potentialNewCredits;
                      const maxPossibleCredits = studentMatieres.reduce((sum, m) => sum + Number(m.credits), 0);

                      return (
                        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-755 shadow-inner space-y-2.5">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-indigo-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Bilan prévisionnel (Saisie courante)
                            </span>
                            <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                              Option LMD
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                              <span className="text-[9px] text-gray-400 font-bold uppercase block">Acquis enregistrés</span>
                              <span className="text-sm font-black text-rose-100">{savedValidatedCredits} ECTS</span>
                            </div>
                            <div className="bg-indigo-950/60 p-2 rounded-lg border border-indigo-900/30">
                              <span className="text-[9px] text-indigo-200 font-bold uppercase block">Projetés via Saisie</span>
                              <span className="text-sm font-black text-emerald-300">+{potentialNewCredits} ECTS</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-300">
                              <span>TOTAL CRÉDITS VALIDÉS ESTIMÉ :</span>
                              <span className="text-xs font-black text-emerald-400">
                                {totalEstimatedCredits} / {maxPossibleCredits || 30} ECTS
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${maxPossibleCredits > 0 ? Math.min(100, Math.round((totalEstimatedCredits / maxPossibleCredits) * 100)) : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Syllabus-wide subjects entry */}
                    <form onSubmit={handleSyllabusSubmit} className="space-y-4">
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto w-full">
                          <table className="custom-table min-w-[850px] w-full" style={{ boxShadow: 'none' }}>
                            <thead>
                              <tr>
                                <th className="py-3 px-4 font-bold text-left uppercase text-[11px] tracking-wider">Matière / Cours</th>
                                <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-24">Crédits</th>
                                <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-40">Note Classe (40%)</th>
                                <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-40">Note Examen (60%)</th>
                                <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-36">Note Finale Est.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {matieres.filter(m => 
                                Number(m.filiere_id) === Number(searchedStudent.filiere_id) &&
                                (!m.semestre_id || Number(m.semestre_id) === Number(selectedSemesterId))
                              ).map(m => {
                                const currentInput = gradesInput[m.id] || { note_classe: "", note_examen: "" };
                                const computed = calculateLiveWeighted(currentInput.note_classe, currentInput.note_examen);
                                
                                // Check if this student already has notes in class for this subject and semester
                                const matchingNotesForMatiere = notes.filter(n => {
                                  const noteCours = cours.find(c => c.id === n.cours_id);
                                  return (
                                    Number(n.etudiant_id) === Number(searchedStudent.id) && 
                                    Number(n.semestre_id) === Number(selectedSemesterId) && 
                                    noteCours?.titre === m.nom_matiere
                                  );
                                });

                                return (
                                  <tr key={m.id} className={`transition border-b last:border-b-0 ${adminTheme === 'sombre-or' ? 'hover:bg-slate-900/40 border-[#20253f]' : 'hover:bg-slate-50 border-gray-150'}`}>
                                    <td className="py-4 px-4">
                                      <div className={`font-bold text-sm ${adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-900'}`}>{m.nom_matiere}</div>
                                      <div className="font-mono text-[10px] text-amber-500/85 font-semibold mt-0.5 uppercase tracking-wider">{m.code_matiere}</div>
                                      {matchingNotesForMatiere.length > 0 && (
                                        <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border w-fit ${
                                          adminTheme === 'sombre-or' 
                                            ? 'text-[#cca072] bg-[#191410] border-[#cca072]/20' 
                                            : 'text-amber-700 bg-amber-50 border-amber-200'
                                        }`}>
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>Déjà {matchingNotesForMatiere.length} évaluation(s) saisie(s)</span>
                                        </div>
                                      )}
                                    </td>
                                    <td className={`py-4 px-4 text-center font-mono font-bold text-xs ${
                                      adminTheme === 'sombre-or' ? 'text-slate-300 bg-slate-950/20' : 'text-slate-600 bg-slate-50/50'
                                    }`}>{m.credits} ECTS</td>
                                    <td className="py-4 px-4">
                                      <div className="flex flex-col items-center justify-center">
                                        <input 
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="20"
                                          placeholder="Ex: 14"
                                          value={currentInput.note_classe}
                                          onChange={e => {
                                            setGradesInput({
                                              ...gradesInput,
                                              [m.id]: { ...currentInput, note_classe: e.target.value }
                                            });
                                          }}
                                          className={`py-2 px-3 text-center text-sm font-extrabold w-32 focus:ring-2 focus:outline-none rounded-xl border transition-all ${getValidationInfo(currentInput.note_classe, adminTheme).className}`}
                                        />
                                        {getValidationInfo(currentInput.note_classe, adminTheme).helperText && (
                                          <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 block px-2 py-0.5 rounded border text-center ${
                                            getValidationInfo(currentInput.note_classe, adminTheme).isError 
                                              ? (adminTheme === 'sombre-or' ? 'text-rose-400 bg-rose-950/40 border-rose-900/30' : 'text-rose-700 bg-rose-50 border-rose-200') 
                                              : (adminTheme === 'sombre-or' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200')
                                          }`}>
                                            {getValidationInfo(currentInput.note_classe, adminTheme).helperText}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4">
                                      <div className="flex flex-col items-center justify-center">
                                        <input 
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="20"
                                          placeholder="Ex: 11.5"
                                          value={currentInput.note_examen}
                                          onChange={e => {
                                            setGradesInput({
                                              ...gradesInput,
                                              [m.id]: { ...currentInput, note_examen: e.target.value }
                                            });
                                          }}
                                          className={`py-2 px-3 text-center text-sm font-extrabold w-32 focus:ring-2 focus:outline-none rounded-xl border transition-all ${getValidationInfo(currentInput.note_examen, adminTheme).className}`}
                                        />
                                        {getValidationInfo(currentInput.note_examen, adminTheme).helperText && (
                                          <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 block px-2 py-0.5 rounded border text-center ${
                                            getValidationInfo(currentInput.note_examen, adminTheme).isError 
                                              ? (adminTheme === 'sombre-or' ? 'text-rose-400 bg-rose-950/40 border-rose-900/30' : 'text-rose-700 bg-rose-50 border-rose-200') 
                                              : (adminTheme === 'sombre-or' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200')
                                          }`}>
                                            {getValidationInfo(currentInput.note_examen, adminTheme).helperText}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      {computed !== null ? (
                                        <span className={`inline-flex items-center justify-center font-mono text-sm font-black px-3 py-1 rounded-xl border ${
                                          computed >= 10 
                                            ? adminTheme === 'sombre-or'
                                              ? "bg-emerald-950/50 border-emerald-500/35 text-emerald-400 shadow-sm shadow-emerald-950/20" 
                                              : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs"
                                            : adminTheme === 'sombre-or'
                                              ? "bg-rose-950/50 border-rose-500/35 text-rose-400 shadow-sm shadow-rose-950/20"
                                              : "bg-rose-50 border-rose-200 text-rose-700 shadow-xs"
                                        }`}>
                                          {computed.toFixed(2)} / 20
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 font-bold text-sm select-none">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => {
                            setSearchedStudent(null);
                            setMatriculeQuery("");
                            setSearchHasBeenRun(false);
                            setGradesInput({});
                          }}
                          className="btn bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold"
                        >
                          Annuler
                        </button>
                        <button 
                          type="submit" 
                          disabled={hasValidationErrors}
                          className={`btn font-bold text-xs inline-flex items-center gap-1.5 transition-all ${
                            hasValidationErrors 
                              ? '!bg-rose-100 !text-rose-700 !border-rose-300 cursor-not-allowed opacity-80' 
                              : 'btn-primary'
                          }`}
                          title={hasValidationErrors ? "Certaines notes saisies sont incorrectes (0-20)" : "Enregistrer toutes les notes du syllabus"}
                        >
                          <Save className="w-4 h-4" /> Enregistrer le Syllabus
                        </button>
                      </div>
                    </form>
                  </div>
                ) : searchHasBeenRun ? (
                  <div className="bg-amber-50 text-amber-800 text-xs p-4 rounded-xl border border-amber-200 text-center">
                    Veuillez spécifier un matricule valide ci-dessus afin d'initialiser la grille de matières.
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-250 p-8 rounded-xl text-center text-gray-400 text-xs flex flex-col items-center justify-center space-y-2">
                    <User className="w-8 h-8 text-gray-300" />
                    <span>Saisir le numéro de matricule d'un élève (ex: <strong className="font-mono text-gray-600">ETU20250001</strong>) et cliquer sur « Afficher les Matières & Saisir » pour débuter.</span>
                  </div>
                )}
              </>
            )}

            {/* --- MODE 2: COLLECTIF PAR MATIERE --- */}
            {entryMode === 'collective' && (
              <div className="space-y-4">
                {/* Filters selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
                  {/* Filière Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Filière Académique *</label>
                    <select 
                      value={selectedFiliereId} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (onFiliereChange) {
                          onFiliereChange(val);
                        } else {
                          setLocalFiliereId(val);
                        }
                        setCollectiveGrades({});
                      }}
                      className="form-control text-xs w-full py-2 px-3 focus:ring-1 focus:ring-blue-500 bg-white font-bold"
                    >
                      <option value="">Sélectionner une filière...</option>
                      {filieres.map(f => (
                        <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                      ))}
                    </select>
                  </div>

                  {/* Session / Semestre select dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Session Académique *</label>
                    <select 
                      value={selectedSemesterId} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (onSemestreChange) {
                          onSemestreChange(val);
                        } else {
                          setLocalSemesterId(val);
                        }
                        setCollectiveGrades({});
                      }}
                      className="form-control text-pivoted text-xs w-full py-2 px-3 bg-white font-bold"
                    >
                      {semestres
                        .filter(s => !selectedFiliereId || !s.filiere_id || Number(s.filiere_id) === Number(selectedFiliereId))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.nom_semestre} ({s.annee_scolaire})</option>
                        ))}
                    </select>
                  </div>

                  {/* Course dropdown list representing subject */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Matière Obligatoire *</label>
                    <select
                      value={collectiveMatiereId}
                      onChange={e => {
                        setCollectiveMatiereId(Number(e.target.value));
                        setCollectiveGrades({});
                      }}
                      className="form-control text-xs w-full py-2 px-3 font-bold bg-white"
                      disabled={!selectedFiliereId}
                    >
                      <option value="">Sélectionner une matière...</option>
                      {matieres.filter(m => 
                        Number(m.filiere_id) === Number(selectedFiliereId) &&
                        (!m.semestre_id || Number(m.semestre_id) === Number(selectedSemesterId))
                      ).map(m => (
                        <option key={m.id} value={m.id}>{m.nom_matiere} ({m.code_matiere})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-300 text-rose-850 p-4 rounded-xl text-xs flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    <span className="font-bold">{errorMessage}</span>
                  </div>
                )}

                {(() => {
                  const filteredStudents = etudiants.filter(e => Number(e.filiere_id) === Number(selectedFiliereId));
                  const activeMatiereObj = matieres.find(x => x.id === collectiveMatiereId);

                  if (!selectedFiliereId) {
                    return (
                      <div className="border border-dashed border-gray-250 p-8 rounded-xl text-center text-gray-400 text-xs flex flex-col items-center justify-center space-y-2">
                        <Layers className="w-8 h-8 text-gray-300" />
                        <span>Veuillez sélectionner une filière pour charger la liste collective des élèves.</span>
                      </div>
                    );
                  }

                  if (!collectiveMatiereId || !activeMatiereObj) {
                    return (
                      <div className="border border-dashed border-gray-250 p-8 rounded-xl text-center text-gray-400 text-xs flex flex-col items-center justify-center space-y-2">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                        <span>Veuillez sélectionner la matière académique pour laquelle vous souhaitez entrer les notes.</span>
                      </div>
                    );
                  }

                  if (filteredStudents.length === 0) {
                    return (
                      <div className="bg-amber-50 text-amber-800 text-xs p-6 rounded-xl text-center border border-amber-200">
                        Aucun étudiant n'est encore inscrit dans cette filière académique.
                      </div>
                    );
                  }

                  return (
                    <form onSubmit={handleCollectiveSubmit} className="space-y-4">
                      {/* Active subject info banner */}
                      <div className={`p-4 rounded-xl shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left border ${
                        adminTheme === 'sombre-or'
                          ? 'bg-[#101428] text-white border-[#20253f]'
                          : 'bg-blue-50/50 text-blue-950 border-blue-100'
                      }`}>
                        <div className="flex items-center gap-3">
                          <BookOpen className={`w-5 h-5 ${adminTheme === 'sombre-or' ? 'text-[#dfcbb0]' : 'text-blue-600'}`} />
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Saisie en cours pour la matière :</span>
                            <h4 className={`text-sm font-black ${adminTheme === 'sombre-or' ? 'text-white' : 'text-blue-905'}`}>{activeMatiereObj.nom_matiere}</h4>
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Code & Crédits</span>
                          <span className={`text-xs font-mono font-bold ${adminTheme === 'sombre-or' ? 'text-[#dfcbb0]' : 'text-blue-800'}`}>{activeMatiereObj.code_matiere} — {activeMatiereObj.credits} ECTS</span>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto w-full">
                          <table className="custom-table min-w-[750px] w-full" style={{ boxShadow: 'none' }}>
                            <thead>
                              <tr>
                                <th className="py-3 px-4 font-bold text-left uppercase text-[11px] tracking-wider">Étudiant / Matière</th>
                                <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-40">Note Classe (40%)</th>
                                <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-40">Note Examen (60%)</th>
                                <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-36">Note Finale Est.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredStudents.map(st => {
                                const currentInput = collectiveGrades[st.id] || { note_classe: "", note_examen: "" };
                                const computed = calculateLiveWeighted(currentInput.note_classe, currentInput.note_examen);
                                
                                // check if student has a note in matching matiere
                                const matchingNotesForMatiere = notes.filter(n => {
                                  const noteCours = cours.find(c => c.id === n.cours_id);
                                  return (
                                    Number(n.etudiant_id) === Number(st.id) && 
                                    Number(n.semestre_id) === Number(selectedSemesterId) && 
                                    noteCours?.titre === activeMatiereObj.nom_matiere
                                  );
                                });

                                return (
                                  <tr key={st.id} className={`transition border-b last:border-b-0 ${adminTheme === 'sombre-or' ? 'hover:bg-slate-900/40 border-[#20253f]' : 'hover:bg-slate-50 border-gray-150'}`}>
                                    <td className="py-4 px-4 text-left">
                                      <div className={`font-bold text-sm ${adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-900'}`}>{st.nom} {st.prenom}</div>
                                      <div className="font-mono text-[10.5px] text-amber-550/85 font-semibold mt-0.5 uppercase tracking-wider">{st.matricule}</div>
                                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                                        <span className="text-gray-400">Évaluation :</span>
                                        <span className={`font-bold px-1.5 py-0.5 rounded border font-sans ${
                                          adminTheme === 'sombre-or' 
                                            ? 'text-[#dfcbb0] bg-[#1d1b24] border-[#dfcbb0]/25' 
                                            : 'text-blue-700 bg-blue-50 border-blue-250'
                                        }`}>
                                          {activeMatiereObj.nom_matiere}
                                        </span>
                                      </div>
                                      {matchingNotesForMatiere.length > 0 && (
                                        <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border w-fit ${
                                          adminTheme === 'sombre-or' 
                                            ? 'text-[#cca072] bg-[#191410] border-[#cca072]/20' 
                                            : 'text-amber-700 bg-amber-50 border-amber-200'
                                        }`}>
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>Déjà évalué : {Number(matchingNotesForMatiere[0].note).toFixed(2)}/20</span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-4 px-4">
                                      <div className="flex flex-col items-center justify-center">
                                        <input 
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="20"
                                          placeholder="Ex: 14"
                                          value={currentInput.note_classe}
                                          onChange={e => {
                                            setCollectiveGrades({
                                              ...collectiveGrades,
                                              [st.id]: { ...currentInput, note_classe: e.target.value }
                                            });
                                          }}
                                          className={`py-2 px-3 text-center text-sm font-extrabold w-32 focus:ring-2 focus:outline-none rounded-xl border transition-all ${getValidationInfo(currentInput.note_classe, adminTheme).className}`}
                                        />
                                        {getValidationInfo(currentInput.note_classe, adminTheme).helperText && (
                                          <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 block px-2 py-0.5 rounded border text-center ${
                                            getValidationInfo(currentInput.note_classe, adminTheme).isError 
                                              ? (adminTheme === 'sombre-or' ? 'text-rose-400 bg-rose-950/40 border-rose-900/30' : 'text-rose-700 bg-rose-50 border-rose-200') 
                                              : (adminTheme === 'sombre-or' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200')
                                          }`}>
                                            {getValidationInfo(currentInput.note_classe, adminTheme).helperText}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4">
                                      <div className="flex flex-col items-center justify-center">
                                        <input 
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="20"
                                          placeholder="Ex: 11.5"
                                          value={currentInput.note_examen}
                                          onChange={e => {
                                            setCollectiveGrades({
                                              ...collectiveGrades,
                                              [st.id]: { ...currentInput, note_examen: e.target.value }
                                            });
                                          }}
                                          className={`py-2 px-3 text-center text-sm font-extrabold w-32 focus:ring-2 focus:outline-none rounded-xl border transition-all ${getValidationInfo(currentInput.note_examen, adminTheme).className}`}
                                        />
                                        {getValidationInfo(currentInput.note_examen, adminTheme).helperText && (
                                          <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 block px-2 py-0.5 rounded border text-center ${
                                            getValidationInfo(currentInput.note_examen, adminTheme).isError 
                                              ? (adminTheme === 'sombre-or' ? 'text-rose-400 bg-rose-950/40 border-rose-900/30' : 'text-rose-700 bg-rose-50 border-rose-200') 
                                              : (adminTheme === 'sombre-or' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200')
                                          }`}>
                                            {getValidationInfo(currentInput.note_examen, adminTheme).helperText}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      {computed !== null ? (
                                        <span className={`inline-flex items-center justify-center font-mono text-sm font-black px-3 py-1 rounded-xl border ${
                                          computed >= 10 
                                            ? adminTheme === 'sombre-or'
                                              ? "bg-emerald-950/50 border-emerald-500/35 text-emerald-400 shadow-sm shadow-emerald-950/20" 
                                              : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs"
                                            : adminTheme === 'sombre-or'
                                              ? "bg-rose-950/50 border-rose-500/35 text-rose-400 shadow-sm shadow-rose-950/20"
                                              : "bg-rose-50 border-rose-200 text-rose-700 shadow-xs"
                                        }`}>
                                          {computed.toFixed(2)} / 20
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 font-bold text-sm select-none">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => setCollectiveGrades({})}
                          className="btn bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold"
                        >
                          Vider le formulaire
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary font-bold text-xs inline-flex items-center gap-1.5"
                        >
                          <Save className="w-4 h-4" /> Enregistrer les notes de la classe
                        </button>
                      </div>
                    </form>
                  );
                })()}

              </div>
            )}

            {/* --- MODE 5: SAISIE PAR BULLETIN (PAR ELEVE / MULTI-MATIERES) --- */}
            {entryMode === 'bulletin' && (
              <div className="space-y-4">
                {/* Selector Header */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border ${
                  adminTheme === 'sombre-or' 
                    ? 'bg-[#101428] border-[#20253f]' 
                    : 'bg-slate-50 border-gray-200'
                }`}>
                  {/* Filière Selection to narrow down */}
                  <div className="space-y-1 text-left">
                    <label className={`text-[10px] font-black uppercase tracking-wider ${
                      adminTheme === 'sombre-or' ? 'text-[#dfcbb0]' : 'text-gray-600'
                    }`}>Filière Académique (Optionnel)</label>
                    <select 
                      value={selectedFiliereId} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (onFiliereChange) {
                          onFiliereChange(val);
                        } else {
                          setLocalFiliereId(val);
                        }
                        // Reset student if they change filiere to avoid cross-filiere student issues
                        setBulletinEtudiantId(0);
                      }}
                      className={`form-control text-xs w-full py-2 px-3 focus:ring-1 focus:ring-blue-500 font-bold border rounded-lg ${
                        adminTheme === 'sombre-or' 
                          ? 'bg-[#0f111a] text-white border-[#20253f]' 
                          : 'bg-white text-gray-900 border-gray-200'
                      }`}
                    >
                      <option value="" className={adminTheme === 'sombre-or' ? 'text-white bg-slate-900' : 'text-gray-900 bg-white'}>Toutes les filières...</option>
                      {filieres.map(f => (
                        <option key={f.id} value={f.id} className={adminTheme === 'sombre-or' ? 'text-white bg-slate-900' : 'text-gray-900 bg-white'}>{f.nom_filiere}</option>
                      ))}
                    </select>
                  </div>

                  {/* Étudiant selection */}
                  <div className="space-y-1 text-left">
                    <label className={`text-[10px] font-black uppercase tracking-wider ${
                      adminTheme === 'sombre-or' ? 'text-[#dfcbb0]' : 'text-gray-600'
                    }`}>Sélectionner l'Étudiant *</label>
                    <select 
                      value={bulletinEtudiantId} 
                      onChange={e => setBulletinEtudiantId(Number(e.target.value))}
                      className={`form-control text-xs w-full py-2 px-3 focus:ring-1 focus:ring-blue-500 font-bold border rounded-lg ${
                        adminTheme === 'sombre-or' 
                          ? 'bg-[#0f111a] text-white border-[#20253f]' 
                          : 'bg-white text-gray-900 border-gray-200'
                      }`}
                    >
                      <option value="0" className={adminTheme === 'sombre-or' ? 'text-white bg-slate-900' : 'text-gray-900 bg-white'}>-- Choisir un étudiant --</option>
                      {etudiants
                        .filter(st => !selectedFiliereId || Number(st.filiere_id) === Number(selectedFiliereId))
                        .map(st => {
                          const fil = filieres.find(f => Number(f.id) === Number(st.filiere_id));
                          return (
                            <option key={st.id} value={st.id} className={adminTheme === 'sombre-or' ? 'text-white bg-slate-900' : 'text-gray-900 bg-white'}>
                              {st.nom} {st.prenom} ({st.matricule}) {fil ? ` - ${fil.nom_filiere}` : ""}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-300 text-rose-850 p-4 rounded-xl text-xs flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    <span className="font-bold">{errorMessage}</span>
                  </div>
                )}

                {(() => {
                  if (bulletinEtudiantId === 0) {
                    return (
                      <div className={`border border-dashed p-8 rounded-xl text-center text-xs flex flex-col items-center justify-center space-y-2 ${
                        adminTheme === 'sombre-or' ? 'border-[#20253f] text-gray-400' : 'border-gray-250 text-gray-400'
                      }`}>
                        <User className={`w-8 h-8 ${adminTheme === 'sombre-or' ? 'text-slate-700' : 'text-gray-300'}`} />
                        <span>Veuillez sélectionner un étudiant ci-dessus pour charger et saisir son bulletin de notes.</span>
                      </div>
                    );
                  }

                  const student = etudiants.find(e => Number(e.id) === Number(bulletinEtudiantId));
                  if (!student) return null;

                  const studentFiliere = filieres.find(f => Number(f.id) === Number(student.filiere_id));
                  const studentMatieres = matieres
                    .filter(m => 
                      Number(m.filiere_id) === Number(student.filiere_id) &&
                      (!m.semestre_id || Number(m.semestre_id) === Number(selectedSemesterId))
                    )
                    .sort((a, b) => a.nom_matiere.localeCompare(b.nom_matiere));

                  if (studentMatieres.length === 0) {
                    return (
                      <div className={`text-xs p-6 rounded-xl text-center border ${
                        adminTheme === 'sombre-or' 
                          ? 'bg-amber-950/20 text-amber-300 border-amber-900/30' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        Aucune matière n'est configurée pour la filière de cet étudiant ({studentFiliere?.nom_filiere || "Inconnue"}) et cette session académique.
                      </div>
                    );
                  }

                  return (
                    <form onSubmit={handleBulletinSubmit} className="space-y-4">
                      {/* Bulletin header card with MATRICULE at the top and NAME below, well-styled */}
                      <div className={`p-6 rounded-xl border text-left shadow-xs relative overflow-hidden ${
                        adminTheme === 'sombre-or' 
                          ? 'bg-[#101428] text-white border-[#20253f]' 
                          : 'bg-white text-slate-950 border-gray-200'
                      }`}>
                        {/* Elegant watermark */}
                        <div className="absolute right-4 top-4 opacity-5">
                          <User className="w-16 h-16" />
                        </div>

                        <div className="space-y-3">
                          {/* MATRICULE TRÈS EN HAUT */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono">
                              MATRICULE : {student.matricule}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded ${
                              adminTheme === 'sombre-or' ? 'bg-[#1a2035] text-[#dfcbb0]' : 'bg-blue-50 text-blue-800'
                            }`}>
                              FILIÈRE : {studentFiliere?.nom_filiere || "Non spécifiée"}
                            </span>
                          </div>

                          {/* NOM ET PRÉNOM JUSTE EN DESSOUS */}
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Nom complet de l'Étudiant</span>
                            <h3 className={`text-xl font-black mt-0.5 tracking-tight ${
                              adminTheme === 'sombre-or' ? 'text-[#dfcbb0]' : 'text-slate-900'
                            }`}>
                              {student.nom.toUpperCase()} {student.prenom}
                            </h3>
                          </div>

                          {/* SESSION ET ACCOMPAGNEMENT */}
                          <div className={`pt-2 border-t flex flex-wrap justify-between items-center gap-2 text-[11px] ${
                            adminTheme === 'sombre-or' ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-500'
                          }`}>
                            <div>
                              <span>Mode Saisie : </span>
                              <strong className="text-gray-600 dark:text-gray-300 font-bold">Bulletin complet (saisie multi-matières)</strong>
                            </div>
                            <div className="font-bold">
                              <span>Session : </span>
                              <span className="text-blue-600">
                                {semestres.find(s => s.id === selectedSemesterId)?.nom_semestre || "Semestre Actuel"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Grade Saisie Bulletin Table */}
                      <div className={`border rounded-xl overflow-hidden shadow-xs ${
                        adminTheme === 'sombre-or' ? 'border-[#20253f]' : 'border-gray-200'
                      }`}>
                        <div className="overflow-x-auto w-full">
                          <table className={`min-w-max w-full text-left text-xs border-collapse ${
                            adminTheme === 'sombre-or' ? 'bg-[#0d101d]' : 'bg-white'
                          }`}>
                            <thead className={`border-b ${
                              adminTheme === 'sombre-or' ? 'bg-[#101428] border-[#20253f]' : 'bg-slate-50 border-gray-200'
                            }`}>
                              <tr>
                                <th className={`py-3 px-4 font-bold text-left uppercase text-[10px] tracking-wider ${
                                  adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-gray-700'
                                }`}>Matière / Code</th>
                                <th className={`py-3 px-4 font-bold text-center uppercase text-[10px] tracking-wider ${
                                  adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-gray-700'
                                } w-32`}>Crédits (ECTS)</th>
                                <th className={`py-3 px-4 font-bold text-center uppercase text-[10px] tracking-wider ${
                                  adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-gray-700'
                                } w-32`}>Note CC (40%)</th>
                                <th className={`py-3 px-4 font-bold text-center uppercase text-[10px] tracking-wider ${
                                  adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-gray-700'
                                } w-32`}>Note Examen (60%)</th>
                                <th className={`py-3 px-4 font-bold text-center uppercase text-[10px] tracking-wider ${
                                  adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-gray-700'
                                } w-32`}>Moyenne / Note</th>
                                <th className={`py-3 px-4 font-bold text-center uppercase text-[10px] tracking-wider ${
                                  adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-gray-700'
                                } w-32`}>Décision</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${adminTheme === 'sombre-or' ? 'divide-[#20253f]' : 'divide-gray-150'}`}>
                              {studentMatieres.map(m => {
                                const currentInput = bulletinGrades[m.id] || { note_classe: "", note_examen: "" };
                                const computed = calculateLiveWeighted(currentInput.note_classe, currentInput.note_examen);

                                // validation checks
                                const ccVal = getValidationInfo(currentInput.note_classe, adminTheme);
                                const exVal = getValidationInfo(currentInput.note_examen, adminTheme);

                                return (
                                  <tr key={m.id} className={`transition-colors ${
                                    adminTheme === 'sombre-or' ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50/70'
                                  }`}>
                                    <td className="py-3.5 px-4 text-left">
                                      <div className={`font-bold text-sm ${adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-900'}`}>{m.nom_matiere}</div>
                                      <div className="font-mono text-[9px] text-amber-600 font-semibold mt-0.5 uppercase tracking-wider">{m.code_matiere}</div>
                                    </td>
                                    <td className={`py-3.5 px-4 text-center font-mono font-bold text-xs ${
                                      adminTheme === 'sombre-or' ? 'text-slate-400 bg-[#101428]/20' : 'text-slate-600 bg-slate-50/30'
                                    }`}>
                                      {m.credits} ECTS
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <div className="flex flex-col items-center">
                                        <input 
                                          type="text"
                                          placeholder="CC /20"
                                          value={currentInput.note_classe}
                                          onChange={e => {
                                            setBulletinGrades({
                                              ...bulletinGrades,
                                              [m.id]: { ...currentInput, note_classe: e.target.value }
                                            });
                                          }}
                                          className={`w-20 text-center py-1 px-2 text-xs font-black rounded-lg border transition-all ${
                                            currentInput.note_classe.trim() === "" 
                                              ? adminTheme === 'sombre-or'
                                                ? "border-[#20253f] bg-[#0d1021] text-white focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/10"
                                                : "border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10"
                                              : ccVal.isError 
                                                ? adminTheme === 'sombre-or'
                                                  ? "!border-rose-750 !bg-rose-950/30 !text-rose-400"
                                                  : "!border-rose-400 !bg-rose-50 !text-rose-700"
                                                : adminTheme === 'sombre-or'
                                                  ? "!border-emerald-750 !bg-emerald-950/30 !text-emerald-400"
                                                  : "!border-emerald-400 !bg-emerald-50 !text-emerald-700"
                                          }`}
                                        />
                                        {ccVal.isError && <span className="text-[8px] text-rose-500 font-bold mt-0.5">{ccVal.helperText}</span>}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <div className="flex flex-col items-center">
                                        <input 
                                          type="text"
                                          placeholder="EX /20"
                                          value={currentInput.note_examen}
                                          onChange={e => {
                                            setBulletinGrades({
                                              ...bulletinGrades,
                                              [m.id]: { ...currentInput, note_examen: e.target.value }
                                            });
                                          }}
                                          className={`w-20 text-center py-1 px-2 text-xs font-black rounded-lg border transition-all ${
                                            currentInput.note_examen.trim() === "" 
                                              ? adminTheme === 'sombre-or'
                                                ? "border-[#20253f] bg-[#0d1021] text-white focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/10"
                                                : "border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10"
                                              : exVal.isError 
                                                ? adminTheme === 'sombre-or'
                                                  ? "!border-rose-750 !bg-rose-950/30 !text-rose-400"
                                                  : "!border-rose-400 !bg-rose-50 !text-rose-700"
                                                : adminTheme === 'sombre-or'
                                                  ? "!border-emerald-750 !bg-emerald-950/30 !text-emerald-400"
                                                  : "!border-emerald-400 !bg-emerald-50 !text-emerald-700"
                                          }`}
                                        />
                                        {exVal.isError && <span className="text-[8px] text-rose-500 font-bold mt-0.5">{exVal.helperText}</span>}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      {computed !== null ? (
                                        <span className={`inline-flex items-center justify-center font-mono text-[11px] font-black px-2.5 py-1 rounded-md border ${
                                          computed >= 10 
                                            ? adminTheme === 'sombre-or'
                                              ? "bg-emerald-950/30 border-emerald-800 text-emerald-400"
                                              : "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                            : adminTheme === 'sombre-or'
                                              ? "bg-rose-950/30 border-rose-850 text-rose-400"
                                              : "bg-rose-50 border-rose-200 text-rose-700"
                                        }`}>
                                          {computed.toFixed(2)}/20
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 font-semibold text-[10px] italic">Non saisie</span>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      {computed !== null ? (
                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                          computed >= 10 
                                            ? "bg-emerald-100 text-emerald-800" 
                                            : "bg-rose-100 text-rose-800"
                                        }`}>
                                          {computed >= 10 ? "ADMIS" : "RATTRAPAGE"}
                                        </span>
                                      ) : (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => {
                            // Reload existing notes
                            const initialBulletin: Record<number, { note_classe: string; note_examen: string }> = {};
                            studentMatieres.forEach(m => {
                              const existing = notes.find(n => 
                                Number(n.etudiant_id) === Number(bulletinEtudiantId) &&
                                Number(n.semestre_id) === Number(selectedSemesterId) &&
                                cours.find(c => c.id === n.cours_id)?.titre === m.nom_matiere
                              );
                              initialBulletin[m.id] = {
                                note_classe: existing?.note_classe !== undefined ? existing.note_classe.toString() : "",
                                note_examen: existing?.note_examen !== undefined ? existing.note_examen.toString() : ""
                              };
                            });
                            setBulletinGrades(initialBulletin);
                            setSuccessMessage("Le bulletin de l'étudiant a été réinitialisé aux valeurs enregistrées.");
                          }}
                          className={`btn text-xs font-semibold ${
                            adminTheme === 'sombre-or' 
                              ? 'bg-[#101428] text-slate-300 border border-[#20253f] hover:bg-slate-900' 
                              : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          Réinitialiser le bulletin
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary font-bold text-xs inline-flex items-center gap-1.5"
                        >
                          <Save className="w-4 h-4" /> Enregistrer le Bulletin Complet
                        </button>
                      </div>
                    </form>
                  );
                })()}
              </div>
            )}

            {/* --- MODE 4: GRILLE GLOBALE (MULTI-MATIERES) --- */}
            {entryMode === 'grid' && (
              <div className="space-y-4">
                <form onSubmit={handleGridSubmit} className="space-y-4">
                  {/* SINGLE UNIFIED HORIZONTAL CONTROLS RIBBON */}
                  <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border select-none transition-all ${
                    adminTheme === 'sombre-or' 
                      ? 'bg-[#0d1021] border-[#20253f] text-white shadow-md shadow-amber-950/5' 
                      : 'bg-slate-100 border-slate-200 text-slate-900 shadow-xs'
                  }`}>
                    {/* Left: Filters (Filière & Période) */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* FILIÈRE ACTIVE SELECT */}
                      <div className={`flex items-center gap-1.5 text-[11px] border rounded-lg p-1.5 px-3 transition-colors ${
                        adminTheme === 'sombre-or' ? 'bg-[#121630] border-[#20253f]' : 'bg-white border-gray-250'
                      }`}>
                        <span className={`font-black uppercase tracking-wider text-[9px] ${
                          adminTheme === 'sombre-or' ? 'text-amber-400' : 'text-slate-500'
                        }`}>Filière :</span>
                        <select 
                          value={selectedFiliereId} 
                          onChange={e => {
                            const val = Number(e.target.value);
                            if (onFiliereChange) {
                              onFiliereChange(val);
                            } else {
                              setLocalFiliereId(val);
                            }
                          }}
                          className={`bg-transparent border-none text-[11px] font-black outline-none cursor-pointer focus:ring-0 p-0 text-ellipsis truncate max-w-[130px] sm:max-w-[200px] ${
                            adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-800'
                          }`}
                        >
                          <option value="" className={adminTheme === 'sombre-or' ? 'bg-[#0d1021] text-white' : 'text-gray-950'}>Choisir une filière...</option>
                          {filieres.map(f => (
                            <option key={f.id} value={f.id} className={adminTheme === 'sombre-or' ? 'bg-[#0d1021] text-white' : 'text-gray-950'}>{f.nom_filiere}</option>
                          ))}
                        </select>
                      </div>

                      {/* SÉLECTEUR DE PÉRIODE */}
                      <div className={`flex items-center gap-1.5 text-[11px] border rounded-lg p-1.5 px-3 transition-colors ${
                        adminTheme === 'sombre-or' ? 'bg-[#121630] border-[#20253f]' : 'bg-white border-gray-250'
                      }`}>
                        <span className={`font-black uppercase tracking-wider text-[9px] ${
                          adminTheme === 'sombre-or' ? 'text-amber-400' : 'text-slate-500'
                        }`}>Période :</span>
                        <select 
                          value={selectedSemesterId} 
                          onChange={e => {
                            const val = Number(e.target.value);
                            if (onSemestreChange) {
                              onSemestreChange(val);
                            } else {
                              setLocalSemesterId(val);
                            }
                          }}
                          className={`bg-transparent border-none text-[11px] font-black outline-none cursor-pointer focus:ring-0 p-0 ${
                            adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-800'
                          }`}
                        >
                          {semestres
                            .filter(s => !selectedFiliereId || !s.filiere_id || Number(s.filiere_id) === Number(selectedFiliereId))
                            .map(s => (
                              <option key={s.id} value={s.id} className={adminTheme === 'sombre-or' ? 'bg-[#0d1021] text-white' : 'text-gray-950'}>{s.nom_semestre} ({s.annee_scolaire})</option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Middle: Format d'affichage (Fiche vs Tableau) & single student navigation (Precedent/Suivant) */}
                    {selectedFiliereId > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {/* SUB-MODE TOGGLE */}
                        <div className={`flex items-center border rounded-lg p-0.5 space-x-0.5 transition-all ${
                          adminTheme === 'sombre-or' ? 'bg-slate-950 border-[#20253f]' : 'bg-white border-gray-250'
                        }`}>
                          <button
                            type="button"
                            onClick={() => setGridSubMode('card')}
                            className={`text-[10px] sm:text-[11px] font-black px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                              gridSubMode === 'card'
                                ? adminTheme === 'sombre-or' ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "bg-blue-900 text-white shadow-xs"
                                : adminTheme === 'sombre-or' ? "text-slate-400 hover:text-white" : "text-gray-650 hover:text-gray-900"
                            }`}
                            title="Saisie par Fiche Étudiant"
                          >
                            <User className="w-3 h-3" />
                            <span>Fiche</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGridSubMode('matrix')}
                            className={`text-[10px] sm:text-[11px] font-black px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                              gridSubMode === 'matrix'
                                ? adminTheme === 'sombre-or' ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "bg-blue-900 text-white shadow-xs"
                                : adminTheme === 'sombre-or' ? "text-slate-400 hover:text-white" : "text-gray-650 hover:text-gray-900"
                            }`}
                            title="Saisie par Tableau Matriciel"
                          >
                            <Layers className="w-3 h-3" />
                            <span>Tableau</span>
                          </button>
                        </div>

                        {/* If in Card sub-mode, show Layout selection (Une seule fiche vs Cascade) inline too! */}
                        {gridSubMode === 'card' && (
                          <div className={`flex items-center border rounded-lg p-0.5 space-x-0.5 transition-all ${
                            adminTheme === 'sombre-or' ? 'bg-slate-950 border-[#20253f]' : 'bg-white border-gray-250'
                          }`}>
                            <button
                              type="button"
                              onClick={() => setGridCardLayout('single')}
                              className={`text-[10px] sm:text-[11px] font-black px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                                gridCardLayout === 'single'
                                  ? adminTheme === 'sombre-or' ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "bg-blue-900 text-white shadow-xs"
                                  : adminTheme === 'sombre-or' ? "text-slate-400 hover:text-white" : "text-gray-650 hover:text-gray-900"
                              }`}
                            >
                              Unique
                            </button>
                            <button
                              type="button"
                              onClick={() => setGridCardLayout('all')}
                              className={`text-[10px] sm:text-[11px] font-black px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                                gridCardLayout === 'all'
                                  ? adminTheme === 'sombre-or' ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "bg-blue-900 text-white shadow-xs"
                                  : adminTheme === 'sombre-or' ? "text-slate-400 hover:text-white" : "text-gray-650 hover:text-gray-900"
                              }`}
                            >
                              Cascade
                            </button>
                          </div>
                        )}

                        {/* STUDENT NAVIGATION: PRECEDENT / DROPDOWN / SUIVANT */}
                        {gridSubMode === 'card' && gridCardLayout === 'single' && etudiants.filter(e => Number(e.filiere_id) === Number(selectedFiliereId)).length > 0 && (
                          <div className={`flex items-center gap-1 border rounded-lg p-0.5 transition-colors ${
                            adminTheme === 'sombre-or' ? 'bg-slate-950 border-[#20253f]' : 'bg-white border-gray-250'
                          }`}>
                            <button
                              type="button"
                              disabled={gridActiveStudentIndex === 0}
                              onClick={() => setGridActiveStudentIndex(prev => Math.max(0, prev - 1))}
                              className={`px-2 py-1 text-xs font-black rounded-md disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer ${
                                adminTheme === 'sombre-or' ? 'bg-[#0d1021] hover:bg-slate-800 text-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
                              }`}
                              title="Élève Précédent"
                            >
                              ←
                            </button>

                            <select
                              value={gridActiveStudentIndex}
                              onChange={e => setGridActiveStudentIndex(Number(e.target.value))}
                              className={`text-[10px] font-black py-0.5 px-2 bg-transparent border-none focus:ring-0 focus:outline-none max-w-[130px] ${
                                adminTheme === 'sombre-or' ? 'text-white' : 'text-gray-950'
                              }`}
                            >
                              {etudiants.filter(e => Number(e.filiere_id) === Number(selectedFiliereId)).map((st, idx) => (
                                <option key={st.id} value={idx} className="text-gray-950">
                                  {st.nom} ({st.matricule})
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              disabled={gridActiveStudentIndex >= etudiants.filter(e => Number(e.filiere_id) === Number(selectedFiliereId)).length - 1}
                              onClick={() => setGridActiveStudentIndex(prev => Math.min(etudiants.filter(e => Number(e.filiere_id) === Number(selectedFiliereId)).length - 1, prev + 1))}
                              className={`px-2 py-1 text-xs font-black rounded-md disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer ${
                                adminTheme === 'sombre-or' ? 'bg-[#0d1021] hover:bg-slate-800 text-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
                              }`}
                              title="Élève Suivant"
                            >
                              →
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Right: Enregistrement Status and Save Action Button */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-black border px-2.5 py-1.5 rounded-lg tracking-wide hidden lg:inline-block ${
                        adminTheme === 'sombre-or' 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                          : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      }`}>
                        Actif ✔
                      </span>

                      {selectedFiliereId > 0 && (
                        <button 
                          type="submit" 
                          className={`px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                            adminTheme === 'sombre-or'
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                              : 'bg-blue-900 text-white hover:bg-slate-900'
                          }`}
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Sauvegarder</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="bg-rose-50 border border-rose-300 text-rose-850 p-4 rounded-xl text-xs flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                      <span className="font-bold">{errorMessage}</span>
                    </div>
                  )}

                  {(() => {
                    const filteredStudents = etudiants.filter(e => Number(e.filiere_id) === Number(selectedFiliereId));
                    const filteredMatieres = matieres.filter(m => 
                      Number(m.filiere_id) === Number(selectedFiliereId) &&
                      (!m.semestre_id || Number(m.semestre_id) === Number(selectedSemesterId))
                    );

                    if (!selectedFiliereId) {
                      return (
                        <div className={`border border-dashed p-8 rounded-xl text-center text-xs flex flex-col items-center justify-center space-y-2 ${
                          adminTheme === 'sombre-or' ? 'border-[#20253f] text-slate-400' : 'border-gray-250 text-gray-400'
                        }`}>
                          <Layers className="w-8 h-8 text-gray-300" />
                          <span>Veuillez sélectionner une filière pour charger la grille de saisie globale.</span>
                        </div>
                      );
                    }

                    if (filteredMatieres.length === 0) {
                      return (
                        <div className={`text-xs p-6 rounded-xl text-center border ${
                          adminTheme === 'sombre-or' ? 'bg-[#121630]/40 border-rose-950 text-rose-300' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          Aucune matière n'est configurée pour cette filière et cette session académique.
                        </div>
                      );
                    }

                    if (filteredStudents.length === 0) {
                      return (
                        <div className={`text-xs p-6 rounded-xl text-center border ${
                          adminTheme === 'sombre-or' ? 'bg-[#121630]/40 border-rose-950 text-rose-300' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          Aucun étudiant n'est encore inscrit dans cette filière académique.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {gridSubMode === 'card' && (() => {
                        const calculateStudentLiveAverage = (studentId: number) => {
                          let totalWeighted = 0;
                          let totalCredits = 0;
                          filteredMatieres.forEach(m => {
                            const cellKey = `${studentId}_${m.id}`;
                            const currentInput = gridGrades[cellKey] || { note_classe: "", note_examen: "" };
                            const computed = calculateLiveWeighted(currentInput.note_classe, currentInput.note_examen);
                            if (computed !== null) {
                              totalWeighted += computed * m.credits;
                              totalCredits += m.credits;
                            }
                          });
                          return totalCredits > 0 ? totalWeighted / totalCredits : null;
                        };

                        const renderStudentCard = (student: Etudiant, studentIndex: number, isCascade: boolean) => {
                          const studentAvg = calculateStudentLiveAverage(student.id);

                          return (
                            <div 
                              key={student.id} 
                              className={`rounded-xl border shadow-xs overflow-hidden transition-all text-left ${
                                adminTheme === 'sombre-or' 
                                  ? 'bg-[#0d1021] text-white border-[#20253f]' 
                                  : 'bg-white text-slate-950 border-gray-200'
                              } ${isCascade ? 'mb-4 hover:shadow-md' : ''}`}
                            >
                              {/* Student info compact header */}
                              <div className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-3 text-left ${
                                adminTheme === 'sombre-or' 
                                  ? 'bg-[#121630] border-[#20253f]' 
                                  : 'bg-slate-50 border-gray-200'
                              }`}>
                                <div className="space-y-0.5 text-left">
                                  <div className="flex items-center gap-1.5 text-left">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/10 font-mono">
                                      {student.matricule}
                                    </span>
                                    {isCascade && (
                                      <span className="text-[10px] font-black text-gray-400 font-mono">
                                        Fiche n° {studentIndex + 1} / {filteredStudents.length}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className={`text-sm font-black tracking-tight text-left uppercase ${
                                    adminTheme === 'sombre-or' ? 'text-[#dfcbb0]' : 'text-slate-900'
                                  }`}>
                                    {student.nom} {student.prenom}
                                  </h4>
                                </div>

                                {/* General Live Average & Actions/Nav */}
                                <div className="flex items-center gap-3">
                                  {studentAvg !== null ? (
                                    <div className="text-right">
                                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Moyenne Générale</span>
                                      <span className={`inline-flex items-center justify-center font-mono text-xs font-black px-2 py-0.5 rounded-md border ${
                                        studentAvg >= 10 
                                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                                          : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                                      }`}>
                                        {studentAvg.toFixed(2)} / 20
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-right">
                                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Moyenne Générale</span>
                                      <span className="text-gray-400 font-bold text-xs font-mono">—</span>
                                    </div>
                                  )}


                                </div>
                              </div>

                              {/* Subjects list rows */}
                              <div className="divide-y divide-gray-150/70 dark:divide-slate-800 bg-white dark:bg-[#0d1021]">
                                {/* Compact Header Row (Hidden on mobile) */}
                                <div className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-2 bg-slate-50/50 dark:bg-[#11152d]/40 border-b border-gray-100 dark:border-[#20253f] text-[9px] font-black uppercase text-gray-400 tracking-wider text-left">
                                  <div className="col-span-6">Matière académique</div>
                                  <div className="col-span-2 text-center">Note CC (40%)</div>
                                  <div className="col-span-2 text-center">Note Examen (60%)</div>
                                  <div className="col-span-2 text-center">Moyenne Live</div>
                                </div>

                                {filteredMatieres.map(m => {
                                  const cellKey = `${student.id}_${m.id}`;
                                  const currentInput = gridGrades[cellKey] || { note_classe: "", note_examen: "" };
                                  const computed = calculateLiveWeighted(currentInput.note_classe, currentInput.note_examen);

                                  const ccVal = getValidationInfo(currentInput.note_classe, adminTheme);
                                  const exVal = getValidationInfo(currentInput.note_examen, adminTheme);

                                  return (
                                    <div 
                                      key={m.id} 
                                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-5 py-2 items-center hover:bg-slate-50/40 dark:hover:bg-[#141935]/30 transition-colors text-left"
                                    >
                                      {/* Subject info */}
                                      <div className="col-span-6 text-left">
                                        <div className="font-extrabold text-gray-900 dark:text-slate-100 text-xs tracking-tight text-left">
                                          {m.nom_matiere}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5 text-left">
                                          <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 px-1 py-0.2 rounded">
                                            {m.code_matiere}
                                          </span>
                                          <span className="text-[9px] font-semibold text-gray-400 dark:text-slate-500">
                                            {m.credits} ECTS
                                          </span>
                                        </div>
                                      </div>

                                      {/* CC input */}
                                      <div className="col-span-2 flex items-center justify-between md:justify-center gap-2">
                                        <span className="md:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest">CC (40%) :</span>
                                        <div className="relative">
                                          <input 
                                            type="text"
                                            placeholder="-"
                                            value={currentInput.note_classe}
                                            onChange={e => {
                                              setGridGrades({
                                                ...gridGrades,
                                                [cellKey]: { ...currentInput, note_classe: e.target.value }
                                              });
                                            }}
                                            className={`w-16 h-7 text-center text-xs font-black rounded-lg border transition-all ${
                                              currentInput.note_classe.trim() === "" 
                                                ? adminTheme === 'sombre-or'
                                                  ? "border-[#20253f] bg-[#121630] text-white focus:border-[#dfcbb0] focus:ring-1 focus:ring-[#dfcbb0]/20"
                                                  : "border-gray-300 bg-white text-gray-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10"
                                                : ccVal.isError 
                                                  ? adminTheme === 'sombre-or'
                                                    ? "!border-rose-750 !bg-rose-950/40 !text-rose-400"
                                                    : "!border-rose-400 !bg-rose-50 !text-rose-700"
                                                  : adminTheme === 'sombre-or'
                                                    ? "!border-emerald-750 !bg-emerald-950/40 !text-emerald-400"
                                                    : "!border-emerald-400 !bg-emerald-50 !text-emerald-700"
                                            }`}
                                          />
                                        </div>
                                      </div>

                                      {/* EX input */}
                                      <div className="col-span-2 flex items-center justify-between md:justify-center gap-2">
                                        <span className="md:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest">EX (60%) :</span>
                                        <div className="relative">
                                          <input 
                                            type="text"
                                            placeholder="-"
                                            value={currentInput.note_examen}
                                            onChange={e => {
                                              setGridGrades({
                                                ...gridGrades,
                                                [cellKey]: { ...currentInput, note_examen: e.target.value }
                                              });
                                            }}
                                            className={`w-16 h-7 text-center text-xs font-black rounded-lg border transition-all ${
                                              currentInput.note_examen.trim() === "" 
                                                ? adminTheme === 'sombre-or'
                                                  ? "border-[#20253f] bg-[#121630] text-white focus:border-[#dfcbb0] focus:ring-1 focus:ring-[#dfcbb0]/20"
                                                  : "border-gray-300 bg-white text-gray-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10"
                                                : exVal.isError 
                                                  ? adminTheme === 'sombre-or'
                                                    ? "!border-rose-750 !bg-rose-950/40 !text-rose-400"
                                                    : "!border-rose-400 !bg-rose-50 !text-rose-700"
                                                  : adminTheme === 'sombre-or'
                                                    ? "!border-emerald-750 !bg-emerald-950/40 !text-emerald-400"
                                                    : "!border-emerald-400 !bg-emerald-50 !text-emerald-700"
                                            }`}
                                          />
                                        </div>
                                      </div>

                                      {/* Weighted live average */}
                                      <div className="col-span-2 flex items-center justify-between md:justify-center gap-2">
                                        <span className="md:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest">Moyenne :</span>
                                        {computed !== null ? (
                                          <span className={`inline-flex items-center justify-center font-mono text-xs font-black px-2 py-0.5 rounded-md border ${
                                            computed >= 10 
                                              ? adminTheme === 'sombre-or'
                                                ? "bg-emerald-950/30 border-emerald-800 text-emerald-400"
                                                : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                              : adminTheme === 'sombre-or'
                                                ? "bg-rose-950/30 border-rose-850 text-rose-400"
                                                : "bg-rose-50 border-rose-200 text-rose-700"
                                          }`}>
                                            Moy: {computed.toFixed(2)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400 font-mono text-xs">—</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        };

                        return (
                          <div className="space-y-3.5">
                            {gridCardLayout === 'single' ? (
                              // Render only the active student card
                              (() => {
                                const activeStudent = filteredStudents[gridActiveStudentIndex] || filteredStudents[0];
                                return renderStudentCard(activeStudent, gridActiveStudentIndex, false);
                              })()
                            ) : (
                              // Render all students cards vertically stacked in order!
                              <div className="space-y-4">
                                {filteredStudents.map((student, idx) => renderStudentCard(student, idx, true))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {gridSubMode === 'matrix' && (
                        <div className="space-y-4 text-left">
                          <div className="bg-blue-50/50 text-blue-950 p-3.5 rounded-xl border border-blue-100 text-xs text-left">
                            <span className="font-extrabold block text-blue-900 mb-1">💡 Saisie Matricielle Globale (LMD)</span>
                            Saisissez ou modifiez directement les notes de CC (Contrôle Continu, 40%) et d'EX (Examen, 60%) pour chaque matière et chaque élève. 
                            Les moyennes sont calculées en temps réel.
                          </div>

                          <div className="border border-gray-250 rounded-xl overflow-hidden shadow-xs">
                            <div className="overflow-x-auto overflow-y-auto max-h-[480px] w-full bg-white">
                              <table className="min-w-max w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 sticky top-0 z-10 shadow-xs border-b border-gray-200">
                                  <tr>
                                    <th className="py-3 px-4 font-bold text-left uppercase text-[10px] tracking-wider text-gray-700 bg-slate-50 sticky left-0 z-20 min-w-[200px] border-r border-gray-200">
                                      Étudiant
                                    </th>
                                    {filteredMatieres.map(m => (
                                      <th key={m.id} className="py-3 px-3 text-center uppercase text-[10px] tracking-wider text-gray-700 bg-slate-50 border-r border-gray-200 w-44">
                                        <div className="font-bold text-slate-900 truncate max-w-[170px]" title={m.nom_matiere}>
                                          {m.nom_matiere}
                                        </div>
                                        <div className="text-[9px] text-amber-600 font-mono font-bold uppercase mt-0.5">
                                          {m.code_matiere} • {m.credits} ECTS
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-150 bg-white">
                                  {filteredStudents.map(st => (
                                    <tr key={st.id} className="hover:bg-slate-50/85 transition-colors bg-white">
                                      <td className="py-3 px-4 text-left font-bold text-slate-900 sticky left-0 z-10 bg-white border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="text-gray-900">{st.nom} {st.prenom}</div>
                                        <div className="font-mono text-[9px] text-gray-500 font-semibold uppercase mt-0.5 tracking-wider">{st.matricule}</div>
                                      </td>
                                      {filteredMatieres.map(m => {
                                        const cellKey = `${st.id}_${m.id}`;
                                        const currentInput = gridGrades[cellKey] || { note_classe: "", note_examen: "" };
                                        const computed = calculateLiveWeighted(currentInput.note_classe, currentInput.note_examen);

                                        // validation classes
                                        const ccVal = getValidationInfo(currentInput.note_classe, adminTheme);
                                        const exVal = getValidationInfo(currentInput.note_examen, adminTheme);

                                        return (
                                          <td key={m.id} className="py-3 px-3 text-center border-r border-gray-200 bg-slate-50/30">
                                            <div className="flex items-center justify-center gap-1.5">
                                              {/* CC Input */}
                                              <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">CC</span>
                                                <input 
                                                  type="text"
                                                  placeholder="-"
                                                  value={currentInput.note_classe}
                                                  onChange={e => {
                                                    setGridGrades({
                                                      ...gridGrades,
                                                      [cellKey]: { ...currentInput, note_classe: e.target.value }
                                                    });
                                                  }}
                                                  className={`w-14 text-center py-1 px-1.5 text-xs font-black rounded-lg border transition-all ${
                                                    currentInput.note_classe.trim() === "" 
                                                      ? "border-gray-200 bg-white text-gray-900 focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/10"
                                                      : ccVal.isError 
                                                        ? "!border-rose-400 !bg-rose-50 !text-rose-700 font-bold"
                                                        : "!border-emerald-400 !bg-emerald-50 !text-emerald-700 font-bold"
                                                  }`}
                                                />
                                              </div>

                                              {/* EX Input */}
                                              <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">EX</span>
                                                <input 
                                                  type="text"
                                                  placeholder="-"
                                                  value={currentInput.note_examen}
                                                  onChange={e => {
                                                    setGridGrades({
                                                      ...gridGrades,
                                                      [cellKey]: { ...currentInput, note_examen: e.target.value }
                                                    });
                                                  }}
                                                  className={`w-14 text-center py-1 px-1.5 text-xs font-black rounded-lg border transition-all ${
                                                    currentInput.note_examen.trim() === "" 
                                                      ? "border-gray-200 bg-white text-gray-900 focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/10"
                                                      : exVal.isError 
                                                        ? "!border-rose-400 !bg-rose-50 !text-rose-700 font-bold"
                                                        : "!border-emerald-400 !bg-emerald-50 !text-emerald-700 font-bold"
                                                  }`}
                                                />
                                              </div>
                                            </div>

                                            {/* Computed average */}
                                            {computed !== null ? (
                                              <div className="mt-1 flex items-center justify-center">
                                                <span className={`inline-flex items-center justify-center font-mono text-[9.5px] font-black px-1.5 py-0.5 rounded-md border ${
                                                  computed >= 10 
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                                    : "bg-rose-50 border-rose-200 text-rose-700"
                                                }`}>
                                                  Moy: {computed.toFixed(1)}
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="h-4 mt-1"></div>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => {
                            // Reload existing notes
                            const initialGrid: Record<string, { note_classe: string; note_examen: string }> = {};
                            filteredStudents.forEach(st => {
                              filteredMatieres.forEach(m => {
                                const existing = notes.find(n => 
                                  Number(n.etudiant_id) === Number(st.id) &&
                                  Number(n.semestre_id) === Number(selectedSemesterId) &&
                                  cours.find(c => c.id === n.cours_id)?.titre === m.nom_matiere
                                );
                                initialGrid[`${st.id}_${m.id}`] = {
                                  note_classe: existing?.note_classe !== undefined ? existing.note_classe.toString() : "",
                                  note_examen: existing?.note_examen !== undefined ? existing.note_examen.toString() : ""
                                };
                              });
                            });
                            setGridGrades(initialGrid);
                            setSuccessMessage("La grille de notes a été réinitialisée avec les valeurs enregistrées.");
                          }}
                          className="btn bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold"
                        >
                          Réinitialiser la grille
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary font-bold text-xs inline-flex items-center gap-1.5"
                        >
                          <Save className="w-4 h-4" /> Enregistrer la Grille Globale
                        </button>
                      </div>
                    </div>
                  );
                })()}
                </form>
              </div>
            )}

            {/* --- MODE 3: IMPORTATION RAPIDE PAR COPIER-COLLER --- */}
            {entryMode === 'paste' && (
              <div className="space-y-4">
                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100/50 text-[11px] text-indigo-950 leading-relaxed">
                  <h4 className="font-black text-indigo-900 mb-1">📋 Guide d'utilisation de l'import rapide</h4>
                  <p>Idéal pour copier des notes depuis **Excel**, **Google Sheets**, ou un fichier texte. Renseignez la matière visée, puis collez les notes au format :</p>
                  <code className="text-[10.5px] font-mono bg-white font-black text-indigo-800 block px-2.5 py-1 rounded border border-indigo-150 mt-1 w-fit">
                    MATRICULE [SÉPARATEUR] NOTE_CLASSE [SÉPARATEUR] NOTE_EXAMEN
                  </code>
                  <p className="mt-1 text-slate-500">Séparateurs supportés : tabulations (copié d'excel), points-virgules, ou virgules. Exemple :</p>
                  <pre className="font-mono bg-white p-2 text-[9.5px] leading-tight rounded border border-indigo-150 mt-1 select-all">
                    ETU20250001;14.5;13{"\n"}
                    ETU20250002;12;15.5
                  </pre>
                </div>

                {/* Filters selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Filière Académique *</label>
                    <select 
                      value={selectedFiliereId} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (onFiliereChange) {
                          onFiliereChange(val);
                        } else {
                          setLocalFiliereId(val);
                        }
                        setPasteAnalyzedRows([]);
                      }}
                      className="form-control text-xs w-full py-2 px-3 focus:ring-1 focus:ring-blue-500 bg-white font-bold"
                    >
                      <option value="">Sélectionner une filière...</option>
                      {filieres.map(f => (
                        <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Session Académique *</label>
                    <select 
                      value={selectedSemesterId} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (onSemestreChange) {
                          onSemestreChange(val);
                        } else {
                          setLocalSemesterId(val);
                        }
                        setPasteAnalyzedRows([]);
                      }}
                      className="form-control text-pivoted text-xs w-full py-2 px-3 bg-white font-bold"
                    >
                      {semestres
                        .filter(s => !selectedFiliereId || !s.filiere_id || Number(s.filiere_id) === Number(selectedFiliereId))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.nom_semestre} ({s.annee_scolaire})</option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Matière visée *</label>
                    <select
                      value={pasteMatiereId}
                      onChange={e => {
                        setPasteMatiereId(Number(e.target.value));
                        setPasteAnalyzedRows([]);
                      }}
                      className="form-control text-xs w-full py-2 px-3 font-bold bg-white"
                      disabled={!selectedFiliereId}
                    >
                      <option value="">Sélectionner la matière...</option>
                      {matieres.filter(m => 
                        Number(m.filiere_id) === Number(selectedFiliereId) &&
                        (!m.semestre_id || Number(m.semestre_id) === Number(selectedSemesterId))
                      ).map(m => (
                        <option key={m.id} value={m.id}>{m.nom_matiere} ({m.code_matiere})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Zone de données copier-coller (Données brutes)</label>
                  <textarea 
                    rows={6}
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder="ETU20250001;14.5;13&#10;ETU20250002;12;15.5"
                    className="form-control font-mono text-xs w-full p-3 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={handleAnalyzePaste}
                    className="btn bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" /> Analyser ces données
                  </button>
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-300 text-rose-850 p-4 rounded-xl text-xs flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    <span className="font-bold">{errorMessage}</span>
                  </div>
                )}

                {pasteAnalyzedRows.length > 0 && (() => {
                  const pasteMatiereObj = matieres.find(m => m.id === pasteMatiereId);
                  return (
                    <div className="space-y-4 border-t border-gray-150 pt-4" id="paste-analyzer-preview">
                      {/* Active subject info banner in Paste Mode */}
                      {pasteMatiereObj && (
                        <div className="bg-[#101428] text-white p-4 rounded-xl border border-[#20253f] shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-[#dfcbb0]" />
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Importation de notes pour la matière :</span>
                              <h4 className="text-sm font-black text-white">{pasteMatiereObj.nom_matiere}</h4>
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Code & Crédits</span>
                            <span className="text-xs font-mono font-bold text-[#dfcbb0]">{pasteMatiereObj.code_matiere} — {pasteMatiereObj.credits} ECTS</span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-gray-200">
                        <div className="text-xs text-left">
                          <span className="font-extrabold text-slate-800">Résultat d'analyse :</span>
                          <div className="mt-1 font-semibold space-x-3">
                            <span className="text-emerald-700">{pasteAnalyzedRows.filter(r => r.isValid).length} valides</span>
                            <span className="text-rose-600">{pasteAnalyzedRows.filter(r => !r.isValid).length} ignorés</span>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={handleConfirmPasteImport}
                          disabled={pasteAnalyzedRows.filter(r => r.isValid).length === 0}
                          className={`btn btn-primary font-bold text-xs inline-flex items-center gap-1.5 ${
                            pasteAnalyzedRows.filter(r => r.isValid).length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Save className="w-4 h-4" /> Confirmer l'importation de {pasteAnalyzedRows.filter(r => r.isValid).length} lignes
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs max-h-60 overflow-y-auto overflow-x-auto">
                        <table className="custom-table min-w-[700px] w-full" style={{ boxShadow: 'none' }}>
                          <thead>
                            <tr>
                              <th className="py-3 px-4 font-bold text-left uppercase text-[11px] tracking-wider">Ligne / Matricule</th>
                              <th className="py-3 px-4 font-bold text-left uppercase text-[11px] tracking-wider">Étudiant / Matière</th>
                              <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-24">Note CC</th>
                              <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-24">Note Exam</th>
                              <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-24">Moyenne</th>
                              <th className="py-3 px-4 font-bold text-center uppercase text-[11px] tracking-wider w-28">Validité</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pasteAnalyzedRows.map(row => {
                              const cc = parseFloat(row.noteClasse);
                              const ds = parseFloat(row.noteExamen);
                              const avgVal = row.isValid ? (cc * 0.4) + (ds * 0.6) : null;
                              
                              return (
                                <tr key={row.id} className={`border-b border-[#20253f] last:border-b-0 transition-colors ${row.isValid ? 'bg-slate-900/40 hover:bg-slate-900/60' : 'bg-rose-950/20 hover:bg-rose-950/30'}`}>
                                  <td className="py-3 px-4 text-left">
                                    <div className="font-extrabold text-[#cca072] font-mono text-[10.5px] uppercase tracking-wider">Ligne #{row.id}</div>
                                    <div className="font-mono text-[11px] font-black text-amber-500 uppercase mt-0.5">{row.matricule}</div>
                                  </td>
                                  <td className="py-3 px-4 font-bold text-white text-xs text-left">
                                    <div>{row.studentName}</div>
                                    {pasteMatiereObj && (
                                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                                        <span className="text-gray-400 font-normal">Matière ciblé :</span>
                                        <span className="text-[#dfcbb0] font-bold bg-[#1d1b24] px-1.5 py-0.2 rounded border border-[#dfcbb0]/20 font-sans">
                                          {pasteMatiereObj.nom_matiere}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center font-black text-xs text-slate-200">{row.noteClasse} / 20</td>
                                  <td className="py-3 px-4 text-center font-black text-xs text-slate-200">{row.noteExamen} / 20</td>
                                  <td className="py-3 px-4 text-center">
                                    {avgVal !== null ? (
                                      <span className={`inline-flex items-center justify-center font-mono text-xs font-black px-2 py-0.5 rounded-lg border ${
                                        avgVal >= 10 
                                          ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400" 
                                          : "bg-rose-950/40 border-rose-500/20 text-rose-400"
                                      }`}>
                                        {avgVal.toFixed(2)}
                                      </span>
                                    ) : <span className="text-slate-500 font-bold text-xs select-none">-</span>}
                                  </td>
                                <td className="py-3 px-4 text-center">
                                  {row.isValid ? (
                                    <span className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-black uppercase text-[10px] tracking-wider px-2.5 py-1 rounded-lg">
                                      Prêt ✓
                                    </span>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="bg-rose-950/60 border border-rose-500/30 text-rose-400 font-black uppercase text-[10px] tracking-wider px-2.5 py-1 rounded-lg">
                                        Rejeté ✗
                                      </span>
                                      <span className="text-[10px] text-rose-300 font-medium block text-center max-w-[150px] leading-tight mt-0.5">{row.errorReason}</span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT VALIDATED EVALUATIONS LIST (Under the workflow, spans full 12 columns) */}
        <div className="xl:col-span-12">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" id="grades-history-card">
            <div className="px-5 py-4 border-b border-gray-150 bg-gray-55 flex justify-between items-center bg-gray-50">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                {selectedFiliereId > 0 ? `Notes : ${filieres.find(f => f.id === selectedFiliereId)?.nom_filiere}` : "Évaluations validées"}
              </h4>
              <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
                {notes.filter(n => {
                  const s = etudiants.find(e => Number(e.id) === Number(n.etudiant_id));
                  const matchesFiliere = !selectedFiliereId || Number(s?.filiere_id) === Number(selectedFiliereId);
                  const matchesSem = !selectedSemesterId || Number(n.semestre_id) === Number(selectedSemesterId);
                  return matchesFiliere && matchesSem;
                }).length} notes
              </span>
            </div>
            
            <div className="divide-y divide-gray-150 max-h-[600px] overflow-y-auto">
              {notes.filter(n => {
                const s = etudiants.find(e => Number(e.id) === Number(n.etudiant_id));
                const matchesFiliere = !selectedFiliereId || Number(s?.filiere_id) === Number(selectedFiliereId);
                const matchesSem = !selectedSemesterId || Number(n.semestre_id) === Number(selectedSemesterId);
                return matchesFiliere && matchesSem;
              }).length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">Aucune évaluation correspondante pour cette sélection.</div>
              ) : (
                [...notes].reverse().filter(note => {
                  const s = etudiants.find(e => Number(e.id) === Number(note.etudiant_id));
                  const matchesFiliere = !selectedFiliereId || Number(s?.filiere_id) === Number(selectedFiliereId);
                  const matchesSem = !selectedSemesterId || Number(note.semestre_id) === Number(selectedSemesterId);
                  return matchesFiliere && matchesSem;
                }).map(note => {
                  const student = etudiants.find(e => Number(e.id) === Number(note.etudiant_id));
                  const parsedCours = cours.find(c => Number(c.id) === Number(note.cours_id));
                  const sem = semestres.find(s => Number(s.id) === Number(note.semestre_id));
                  
                  return (
                    <div key={note.id} className="p-4 hover:bg-slate-50 transition space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                            {sem ? sem.nom_semestre : "S1"}
                          </span>
                          <span className="font-mono font-bold text-gray-800 ml-2">{student ? student.matricule : "-"}</span>
                        </div>
                        <button 
                          onClick={() => {
                            onDeleteNote(note.id);
                          }}
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded px-1.5 py-0.5 font-bold text-[10px]"
                        >
                          Supprimer
                        </button>
                      </div>

                      <div>
                        <div className="font-black text-gray-950 uppercase">{student ? `${student.nom} ${student.prenom}` : "Inconnu"}</div>
                        <div className="text-gray-500 font-medium text-[11px] mt-0.5">{parsedCours ? parsedCours.titre : "Inconnu"}</div>
                      </div>

                      <div className="flex justify-between items-end pt-1">
                        <div>
                          {note.note_classe !== undefined && note.note_examen !== undefined ? (
                            <div className="text-[10px] text-gray-400 space-y-0.5 font-mono">
                              <div>CC (40%): <strong className="text-gray-700">{note.note_classe}/20</strong></div>
                              <div>Exam (60%): <strong className="text-gray-700">{note.note_examen}/20</strong></div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Saisie standard</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400 font-bold block mb-0.5">{note.credits} Crédits</div>
                          <strong className="text-blue-905 font-black bg-blue-50 text-blue-800 border border-blue-100 px-2 py-0.5 rounded text-xs select-all">
                            {Number(note.note).toFixed(2)}/20
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: Bilan des Crédits Académiques en Temps Réel pour CHAQUE étudiant */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4" id="credits-summary-realtime">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-150 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 text-sm">Tableau de Validation des Crédits Académiques</h3>
              <p className="text-[11px] text-gray-400">Suivi en temps réel des ECTS validés (notes ≥ 10/20) pour tous les étudiants du semestre</p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              placeholder="Rechercher un étudiant..."
              value={creditSearchQuery}
              onChange={e => setCreditSearchQuery(e.target.value)}
              className="form-control pl-8 py-1.5 text-xs w-full bg-slate-50 border-gray-200 focus:bg-white focus:border-indigo-405"
            />
          </div>
        </div>

        {(() => {
          const activeStudents = etudiants.filter(e => !selectedFiliereId || Number(e.filiere_id) === Number(selectedFiliereId));
          const filteredForCredits = activeStudents.filter(st => {
            const query = creditSearchQuery.toLowerCase().trim();
            if (!query) return true;
            return (
              st.nom.toLowerCase().includes(query) ||
              st.prenom.toLowerCase().includes(query) ||
              st.matricule.toLowerCase().includes(query)
            );
          });

          if (filteredForCredits.length === 0) {
            return (
              <div className="p-8 text-center text-gray-400 text-xs">
                Aucun étudiant trouvé pour les sélections de filière & recherche actuelles.
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {filteredForCredits.map(st => {
                // Get all matieres for this filiere
                const studentMatieres = matieres.filter(m => 
                  Number(m.filiere_id) === Number(st.filiere_id) &&
                  Number(m.semestre_id) === Number(selectedSemesterId)
                );
                const totalSyllabusCredits = studentMatieres.reduce((sum, m) => sum + Number(m.credits), 0);

                // Find saved grades for st in selected semester
                const studentNotesInSem = notes.filter(n => 
                  Number(n.etudiant_id) === Number(st.id) && 
                  Number(n.semestre_id) === Number(selectedSemesterId)
                );

                // Calculate validated credits
                const validatedCredits = studentNotesInSem
                  .filter(n => Number(n.note) >= 10)
                  .reduce((sum, n) => sum + Number(n.credits), 0);

                // Calculate active average for current semester
                const gradesValueList = studentNotesInSem.map(n => Number(n.note));
                const totalGradesCount = gradesValueList.length;
                const averageSemesterScore = totalGradesCount > 0 
                  ? (gradesValueList.reduce((sum, val) => sum + val, 0) / totalGradesCount)
                  : 0;

                const progressPct = totalSyllabusCredits > 0 
                  ? Math.round((validatedCredits / totalSyllabusCredits) * 100) 
                  : 0;

                const isExpanded = expandedStudentId[st.id] || false;

                // LMD status
                let statusLabel = "En cours d'acquisition";
                let badgeClass = "bg-slate-105 text-slate-700 border-slate-200";
                
                if (totalGradesCount > 0) {
                  if (validatedCredits === totalSyllabusCredits && totalSyllabusCredits > 0) {
                    statusLabel = "Semestre Validé (V.A.)";
                    badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-250";
                  } else if (averageSemesterScore >= 10) {
                    statusLabel = "Validé par Compensation (V.Comp)";
                    badgeClass = "bg-sky-100 text-sky-800 border-sky-200";
                  } else {
                    statusLabel = "Crédits partiels (R.A.)";
                    badgeClass = "bg-rose-100 text-rose-800 border-rose-250";
                  }
                }

                return (
                  <div key={st.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-350 transition-all bg-white shadow-xs">
                    {/* Header Row */}
                    <div 
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 select-none"
                      onClick={() => setExpandedStudentId(prev => ({ ...prev, [st.id]: !isExpanded }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-705 text-xs font-bold font-mono border border-slate-200 flex items-center justify-center shrink-0 uppercase">
                          {st.nom.substring(0, 1)}{st.prenom.substring(0, 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-gray-900 uppercase text-xs leading-none">{st.nom} {st.prenom}</span>
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded leading-none">
                              {st.matricule}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium block mt-1.5">
                            Filière : {filieres.find(f => f.id === st.filiere_id)?.nom_filiere || "-"}
                          </span>
                        </div>
                      </div>

                      {/* Stats Metrics Grid */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs font-bold">
                        {/* Semester average */}
                        <div className="text-left sm:text-center shrink-0">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Moyenne Semestrielle</span>
                          <span className={`font-black text-sm ${averageSemesterScore >= 10 ? 'text-indigo-650' : averageSemesterScore > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                            {totalGradesCount > 0 ? `${averageSemesterScore.toFixed(2)}/20` : 'Non saisi'}
                          </span>
                        </div>

                        {/* Validated ECTS count */}
                        <div className="text-left sm:text-center shrink-0">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Crédits Capitalisés</span>
                          <span className="font-mono text-sm text-slate-900 block font-black">
                            {validatedCredits} <span className="text-[10px] text-gray-400 font-normal">/ {totalSyllabusCredits} ECTS</span>
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-full border ${badgeClass}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Expand Icon */}
                        <div className="text-slate-400 shrink-0 ml-auto md:ml-0">
                          <span className="p-1 hover:bg-slate-150 rounded-full inline-block">
                            <Layers className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-800' : ''}`} />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress slider bar indicator */}
                    <div className="bg-gray-100 h-1.5 w-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${validatedCredits === totalSyllabusCredits && totalSyllabusCredits > 0 ? "bg-emerald-500" : averageSemesterScore >= 10 ? "bg-sky-500" : "bg-indigo-500"}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Expand Detail Grid */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-gray-150 p-4 space-y-3">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-700 block">Détail des modules d'évaluation</span>
                          <span className="text-[10px] text-gray-400 font-semibold font-mono">{studentNotesInSem.length} notes saisies</span>
                        </div>
                        
                        {studentMatieres.length === 0 ? (
                          <p className="text-gray-400 italic text-xs">Aucune matière enregistrée dans cette filière académique.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {studentMatieres.map(m => {
                              // Find corresponding note
                              const activeNoteObj = studentNotesInSem.find(n => {
                                const parCourse = cours.find(c => c.id === n.cours_id);
                                return parCourse ? parCourse.titre === m.nom_matiere : false;
                              });

                              return (
                                <div key={m.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between text-xs hover:border-slate-350 transition-colors">
                                  <div>
                                    <div className="font-extrabold text-slate-900">{m.nom_matiere}</div>
                                    <div className="font-mono text-[9px] text-gray-400 flex items-center gap-2 mt-0.5">
                                      <span>Code: {m.code_matiere}</span>
                                      &bull;
                                      <span className="font-bold text-slate-500">{m.credits} ECTS</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {activeNoteObj ? (
                                      <div className="space-y-1">
                                        <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${Number(activeNoteObj.note) >= 10 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
                                          {Number(activeNoteObj.note).toFixed(2)}/20
                                        </span>
                                        <div className="text-[9px] uppercase font-bold text-gray-400 leading-none mt-1">
                                          {Number(activeNoteObj.note) >= 10 ? 'Capitalisé ✓ (V.A.)' : 'En rattrapage ✗'}
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <span className="bg-gray-100 text-gray-400 font-mono text-[10px] px-2 py-0.5 rounded italic">
                                          Non saisi
                                        </span>
                                        <div className="text-[9px] text-gray-300 font-semibold mt-1">Saisie requise</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
