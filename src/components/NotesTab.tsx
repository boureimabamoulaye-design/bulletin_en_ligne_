import React, { useState } from 'react';
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
      className: "border-slate-700 bg-[#0d101d] text-white",
      helperText: "",
      isError: false
    };
  }
  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0 || num > 20) {
    return {
      isValid: false,
      className: "!border-rose-500 !bg-rose-950/20 !text-rose-250 focus:!ring-rose-500/30 focus:!border-rose-450",
      helperText: "Invalide (0-20)",
      isError: true
    };
  }
  return {
    isValid: true,
    className: "!border-emerald-500 !bg-emerald-950/25 !text-emerald-250 focus:!ring-emerald-500/30 focus:!border-emerald-450",
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
  globalFiliereId,
  globalSemestreId
}: NotesTabProps) {
  // --- STATES ---
  const [localFiliereId, setLocalFiliereId] = useState<number>(filieres[0]?.id || 0);
  const [matriculeQuery, setMatriculeQuery] = useState("");
  const [searchedStudent, setSearchedStudent] = useState<Etudiant | null>(null);
  const [searchHasBeenRun, setSearchHasBeenRun] = useState(false);
  const [localSemesterId, setLocalSemesterId] = useState<number>(semestres[0]?.id || 0);

  const selectedFiliereId = globalFiliereId && globalFiliereId > 0 ? globalFiliereId : localFiliereId;
  const selectedSemesterId = globalSemestreId && globalSemestreId > 0 ? globalSemestreId : localSemesterId;

  // States to keep class/exam scores for loaded subjects
  // Key represents matiere.id
  const [gradesInput, setGradesInput] = useState<Record<number, { note_classe: string; note_examen: string }>>({});
  const [matriculeError, setMatriculeError] = useState("");

  // Search/Load student from matricule
  const handleLoadStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setMatriculeError("");
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
      // Retrieve subjects of their filiere and reset grade input map
      const studentMatieres = matieres.filter(m => m.filiere_id === selectedFiliereId);
      
      if (studentMatieres.length === 0) {
        setMatriculeError(`Aucune matière n'est configurée pour la filière sélectionnée. Veuillez d'abord en ajouter dans l'onglet Filières & Matières !`);
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

    // Weight formula: Class Grade counts for 60%, Exam Grade counts for 40%
    return (validCC * 0.6) + (validDS * 0.4);
  };

  // Batch insert class/exam notes for loaded matricule
  const handleSyllabusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedStudent) return;

    const studentMatieres = matieres.filter(m => m.filiere_id === searchedStudent.filiere_id);
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

        const weightedScore = (cc * 0.6) + (ds * 0.4);
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
      alert("Erreur de validation : Toutes les notes saisies (de classe et d'examen) doivent être de vrais nombres compris strictment entre 0 et 20.");
      return;
    }

    if (!entriesFound) {
      alert("Veuillez saisir au moins des notes de classe et d'examen pour une matière.");
      return;
    }

    // Call batched state addition
    onAddNotes(gradesToSubmit);

    // Reset everything
    setSearchedStudent(null);
    setMatriculeQuery("");
    setSearchHasBeenRun(false);
    setGradesInput({});
    alert(`Félicitations! Les devoirs et évaluations de l'étudiant ont été enregistrés et pondérés à 60% (classe) et 40% (examen) avec succès.`);
  };

  return (
    <div className="space-y-6" id="notes-management-container">

      {/* Primary Grid View: Saisie Left, Logs Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE WORKFLOW (7 columns) */}
        <div className="xl:col-span-7 space-y-6">
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6" id="matricule-syllabus-card">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Award className="w-5 h-5 text-blue-900" />
              <div>
                <h3 className="font-bold text-gray-950 text-sm">Saisie du Relevé par Matricule</h3>
                <p className="text-[11px] text-gray-400">Pondération réglementaire de classe (60%) et d'examen final (40%)</p>
              </div>
            </div>

            {/* Matricule Entry Search Bar with Filiere selector */}
            <form onSubmit={handleLoadStudent} className="bg-slate-50 p-5 rounded-xl border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filière select dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Filière Académique *</label>
                  {globalFiliereId && globalFiliereId > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 p-2 rounded text-xs font-bold text-blue-900 select-none">
                      {filieres.find(f => f.id === globalFiliereId)?.nom_filiere}
                    </div>
                  ) : (
                    <select 
                      value={selectedFiliereId} 
                      onChange={e => {
                        setLocalFiliereId(Number(e.target.value));
                        // Reset search status on filière change
                        setSearchedStudent(null);
                        setSearchHasBeenRun(false);
                        setMatriculeError("");
                      }}
                      className="form-control text-xs w-full py-2 px-3 focus:ring-1 focus:ring-blue-500 bg-white"
                      required
                    >
                      <option value="">Sélectionner une filière...</option>
                      {filieres.map(f => (
                        <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                      ))}
                    </select>
                  )}
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
                  {globalSemestreId && globalSemestreId > 0 ? (
                    <div className="bg-slate-100 border border-slate-200 p-2 rounded text-xs font-bold text-slate-800 select-none">
                      {semestres.find(s => s.id === globalSemestreId)?.nom_semestre}
                    </div>
                  ) : (
                    <select 
                      value={selectedSemesterId} 
                      onChange={e => {
                        setLocalSemesterId(Number(e.target.value));
                        // Reset loaded student to refresh semester-based matching notes
                        setSearchedStudent(null);
                        setSearchHasBeenRun(false);
                        setMatriculeError("");
                      }}
                      className="form-control text-pivoted text-xs w-full py-2 px-3 bg-white"
                      required
                    >
                      {semestres.map(s => (
                        <option key={s.id} value={s.id}>{s.nom_semestre} ({s.annee_scolaire})</option>
                      ))}
                    </select>
                  )}
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
                        {filieres.find(f => f.id === searchedStudent.filiere_id)?.nom_filiere || "Inconnue"}
                      </strong></span>
                    </div>
                  </div>
                </div>

                {/* Syllabus-wide subjects entry */}
                <form onSubmit={handleSyllabusSubmit} className="space-y-4">
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto w-full">
                      <table className="custom-table w-full text-xs" style={{ boxShadow: 'none' }}>
                        <thead>
                          <tr className="bg-gray-55 text-gray-700">
                            <th className="py-2.5 px-3 font-bold text-left uppercase text-[10px]">Matière obligatoire</th>
                            <th className="py-2.5 px-3 font-bold text-center uppercase text-[10px] w-14">Crédits</th>
                            <th className="py-2.5 px-3 font-bold text-center uppercase text-[10px] w-28">Note Classe (60%)</th>
                            <th className="py-2.5 px-3 font-bold text-center uppercase text-[10px] w-28">Note Examen (40%)</th>
                            <th className="py-2.5 px-3 font-bold text-center uppercase text-[10px] w-28">Note Finale Est.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matieres.filter(m => m.filiere_id === searchedStudent.filiere_id).map(m => {
                            const currentInput = gradesInput[m.id] || { note_classe: "", note_examen: "" };
                            const computed = calculateLiveWeighted(currentInput.note_classe, currentInput.note_examen);
                            
                            // Check if this student already has notes in class for this subject and semester
                            const matchingNotesForMatiere = notes.filter(n => {
                              const noteCours = cours.find(c => c.id === n.cours_id);
                              return (
                                n.etudiant_id === searchedStudent.id && 
                                n.semestre_id === selectedSemesterId && 
                                noteCours?.titre === m.nom_matiere
                              );
                            });

                            return (
                              <tr key={m.id} className="hover:bg-slate-50 transition border-b border-gray-150 last:border-b-0">
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-gray-900">{m.nom_matiere}</div>
                                  <div className="font-mono text-[9px] text-gray-400 mt-0.5">{m.code_matiere}</div>
                                  {matchingNotesForMatiere.length > 0 && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded w-fit">
                                      <Clock className="w-3 h-3" />
                                      <span>Déjà {matchingNotesForMatiere.length} évaluation(s) saisie(s)</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center font-bold text-gray-500 font-bold text-gray-600">{m.credits} ECTS</td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex flex-col items-center">
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
                                      className={`form-control py-1 px-2 text-center text-xs font-bold w-20 mx-auto ${getValidationInfo(currentInput.note_classe).className}`}
                                    />
                                    {getValidationInfo(currentInput.note_classe).helperText && (
                                      <span className={`text-[9px] font-bold mt-1 block ${getValidationInfo(currentInput.note_classe).isError ? 'text-rose-400' : 'text-emerald-450'}`}>
                                        {getValidationInfo(currentInput.note_classe).helperText}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex flex-col items-center">
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
                                      className={`form-control py-1 px-2 text-center text-xs font-bold w-20 mx-auto ${getValidationInfo(currentInput.note_examen).className}`}
                                    />
                                    {getValidationInfo(currentInput.note_examen).helperText && (
                                      <span className={`text-[9px] font-bold mt-1 block ${getValidationInfo(currentInput.note_examen).isError ? 'text-rose-400' : 'text-emerald-450'}`}>
                                        {getValidationInfo(currentInput.note_examen).helperText}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {computed !== null ? (
                                    <strong className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                                      computed >= 10 
                                        ? "bg-emerald-100 text-emerald-800" 
                                        : "bg-rose-100 text-rose-800"
                                    }`}>
                                      {computed.toFixed(2)}/20
                                    </strong>
                                  ) : (
                                    <span className="text-gray-350 italic text-[11px]">-</span>
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
                      className="btn btn-primary font-bold text-xs inline-flex items-center gap-1.5"
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
                <span>Saisir le numéro de matricule d'un élève (ex: <strong className="font-mono text-gray-600">ETU20250001</strong>) et cliquer sur « Charger le Syllabus » pour débuter.</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT VALIDATED EVALUATIONS LIST (5 columns) */}
        <div className="xl:col-span-5">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" id="grades-history-card">
            <div className="px-5 py-4 border-b border-gray-150 bg-gray-55 flex justify-between items-center bg-gray-50">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                {selectedFiliereId > 0 ? `Notes : ${filieres.find(f => f.id === selectedFiliereId)?.nom_filiere}` : "Évaluations validées"}
              </h4>
              <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
                {notes.filter(n => {
                  const s = etudiants.find(e => e.id === n.etudiant_id);
                  const matchesFiliere = !selectedFiliereId || s?.filiere_id === selectedFiliereId;
                  const matchesSem = !selectedSemesterId || n.semestre_id === selectedSemesterId;
                  return matchesFiliere && matchesSem;
                }).length} notes
              </span>
            </div>
            
            <div className="divide-y divide-gray-150 max-h-[600px] overflow-y-auto">
              {notes.filter(n => {
                const s = etudiants.find(e => e.id === n.etudiant_id);
                const matchesFiliere = !selectedFiliereId || s?.filiere_id === selectedFiliereId;
                const matchesSem = !selectedSemesterId || n.semestre_id === selectedSemesterId;
                return matchesFiliere && matchesSem;
              }).length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">Aucune évaluation correspondante pour cette sélection.</div>
              ) : (
                [...notes].reverse().filter(note => {
                  const s = etudiants.find(e => e.id === note.etudiant_id);
                  const matchesFiliere = !selectedFiliereId || s?.filiere_id === selectedFiliereId;
                  const matchesSem = !selectedSemesterId || note.semestre_id === selectedSemesterId;
                  return matchesFiliere && matchesSem;
                }).map(note => {
                  const student = etudiants.find(e => e.id === note.etudiant_id);
                  const parsedCours = cours.find(c => c.id === note.cours_id);
                  const sem = semestres.find(s => s.id === note.semestre_id);
                  
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
                            if (confirm("Supprimer cette note définitivement ? Cette décision affectera la moyenne de l'étudiant.")) {
                              onDeleteNote(note.id);
                            }
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
                              <div>CC (60%): <strong className="text-gray-700">{note.note_classe}/20</strong></div>
                              <div>Exam (40%): <strong className="text-gray-700">{note.note_examen}/20</strong></div>
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
    </div>
  );
}
