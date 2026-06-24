import React, { useState, useEffect } from 'react';
import { Note, Etudiant, Cours, Semestre, Matiere, Filiere } from '../types';
import { 
  Plus, Award, Trash2, ShieldAlert, Search, User, 
  BookOpen, Layers, Save, CheckCircle, GraduationCap, Clock 
} from 'lucide-react';

const getValidationInfo = (valStr: string) => {
  const trimmed = valStr.trim();
  if (trimmed === "") {
    return {
      isValid: true,
      className: "border-[#23273e] bg-[#0d1021] text-white focus:border-[#c5a880] focus:ring-[#c5a880]/20 font-medium text-sm shadow-inner",
      helperText: "",
      isError: false
    };
  }
  const num = parseFloat(trimmed);
  if (isNaN(num)) {
    return {
      isValid: false,
      className: "!border-rose-500 !bg-rose-950/40 !text-rose-200 focus:!ring-rose-500/20 shadow-sm shadow-rose-900/30 animate-pulse font-bold text-sm",
      helperText: "Format invalide",
      isError: true
    };
  }
  if (num < 0 || num > 20) {
    return {
      isValid: false,
      className: "!border-rose-500 !bg-rose-950/40 !text-rose-200 focus:!ring-rose-500/20 shadow-sm shadow-rose-900/30 font-bold text-sm",
      helperText: "Hors intervalle (0-20)",
      isError: true
    };
  }
  return {
    isValid: true,
    className: "!border-emerald-500 !bg-emerald-950/40 !text-emerald-300 focus:!ring-emerald-500/20 font-bold text-sm shadow-xs",
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
  onFiliereChange
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
  const [entryMode, setEntryMode] = useState<'individual' | 'collective' | 'paste'>('individual');

  // Collective Saisie states
  const [collectiveMatiereId, setCollectiveMatiereId] = useState<number>(0);
  const [collectiveGrades, setCollectiveGrades] = useState<Record<number, { note_classe: string; note_examen: string }>>({});

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

  const handleSwitchMode = (mode: 'individual' | 'collective' | 'paste') => {
    setEntryMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setMatriculeError("");
    setSearchedStudent(null);
    setSearchHasBeenRun(false);
    setGradesInput({});
    setCollectiveGrades({});
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
              
              {/* Mode Multi-Saisie Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-gray-200 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('individual')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                    entryMode === 'individual'
                      ? 'bg-white text-blue-905 shadow-xs border border-gray-200/50'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Par Élève
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('collective')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                    entryMode === 'collective'
                      ? 'bg-white text-blue-905 shadow-xs border border-gray-200/50'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Par Matière (Collectif)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('paste')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                    entryMode === 'paste'
                      ? 'bg-white text-blue-905 shadow-xs border border-gray-200/50'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Import Copier-Coller
                </button>
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
                                <th className="py-3 px-4 font-bold text-left uppercase text-[11px] tracking-wider">Matière obligatoire</th>
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
                                  <tr key={m.id} className="hover:bg-slate-900/40 transition border-b border-[#20253f] last:border-b-0">
                                    <td className="py-4 px-4">
                                      <div className="font-bold text-white text-sm">{m.nom_matiere}</div>
                                      <div className="font-mono text-[10px] text-amber-500/85 font-semibold mt-0.5 uppercase tracking-wider">{m.code_matiere}</div>
                                      {matchingNotesForMatiere.length > 0 && (
                                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#cca072] font-semibold bg-[#191410] px-2 py-0.5 rounded border border-[#cca072]/20 w-fit">
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>Déjà {matchingNotesForMatiere.length} évaluation(s) saisie(s)</span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-300 text-xs bg-slate-950/20">{m.credits} ECTS</td>
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
                                          className={`py-2 px-3 text-center text-sm font-extrabold w-32 focus:ring-2 focus:outline-none rounded-xl border transition-all ${getValidationInfo(currentInput.note_classe).className}`}
                                        />
                                        {getValidationInfo(currentInput.note_classe).helperText && (
                                          <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 block px-2 py-0.5 rounded border text-center ${getValidationInfo(currentInput.note_classe).isError ? 'text-rose-400 bg-rose-950/40 border-rose-900/30' : 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30'}`}>
                                            {getValidationInfo(currentInput.note_classe).helperText}
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
                                          className={`py-2 px-3 text-center text-sm font-extrabold w-32 focus:ring-2 focus:outline-none rounded-xl border transition-all ${getValidationInfo(currentInput.note_examen).className}`}
                                        />
                                        {getValidationInfo(currentInput.note_examen).helperText && (
                                          <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 block px-2 py-0.5 rounded border text-center ${getValidationInfo(currentInput.note_examen).isError ? 'text-rose-400 bg-rose-950/40 border-rose-900/30' : 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30'}`}>
                                            {getValidationInfo(currentInput.note_examen).helperText}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      {computed !== null ? (
                                        <span className={`inline-flex items-center justify-center font-mono text-sm font-black px-3 py-1 rounded-xl border ${
                                          computed >= 10 
                                            ? "bg-emerald-950/50 border-emerald-500/35 text-emerald-400 shadow-sm shadow-emerald-950/20" 
                                            : "bg-rose-950/50 border-rose-500/35 text-rose-400 shadow-sm shadow-rose-950/20"
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
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto w-full">
                          <table className="custom-table min-w-[750px] w-full" style={{ boxShadow: 'none' }}>
                            <thead>
                              <tr>
                                <th className="py-3 px-4 font-bold text-left uppercase text-[11px] tracking-wider">Étudiant</th>
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
                                  <tr key={st.id} className="hover:bg-slate-900/40 transition border-b border-[#20253f] last:border-b-0">
                                    <td className="py-4 px-4">
                                      <div className="font-bold text-white text-sm">{st.nom} {st.prenom}</div>
                                      <div className="font-mono text-[10.5px] text-amber-500/85 font-semibold mt-0.5 uppercase tracking-wider">{st.matricule}</div>
                                      {matchingNotesForMatiere.length > 0 && (
                                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#cca072] font-semibold bg-[#191410] px-2 py-0.5 rounded border border-[#cca072]/20 w-fit">
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
                                          className={`py-2 px-3 text-center text-sm font-extrabold w-32 focus:ring-2 focus:outline-none rounded-xl border transition-all ${getValidationInfo(currentInput.note_classe).className}`}
                                        />
                                        {getValidationInfo(currentInput.note_classe).helperText && (
                                          <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 block px-2 py-0.5 rounded border text-center ${getValidationInfo(currentInput.note_classe).isError ? 'text-rose-400 bg-rose-950/40 border-rose-900/30' : 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30'}`}>
                                            {getValidationInfo(currentInput.note_classe).helperText}
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
                                          className={`py-2 px-3 text-center text-sm font-extrabold w-32 focus:ring-2 focus:outline-none rounded-xl border transition-all ${getValidationInfo(currentInput.note_examen).className}`}
                                        />
                                        {getValidationInfo(currentInput.note_examen).helperText && (
                                          <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 block px-2 py-0.5 rounded border text-center ${getValidationInfo(currentInput.note_examen).isError ? 'text-rose-400 bg-rose-950/40 border-rose-900/30' : 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30'}`}>
                                            {getValidationInfo(currentInput.note_examen).helperText}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      {computed !== null ? (
                                        <span className={`inline-flex items-center justify-center font-mono text-sm font-black px-3 py-1 rounded-xl border ${
                                          computed >= 10 
                                            ? "bg-emerald-950/50 border-emerald-500/35 text-emerald-400 shadow-sm shadow-emerald-950/20" 
                                            : "bg-rose-950/50 border-rose-500/35 text-rose-400 shadow-sm shadow-rose-950/20"
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

                {pasteAnalyzedRows.length > 0 && (
                  <div className="space-y-4 border-t border-gray-150 pt-4" id="paste-analyzer-preview">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-gray-200">
                      <div className="text-xs">
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
                            <th className="py-3 px-4 font-bold text-left uppercase text-[11px] tracking-wider">Étudiant identifié</th>
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
                                <td className="py-3 px-4">
                                  <div className="font-extrabold text-[#cca072] font-mono text-[10.5px] uppercase tracking-wider">Ligne #{row.id}</div>
                                  <div className="font-mono text-[11px] font-black text-amber-500 uppercase mt-0.5">{row.matricule}</div>
                                </td>
                                <td className="py-3 px-4 font-bold text-white text-xs">{row.studentName}</td>
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
                )}
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
