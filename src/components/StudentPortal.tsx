import React, { useState } from 'react';
import { Etudiant, Note, Cours, Semestre, Filiere, Classe, AutorisationFiliere, HistoriqueAcces, Paiement } from '../types';
import { GraduationCap, Award, FileText, Lock, ShieldAlert, CheckCircle, Download, Printer, User, BookOpen, Menu, X, LogOut, DollarSign, Eye, EyeOff, Clock, Shield, Calendar } from 'lucide-react';

interface StudentPortalProps {
  activeStudent: Etudiant;
  etudiants?: Etudiant[];
  notes: Note[];
  cours: Cours[];
  semestres: Semestre[];
  anneesScolaires?: string[];
  filieres: Filiere[];
  classes: Classe[];
  autorisations: AutorisationFiliere[];
  paiements: Paiement[];
  scolariteAnnuelle: number;
  initialFiliereId?: number;
  onLogAccess: (studentId: number, filiereId: number) => void;
  onUpdatePassword: (studentId: number, newPass: string) => void;
  onLogout: () => void;
  globalAnneeScolaire?: string;
  onAnneeScolaireChange?: (annee: string) => void;
  adminTheme?: string;
  onThemeChange?: () => void;
  compactScroll?: boolean;
  onCompactScrollChange?: (val: boolean) => void;
  globalSemestreId?: number;
  onSemestreChange?: (id: number) => void;
}

const shortenSemester = (name: string): string => {
  if (!name) return "";
  return name.replace(/semestre\s*/i, "S");
};

export default function StudentPortal({ 
  activeStudent, 
  etudiants = [],
  notes, 
  cours, 
  semestres, 
  anneesScolaires = [],
  filieres, 
  classes, 
  autorisations,
  paiements,
  scolariteAnnuelle,
  initialFiliereId,
  onLogAccess,
  onUpdatePassword,
  onLogout,
  globalAnneeScolaire,
  onAnneeScolaireChange,
  adminTheme = 'sombre-or',
  onThemeChange,
  compactScroll = false,
  onCompactScrollChange,
  globalSemestreId,
  onSemestreChange
}: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<'profil' | 'cours' | 'notes' | 'bulletins' | 'paiements'>('bulletins');
  const [menuOpen, setMenuOpen] = useState(false);
  const studentSemestres = semestres.filter(s => !s.filiere_id || Number(s.filiere_id) === Number(activeStudent.filiere_id));
  const [localSemestreId, setLocalSemestreId] = useState<number>(() => {
    return studentSemestres[0]?.id || semestres[0]?.id || 0;
  });
  const selectedSemestreId = globalSemestreId && globalSemestreId > 0 ? globalSemestreId : localSemestreId;
  const setSelectedSemestreId = (id: number) => {
    if (onSemestreChange) {
      onSemestreChange(id);
    } else {
      setLocalSemestreId(id);
    }
  };

  // Dynamically compile unique list of academic years
  const uniqueAnneeScolaires = Array.from(new Set([
    ...anneesScolaires,
    ...semestres.map(s => s.annee_scolaire),
    ...paiements.map(p => p.annee_scolaire)
  ].filter(Boolean)));
  if (uniqueAnneeScolaires.length === 0) {
    uniqueAnneeScolaires.push("2025-2026", "2026-2027", "2024-2025");
  }

  // Active academic year for student view
  const [selectedStudentAnnee, setSelectedStudentAnnee] = useState<string>(() => {
    return uniqueAnneeScolaires.includes("2025-2026") ? "2025-2026" : (uniqueAnneeScolaires[0] || "2025-2026");
  });

  // Sync state with global academic year toggle
  React.useEffect(() => {
    if (globalAnneeScolaire) {
      setSelectedStudentAnnee(globalAnneeScolaire);
    }
  }, [globalAnneeScolaire]);

  // Reset all state when the active student changes to prevent state leakage and bugs when multiple students connect
  React.useEffect(() => {
    setActiveTab('bulletins');
    setMenuOpen(false);
    
    const sSemestres = semestres.filter(s => !s.filiere_id || Number(s.filiere_id) === Number(activeStudent.filiere_id));
    const firstSemId = sSemestres[0]?.id || semestres[0]?.id || 0;
    setSelectedSemestreId(firstSemId);
    
    setCourseFiliereFilter(initialFiliereId || activeStudent.filiere_id);
    
    setCurrentPass("");
    setNewPass("");
    setPassMsg({ text: "", type: "" });
  }, [activeStudent.id, activeStudent.filiere_id, initialFiliereId, semestres]);

  // Synchronise selectedSemestreId if the semesters filtered list updates as academic year gets toggled
  React.useEffect(() => {
    const studentSemestres = semestres.filter(s => !s.filiere_id || Number(s.filiere_id) === Number(activeStudent.filiere_id));
    if (studentSemestres.length > 0) {
      if (!studentSemestres.some(s => s.id === selectedSemestreId)) {
        setSelectedSemestreId(studentSemestres[0].id);
      }
    }
  }, [semestres, activeStudent.filiere_id, selectedSemestreId]);

  // Password fields
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ text: "", type: "" });

  const [courseFiliereFilter, setCourseFiliereFilter] = useState<number>(() => {
    return initialFiliereId || activeStudent.filiere_id;
  });


  const filierePrincipale = filieres.find(f => f.id === courseFiliereFilter);
  const classeActuelle = classes.find(c => c.id === activeStudent.classe_id);

  // Authorisations (other majors the administration authorized this student to access)
  const allowedOtherFiliereIds = autorisations
    .filter(a => a.etudiant_id === activeStudent.id)
    .map(a => a.filiere_id);

  const allowedOtherFilieres = filieres.filter(f => allowedOtherFiliereIds.includes(f.id));

  // Compile list of all accessible filieres for switching
  const allAccessibleFiliereIds = Array.from(new Set([activeStudent.filiere_id, ...allowedOtherFiliereIds]));
  const allAccessibleFilieres = filieres.filter(f => allAccessibleFiliereIds.includes(f.id));

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) return;

    if (currentPass !== activeStudent.mot_de_passe) {
      setPassMsg({ text: "Erreur : L'ancien mot de passe fourni est incorrect.", type: "danger" });
      return;
    }

    onUpdatePassword(activeStudent.id, newPass);
    setPassMsg({ text: "Félicitations ! Votre mot de passe a bien été mis à jour.", type: "success" });
    setCurrentPass("");
    setNewPass("");
  };

  const handleSelectFiliereCourse = (filiereId: number) => {
    setCourseFiliereFilter(filiereId);
    
    // If accessing another authorized major (not main), record in access logs!
    if (Number(filiereId) !== Number(activeStudent.filiere_id)) {
      onLogAccess(activeStudent.id, filiereId);
    }
  };

  // Filter courses based on selections
  const accessibleCourses = cours.filter(c => Number(c.filiere_id) === Number(courseFiliereFilter) && Number(c.classe_id) === Number(activeStudent.classe_id));

  // Compute stats for grades belonging to the active selected filiere
  const studentGrades = React.useMemo(() => {
    return notes.filter(n => {
      if (Number(n.etudiant_id) !== Number(activeStudent.id)) return false;
      if (Number(n.semestre_id) !== Number(selectedSemestreId)) return false;
      const parentCourse = cours.find(c => Number(c.id) === Number(n.cours_id));
      return parentCourse ? Number(parentCourse.filiere_id) === Number(courseFiliereFilter) : false;
    });
  }, [notes, activeStudent.id, selectedSemestreId, cours, courseFiliereFilter]);

  const currentAverage = React.useMemo(() => {
    if (studentGrades.length === 0) return 0;
    let sumVal = 0;
    let sumCredits = 0;
    studentGrades.forEach(g => {
      sumVal += Number(g.note || 0) * Number(g.credits || 0);
      sumCredits += Number(g.credits || 0);
    });
    return sumCredits > 0 ? (sumVal / sumCredits) : 0;
  }, [studentGrades]);

  const activeSem = semestres.find(s => Number(s.id) === Number(selectedSemestreId));

  const getMention = (averagedGrade: number) => {
    if (averagedGrade >= 18) return "Excellent";
    if (averagedGrade >= 16) return "Très Bien";
    if (averagedGrade >= 14) return "Bien";
    if (averagedGrade >= 12) return "Assez Bien";
    if (averagedGrade >= 10) return "Passable";
    return "Insuffisant";
  };

  const calculateGPAForStudent = React.useCallback((studentId: number, semId: number) => {
    const sGrades = notes.filter(n => Number(n.etudiant_id) === Number(studentId) && Number(n.semestre_id) === Number(semId));
    if (sGrades.length === 0) return 0;
    let sumVal = 0;
    let sumCredits = 0;
    sGrades.forEach(g => {
      sumVal += Number(g.note || 0) * Number(g.credits || 0);
      sumCredits += Number(g.credits || 0);
    });
    return sumCredits > 0 ? (sumVal / sumCredits) : 0;
  }, [notes]);

  // Dynamic ranking calculation relative to students in the same level/class
  const studentRankInfo = React.useMemo(() => {
    if (!etudiants || etudiants.length === 0) return { rank: 1, total: 1 };

    // Find classmates belonging to the same class as activeStudent
    const classmates = etudiants.filter(e => Number(e.classe_id) === Number(activeStudent.classe_id));
    if (classmates.length === 0) return { rank: 1, total: 1 };

    // Compute GPA for all classmates in this semester
    const rankList = classmates.map(c => {
      if (Number(c.id) === Number(activeStudent.id)) {
        return { id: c.id, gpa: currentAverage };
      }
      return {
        id: c.id,
        gpa: calculateGPAForStudent(c.id, selectedSemestreId)
      };
    }).sort((a, b) => b.gpa - a.gpa);

    const position = rankList.findIndex(item => Number(item.id) === Number(activeStudent.id));
    return {
      rank: position !== -1 ? position + 1 : 1,
      total: classmates.length
    };
  }, [etudiants, activeStudent.classe_id, activeStudent.id, currentAverage, selectedSemestreId, calculateGPAForStudent]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-100 pt-[60px] lg:pt-0" id="student-portal-wrapper">
      
      {/* Sidebar for Student */}
      <div className="hidden lg:flex w-full lg:w-64 bg-slate-900 text-slate-100 shrink-0 flex-col justify-between border-r border-slate-800 p-4">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">E</div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight text-white">Espace Étudiant</h3>
              <span className="text-[10px] text-gray-400 font-mono tracking-tight">{activeStudent.matricule}</span>
            </div>
          </div>

          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => setActiveTab('profil')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${activeTab === 'profil' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                🎓 Mon Profil & Droits
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('cours')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${activeTab === 'cours' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                📚 Bibliothèques de cours
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('notes')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${activeTab === 'notes' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                🏅 Notes Récoltées
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('bulletins')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${activeTab === 'bulletins' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                📜 Mon Bulletin Trimestriel
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('paiements')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${activeTab === 'paiements' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                💳 Scolarité & Paiements
              </button>
            </li>
          </ul>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3 bg-slate-950/40 p-2.5 rounded-lg text-xs">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-[11px] shrink-0">
              {activeStudent.nom.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <span className="font-extrabold text-slate-200 block truncate">{activeStudent.nom} {activeStudent.prenom}</span>
              <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">🟢 En Ligne</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-xs font-bold transition bg-red-950/40 text-red-350 hover:bg-red-900 hover:text-white border border-red-900/50 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0 text-red-400" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Working Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`border-b px-6 py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0 transition-colors ${
          adminTheme === 'sombre-or' ? 'bg-[#0b0f19] border-amber-500/10' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h2 className={`text-lg font-black tracking-tight ${
              adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-900'
            }`}>
              {activeTab === 'profil' && "Mon Profil Universitaire"}
              {activeTab === 'cours' && "Supports & Syllabus des Filières"}
              {activeTab === 'notes' && "Relevé des notes d'évaluations"}
              {activeTab === 'bulletins' && "Génération Automatique de Bulletins"}
              {activeTab === 'paiements' && "Mon Carnet de Paiements & Versements"}
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end select-none">
            {/* 4. FILIÈRE ACTIVE */}
            <div className={`flex items-center gap-1 text-[11px] border rounded-lg p-1.5 px-3 transition-colors ${
              adminTheme === 'sombre-or' ? 'bg-slate-950 border-amber-500/20' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`font-extrabold uppercase tracking-wider ${
                adminTheme === 'sombre-or' ? 'text-amber-400/80' : 'text-slate-400'
              }`}>Filière active :</span>
              <select
                value={courseFiliereFilter}
                onChange={(e) => handleSelectFiliereCourse(Number(e.target.value))}
                className={`bg-transparent border-none text-xs font-bold outline-none cursor-pointer focus:ring-0 p-0 text-ellipsis truncate max-w-[160px] ${
                  adminTheme === 'sombre-or' ? 'text-white' : 'text-blue-900'
                }`}
              >
                {allAccessibleFilieres.map(f => (
                  <option key={f.id} value={f.id} className={adminTheme === 'sombre-or' ? 'bg-slate-950 text-white' : ''}>
                    {f.nom_filiere}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="flex-grow p-6 overflow-y-auto max-w-6xl w-full mx-auto select-none pb-6 lg:pb-6">
          
          {/* TAB 1: PROFIL */}
          {activeTab === 'profil' && (
            <div className="space-y-6" id="student-profil-tab">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Identity Sheet */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-blue-105 text-blue-800 flex items-center justify-center font-black text-2xl shadow border border-blue-200 shrink-0">
                        {activeStudent.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-base">{activeStudent.nom} {activeStudent.prenom}</h4>
                        <span className="text-xs font-mono font-bold text-gray-400 uppercase mt-1 block">MATRICULE : {activeStudent.matricule}</span>
                      </div>
                    </div>

                    <div className="space-y-3 font-medium text-xs">
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-400">Filière d'Étude Principale :</span>
                        <span className="text-blue-700 font-extrabold">{filierePrincipale?.nom_filiere}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-400">Date de Naissance :</span>
                        <span className="text-slate-800 font-bold">{activeStudent.date_naissance}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-400">Lieu de Naissance :</span>
                        <span className="text-slate-800 font-bold">{activeStudent.lieu_naissance || "Bamako"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-400">E-mail de l'élève :</span>
                        <span className="text-slate-800 font-bold">{activeStudent.email}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-400">Téléphone de Secours :</span>
                        <span className="text-slate-800 font-bold">{activeStudent.telephone || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Sheet */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-sm text-slate-900 mb-4 border-b pb-2">Sécurité : Modifier de mot de passe</h4>
                  {passMsg.text && (
                    <div className={`p-3 text-xs font-semibold rounded-lg mb-4 ${passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                      {passMsg.text}
                    </div>
                  )}
                  <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
                    <div className="form-group mb-0">
                      <label className="form-label">Ancien mot de passe</label>
                      <div className="relative">
                        <input 
                          type={showCurrentPass ? "text" : "password"} 
                          value={currentPass}
                          onChange={e => setCurrentPass(e.target.value)}
                          className="form-control pr-10" 
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showCurrentPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="form-group mb-0">
                      <label className="form-label">Nouveau mot de passe</label>
                      <div className="relative">
                        <input 
                          type={showNewPass ? "text" : "password"} 
                          value={newPass}
                          onChange={e => setNewPass(e.target.value)}
                          className="form-control pr-10" 
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showNewPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary font-bold text-xs">Enregistrer</button>
                  </form>
                </div>

                {/* Available Specialties Selector */}
                <div className="col-span-1 md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h4 className="font-bold text-sm text-slate-900 mb-1">Mes Filières & Domaines d'Études</h4>
                  <p className="text-xs text-gray-500 mb-5">Sélectionnez une spécialité ci-dessous pour l'activer instantanément comme votre filière principale d'étude.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {allAccessibleFilieres.map(f => {
                      const isSelected = f.id === courseFiliereFilter;
                      return (
                        <div 
                          key={f.id} 
                          onClick={() => handleSelectFiliereCourse(f.id)}
                          className={`p-4 rounded-xl border-2 transition cursor-pointer relative overflow-hidden select-none ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50/20' 
                              : 'border-slate-200 hover:border-slate-350 bg-white hover:shadow-xs'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-blue-700' : 'text-gray-400'}`}>
                              {isSelected ? '★ Spécialité Active' : 'Spécialité Disponible'}
                            </span>
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                            )}
                          </div>
                          <h5 className="font-bold text-sm text-slate-900 mt-1">{f.nom_filiere}</h5>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{f.description || "Aucun descriptif pour cette filière."}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: COURS / DOCUMENTS */}
          {activeTab === 'cours' && (
            <div className="space-y-6" id="student-cours-tab">
              
              {/* Filter bar - toggle between all accessible majors with equal priority */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-gray-500 uppercase mr-2">Filière d'étude active :</span>
                
                {allAccessibleFilieres.map(f => {
                  const isSelected = f.id === courseFiliereFilter;
                  return (
                    <button 
                      key={f.id}
                      onClick={() => handleSelectFiliereCourse(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-black shadow-sm' 
                          : 'bg-gray-100 hover:bg-gray-200 text-slate-800'
                      }`}
                    >
                      🎓 {f.nom_filiere}
                    </button>
                  );
                })}
              </div>

              {/* Accessible documents list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="student-courses-grid">
                {accessibleCourses.length === 0 ? (
                  <div className="p-8 text-center bg-white border rounded-xl shadow-sm text-gray-500 text-sm col-span-2">
                    Aucun support de cours n'a été publié pour ce niveau d'études.
                  </div>
                ) : (
                  accessibleCourses.map(course => (
                    <div key={course.id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:border-blue-400 group transition">
                      <div className="p-5">
                        <span className="text-[10px] font-bold text-blue-700 font-mono tracking-tight uppercase bg-blue-50 px-20 py-1 rounded">
                          {course.enseignant}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 mt-2">{course.titre}</h4>
                        <p className="text-xs text-gray-500 line-clamp-3 mt-2">{course.description || "Aucun descriptif de cours rédigé."}</p>
                        <span className="text-[10px] text-gray-400 block mt-4 font-mono font-bold uppercase">Date de dépôt : {course.date_ajout}</span>
                      </div>
                      
                      {course.fichier && (
                        <div className="bg-slate-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                          <div className="flex flex-col truncate mr-2">
                            <span className="text-xs font-semibold text-slate-700 truncate">{course.fichier}</span>
                            {course.fichierTaille && (
                              <span className="text-[9px] text-gray-400 font-medium">{course.fichierTaille}</span>
                            )}
                          </div>
                          <button 
                            onClick={() => {
                              if (course.fichierData) {
                                const link = document.createElement('a');
                                link.href = course.fichierData;
                                link.download = course.fichier;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } else {
                                const text = `Support de cours : ${course.fichier}`;
                                const blob = new Blob([text], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = course.fichier;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-1 px-3 py-1.5 rounded text-[10px] font-bold inline-flex items-center gap-1.5 leading-none transition shrink-0 cursor-pointer"
                          >
                            Télécharger
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-6" id="student-notes-tab">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-150 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-gray-800">Mes notes d'évaluations scolaires</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Le calcul repose sur le nouveau système de Crédits Académiques (ECTS).</p>
                  </div>
                  <div className="w-56">
                    <select 
                      value={selectedSemestreId} 
                      onChange={e => setSelectedSemestreId(Number(e.target.value))}
                      className="form-control"
                    >
                      {semestres
                        .filter(s => !s.filiere_id || Number(s.filiere_id) === Number(activeStudent.filiere_id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{shortenSemester(s.nom_semestre)} ({s.annee_scolaire})</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="custom-table min-w-[850px] text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-100 font-bold">
                        <th className="py-2.5 px-4 uppercase text-[10px] text-left">
                          <span className="md:hidden">Matière / Module</span>
                          <span className="hidden md:inline">Intitulé de la Matière / Module</span>
                        </th>
                        <th className="py-2.5 px-3 uppercase text-[10px] text-center w-24">
                          <span className="md:hidden">CC (40%)</span>
                          <span className="hidden md:inline">Note CC / Classe (40%)</span>
                        </th>
                        <th className="py-2.5 px-3 uppercase text-[10px] text-center w-24">
                          <span className="md:hidden">Exam (60%)</span>
                          <span className="hidden md:inline">Note Examen (60%)</span>
                        </th>
                        <th className="py-2.5 px-3 uppercase text-[10px] text-center w-24">
                          <span className="md:hidden">Moy. Fin.</span>
                          <span className="hidden md:inline">Moyenne Finale</span>
                        </th>
                        <th className="py-2.5 px-3 uppercase text-[10px] text-center w-14">
                          <span className="md:hidden">Créd.</span>
                          <span className="hidden md:inline">Crédits</span>
                        </th>
                        <th className="py-2.5 px-3 uppercase text-[10px] text-center w-24">
                          <span className="md:hidden">Pondéré</span>
                          <span className="hidden md:inline">Grade Pondéré</span>
                        </th>
                        <th className="py-2.5 px-3 uppercase text-[10px] text-center w-24">
                          <span className="md:hidden">Ment.</span>
                          <span className="hidden md:inline">Mention</span>
                        </th>
                        <th className="py-2.5 px-3 uppercase text-[10px] text-center w-24">
                          <span className="md:hidden">Statut</span>
                          <span className="hidden md:inline">Statut LMD</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentGrades.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-gray-500 font-medium">Aucune note n'a été saisie pour ce semestre.</td>
                        </tr>
                      ) : (
                        studentGrades.map(g => {
                          const parsedCours = cours.find(x => x.id === g.cours_id);
                          const finalNote = Number(g.note);
                          const notePonderated = finalNote * Number(g.credits);

                          const getSubjMention = (val: number) => {
                            if (val >= 16) return "Très Bien";
                            if (val >= 14) return "Bien";
                            if (val >= 12) return "Assez Bien";
                            if (val >= 10) return "Passable";
                            return "Ajourné";
                          };

                          // University LMD validation status
                          let subjStatus = "Rattrapage (R.A.)";
                          let badgeStyle = "bg-rose-100 text-rose-850 border border-rose-250";
                          
                          if (finalNote >= 10) {
                            subjStatus = "Capitalisé (V.A.)";
                            badgeStyle = "bg-emerald-100 text-emerald-850 border border-emerald-250";
                          } else if (currentAverage >= 10) {
                            subjStatus = "Compensé (V.Comp)";
                            badgeStyle = "bg-sky-100 text-sky-850 border border-sky-200";
                          }

                          const subjMention = getSubjMention(finalNote);

                          return (
                            <tr key={g.id} className="hover:bg-slate-50 border-b border-gray-150 transition text-center">
                              <td className="font-bold text-slate-900 py-3 px-4 text-left">
                                <div>{parsedCours ? parsedCours.titre : "Evaluation Générale"}</div>
                              </td>
                              <td className="font-medium text-gray-700">
                                {g.note_classe !== undefined ? `${g.note_classe.toFixed(2)}/20` : "-"}
                              </td>
                              <td className="font-medium text-gray-700">
                                {g.note_examen !== undefined ? `${g.note_examen.toFixed(2)}/20` : "-"}
                              </td>
                              <td className="font-bold text-slate-950 text-sm">
                                {finalNote.toFixed(2)}/20
                              </td>
                              <td className="font-semibold text-gray-550">{g.credits}</td>
                              <td className="font-bold text-blue-700">{notePonderated.toFixed(2)}</td>
                              <td className="font-medium">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  finalNote >= 14 ? "bg-emerald-50 text-emerald-700" :
                                  finalNote >= 10 ? "bg-blue-50 text-blue-750" :
                                  "bg-rose-50 text-rose-700"
                                }`}>
                                  {subjMention}
                                </span>
                              </td>
                              <td>
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${badgeStyle}`}>
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
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* University Credits Balance (LMD System) */}
                {studentGrades.length > 0 && (() => {
                  const totalSemCredits = studentGrades.reduce((sum, g) => sum + Number(g.credits), 0);
                  const capCredits = studentGrades.filter(g => Number(g.note) >= 10).reduce((sum, g) => sum + Number(g.credits), 0);
                  const isComp = currentAverage >= 10;
                  const valCredits = isComp ? totalSemCredits : capCredits;
                  const compCredits = isComp ? (totalSemCredits - capCredits) : 0;
                  const progressPercentage = totalSemCredits > 0 ? Math.round((valCredits / totalSemCredits) * 100) : 0;

                  return (
                    <div className="bg-slate-50 border-t border-gray-200 p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                          Bilan des Crédits Académiques (Système LMD)
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">Compensation semestrielle active</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Crédits inscrits</span>
                          <span className="text-sm font-black text-slate-900">{totalSemCredits} ECTS</span>
                        </div>
                        <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase block">Crédits acquis</span>
                          <span className="text-sm font-black text-emerald-800">{capCredits} ECTS</span>
                        </div>
                        <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-150">
                          <span className="text-[9px] font-bold text-sky-600 uppercase block">Crédits compensés</span>
                          <span className="text-sm font-black text-sky-850">{compCredits} ECTS</span>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-150">
                          <span className="text-[9px] font-bold text-indigo-700 uppercase block">Crédits validés</span>
                          <span className="text-sm font-black text-indigo-900">{valCredits} / {totalSemCredits} ECTS</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                          <span>Progression d'acquisition :</span>
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
                      </div>
                    </div>
                  );
                })()}

                {/* Score summary */}
                {studentGrades.length > 0 && (() => {
                  const { rank, total } = studentRankInfo;
                  return (
                    <div className="bg-slate-900 text-slate-100 p-5 flex flex-col sm:flex-row justify-between items-center text-xs font-bold shrink-0 rounded-b-xl gap-3">
                      <div className="flex items-center gap-2">
                        <span>Semestre :</span>
                        <span className="text-amber-400 font-extrabold uppercase">{activeSem ? shortenSemester(activeSem.nom_semestre) : "Semestre"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block mb-0.5">Moyenne Pondérée</span>
                          <span className="text-base text-blue-400 font-extrabold">{currentAverage.toFixed(2)} / 20</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: BULLETINS */}
          {activeTab === 'bulletins' && (
            <div className="space-y-6" id="student-bulletins-tab">
              {/* Period selection header */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-gray-550 uppercase">Rapport de Notes Semestriel :</span>
                <div className="flex gap-2">
                  <select 
                    value={selectedSemestreId} 
                    onChange={e => setSelectedSemestreId(Number(e.target.value))}
                    className="form-control w-52"
                  >
                    {semestres
                      .filter(s => !s.filiere_id || Number(s.filiere_id) === Number(activeStudent.filiere_id))
                      .map(s => (
                        <option key={s.id} value={s.id}>{shortenSemester(s.nom_semestre)}</option>
                      ))}
                  </select>

                </div>
              </div>

              {/* Complete visual bulletin printable card representation */}
              {activeStudent && activeSem ? (
                <div className="bg-[#ffffff] p-8 max-w-4xl mx-auto rounded-2xl border-4 border-[#000000] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden text-[#000000]" id="student-pdf-bulletin">
                  
                  {/* Stamp background seal */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 pointer-events-none opacity-[0.04] border-8 border-[#000000] rounded-full w-96 h-96 flex items-center justify-center">
                    <span className="text-[#000000] font-bold text-3xl tracking-widest text-center">ACADÉMIE<br />SCOLAIRE</span>
                  </div>

                  {/* Header school letterhead */}
                  <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-[#000000] pb-5 gap-4">
                    <div className="text-center md:text-left">
                      <h2 className="text-lg font-black text-[#000000] tracking-tight flex items-center gap-2 justify-center md:justify-start">
                        <BookOpen className="w-6 h-6 text-[#000000]" />
                        <span>INSTITUT SUPÉRIEUR DES TECHNOLOGIES</span>
                      </h2>
                      <p className="text-xs text-[#000000] mt-1 uppercase font-bold">Bamako - Hamdallaye ACI | Tel: +223 20 22 40 30</p>
                    </div>
                    <div className="text-center md:text-right font-mono text-xs border-l-0 md:border-l border-[#000000] pl-0 md:pl-6 shrink-0 w-full md:w-auto text-[#000000]">
                      <strong className="text-[#000000] block font-black uppercase">BULLETIN SCOLAIRE OFFICIEL</strong>
                      <span className="text-[#000000] font-extrabold uppercase mt-1 block">{shortenSemester(activeSem.nom_semestre)} ({activeSem.annee_scolaire})</span>
                    </div>
                  </div>

                  {/* Student identities */}
                  <div className="my-6 md:flex gap-6 bg-[#ffffff] border-2 border-[#000000] rounded-xl p-4 text-[#000000]">
                    <GraduationCap 
                      className="w-14 h-14 text-[#000000] bg-[#ffffff] p-2.5 rounded-lg border-2 border-[#000000] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto md:mx-0 shrink-0 mb-3 md:mb-0" 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-xs text-[#000000] flex-1">
                      <div>
                        <span className="text-[#525252] uppercase font-black tracking-wider block text-[9px]">ID Matricule</span>
                        <strong className="font-mono text-[#000000] text-sm">{activeStudent.matricule}</strong>
                      </div>
                      <div>
                        <span className="text-[#525252] uppercase font-black tracking-wider block text-[9px]">Étudiant</span>
                        <strong className="text-[#000000] uppercase text-sm font-black">{activeStudent.nom} {activeStudent.prenom}</strong>
                      </div>
                      <div>
                        <span className="text-[#525252] uppercase font-black tracking-wider block text-[9px]">Filière</span>
                        <strong className="text-[#000000] font-black uppercase text-sm">{filierePrincipale?.nom_filiere}</strong>
                      </div>
                      <div>
                        <span className="text-[#525252] uppercase font-black tracking-wider block text-[9px]">Enseigne niveau</span>
                        <strong className="text-[#000000] font-bold text-sm">{classeActuelle?.nom_classe}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Grades grid */}
                  <div className="border-2 border-[#000000] rounded-xl overflow-hidden mt-6 bg-[#ffffff]">
                    <div className="overflow-x-auto w-full">
                      <table className="min-w-[850px] w-full text-xs text-[#000000] bg-[#ffffff] border-collapse" style={{ boxShadow: 'none' }}>
                        <thead>
                          <tr className="bg-[#f5f5f5] border-b-2 border-[#000000] text-[#000000]">
                            <th className="py-3 px-4 font-black text-left text-[#000000]">
                              <span className="md:hidden">Module</span>
                              <span className="hidden md:inline">Cours module</span>
                            </th>
                            <th className="py-3 px-3 uppercase text-[10px] text-center w-24 text-[#000000] border-l border-[#000000]">
                              <span className="md:hidden">CC (40%)</span>
                              <span className="hidden md:inline">Note CC / Classe (40%)</span>
                            </th>
                            <th className="py-3 px-3 uppercase text-[10px] text-center w-24 text-[#000000] border-l border-[#000000]">
                              <span className="md:hidden">Exam (60%)</span>
                              <span className="hidden md:inline">Note Examen (60%)</span>
                            </th>
                            <th className="py-3 px-3 uppercase text-[10px] text-center w-24 text-[#000000] border-l border-[#000000]">
                              <span className="md:hidden">Moy. Fin.</span>
                              <span className="hidden md:inline">Moyenne Finale</span>
                            </th>
                            <th className="py-3 px-3 uppercase text-[10px] text-center w-14 text-[#000000] border-l border-[#000000]">
                              <span className="md:hidden">Créd.</span>
                              <span className="hidden md:inline">Crédits</span>
                            </th>
                            <th className="py-3 px-3 uppercase text-[10px] text-center w-24 text-[#000000] border-l border-[#000000]">
                              <span className="md:hidden">Total</span>
                              <span className="hidden md:inline">Total pondéré</span>
                            </th>
                            <th className="py-3 px-3 uppercase text-[10px] text-center w-24 text-[#000000] border-l border-[#000000]">
                              <span className="md:hidden">Ment.</span>
                              <span className="hidden md:inline">Mention</span>
                            </th>
                            <th className="py-3 px-3 uppercase text-[10px] text-center w-24 text-[#000000] border-l border-[#000000]">
                              <span className="md:hidden">Statut</span>
                              <span className="hidden md:inline">Statut LMD</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentGrades.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-[#000000] font-bold">Aucun bulletin disponible (pas de notes validées).</td>
                            </tr>
                          ) : (
                            studentGrades.map(g => {
                              const courseObj = cours.find(c => c.id === g.cours_id);
                              const finalNote = Number(g.note);
                              const notePonderated = finalNote * Number(g.credits);

                              const getSubjMention = (val: number) => {
                                if (val >= 16) return "Très Bien";
                                if (val >= 14) return "Bien";
                                if (val >= 12) return "Assez Bien";
                                if (val >= 10) return "Passable";
                                return "Ajourné";
                              };

                              // University LMD validation status
                              let subjStatus = "Rattrapage (R.A.)";
                              
                              if (finalNote >= 10) {
                                subjStatus = "Capitalisé (V.A.)";
                              } else if (currentAverage >= 10) {
                                subjStatus = "Compensé (V.Comp)";
                              }

                              const subjMention = getSubjMention(finalNote);

                              return (
                                <tr key={g.id} className="border-b border-[#000000] hover:bg-[#fafafa] transition text-center text-[#000000]">
                                  <td className="font-bold text-[#000000] py-3 px-4 text-left">
                                    <div className="font-bold text-sm">{courseObj ? courseObj.titre : "Cours"}</div>
                                  </td>
                                  <td className="font-bold text-[#000000] border-l border-[#000000]">
                                    {g.note_classe !== undefined ? `${g.note_classe.toFixed(2)}/20` : "-"}
                                  </td>
                                  <td className="font-bold text-[#000000] border-l border-[#000000]">
                                    {g.note_examen !== undefined ? `${g.note_examen.toFixed(2)}/20` : "-"}
                                  </td>
                                  <td className="font-black text-[#000000] text-sm border-l border-[#000000]">
                                    {finalNote.toFixed(2)}/20
                                  </td>
                                  <td className="font-bold text-[#000000] border-l border-[#000000]">{g.credits}</td>
                                  <td className="font-black text-[#000000] border-l border-[#000000]">{notePonderated.toFixed(2)}</td>
                                  <td className="font-bold border-l border-[#000000] p-1">
                                    <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded border border-[#000000] ${
                                      finalNote >= 10 ? "bg-[#e2f3e2] text-[#0f5132]" : "bg-[#f8d7da] text-[#842029]"
                                    }`}>
                                      {subjMention}
                                    </span>
                                  </td>
                                  <td className="border-l border-[#000000] text-[#000000] p-1">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-[#000000] ${
                                      subjStatus.includes("Capitalisé") ? "bg-[#e2f3e2] text-[#0f5132]" : 
                                      subjStatus.includes("Compensé") ? "bg-[#e8f0fe] text-[#1a73e8]" : 
                                      "bg-[#f8d7da] text-[#842029]"
                                    }`}>
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
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* LMD Credits Balance Section */}
                  {studentGrades.length > 0 && (() => {
                    const totalSemCredits = studentGrades.reduce((sum, g) => sum + Number(g.credits), 0);
                    const capCredits = studentGrades.filter(g => Number(g.note) >= 10).reduce((sum, g) => sum + Number(g.credits), 0);
                    const isComp = currentAverage >= 10;
                    const valCredits = isComp ? totalSemCredits : capCredits;
                    const compCredits = isComp ? (totalSemCredits - capCredits) : 0;
                    const progressPercentage = totalSemCredits > 0 ? Math.round((valCredits / totalSemCredits) * 100) : 0;

                    return (
                      <div className="mt-5 p-4 bg-[#ffffff] border-2 border-[#000000] rounded-xl space-y-3 relative mx-auto w-full text-[#000000] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#000000] pb-2">
                          <span className="text-[10px] font-black text-[#000000] uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#000000] animate-pulse"></span>
                            <span className="md:hidden">Bilan Crédits (LMD)</span>
                            <span className="hidden md:inline">Bilan des Crédits Académiques (Système LMD)</span>
                          </span>
                          <span className="text-[10px] text-[#000000] font-mono font-bold">
                            <span className="md:hidden">Compensations Actives</span>
                            <span className="hidden md:inline">Compensations semestrielles actives</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                          <div className="bg-[#ffffff] p-2.5 rounded-lg border-2 border-[#000000] text-[#000000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-[9px] font-bold text-[#525252] uppercase block">
                              <span className="md:hidden">Inscrits</span>
                              <span className="hidden md:inline">Crédits inscrits</span>
                            </span>
                            <span className="text-sm font-black text-[#000000]">{totalSemCredits} ECTS</span>
                          </div>
                          <div className="bg-[#ffffff] p-2.5 rounded-lg border-2 border-[#000000] text-[#000000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-[9px] font-bold text-[#525252] uppercase block">
                              <span className="md:hidden">Capitalisés</span>
                              <span className="hidden md:inline">Crédits capitalisés</span>
                            </span>
                            <span className="text-sm font-black text-[#000000]">{capCredits} ECTS</span>
                          </div>
                          <div className="bg-[#ffffff] p-2.5 rounded-lg border-2 border-[#000000] text-[#000000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-[9px] font-bold text-[#525252] uppercase block">
                              <span className="md:hidden">Compensés</span>
                              <span className="hidden md:inline">Crédits compensés</span>
                            </span>
                            <span className="text-sm font-black text-[#000000]">{compCredits} ECTS</span>
                          </div>
                          <div className="bg-[#ffffff] p-2.5 rounded-lg border-2 border-[#000000] text-[#000000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-[9px] font-bold text-[#525252] uppercase block">
                              <span className="md:hidden">Validés</span>
                              <span className="hidden md:inline">Crédits validés</span>
                            </span>
                            <span className="text-sm font-black text-[#000000]">{valCredits} / {totalSemCredits} ECTS</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-black text-[#000000]">
                            <span>
                              <span className="md:hidden">Taux Val. Semestre :</span>
                              <span className="hidden md:inline">Taux de validation du semestre :</span>
                            </span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-[#ffffff] border-2 border-[#000000] h-3.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-[#000000] transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Results summarisations */}
                  {(() => {
                    const { rank, total } = studentRankInfo;
                    return (
                      <div className="mt-6 border-t-2 border-[#000000] pt-5 flex flex-col md:flex-row gap-4 text-[#000000]">
                        <div className="flex-1 space-y-2 border-2 border-[#000000] p-4 rounded-xl text-xs font-bold text-[#000000] bg-[#ffffff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex justify-between">
                            <span className="text-[#000000] font-bold">
                              <span className="md:hidden">Moy. Trim :</span>
                              <span className="hidden md:inline">Moyenne trimestrielle :</span>
                            </span>
                            <span className="text-[#000000] font-black">{currentAverage > 0 ? `${currentAverage.toFixed(2)}/20` : "Pas de moyenne"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#000000] font-bold">
                              <span className="md:hidden">Val. Admin :</span>
                              <span className="hidden md:inline">Validation administrative :</span>
                            </span>
                            <span className="text-[#000000] font-extrabold uppercase font-mono">
                              {currentAverage >= 10 ? 'Validé' : 'Non validé'}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 bg-[#ffffff] border-2 border-[#000000] rounded-xl p-4 flex flex-col items-center justify-center text-center text-[#000000] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <span className="text-[10px] uppercase font-black text-[#525252]">Mention Scolaire</span>
                          <strong className="text-lg text-[#000000] uppercase mt-1 font-black">{currentAverage > 0 ? getMention(currentAverage) : "-"}</strong>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Stamp space */}
                  <div className="mt-8 pt-8 border-t border-[#000000] grid grid-cols-2 text-center text-xs text-[#000000]">
                    <div>
                      <strong className="text-[#000000] block uppercase font-black text-[10px]">La Direction-Générale</strong>
                      <p className="text-[10px] mt-0.5 font-bold italic">Signature validée électroniquement</p>
                      <div className="mt-8 border-b border-[#000000] w-24 mx-auto"></div>
                    </div>
                    <div>
                      <strong className="text-[#000000] block uppercase font-black text-[10px]">Le Sceau d'Établissement</strong>
                      <p className="text-[10px] mt-0.5 font-bold italic">Sceau officiel de scolarité</p>
                      <div className="mt-8 border-b border-[#000000] w-24 mx-auto"></div>
                    </div>
                  </div>

                </div>
              ) : (
                <p className="p-8 text-center text-gray-500">Bulletin provisoire indisponible.</p>
              )}
            </div>
          )}

          {/* TAB 5: PAIEMENTS */}
          {activeTab === 'paiements' && (
            <div className="space-y-6 animate-fade-in" id="student-paiement-tab">
              {(() => {
                const studentPayments = paiements.filter(p => p.etudiant_id === activeStudent.id && p.annee_scolaire === selectedStudentAnnee);
                const totalPaid = studentPayments.filter(p => p.statut === 'Payé').reduce((sum, p) => sum + p.montant, 0);
                const totalPending = studentPayments.filter(p => p.statut === 'En attente').reduce((sum, p) => sum + p.montant, 0);
                const expectedScolarite = scolariteAnnuelle; // Configured annual tuition
                const remainder = expectedScolarite - totalPaid;
                const progressPct = Math.min(100, Math.round((totalPaid / expectedScolarite) * 100));

                const formatCFA = (val: number) => {
                  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val);
                };

                return (
                  <>
                    {/* Selector for Academic Year */}
                    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Choix de l'Année Académique</h4>
                        <p className="text-[11px] text-slate-500">Sélectionnez l'année pour consulter vos versements, factures et soldes restants.</p>
                      </div>
                      <select
                        value={selectedStudentAnnee}
                        onChange={e => setSelectedStudentAnnee(e.target.value)}
                        className="p-2.5 bg-white border border-slate-350 rounded-xl text-xs font-bold text-slate-800 focus:outline-none min-w-48"
                      >
                        {uniqueAnneeScolaires.map(yr => (
                          <option key={yr} value={yr}>
                            Année Scolaire {yr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Expected and Paid */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Scolarité Annuelle</span>
                        <div className="flex justify-between items-baseline">
                          <strong className="text-xl text-slate-900 font-extrabold block">{formatCFA(expectedScolarite)}</strong>
                          <span className="text-[10px] text-teal-600 font-extrabold font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Année {selectedStudentAnnee}</span>
                        </div>
                        <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-[10px] text-blue-600 font-bold block mt-1">{progressPct}% complété</span>
                      </div>

                      {/* Cash Approved */}
                      <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-250 shadow-sm space-y-1.5">
                        <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider block">Total Versé & Validé</span>
                        <div className="flex justify-between items-baseline">
                          <strong className="text-xl text-emerald-950 font-extrabold block">{formatCFA(totalPaid)}</strong>
                          <span className="text-xs text-emerald-600 font-bold">Caisse Centrale</span>
                        </div>
                        <p className="text-[10px] text-emerald-850 font-medium leading-tight mt-3">
                          Vos paiements ont été confirmés par le service de comptabilité centrale de l'établissement.
                        </p>
                      </div>

                      {/* Outstanding remaining */}
                      <div className={`p-5 rounded-xl border shadow-sm space-y-1.5 ${remainder > 0 ? 'bg-amber-50 border-amber-250' : 'bg-blue-50 border-blue-200'}`}>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${remainder > 0 ? 'text-amber-700' : 'text-blue-700'}`}>
                          {remainder > 0 ? "Reste à Régler" : "Compte de Scolarité Soldé"}
                        </span>
                        <div className="flex justify-between items-baseline">
                          <strong className={`text-xl font-extrabold block ${remainder > 0 ? 'text-amber-950' : 'text-blue-950'}`}>
                            {remainder > 0 ? formatCFA(remainder) : "0 CFA"}
                          </strong>
                          <span className="text-xs text-slate-400 font-bold">Solde</span>
                        </div>
                        <p className="text-[10px] leading-tight mt-3 text-slate-600">
                          {remainder > 0 
                            ? "Veuillez régulariser le solde restant avant la session d'examens semestriels."
                            : "Félicitations, vous êtes en règle avec la caisse scolaire pour toute l'année académique !"}
                        </p>
                      </div>

                    </div>

                    {/* Pending alert if any */}
                    {totalPending > 0 && (
                      <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-amber-800">
                        <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-600 shrink-0" />
                        <span>Vous avez un versement d'un montant de <strong className="font-bold">{formatCFA(totalPending)}</strong> en attente de vérification comptable. Les reçus associés seront émis dès validation.</span>
                      </div>
                    )}

                    {/* Receipt transactions table list */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Historique de mes versements</h4>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-[700px] w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider select-none">
                              <th className="py-3 px-4">N° Reçu</th>
                              <th className="py-3 px-4">Rubrique</th>
                              <th className="py-3 px-4">Mode / Canal</th>
                              <th className="py-3 px-4">Montant</th>
                              <th className="py-3 px-4">Date de dépôt</th>
                              <th className="py-3 px-4 text-center">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {studentPayments.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-12 px-4 text-center text-slate-400 italic">
                                  Aucune écriture comptable n'est enregistrée pour votre matricule.
                                </td>
                              </tr>
                            ) : (
                              studentPayments.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                    <span className="text-teal-600 mr-1">■</span> {p.recu_numero}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-blue-200">
                                      {p.type_frais}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-700 font-semibold">{p.methode}</td>
                                  <td className="py-3 px-4 font-mono font-extrabold text-slate-900">{formatCFA(p.montant)}</td>
                                  <td className="py-3 px-4 font-medium text-slate-600">{p.date_paiement}</td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2.5 py-1 text-[9px] rounded-lg border leading-none font-bold ${
                                      p.statut === 'Payé' 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                        : p.statut === 'En attente'
                                        ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                                        : 'bg-slate-100 text-slate-800 border-slate-300'
                                    }`}>
                                      {p.statut}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      {/* Persistent Sticky Top Navigation Bar for Mobile Phones */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 z-50 shadow-[0_4px_16px_rgba(0,0,0,0.30)]">
        <div className="flex justify-between items-center px-4 py-3 h-[60px]">
          <span className="text-white font-extrabold text-xs sm:text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            {activeTab === 'profil' ? 'Mon Profil' :
             activeTab === 'cours' ? 'Supports & Cours' :
             activeTab === 'notes' ? 'Notes / Évaluations' :
             'Bulletins Semestriels'}
          </span>
          
          {/* Hamburger Menu Icon */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/60 transition active:scale-95 text-slate-200 outline-none"
            aria-label="Menu"
          >
            {menuOpen ? (
              <X className="w-5 h-5 shrink-0 text-white" />
            ) : (
              <span className="text-xl leading-none font-extrabold">☰</span>
            )}
          </button>
        </div>

        {/* Dropdown overlay menu / hamburger list */}
        {menuOpen && (
          <div className="absolute top-[60px] left-0 right-0 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl py-3 px-4 flex flex-col gap-1.5 z-50">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold px-2 pb-1.5 border-b border-slate-900 mb-1">
              Navigation d'Éléments
            </p>
            <button 
              onClick={() => { setActiveTab('profil'); setMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'profil' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <User className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Mon Profil</span>
            </button>
            <button 
              onClick={() => { setActiveTab('cours'); setMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'cours' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <BookOpen className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Supports de Cours (Leçons)</span>
            </button>
            <button 
              onClick={() => { setActiveTab('notes'); setMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'notes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>Fiche d'Évaluations (Notes)</span>
            </button>
            <button 
              onClick={() => { setActiveTab('bulletins'); setMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'bulletins' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Bulletin d'Études</span>
            </button>
            <button 
              onClick={() => { setActiveTab('paiements'); setMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'paiements' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <DollarSign className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Scolarité & Paiements</span>
            </button>
            <div className="border-t border-slate-900 pt-1.5 mt-1">
              <button 
                onClick={() => { onLogout(); setMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition bg-red-950/50 text-red-300 hover:bg-red-900 hover:text-white border border-red-900/50"
              >
                <LogOut className="w-4 h-4 shrink-0 text-red-400" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
