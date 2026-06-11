import React, { useState, useEffect } from 'react';
import { Etudiant, Note, Cours, Semestre, Filiere, Classe, Matiere } from '../types';
import { 
  Award, Printer, Download, BookOpen, User, Calendar, 
  GraduationCap, Pencil, Save, X, Check, Trash2, AlertCircle 
} from 'lucide-react';

const getValidationInfo = (valStr: string) => {
  const trimmed = valStr.trim();
  if (trimmed === "") {
    return {
      isValid: true,
      className: "border-slate-300 bg-white text-gray-800",
      helperText: "",
      isError: false
    };
  }
  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0 || num > 20) {
    return {
      isValid: false,
      className: "!border-rose-500 !bg-rose-50 !text-rose-900 focus:!ring-rose-500",
      helperText: "Invalide (0-20)",
      isError: true
    };
  }
  return {
    isValid: true,
    className: "!border-emerald-500 !bg-emerald-50 !text-emerald-900 focus:!ring-emerald-500",
    helperText: "Valide ✓",
    isError: false
  };
};

interface BulletinsTabProps {
  etudiants: Etudiant[];
  notes: Note[];
  cours: Cours[];
  semestres: Semestre[];
  filieres: Filiere[];
  classes: Classe[];
  matieres: Matiere[];
  onUpdateNote: (id: number, updatedFields: Partial<Note>) => void;
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
  globalFiliereId?: number;
  globalSemestreId?: number;
  onSemestreChange?: (id: number) => void;
  onFiliereChange?: (id: number) => void;
}

export default function BulletinsTab({ 
  etudiants, 
  notes, 
  cours, 
  semestres, 
  filieres, 
  classes,
  matieres,
  onUpdateNote,
  onAddNotes,
  onDeleteNote,
  globalFiliereId,
  globalSemestreId,
  onSemestreChange,
  onFiliereChange
}: BulletinsTabProps) {
  const [localStudentId, setLocalStudentId] = useState<number>(0);
  const [localSemestreId, setLocalSemestreId] = useState<number>(semestres[0]?.id || 0);

  const eligibleStudents = globalFiliereId && globalFiliereId > 0 
    ? etudiants.filter(e => Number(e.filiere_id) === Number(globalFiliereId)) 
    : etudiants;

  const selectedStudentId = localStudentId && eligibleStudents.some(e => Number(e.id) === Number(localStudentId))
    ? localStudentId
    : 0;

  const activeStudent = etudiants.find(e => Number(e.id) === Number(selectedStudentId));

  const activeFiliereFilter = globalFiliereId && globalFiliereId > 0 
    ? globalFiliereId 
    : (activeStudent ? Number(activeStudent.filiere_id) : 0);

  // Sync local semester when active filiere/student changes
  useEffect(() => {
    if (activeFiliereFilter > 0) {
      const filtered = semestres.filter(s => !s.filiere_id || Number(s.filiere_id) === Number(activeFiliereFilter));
      if (filtered.length > 0) {
        if (!filtered.some(s => Number(s.id) === Number(localSemestreId))) {
          setLocalSemestreId(filtered[0].id);
        }
      }
    }
  }, [activeFiliereFilter, semestres, localSemestreId]);

  const selectedSemestreId = globalSemestreId && globalSemestreId > 0 ? globalSemestreId : localSemestreId;

  const activeSem = semestres.find(s => Number(s.id) === Number(selectedSemestreId));

  // --- LOCAL EDIT STATES ---
  const [isEditing, setIsEditing] = useState(false);
  const [editedGrades, setEditedGrades] = useState<Record<number, { note_classe: string; note_examen: string }>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);

  const hasValidationErrors = Object.values(editedGrades).some((input: any) => {
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

  // Reset / cancel edit mode if selected student or semester changes
  useEffect(() => {
    setIsEditing(false);
    setEditedGrades({});
    setValidationError(null);
    setValidationSuccess(null);
  }, [selectedStudentId, selectedSemestreId]);

  // Scheduled subjects of the current semester/filiere
  const studentMatieresOfSem = activeStudent
    ? matieres.filter(m => 
        Number(m.filiere_id) === Number(activeStudent.filiere_id) && 
        Number(m.semestre_id) === Number(selectedSemestreId)
      )
    : [];

  // Filter student grades from general source of truth
  const studentGrades = notes.filter(n => Number(n.etudiant_id) === Number(selectedStudentId) && Number(n.semestre_id) === Number(selectedSemestreId));

  // Define structured grades list to render, adapting if in edit mode
  const gradesToRender = isEditing
    ? studentMatieresOfSem.map(m => {
        const inputs = editedGrades[m.id] || { note_classe: "", note_examen: "" };
        const cc = parseFloat(inputs.note_classe);
        const ds = parseFloat(inputs.note_examen);
        const hasValues = !isNaN(cc) && cc >= 0 && cc <= 20 && !isNaN(ds) && ds >= 0 && ds <= 20;
        const weighted = hasValues ? (cc * 0.4) + (ds * 0.6) : null;

        const existingGrade = studentGrades.find(g => {
          const course = cours.find(c => Number(c.id) === Number(g.cours_id));
          return course?.titre === m.nom_matiere;
        });

        return {
          id: existingGrade?.id,
          matiere_id: m.id,
          nom_matiere: m.nom_matiere,
          code_matiere: m.code_matiere,
          credits: m.credits,
          note_classe: isNaN(cc) ? null : cc,
          note_examen: isNaN(ds) ? null : ds,
          note: weighted,
          isGradesValid: hasValues
        };
      })
    : studentGrades.map(g => {
        const courseObj = cours.find(c => Number(c.id) === Number(g.cours_id));
        const matiereObj = matieres.find(m => m.nom_matiere === courseObj?.titre && Number(m.filiere_id) === Number(activeStudent?.filiere_id));
        return {
          id: g.id,
          matiere_id: matiereObj?.id || 0,
          nom_matiere: courseObj ? courseObj.titre : "Enseignement Général",
          code_matiere: matiereObj ? matiereObj.code_matiere : "GEN-01",
          credits: g.credits,
          note_classe: g.note_classe !== undefined ? g.note_classe : null,
          note_examen: g.note_examen !== undefined ? g.note_examen : null,
          note: Number(g.note),
          isGradesValid: true
        };
      });

  // 2. Compute dynamic average (weighted with credits) - reacts to live typing if editing!
  const activeGPA = (() => {
    const validGrades = gradesToRender.filter(g => g.note !== null);
    if (validGrades.length === 0) return 0;
    
    let sumNotes = 0;
    let sumCredits = 0;
    validGrades.forEach(g => {
      sumNotes += g.note! * Number(g.credits);
      sumCredits += Number(g.credits);
    });

    return sumCredits > 0 ? (sumNotes / sumCredits) : 0;
  })();

  const calculateGPA = (studentId: number, semId: number) => {
    const grades = notes.filter(n => Number(n.etudiant_id) === Number(studentId) && Number(n.semestre_id) === Number(semId));
    if (grades.length === 0) return 0;
    
    let sumNotes = 0;
    let sumCredits = 0;
    grades.forEach(g => {
      sumNotes += Number(g.note) * Number(g.credits);
      sumCredits += Number(g.credits);
    });

    return sumCredits > 0 ? (sumNotes / sumCredits) : 0;
  };

  // 3. Dynamic ranking calculation relative to students in the same level/class
  const getStudentRank = (studentId: number, semId: number) => {
    const studentObj = etudiants.find(e => e.id === studentId);
    if (!studentObj) return { rank: 1, total: 1 };

    // Find all classmates
    const classmates = etudiants.filter(e => Number(e.classe_id) === Number(studentObj.classe_id));
    
    // Compute GPA for all classmates in this semester
    const rankList = classmates.map(c => {
      if (Number(c.id) === Number(studentId)) {
        return { id: c.id, gpa: activeGPA };
      }
      return {
        id: c.id,
        gpa: calculateGPA(c.id, semId)
      };
    }).sort((a, b) => b.gpa - a.gpa);

    const position = rankList.findIndex(item => Number(item.id) === Number(studentId));
    return {
      rank: position !== -1 ? position + 1 : 1,
      total: classmates.length
    };
  };

  const { rank: activeRank, total: activeTotalClassmates } = getStudentRank(selectedStudentId, selectedSemestreId);

  // 4. Mention calculator
  const getMention = (averagedGrade: number) => {
    if (averagedGrade >= 18) return "Excellent";
    if (averagedGrade >= 16) return "Très Bien";
    if (averagedGrade >= 14) return "Bien";
    if (averagedGrade >= 12) return "Assez Bien";
    if (averagedGrade >= 10) return "Passable";
    return "Insuffisant";
  };

  const activeMention = getMention(activeGPA);
  const activeDecision = activeGPA >= 10 ? "Admis" : "Ajourné";

  // Initialize edit mode inputs
  const handleStartEditing = () => {
    setValidationError(null);
    setValidationSuccess(null);
    const initialValues: Record<number, { note_classe: string; note_examen: string }> = {};
    studentMatieresOfSem.forEach(m => {
      const g = studentGrades.find(grade => {
        const c = cours.find(x => x.id === grade.cours_id);
        return c ? c.titre === m.nom_matiere : false;
      });
      initialValues[m.id] = {
        note_classe: g && g.note_classe !== undefined ? g.note_classe.toString() : "",
        note_examen: g && g.note_examen !== undefined ? g.note_examen.toString() : ""
      };
    });
    setEditedGrades(initialValues);
    setIsEditing(true);
  };

  // Save modified grades
  const handleSaveChanges = () => {
    setValidationError(null);
    setValidationSuccess(null);
    if (!activeStudent || !activeSem) return;

    let hasInvalid = false;
    const notesToAdd: {
      etudiant_id: number;
      semestre_id: number;
      credits: number;
      note: number;
      note_classe: number;
      note_examen: number;
      matiere_nom: string;
      matiere_code: string;
    }[] = [];

    studentMatieresOfSem.forEach(m => {
      const input = editedGrades[m.id];
      if (!input) return;

      const ccStr = input.note_classe.trim();
      const dsStr = input.note_examen.trim();

      const existingGrade = studentGrades.find(g => {
        const c = cours.find(x => x.id === g.cours_id);
        return c ? c.titre === m.nom_matiere : false;
      });

      // Clear both = delete
      if (ccStr === "" && dsStr === "") {
        if (existingGrade) {
          onDeleteNote(existingGrade.id);
        }
        return;
      }

      const cc = parseFloat(ccStr);
      const ds = parseFloat(dsStr);

      if (isNaN(cc) || cc < 0 || cc > 20 || isNaN(ds) || ds < 0 || ds > 20) {
        hasInvalid = true;
        return;
      }

      const weighted = (cc * 0.4) + (ds * 0.6);

      if (existingGrade) {
        onUpdateNote(existingGrade.id, {
          note_classe: cc,
          note_examen: ds,
          note: Number(weighted.toFixed(2))
        });
      } else {
        notesToAdd.push({
          etudiant_id: activeStudent.id,
          semestre_id: selectedSemestreId,
          credits: m.credits,
          note: Number(weighted.toFixed(2)),
          note_classe: cc,
          note_examen: ds,
          matiere_nom: m.nom_matiere,
          matiere_code: m.code_matiere
        });
      }
    });

    if (hasInvalid) {
      setValidationError("Erreur de validation : Toutes les notes saisies doivent être de vrais nombres compris entre 0 et 20.");
      return;
    }

    if (notesToAdd.length > 0) {
      onAddNotes(notesToAdd);
    }

    setIsEditing(false);
    setValidationSuccess("Le relevé de notes et le bulletin de l'étudiant ont été mis à jour avec succès !");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    if (!activeStudent || !activeSem) return;
    
    let reportDoc = `====================================================\n`;
    reportDoc += `         BULLETIN SCOLAIRE OFFICIEL\n`;
    reportDoc += `       GROUPE ACADÉMIQUE DE GESTION\n`;
    reportDoc += `====================================================\n\n`;
    reportDoc += `Matricule : ${activeStudent.matricule}\n`;
    reportDoc += `Nom Complet : ${activeStudent.nom} ${activeStudent.prenom}\n`;
    reportDoc += `Sexe : ${activeStudent.sexe} | Date Naiss : ${activeStudent.date_naissance}\n`;
    reportDoc += `Période : ${activeSem.nom_semestre} (${activeSem.annee_scolaire})\n`;
    reportDoc += `Filière : ${filieres.find(x => x.id === activeStudent.filiere_id)?.nom_filiere}\n`;
    reportDoc += `Classe : ${classes.find(x => x.id === activeStudent.classe_id)?.nom_classe}\n`;
    reportDoc += `----------------------------------------------------\n`;
    reportDoc += `Détails des Évaluations :\n`;
    
    studentGrades.forEach(g => {
      const cTitle = cours.find(x => x.id === g.cours_id)?.titre || "Matière";
      reportDoc += `- ${cTitle} (${g.credits} crédits) : ${Number(g.note).toFixed(2)}/20\n`;
    });
    
    reportDoc += `----------------------------------------------------\n`;
    reportDoc += `MOYENNE GÉNÉRALE : ${activeGPA.toFixed(2)} / 20\n`;
    reportDoc += `RANG : ${activeRank} sur ${activeTotalClassmates} étudiants\n`;
    reportDoc += `MENTION : ${activeMention}\n`;
    reportDoc += `DÉCISION DU JURY : ${activeDecision}\n\n`;
    reportDoc += `Fait à Abidjan, le 06/06/2026\n`;
    reportDoc += `Le Secrétaire Général de Direction\n`;
    
    const element = document.createElement("a");
    const file = new Blob([reportDoc], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `bulletin_${activeStudent.matricule}_${activeSem.nom_semestre.replace(" ", "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6" id="bulletins-container">
      {/* Selector ribbon */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-end" id="bulletins-selectors">
         <div className="flex-1 space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-blue-600" /> Choisir l'Étudiant
          </label>
          <select 
            value={selectedStudentId}
            onChange={e => setLocalStudentId(Number(e.target.value))}
            className="form-control"
          >
            <option value={0}>-- Sélectionner un élève --</option>
            {eligibleStudents.length === 0 ? (
              <option value={0} disabled>Aucun étudiant disponible dans cette filière</option>
            ) : (
              eligibleStudents.map(etu => (
                <option key={etu.id} value={etu.id}>{etu.nom} {etu.prenom} ({etu.matricule})</option>
              ))
            )}
          </select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" /> Période Semestrielle
          </label>
          <select 
            value={selectedSemestreId}
            onChange={e => {
              const val = Number(e.target.value);
              if (onSemestreChange) {
                onSemestreChange(val);
              } else {
                setLocalSemestreId(val);
              }
            }}
            className="form-control font-bold"
          >
            {semestres
              .filter(sem => !activeFiliereFilter || !sem.filiere_id || Number(sem.filiere_id) === Number(activeFiliereFilter))
              .map(sem => (
                <option key={sem.id} value={sem.id}>{sem.nom_semestre} ({sem.annee_scolaire})</option>
              ))}
          </select>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleSaveChanges}
                disabled={hasValidationErrors}
                className={`btn font-bold flex items-center gap-1.5 transition-all ${
                  hasValidationErrors
                    ? '!bg-rose-100 !text-rose-700 !border-rose-300 cursor-not-allowed opacity-80'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                title={hasValidationErrors ? "Certaines notes saisies sont hors limites (0-20)" : "Enregistrer toutes les modifications de notes"}
              >
                <Save className="w-4 h-4" /> Enregistrer
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="btn bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold flex items-center gap-1.5"
                title="Annuler les modifications en cours"
              >
                <X className="w-4 h-4" /> Annuler
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleStartEditing}
                disabled={selectedStudentId === 0}
                className="btn bg-amber-500 hover:bg-amber-600 text-white font-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Passer en mode d'édition directe pour ce bulletin"
              >
                <Pencil className="w-4 h-4" /> Modifier les notes
              </button>
              <button 
                onClick={handlePrint}
                disabled={selectedStudentId === 0}
                className="btn bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Lancer l'impression"
              >
                <Printer className="w-4 h-4" /> Imprimer
              </button>
              <button 
                onClick={handleDownloadReport}
                disabled={selectedStudentId === 0}
                className="btn btn-primary font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Télécharger le bulletin textuel"
              >
                <Download className="w-4 h-4" /> Certificat PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main visual display of the report card */}
      {activeStudent && activeSem ? (
        <div className="bg-white p-8 max-w-4xl mx-auto rounded-2xl border-4 border-slate-900 shadow-xl relative overflow-hidden" id="bulletin-official-canvas">
          {/* Subtle decoration background seal */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 pointer-events-none opacity-5 border-8 border-slate-900 rounded-full w-96 h-96 flex items-center justify-center">
            <span className="text-slate-950 font-bold text-3xl tracking-widest text-center">ACADÉMIE<br />SCOLAIRE</span>
          </div>

          {/* Letterhead Header */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start border-b-2 border-slate-800 pb-5 gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 justify-center md:justify-start">
                <BookOpen className="w-6 h-6 text-blue-800" />
                <span>INSTITUT SUPÉRIEUR DES TECHNOLOGIES</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-semibold uppercase">Abidjan - Plateau | Tel: +225 01 02 03 04 05</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Ministère de l'Enseignement Technique & Professionnel</p>
            </div>
            
            <div className="text-center md:text-right border-l-0 md:border-l border-gray-200 pl-0 md:pl-6 shrink-0 font-mono text-xs">
              <strong className="text-slate-950 block">BULLETIN DE NOTES</strong>
              <span className="text-gray-550 block mt-1 bg-slate-100 text-slate-800 py-1 px-3 rounded font-bold uppercase">{activeSem.nom_semestre}</span>
              <span className="text-gray-400 block mt-1">Année {activeSem.annee_scolaire}</span>
            </div>
          </div>

          {/* Identity panel of Student */}
          <div className="my-6 md:flex gap-6 items-start bg-slate-50 border border-slate-200 rounded-xl p-5">
            <GraduationCap 
              className="w-14 h-14 text-slate-800 bg-white p-2.5 rounded-lg border-2 border-slate-900 shadow-md mx-auto md:mx-0 shrink-0 mb-4 md:mb-0" 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs text-slate-850 flex-1">
              <div>
                <dt className="text-gray-400 uppercase font-black tracking-wide">ID Matricule Unifié</dt>
                <dd className="font-mono text-sm font-bold text-slate-900">{activeStudent.matricule}</dd>
              </div>
              <div>
                <dt className="text-gray-400 uppercase font-black tracking-wide">Nom de famille & Prénoms</dt>
                <dd className="text-sm font-black text-slate-950 uppercase">{activeStudent.nom} {activeStudent.prenom}</dd>
              </div>
              <div>
                <dt className="text-gray-400 uppercase font-black tracking-wide">Niveau d'études d'affectation</dt>
                <dd className="font-semibold text-slate-900">{classes.find(c => c.id === activeStudent.classe_id)?.nom_classe}</dd>
              </div>
              <div>
                <dt className="text-gray-400 uppercase font-black tracking-wide">Filière Académique d'Inscription</dt>
                <dd className="font-black text-blue-900 uppercase">
                  {filieres.find(f => f.id === activeStudent.filiere_id)?.nom_filiere}
                </dd>
              </div>
            </div>
          </div>

          {validationError && (
            <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-bold">{validationError}</span>
            </div>
          )}

          {validationSuccess && (
            <div className="mb-4 bg-emerald-50 border border-emerald-250 text-emerald-850 p-4 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold">{validationSuccess}</span>
            </div>
          )}

          {/* Marks table detail */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mt-6">
            <div className="overflow-x-auto w-full">
              <table className="custom-table w-full text-xs" style={{ boxShadow: 'none' }}>
                <thead>
                  <tr className="bg-slate-900 text-slate-100">
                    <th className="font-bold py-2.5 px-4 uppercase text-[10px] text-left">Modules / Cours Validés</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-36">Note CC / Classe (40%)</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-36">Note Examen (60%)</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-24">Moyenne Finale</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-14">Crédits</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-24">Total pondéré</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-24">Mention</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-24">Statut LMD</th>
                  </tr>
                </thead>
                <tbody>
                  {gradesToRender.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500 font-medium font-bold">Aucune note n'a été introduite ce semestre.</td>
                    </tr>
                  ) : (
                    gradesToRender.map(g => {
                      const finalNote = g.note;
                      const notePonderated = finalNote !== null ? finalNote * Number(g.credits) : null;

                      // Calculate individual mention
                      const getSubjMention = (val: number | null) => {
                        if (val === null) return "En attente";
                        if (val >= 16) return "Très Bien";
                        if (val >= 14) return "Bien";
                        if (val >= 12) return "Assez Bien";
                        if (val >= 10) return "Passable";
                        return "Ajourné";
                      };

                      // University LMD validation status: Validé (V.A.) or Compensé (V.Comp.) or Rattrapage (R.A.)
                      let subjStatus = "Rattrapage (R.A.)";
                      let badgeStyle = "bg-rose-100 text-rose-850 border border-rose-250";
                      
                      if (finalNote !== null) {
                        if (finalNote >= 10) {
                          subjStatus = "Capitalisé (V.A.)";
                          badgeStyle = "bg-emerald-100 text-emerald-850 border border-emerald-250";
                        } else if (activeGPA >= 10) {
                          subjStatus = "Compensé (V.Comp)";
                          badgeStyle = "bg-sky-100 text-sky-850 border border-sky-200";
                        }
                      } else {
                        subjStatus = "Non saisi";
                        badgeStyle = "bg-gray-100 text-gray-600 border border-gray-200";
                      }

                      const subjMention = getSubjMention(finalNote);

                      if (isEditing) {
                        const ccVal = editedGrades[g.matiere_id]?.note_classe ?? "";
                        const examVal = editedGrades[g.matiere_id]?.note_examen ?? "";

                        const ccValInfo = getValidationInfo(ccVal);
                        const examValInfo = getValidationInfo(examVal);

                        return (
                          <tr key={g.matiere_id} className="border-b border-gray-150 hover:bg-slate-50 transition text-center">
                            <td className="font-bold text-slate-900 py-3 px-4 text-left">
                              <div>{g.nom_matiere}</div>
                              <div className="text-[10px] font-mono text-gray-400 font-normal">{g.code_matiere}</div>
                            </td>
                            <td className="p-2 w-36">
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={ccVal}
                                  placeholder="Vide ou 0-20"
                                  onChange={e => {
                                    setEditedGrades(prev => ({
                                      ...prev,
                                      [g.matiere_id]: {
                                        ...prev[g.matiere_id],
                                        note_classe: e.target.value
                                      }
                                    }));
                                  }}
                                  className={`w-full text-center text-xs font-semibold py-1 px-2 border rounded-md focus:outline-none focus:ring-1 ${ccValInfo.className}`}
                                />
                                {ccValInfo.helperText && (
                                  <div className={`text-[8px] font-bold ${ccValInfo.isError ? "text-rose-600" : "text-emerald-600"}`}>
                                    {ccValInfo.helperText}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-2 w-36">
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={examVal}
                                  placeholder="Vide ou 0-20"
                                  onChange={e => {
                                    setEditedGrades(prev => ({
                                      ...prev,
                                      [g.matiere_id]: {
                                        ...prev[g.matiere_id],
                                        note_examen: e.target.value
                                      }
                                    }));
                                  }}
                                  className={`w-full text-center text-xs font-semibold py-1 px-2 border rounded-md focus:outline-none focus:ring-1 ${examValInfo.className}`}
                                />
                                {examValInfo.helperText && (
                                  <div className={`text-[8px] font-bold ${examValInfo.isError ? "text-rose-600" : "text-emerald-600"}`}>
                                    {examValInfo.helperText}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="font-bold text-slate-950 text-sm">
                              {finalNote !== null ? `${finalNote.toFixed(2)}/20` : "-"}
                            </td>
                            <td className="font-semibold text-gray-550">{g.credits}</td>
                            <td className="font-bold text-slate-850">
                              {notePonderated !== null ? notePonderated.toFixed(2) : "-"}
                            </td>
                            <td className="font-medium">
                              {finalNote !== null ? (
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  finalNote >= 14 ? "bg-emerald-50 text-emerald-700" :
                                  finalNote >= 10 ? "bg-blue-50 text-blue-700" :
                                  "bg-rose-50 text-rose-700"
                                }`}>
                                  {subjMention}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-normal italic">Non saisi</span>
                              )}
                            </td>
                            <td>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${badgeStyle}`}>
                                {subjStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      } else {
                        return (
                          <tr key={g.matiere_id} className="border-b border-gray-150 hover:bg-slate-50 transition text-center">
                            <td className="font-bold text-slate-900 py-3 px-4 text-left">
                              <div>{g.nom_matiere}</div>
                              <div className="text-[10px] font-mono text-gray-400 font-normal">{g.code_matiere}</div>
                            </td>
                            <td className="font-medium text-gray-700">
                              {g.note_classe !== null ? `${g.note_classe.toFixed(2)}/20` : "-"}
                            </td>
                            <td className="font-medium text-gray-700">
                              {g.note_examen !== null ? `${g.note_examen.toFixed(2)}/20` : "-"}
                            </td>
                            <td className="font-bold text-slate-950 text-sm">
                              {finalNote !== null ? `${finalNote.toFixed(2)}/20` : "-"}
                            </td>
                            <td className="font-semibold text-gray-550">{g.credits}</td>
                            <td className="font-bold text-slate-850">
                              {notePonderated !== null ? notePonderated.toFixed(2) : "-"}
                            </td>
                            <td className="font-medium">
                              {finalNote !== null ? (
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  finalNote >= 14 ? "bg-emerald-50 text-emerald-700" :
                                  finalNote >= 10 ? "bg-blue-50 text-blue-700" :
                                  "bg-rose-50 text-rose-700"
                                }`}>
                                  {subjMention}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-normal italic">Non saisi</span>
                              )}
                            </td>
                            <td>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${badgeStyle}`}>
                                {subjStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LMD Credits Balance Section */}
          {gradesToRender.length > 0 && (() => {
            const totalSemCredits = gradesToRender.reduce((sum, g) => sum + Number(g.credits), 0);
            const capCredits = gradesToRender.filter(g => g.note !== null && Number(g.note) >= 10).reduce((sum, g) => sum + Number(g.credits), 0);
            const isComp = activeGPA >= 10;
            const valCredits = isComp ? totalSemCredits : capCredits;
            const compCredits = isComp ? (totalSemCredits - capCredits) : 0;
            const progressPercentage = totalSemCredits > 0 ? Math.round((valCredits / totalSemCredits) * 100) : 0;

            return (
              <div className="mt-5 p-4 bg-slate-50 border border-slate-350 rounded-xl space-y-3 relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    Bilan Académique des Crédits (LMD / ECTS)
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">Compensations automatiques actives</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Crédits inscrits</span>
                    <span className="text-sm font-black text-slate-900">{totalSemCredits} ECTS</span>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase block">Crédits capitalisés</span>
                    <span className="text-sm font-black text-emerald-800">{capCredits} ECTS</span>
                  </div>
                  <div className="bg-sky-50/50 p-2.5 rounded-lg border border-sky-150">
                    <span className="text-[9px] font-bold text-sky-600 uppercase block">Crédits compensés</span>
                    <span className="text-sm font-black text-sky-850">{compCredits} ECTS</span>
                  </div>
                  <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-150">
                    <span className="text-[9px] font-bold text-indigo-700 uppercase block">Crédits validés</span>
                    <span className="text-sm font-black text-indigo-900">{valCredits} / {totalSemCredits} ECTS</span>
                  </div>
                </div>

                {/* Progress bar and informative alert */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <span>Taux d'acquisition de l'année / parcours :</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        progressPercentage >= 100 ? 'bg-emerald-500' : progressPercentage >= 50 ? 'bg-indigo-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-gray-400 italic leading-relaxed">
                     * Règle de l'Enseignement Supérieur : Les matières capitalisées (&ge;10/20) sont acquises définitivement. S'il y a compensation semestrielle (moyenne générale du semestre &ge;10.00), toutes les matières du semestre sont créditées. S'il n'y a pas compensation, l'étudiant doit reprendre au rattrapage uniquement les modules non-acquis.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Performance summary calculation */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-slate-900 pt-5">
            {/* Class Rank and Averages */}
            <div className="space-y-2 border border-dashed border-gray-300 p-4 rounded-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-600">Moyenne Générale de l'Élève :</span>
                <span className="text-lg font-black text-slate-950">{activeGPA > 0 ? `${activeGPA.toFixed(2)}/20` : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-600">Rang de Classement :</span>
                {activeGPA > 0 ? (
                  <span className="font-bold text-slate-900">
                    {activeRank === 1 ? "1er Ex-æquo" : `${activeRank}ème`} sur <span className="font-medium text-slate-500">{activeTotalClassmates} élèves</span>
                  </span>
                ) : (
                  <span className="text-gray-400">Non classé</span>
                )}
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-600">Mention administrative :</span>
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${activeGPA >= 15 ? "bg-emerald-100 text-emerald-800" : activeGPA >= 10 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                  {activeGPA > 0 ? activeMention : "Aucune éval"}
                </span>
              </div>
            </div>

            {/* Decision and dynamic signature section */}
            <div className="bg-slate-50 border border-slate-900 flex flex-col justify-center items-center p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Résultat du conseil de classe</span>
              <h3 className={`text-xl font-black uppercase tracking-tight mt-1 ${activeGPA >= 10 ? "text-emerald-700" : "text-red-700"}`}>
                DÉCISION : {activeGPA > 0 ? activeDecision : "N/A"}
              </h3>
              <p className="text-[10px] text-gray-500 mt-2 font-mono">
                {activeGPA >= 10 ? "L'étudiant est admis à s'inscrire en classe supérieure." : "L'étudiant doit se présenter aux épreuves de rattrapage."}
              </p>
            </div>
          </div>

          {/* Validation section footer */}
          <div className="mt-8 pt-8 border-t border-slate-300 grid grid-cols-2 text-center text-xs">
            <div>
              <span className="font-black text-slate-900 uppercase block">La Direction des Études</span>
              <p className="text-[10px] text-gray-400 mt-0.5 italic">Signature validée électroniquement</p>
              <div className="mt-6 border-b border-gray-400 w-32 mx-auto"></div>
            </div>
            
            <div className="relative">
              <span className="font-black text-slate-900 uppercase block">Le Secrétariat Académique</span>
              <p className="text-[10px] text-gray-400 mt-0.5 italic">Abidjan, le 06 Juin 2026</p>
              <div className="mt-6 border-b border-gray-400 w-32 mx-auto"></div>
              
              {/* Fake dynamic retro-looking administrative seal */}
              <div className="absolute right-4 bottom-[-10px] rounded-full border-4 border-blue-900/40 text-blue-950/40 font-bold uppercase p-3 w-16 h-16 rounded-full flex items-center justify-center font-black tracking-widest text-[8px] transform rotate-12 pointer-events-none select-none">
                SEAL
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-gray-300 p-12 text-center rounded-2xl flex flex-col items-center justify-center gap-3">
          <BookOpen className="w-10 h-10 text-slate-400" />
          <h3 className="font-bold text-slate-200 text-sm">Aucun bulletin de notes ouvert</h3>
          <p className="text-xs text-slate-400 max-w-md">Veuillez sélectionner un élève dans la liste ci-dessus pour charger et générer son relevé de notes semestriel officiel.</p>
        </div>
      )}
    </div>
  );
}
