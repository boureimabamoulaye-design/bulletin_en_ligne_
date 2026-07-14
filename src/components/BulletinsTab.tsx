import React, { useState, useEffect } from 'react';
import { Etudiant, Note, Cours, Semestre, Filiere, Classe, Matiere } from '../types';
import { 
  Award, Printer, Download, BookOpen, User, Calendar, 
  GraduationCap, Pencil, Save, X, Check, Trash2, AlertCircle, FileText,
  Search, ChevronDown, ChevronUp
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

const shortenSemester = (name: string): string => {
  if (!name) return "";
  return name.replace(/semestre\s*/i, "S");
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
  adminTheme?: string;
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
  onFiliereChange,
  adminTheme = 'sombre-or'
}: BulletinsTabProps) {
  const [localStudentId, setLocalStudentId] = useState<number>(0);
  const [localSemestreId, setLocalSemestreId] = useState<number>(semestres[0]?.id || 0);
  const [displayMode, setDisplayMode] = useState<'single' | 'all'>('single');

  // État pour la recherche textuelle de l'étudiant et l'affichage du menu
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const eligibleStudents = (globalFiliereId && globalFiliereId > 0 
    ? etudiants.filter(e => Number(e.filiere_id) === Number(globalFiliereId)) 
    : etudiants).sort((a, b) => {
      const nomA = (a.nom || "").trim().toUpperCase();
      const nomB = (b.nom || "").trim().toUpperCase();
      if (nomA !== nomB) return nomA.localeCompare(nomB);
      const prenomA = (a.prenom || "").trim().toUpperCase();
      const prenomB = (b.prenom || "").trim().toUpperCase();
      return prenomA.localeCompare(prenomB);
    });

  const selectedStudentId = localStudentId && eligibleStudents.some(e => Number(e.id) === Number(localStudentId))
    ? localStudentId
    : 0;

  const activeStudent = etudiants.find(e => Number(e.id) === Number(selectedStudentId));

  // Synchroniser le champ de recherche textuel quand un étudiant est sélectionné
  useEffect(() => {
    if (activeStudent) {
      setStudentSearchInput(`${activeStudent.nom} ${activeStudent.prenom} (${activeStudent.matricule})`);
    } else {
      setStudentSearchInput('');
    }
  }, [selectedStudentId, activeStudent]);

  // Filtrer la liste des étudiants éligibles en fonction de la saisie
  const filteredStudents = studentSearchInput.trim() === "" || (activeStudent && studentSearchInput === `${activeStudent.nom} ${activeStudent.prenom} (${activeStudent.matricule})`)
    ? eligibleStudents
    : eligibleStudents.filter(etu => {
        const query = studentSearchInput.toLowerCase().trim();
        return (
          (etu.nom || "").toLowerCase().includes(query) ||
          (etu.prenom || "").toLowerCase().includes(query) ||
          (etu.matricule || "").toLowerCase().includes(query)
        );
      });

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
  const activeDecision = activeGPA >= 10 ? "Validé" : "Non validé";

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
    reportDoc += `MENTION : ${activeMention}\n`;
    reportDoc += `DÉCISION DU JURY : ${activeDecision}\n\n`;
    reportDoc += `Fait à Bamako, le 06/06/2026\n`;
    reportDoc += `Le Secrétaire Général de Direction\n`;
    
    const element = document.createElement("a");
    const file = new Blob([reportDoc], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `bulletin_${activeStudent.matricule}_${activeSem.nom_semestre.replace(" ", "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderSingleBulletin = (student: Etudiant, isCascade: boolean) => {
    // 1. Get subjects of the semester for this student
    const studentMatieresOfSem = matieres.filter(m => 
      Number(m.filiere_id) === Number(student.filiere_id) && 
      Number(m.semestre_id) === Number(selectedSemestreId)
    );

    // 2. Filter grades for this student
    const studentGrades = notes.filter(n => 
      Number(n.etudiant_id) === Number(student.id) && 
      Number(n.semestre_id) === Number(selectedSemestreId)
    );

    // 3. Define structured grades list to render, adapting if in edit mode (only allowed in single view for selectedStudentId)
    const isStudentEditing = isEditing && Number(student.id) === Number(selectedStudentId);
    
    const gradesToRender = isStudentEditing
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
          const matiereObj = matieres.find(m => m.nom_matiere === courseObj?.titre && Number(m.filiere_id) === Number(student.filiere_id));
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

    // Compute GPA
    const validGrades = gradesToRender.filter(g => g.note !== null);
    let studentGPA = 0;
    if (validGrades.length > 0) {
      let sumNotes = 0;
      let sumCredits = 0;
      validGrades.forEach(g => {
        sumNotes += g.note! * Number(g.credits);
        sumCredits += Number(g.credits);
      });
      studentGPA = sumCredits > 0 ? (sumNotes / sumCredits) : 0;
    }

    // Rank and Mention
    const { rank: studentRank, total: totalClassmates } = getStudentRank(student.id, selectedSemestreId);
    const studentMention = getMention(studentGPA);
    const studentDecision = studentGPA >= 10 ? "Validé" : "Non validé";

    return (
      <div 
        key={student.id} 
        className={`bg-[#ffffff] p-8 max-w-4xl mx-auto rounded-2xl border-4 border-[#000000] relative overflow-hidden text-[#000000] ${
          isCascade ? "mb-10 bulletin-page" : ""
        }`} 
        id={isCascade ? undefined : "bulletin-official-canvas"}
      >
        {/* Subtle decoration background seal */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 pointer-events-none opacity-[0.04] border-8 border-[#000000] rounded-full w-96 h-96 flex items-center justify-center">
          <span className="text-[#000000] font-bold text-3xl tracking-widest text-center">ACADÉMIE<br />SCOLAIRE</span>
        </div>

        {/* Letterhead Header */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start border-b-2 border-[#000000] pb-5 gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-[#000000] tracking-tight flex items-center gap-2 justify-center md:justify-start">
              <BookOpen className="w-6 h-6 text-[#000000]" />
              <span>INSTITUT SUPÉRIEUR DES TECHNOLOGIES</span>
            </h2>
            <p className="text-xs text-[#000000] mt-1 font-bold uppercase">Bamako - Hamdallaye ACI | Tel: +223 20 22 40 30</p>
            <p className="text-[10px] text-[#171717] mt-0.5 font-semibold">Ministère de l'Enseignement Technique & Professionnel</p>
          </div>
          
          <div className="text-center md:text-right border-l-0 md:border-l border-[#000000] pl-0 md:pl-6 shrink-0 font-mono text-xs text-[#000000]">
            <strong className="text-[#000000] block font-black">BULLETIN DE NOTES</strong>
            <span className="text-[#000000] block mt-1 bg-[#ffffff] border border-[#000000] py-1 px-3 rounded font-bold uppercase">
              {shortenSemester(activeSem?.nom_semestre || "")}
            </span>
            <span className="text-[#000000] block mt-1">Année {activeSem?.annee_scolaire}</span>
          </div>
        </div>

        {/* Identity panel of Student */}
        <div className="my-6 md:flex gap-6 items-start bg-[#ffffff] border-2 border-[#000000] rounded-xl p-5 text-[#000000]">
          <GraduationCap 
            className="w-14 h-14 text-[#000000] bg-[#ffffff] p-2.5 rounded-lg border-2 border-[#000000] mx-auto md:mx-0 shrink-0 mb-4 md:mb-0" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs text-[#000000] flex-1">
            <div>
              <dt className="text-[#525252] uppercase font-black tracking-wide text-[9px]">ID Matricule Unifié</dt>
              <dd className="font-mono text-sm font-black text-[#000000]">{student.matricule}</dd>
            </div>
            <div>
              <dt className="text-[#525252] uppercase font-black tracking-wide text-[9px]">Nom de famille & Prénoms</dt>
              <dd className="text-sm font-black text-[#000000] uppercase">{student.nom} {student.prenom}</dd>
            </div>
            <div>
              <dt className="text-[#525252] uppercase font-black tracking-wide text-[9px]">Niveau d'études d'affectation</dt>
              <dd className="font-bold text-sm text-[#000000]">
                {classes.find(c => Number(c.id) === Number(student.classe_id))?.nom_classe || "Non renseigné"}
              </dd>
            </div>
            <div>
              <dt className="text-[#525252] uppercase font-black tracking-wide text-[9px]">Filière Académique d'Inscription</dt>
              <dd className="font-black text-sm text-[#000000] uppercase">
                {filieres.find(f => Number(f.id) === Number(student.filiere_id))?.nom_filiere}
              </dd>
            </div>
          </div>
        </div>

        {/* Errors / success alerts inside single active student */}
        {!isCascade && validationError && (
          <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-bold">{validationError}</span>
          </div>
        )}

        {!isCascade && validationSuccess && (
          <div className="mb-4 bg-emerald-50 border border-emerald-250 text-emerald-850 p-4 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{validationSuccess}</span>
          </div>
        )}

        {/* Marks table detail */}
        <div className="border-2 border-[#000000] rounded-xl overflow-hidden mt-6 bg-[#ffffff]">
          <div className="overflow-x-auto w-full">
            <table className="min-w-[850px] w-full text-xs text-[#000000] bg-[#ffffff] border-collapse" style={{ boxShadow: 'none' }}>
              <thead>
                <tr className="bg-[#f5f5f5] border-b-2 border-[#000000] text-[#000000]">
                  <th className="font-black py-3 px-4 uppercase text-[10px] text-left text-[#000000]">
                    <span className="md:hidden">Matière / Module</span>
                    <span className="hidden md:inline">Modules / Cours Validés</span>
                  </th>
                  <th className="font-black py-3 px-3 uppercase text-[10px] text-center w-36 text-[#000000] border-l border-[#000000]">
                    <span className="md:hidden">CC (40%)</span>
                    <span className="hidden md:inline">Note CC / Classe (40%)</span>
                  </th>
                  <th className="font-black py-3 px-3 uppercase text-[10px] text-center w-36 text-[#000000] border-l border-[#000000]">
                    <span className="md:hidden">Exam (60%)</span>
                    <span className="hidden md:inline">Note Examen (60%)</span>
                  </th>
                  <th className="font-black py-3 px-3 uppercase text-[10px] text-center w-24 text-[#000000] border-l border-[#000000]">
                    <span className="md:hidden">Moy. Fin.</span>
                    <span className="hidden md:inline">Moyenne Finale</span>
                  </th>
                  <th className="font-black py-3 px-3 uppercase text-[10px] text-center w-14 text-[#000000] border-l border-[#000000]">
                    <span className="md:hidden">Créd.</span>
                    <span className="hidden md:inline">Crédits</span>
                  </th>
                  <th className="font-black py-3 px-3 uppercase text-[10px] text-center w-24 text-[#000000] border-l border-[#000000]">
                    <span className="md:hidden">Pondéré</span>
                    <span className="hidden md:inline">Total pondéré</span>
                  </th>
                  <th className="font-black py-3 px-3 uppercase text-[10px] text-center w-24 text-[#000000] border-l border-[#000000]">
                    <span className="md:hidden">Ment.</span>
                    <span className="hidden md:inline">Mention</span>
                  </th>
                  <th className="font-black py-3 px-3 uppercase text-[10px] text-center w-24 text-[#000000] border-l border-[#000000]">
                    <span className="md:hidden">Statut</span>
                    <span className="hidden md:inline">Statut LMD</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {gradesToRender.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#000000] font-bold">Aucune note n'a été introduite ce semestre.</td>
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
                      return "Non validé";
                    };

                    // University LMD validation status: Validé (V.A.) or Compensé (V.Comp.) or Rattrapage (R.A.)
                    let subjStatus = "Rattrapage (R.A.)";
                    
                    if (finalNote !== null) {
                      if (finalNote >= 10) {
                        subjStatus = "Capitalisé (V.A.)";
                      } else if (studentGPA >= 10) {
                        subjStatus = "Compensé (V.Comp)";
                      }
                    } else {
                      subjStatus = "Non saisi";
                    }

                    const subjMention = getSubjMention(finalNote);

                    if (isStudentEditing) {
                      const ccVal = editedGrades[g.matiere_id]?.note_classe ?? "";
                      const examVal = editedGrades[g.matiere_id]?.note_examen ?? "";

                      const ccValInfo = getValidationInfo(ccVal);
                      const examValInfo = getValidationInfo(examVal);

                      return (
                        <tr key={g.matiere_id} className="border-b border-[#000000] hover:bg-[#fafafa] transition text-center text-[#000000]">
                          <td className="font-bold text-[#000000] py-3 px-4 text-left">
                            <div className="font-bold text-sm">{g.nom_matiere}</div>
                            <div className="text-[10px] font-mono text-[#525252] font-semibold">{g.code_matiere}</div>
                          </td>
                          <td className="p-2 w-36 border-l border-[#000000]">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={ccVal}
                                placeholder="CC /20"
                                onChange={e => {
                                  setEditedGrades(prev => ({
                                    ...prev,
                                    [g.matiere_id]: {
                                      ...prev[g.matiere_id],
                                      note_classe: e.target.value
                                    }
                                  }));
                                }}
                                className={`w-full text-center text-xs font-black py-1 px-2 border-2 border-[#000000] rounded-md focus:outline-none focus:ring-1 bg-[#ffffff] text-[#000000]`}
                              />
                              {ccValInfo.helperText && (
                                <div className={`text-[8px] font-black ${ccValInfo.isError ? "text-red-650" : "text-emerald-700"}`}>
                                  {ccValInfo.helperText}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2 w-36 border-l border-[#000000]">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={examVal}
                                placeholder="EX /20"
                                onChange={e => {
                                  setEditedGrades(prev => ({
                                    ...prev,
                                    [g.matiere_id]: {
                                      ...prev[g.matiere_id],
                                      note_examen: e.target.value
                                    }
                                  }));
                                }}
                                className={`w-full text-center text-xs font-black py-1 px-2 border-2 border-[#000000] rounded-md focus:outline-none focus:ring-1 bg-[#ffffff] text-[#000000]`}
                              />
                              {examValInfo.helperText && (
                                <div className={`text-[8px] font-black ${examValInfo.isError ? "text-red-650" : "text-emerald-700"}`}>
                                  {examValInfo.helperText}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="font-black text-[#000000] text-sm border-l border-[#000000]">
                            {finalNote !== null ? `${finalNote.toFixed(2)}/20` : "-"}
                          </td>
                          <td className="font-bold text-[#000000] border-l border-[#000000]">{g.credits}</td>
                          <td className="font-black text-[#000000] border-l border-[#000000]">
                            {notePonderated !== null ? notePonderated.toFixed(2) : "-"}
                          </td>
                          <td className="font-bold border-l border-[#000000] p-1">
                            {finalNote !== null ? (
                              <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded border border-[#000000] bg-[#ffffff] text-[#000000]">
                                {subjMention}
                              </span>
                            ) : (
                              <span className="text-[#000000] font-normal italic">Non saisi</span>
                            )}
                          </td>
                          <td className="border-l border-[#000000] text-[#000000] p-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-[#000000] bg-[#ffffff] text-[#000000]">
                              <span className="hidden md:inline">{subjStatus}</span>
                              <span className="inline md:hidden">
                                {subjStatus.includes("Capitalisé") ? "V.A." : 
                                 subjStatus.includes("Compensé") ? "V.Comp" : 
                                 subjStatus.includes("Rattrapage") ? "R.A." : 
                                 subjStatus === "Non saisi" ? "N.S." : subjStatus}
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr key={g.matiere_id} className="border-b border-[#000000] hover:bg-[#fafafa] transition text-center text-[#000000]">
                          <td className="font-bold text-[#000000] py-3 px-4 text-left">
                            <div className="font-bold text-sm">{g.nom_matiere}</div>
                            <div className="text-[10px] font-mono text-[#525252] font-semibold">{g.code_matiere}</div>
                          </td>
                          <td className="font-bold text-[#000000] border-l border-[#000000]">
                            {g.note_classe !== null ? `${g.note_classe.toFixed(2)}/20` : "-"}
                          </td>
                          <td className="font-bold text-[#000000] border-l border-[#000000]">
                            {g.note_examen !== null ? `${g.note_examen.toFixed(2)}/20` : "-"}
                          </td>
                          <td className="font-black text-[#000000] text-sm border-l border-[#000000]">
                            {finalNote !== null ? `${finalNote.toFixed(2)}/20` : "-"}
                          </td>
                          <td className="font-bold text-[#000000] border-l border-[#000000]">{g.credits}</td>
                          <td className="font-black text-[#000000] border-l border-[#000000]">
                            {notePonderated !== null ? notePonderated.toFixed(2) : "-"}
                          </td>
                          <td className="font-bold border-l border-[#000000] p-1">
                            {finalNote !== null ? (
                              <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded border border-[#000000] bg-[#ffffff] text-[#000000]">
                                {subjMention}
                              </span>
                            ) : (
                              <span className="text-[#000000] font-normal italic">Non saisi</span>
                            )}
                          </td>
                          <td className="border-l border-[#000000] text-[#000000] p-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-[#000000] bg-[#ffffff] text-[#000000]">
                              <span className="hidden md:inline">{subjStatus}</span>
                              <span className="inline md:hidden">
                                {subjStatus.includes("Capitalisé") ? "V.A." : 
                                 subjStatus.includes("Compensé") ? "V.Comp" : 
                                 subjStatus.includes("Rattrapage") ? "R.A." : 
                                 subjStatus === "Non saisi" ? "N.S." : subjStatus}
                              </span>
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
          const isComp = studentGPA >= 10;
          const valCredits = isComp ? totalSemCredits : capCredits;
          const compCredits = isComp ? (totalSemCredits - capCredits) : 0;
          const progressPercentage = totalSemCredits > 0 ? Math.round((valCredits / totalSemCredits) * 100) : 0;

          return (
            <div className="mt-5 p-4 bg-[#ffffff] border-2 border-[#000000] rounded-xl space-y-3 relative text-[#000000]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#000000] pb-2">
                <span className="text-[10px] font-black text-[#000000] uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#000000] animate-pulse"></span>
                  <span className="md:hidden">Bilan Crédits (LMD)</span>
                  <span className="hidden md:inline">Bilan Académique des Crédits (LMD / ECTS)</span>
                </span>
                <span className="text-[10px] text-[#000000] font-mono font-bold">
                  <span className="md:hidden">Compensations Actives</span>
                  <span className="hidden md:inline">Compensations automatiques actives</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-[#ffffff] p-2.5 rounded-lg border-2 border-[#000000] text-[#000000]">
                  <span className="text-[9px] font-bold text-[#525252] uppercase block">
                    <span className="md:hidden">Inscrits</span>
                    <span className="hidden md:inline">Crédits inscrits</span>
                  </span>
                  <span className="text-sm font-black text-[#000000]">{totalSemCredits} ECTS</span>
                </div>
                <div className="bg-[#ffffff] p-2.5 rounded-lg border-2 border-[#000000] text-[#000000]">
                  <span className="text-[9px] font-bold text-[#525252] uppercase block">
                    <span className="md:hidden">Capitalisés</span>
                    <span className="hidden md:inline">Crédits capitalisés</span>
                  </span>
                  <span className="text-sm font-black text-[#000000]">{capCredits} ECTS</span>
                </div>
                <div className="bg-[#ffffff] p-2.5 rounded-lg border-2 border-[#000000] text-[#000000]">
                  <span className="text-[9px] font-bold text-[#525252] uppercase block">
                    <span className="md:hidden">Compensés</span>
                    <span className="hidden md:inline">Crédits compensés</span>
                  </span>
                  <span className="text-sm font-black text-[#000000]">{compCredits} ECTS</span>
                </div>
                <div className="bg-[#ffffff] p-2.5 rounded-lg border-2 border-[#000000] text-[#000000]">
                  <span className="text-[9px] font-bold text-[#525252] uppercase block">
                    <span className="md:hidden">Validés</span>
                    <span className="hidden md:inline">Crédits validés</span>
                  </span>
                  <span className="text-sm font-black text-[#000000]">{valCredits} / {totalSemCredits} ECTS</span>
                </div>
              </div>

              {/* Progress bar and informative alert */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-[#000000]">
                  <span>
                    <span className="md:hidden">Taux d'Acquisition :</span>
                    <span className="hidden md:inline">Taux d'acquisition de l'année / parcours :</span>
                  </span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="w-full bg-[#ffffff] border-2 border-[#000000] h-3.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#000000] transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-[#262626] font-semibold leading-relaxed">
                   * Règle de l'Enseignement Supérieur : Les matières capitalisées (&ge;10/20) sont acquises définitivement. S'il y a compensation semestrielle (moyenne générale du semestre &ge;10.00), toutes les matières du semestre sont créditées. S'il n'y a pas compensation, l'étudiant doit reprendre au rattrapage uniquement les modules non-acquis.
                </p>
              </div>
            </div>
          );
        })()}

        {/* Performance summary calculation */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-[#000000] pt-5 text-[#000000]">
          {/* Class Rank and Averages */}
          <div className="space-y-2 border-2 border-[#000000] p-4 rounded-xl text-[#000000] bg-[#ffffff]">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#000000]">Moyenne Générale de l'Élève :</span>
              <span className="text-lg font-black text-[#000000]">{studentGPA > 0 ? `${studentGPA.toFixed(2)}/20` : "N/A"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#000000]">Rang de l'Élève :</span>
              <span className="font-mono text-xs font-black text-[#000000]">{studentGPA > 0 ? `${studentRank} / ${totalClassmates}` : "N/A"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#000000]">Mention administrative :</span>
              <span className="font-mono text-xs font-black text-[#000000]">
                {studentGPA > 0 ? studentMention : "Aucune éval"}
              </span>
            </div>
          </div>

          {/* Decision and dynamic signature section */}
          <div className="bg-[#ffffff] border-2 border-[#000000] flex flex-col justify-center items-center p-4 rounded-xl text-center font-bold text-[#000000]">
            <span className="text-[10px] uppercase font-black text-[#525252] tracking-wider">Résultat du conseil de classe</span>
            <h3 className="text-xl font-black uppercase tracking-tight mt-1 text-[#000000]">
              DÉCISION : {studentGPA > 0 ? studentDecision : "N/A"}
            </h3>
            <p className="text-[10px] text-[#171717] mt-2 font-mono font-bold">
              {studentGPA >= 10 ? "L'étudiant a validé son semestre d'études." : "L'étudiant n'a pas validé son semestre et doit se présenter aux épreuves de rattrapage."}
            </p>
          </div>
        </div>

        {/* Validation section footer */}
        <div className="mt-8 pt-8 border-t border-[#000000] grid grid-cols-2 text-center text-xs text-[#000000]">
          <div>
            <span className="font-black text-[#000000] uppercase block">La Direction des Études</span>
            <p className="text-[10px] text-[#525252] mt-0.5 font-bold italic">Signature validée électroniquement</p>
            <div className="mt-6 border-b border-[#000000] w-32 mx-auto"></div>
          </div>
          
          <div className="relative">
            <span className="font-black text-[#000000] uppercase block">Le Secrétariat Académique</span>
            <p className="text-[10px] text-[#525252] mt-0.5 font-bold italic">Bamako, le 06 Juin 2026</p>
            <div className="mt-6 border-b border-[#000000] w-32 mx-auto"></div>
            
            {/* Seal */}
            <div className="absolute right-4 bottom-[-10px] rounded-full border-4 border-[#000000] text-[#000000] font-black uppercase p-3 w-16 h-16 flex items-center justify-center tracking-widest text-[8px] transform rotate-12 pointer-events-none select-none">
              SCEAU
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-6" id="bulletins-container">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-150 no-print">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#c5a880] bg-[#c5a880]/10 px-2.5 py-1 rounded-md border border-[#c5a880]/20">
            Édition des Bulletins de Notes
          </span>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Générez, prévisualisez, éditez et imprimez les relevés de notes officiels de vos étudiants.</p>
        </div>

        {/* Display mode toggler */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200 self-stretch sm:self-auto">
          <button
            onClick={() => setDisplayMode('single')}
            className={`flex-1 sm:flex-initial py-1.5 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 justify-center ${
              displayMode === 'single'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Bulletin Individuel
          </button>
          <button
            onClick={() => setDisplayMode('all')}
            className={`flex-1 sm:flex-initial py-1.5 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 justify-center ${
              displayMode === 'all'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Tous les Bulletins ({eligibleStudents.length})
          </button>
        </div>
      </div>

      {/* Dynamic Global Print Styles for Perfect PDF Export */}
      <style>{`
        @media print {
          /* 1. Hide everything by default except the bulletin paper container */
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Hide typical navigation panels, mobile drawers, dashboard sidebars, and filters */
          aside,
          header,
          nav,
          footer,
          .logo-area,
          .sidebar-menu,
          #bulletins-selectors,
          #btn-back-to-dashboard,
          .btn,
          button,
          select,
          input,
          .no-print {
            display: none !important;
          }

          /* Hide path header at the top of the main admin container in App.tsx */
          div[class*="justify-between"][class*="rounded-xl"][class*="p-5"],
          div[id="dashboard-brand-header"],
          div[class*="pt-[60px]"],
          header[class*="border-b"],
          #header-control-strip {
            display: none !important;
          }

          /* 2. Reset container wrappers to let print take full A4 area */
          #admin-workspace-layer,
          main,
          #bulletins-container,
          div[class*="overflow-y-auto"],
          div[class*="max-w-7xl"],
          #student-portal-wrapper,
          #student-bulletins-tab {
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            position: static !important;
          }

          /* 3. Style the printable bulletin sheet beautifully */
          #bulletin-official-canvas,
          #student-pdf-bulletin,
          .bulletin-page {
            border: 4px double #000000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 1.2cm !important;
            margin: 0 auto 1.5cm auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          .bulletin-page:last-child {
            page-break-after: avoid !important;
            margin-bottom: 0 !important;
          }

          /* Ensure table has real border lines */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td, tr {
            border: 1px solid #1e293b !important;
            color: #000000 !important;
          }
          th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Sub-badge structures in print */
          span[class*="rounded"] {
            border: 1px solid #1e293b !important;
            background: transparent !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Configure specific page break guidelines */
          tr {
            page-break-inside: avoid !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
        }
      `}</style>

      {/* Selector ribbon */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-2 select-none mb-6 ${
        adminTheme === 'sombre-or' ? 'bg-[#0f1422] border-amber-500/10' : 'bg-slate-50 border-slate-200'
      }`} id="bulletins-selectors">
        {displayMode === 'single' ? (
          <div className="relative flex items-center">
            {/* Backdrop transparent pour fermer le dropdown */}
            {showStudentDropdown && (
              <div 
                className="fixed inset-0 z-30 cursor-default" 
                onClick={() => setShowStudentDropdown(false)} 
              />
            )}
            
            <div className={`relative z-40 flex items-center gap-1.5 text-[11px] border rounded-lg p-1.5 px-3 transition-all min-w-[280px] sm:min-w-[320px] ${
              adminTheme === 'sombre-or' 
                ? 'bg-slate-950 border-amber-500/20 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/20' 
                : 'bg-white border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20'
            }`}>
              <span className={`font-extrabold uppercase tracking-wider flex-shrink-0 ${
                adminTheme === 'sombre-or' ? 'text-amber-400/80' : 'text-slate-400'
              }`}>Étudiant :</span>
              
              <div className="flex-1 flex items-center gap-1 min-w-0">
                <input 
                  type="text"
                  value={studentSearchInput}
                  onFocus={() => setShowStudentDropdown(true)}
                  onChange={e => {
                    setStudentSearchInput(e.target.value);
                    setShowStudentDropdown(true);
                    if (e.target.value.trim() === "") {
                      setLocalStudentId(0);
                    }
                  }}
                  placeholder="Rechercher (Nom, matricule...)"
                  className={`bg-transparent border-none text-xs font-bold outline-none focus:ring-0 p-0 w-full select-text ${
                    adminTheme === 'sombre-or' ? 'text-white placeholder-slate-700' : 'text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              {studentSearchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentSearchInput('');
                    setLocalStudentId(0);
                    setShowStudentDropdown(true);
                  }}
                  className={`p-0.5 rounded-full transition-colors flex-shrink-0 ${
                    adminTheme === 'sombre-or' ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                className={`p-0.5 rounded transition-colors flex-shrink-0 ${
                  adminTheme === 'sombre-or' ? 'text-slate-400 hover:text-amber-400' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                {showStudentDropdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Suggestions flottantes */}
            {showStudentDropdown && (
              <div className={`absolute left-0 top-full mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border shadow-2xl z-40 transition-all ${
                adminTheme === 'sombre-or' 
                  ? 'bg-[#0a0d18] border-amber-500/20 text-white divide-y divide-amber-500/5' 
                  : 'bg-white border-slate-200 text-slate-800 divide-y divide-slate-100'
              }`}>
                {filteredStudents.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 font-medium">
                    Aucun étudiant trouvé
                  </div>
                ) : (
                  filteredStudents.map(etu => {
                    const isSelected = Number(etu.id) === Number(selectedStudentId);
                    return (
                      <button
                        key={etu.id}
                        type="button"
                        onClick={() => {
                          setLocalStudentId(etu.id);
                          setStudentSearchInput(`${etu.nom} ${etu.prenom} (${etu.matricule})`);
                          setShowStudentDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between ${
                          isSelected
                            ? adminTheme === 'sombre-or'
                              ? 'bg-amber-500/10 text-amber-400 font-extrabold'
                              : 'bg-blue-50 text-blue-700 font-extrabold'
                            : adminTheme === 'sombre-or'
                              ? 'hover:bg-slate-900/60 text-slate-300 hover:text-white'
                              : 'hover:bg-slate-50 text-slate-700 hover:text-slate-950'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="block truncate">{etu.nom} {etu.prenom}</span>
                          <span className={`text-[10px] font-mono font-medium block mt-0.5 ${
                            isSelected 
                              ? adminTheme === 'sombre-or' ? 'text-amber-400/75' : 'text-blue-500'
                              : 'text-slate-500'
                          }`}>{etu.matricule}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={`flex items-center gap-1 text-[11px] border rounded-lg p-1.5 px-3 transition-colors ${
            adminTheme === 'sombre-or' ? 'bg-slate-950 border-amber-500/20' : 'bg-white border-slate-200'
          }`}>
            <span className={`font-extrabold uppercase tracking-wider ${
              adminTheme === 'sombre-or' ? 'text-amber-400/80' : 'text-slate-400'
            }`}>Sélection :</span>
            <span className={`text-xs font-bold ${adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-800'}`}>
              Tous les étudiants ({eligibleStudents.length})
            </span>
          </div>
        )}

        <div className={`flex items-center gap-1 text-[11px] border rounded-lg p-1.5 px-3 transition-colors ${
          adminTheme === 'sombre-or' ? 'bg-slate-950 border-amber-500/20' : 'bg-white border-slate-200'
        }`}>
          <span className={`font-extrabold uppercase tracking-wider ${
            adminTheme === 'sombre-or' ? 'text-amber-400/80' : 'text-slate-400'
          }`}>Période :</span>
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
            className={`bg-transparent border-none text-xs font-bold outline-none cursor-pointer focus:ring-0 p-0 ${
              adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-800'
            }`}
          >
            {semestres
              .filter(sem => !activeFiliereFilter || !sem.filiere_id || Number(sem.filiere_id) === Number(activeFiliereFilter))
              .map(sem => (
                <option key={sem.id} value={sem.id} className={adminTheme === 'sombre-or' ? 'bg-slate-950 text-white' : ''}>
                  {shortenSemester(sem.nom_semestre)} ({sem.annee_scolaire})
                </option>
              ))}
          </select>
        </div>

        <div className="flex gap-2 shrink-0">
          {displayMode === 'single' ? (
            isEditing ? (
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
                  className="btn bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition duration-200 cursor-pointer text-xs"
                  title="Passer en mode d'édition directe pour ce bulletin"
                >
                  <Pencil className="w-4 h-4 text-white" /> Modifier les notes
                </button>

                <button 
                  onClick={handleDownloadReport}
                  disabled={selectedStudentId === 0}
                  className="btn bg-sky-950 hover:bg-sky-900 border border-sky-800 text-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition duration-200 cursor-pointer text-xs"
                  title="Télécharger le bulletin textuel certifié brut"
                >
                  <FileText className="w-4 h-4 text-sky-400" /> Certificat Brut (TXT)
                </button>

                <button 
                  onClick={handlePrint}
                  disabled={selectedStudentId === 0}
                  className="btn bg-blue-700 hover:bg-blue-800 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition duration-200 cursor-pointer text-xs"
                  title="Imprimer le bulletin officiel de cet étudiant"
                >
                  <Printer className="w-4 h-4 text-white" /> Imprimer
                </button>
              </>
            )
          ) : (
            <button 
              onClick={handlePrint}
              disabled={eligibleStudents.length === 0}
              className="btn bg-blue-700 hover:bg-blue-800 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition duration-200 cursor-pointer text-xs w-full justify-center md:w-auto"
              title="Imprimer tous les bulletins d'évaluation de la classe"
            >
              <Printer className="w-4 h-4 text-white" /> Imprimer les bulletins de la classe
            </button>
          )}
        </div>
      </div>

      {/* Main visual display of the report card(s) */}
      {displayMode === 'single' ? (
        activeStudent && activeSem ? (
          renderSingleBulletin(activeStudent, false)
        ) : (
          <div className="bg-slate-50 border border-dashed border-gray-300 p-12 text-center rounded-2xl flex flex-col items-center justify-center gap-3">
            <BookOpen className="w-10 h-10 text-slate-400" />
            <h3 className="font-bold text-slate-900 text-sm">Aucun bulletin de notes ouvert</h3>
            <p className="text-xs text-slate-500 max-w-md">Veuillez sélectionner un élève dans la liste ci-dessus pour charger et générer son relevé de notes semestriel officiel.</p>
          </div>
        )
      ) : (
        <div className="space-y-8">
          {eligibleStudents.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-gray-300 p-12 text-center rounded-2xl flex flex-col items-center justify-center gap-3">
              <BookOpen className="w-10 h-10 text-slate-400" />
              <h3 className="font-bold text-slate-900 text-sm">Aucun étudiant éligible</h3>
              <p className="text-xs text-slate-500 max-w-md">Il n'y a aucun étudiant enregistré dans cette filière académique.</p>
            </div>
          ) : (
            eligibleStudents.map(student => renderSingleBulletin(student, true))
          )}
        </div>
      )}
    </div>
  );
}
