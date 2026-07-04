import React, { useState } from 'react';
import { Etudiant, Filiere, Cours, Note, HistoriqueAcces, Semestre } from '../types';
import { Users, GraduationCap, FileText, TrendingUp, Award, Clock, ArrowLeft, Lock, Unlock, Eye } from 'lucide-react';

interface AdminDashboardProps {
  etudiants: Etudiant[];
  filieres: Filiere[];
  cours: Cours[];
  notes: Note[];
  semestres: Semestre[];
  logs: HistoriqueAcces[];
  onNavigate: (tab: string) => void;
  globalFiliereId?: number;
  globalSemestreId?: number;
  theme?: 'sombre-or' | 'clair-pro';
  isPortalLocked: boolean;
  onTogglePortalLock: () => void;
}

export default function AdminDashboard({ 
  etudiants, 
  filieres, 
  cours, 
  notes, 
  semestres, 
  logs, 
  onNavigate, 
  globalFiliereId, 
  globalSemestreId,
  theme = 'sombre-or',
  isPortalLocked,
  onTogglePortalLock
}: AdminDashboardProps) {
  const [showData, setShowData] = useState(true);

  // Stats calculations
  const filteredStudents = globalFiliereId && globalFiliereId > 0 
    ? etudiants.filter(e => Number(e.filiere_id) === Number(globalFiliereId)) 
    : etudiants;

  const filteredCoursItems = globalFiliereId && globalFiliereId > 0
    ? cours.filter(c => Number(c.filiere_id) === Number(globalFiliereId))
    : cours;

  const filteredNotes = notes.filter(n => {
    const student = etudiants.find(e => Number(e.id) === Number(n.etudiant_id));
    const matchesFiliere = !globalFiliereId || globalFiliereId === 0 || (student && Number(student.filiere_id) === Number(globalFiliereId));
    const matchesSemestre = !globalSemestreId || globalSemestreId === 0 || Number(n.semestre_id) === Number(globalSemestreId);
    return matchesFiliere && matchesSemestre;
  });

  const totalStudents = filteredStudents.length;
  const totalFilieres = filieres.length;
  const totalCours = filteredCoursItems.length;
  
  // Calculate general average
  const totalGrades = filteredNotes.length;
  const averageGrade = totalGrades > 0
    ? (filteredNotes.reduce((sum, n) => sum + Number(n.note), 0) / totalGrades).toFixed(2)
    : "0.00";

  // Recent 5 grades with student and course details
  const getRecentGrades = () => {
    return [...filteredNotes]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5)
      .map(grade => {
        const student = etudiants.find(e => Number(e.id) === Number(grade.etudiant_id));
        const course = cours.find(c => Number(c.id) === Number(grade.cours_id));
        return {
          id: grade.id,
          studentName: student ? `${student.nom} ${student.prenom}` : "Inconnu",
          courseTitle: course ? course.titre : "Cours supprimé",
          note: grade.note,
          date: grade.date_ajout
        };
      });
  };

  // Recent 5 access logs (cross-major)
  const getRecentLogs = () => {
    return [...logs]
      .filter(log => {
        const student = etudiants.find(e => Number(e.id) === Number(log.etudiant_id));
        return !globalFiliereId || globalFiliereId === 0 || (student && Number(student.filiere_id) === Number(globalFiliereId));
      })
      .sort((a, b) => b.id - a.id)
      .slice(0, 5)
      .map(log => {
        const student = etudiants.find(e => Number(e.id) === Number(log.etudiant_id));
        const filiere = filieres.find(f => Number(f.id) === Number(log.filiere_id));
        return {
          id: log.id,
          studentName: student ? `${student.nom} ${student.prenom}` : "Inconnu",
          filiereName: filiere ? filiere.nom_filiere : "Inconnu",
          date: log.date_acces
        };
      });
  };

  if (!showData) {
    return (
      <div className="space-y-6 animate-fade-in" id="admin-dashboard-intro">
        {/* Banner with administrative status */}
        <div className={`p-8 rounded-2xl text-white shadow-md relative overflow-hidden border transition ${
          theme === 'sombre-or' 
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-amber-500/30 shadow-amber-950/20' 
            : 'bg-gradient-to-r from-slate-900 to-indigo-950 border-slate-800 shadow-md'
        }`}>
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center p-6 select-none pointer-events-none">
            <Award className="w-64 h-64 rotate-12 text-white" />
          </div>
          <div className="relative z-10 space-y-4 max-w-2xl">
            <span className={`text-[10px] border font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${
              theme === 'sombre-or'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            }`}>
              Fiche de Poste & Rôle de Direction
            </span>
            <h1 className={`text-xl md:text-2xl font-black tracking-tight leading-tight ${theme === 'sombre-or' ? 'text-amber-400' : 'text-white'}`}>
              Direction Globale de la Scolarité & Validation Pédagogique
            </h1>
            <p className={`text-xs leading-relaxed ${theme === 'sombre-or' ? 'text-slate-300' : 'text-slate-300'}`}>
              L'administrateur scolaire est garant de la conformité des inscriptions, de la structure relationnelle des filières d'enseignement, de la centralisation des supports didactiques, et de la validation impartiale des bulletins de notes semestriels officiels.
            </p>
          </div>
        </div>

        {/* Roles Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Functional roles */}
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 transition ${
            theme === 'sombre-or' 
              ? 'bg-slate-900 border-amber-500/20 text-white shadow-amber-950/10' 
              : 'bg-white border-gray-150 text-slate-900'
          }`}>
            <h3 className={`font-bold text-sm flex items-center gap-2 border-b pb-3 ${
              theme === 'sombre-or' ? 'text-amber-400 border-amber-500/10' : 'text-slate-900 border-gray-100'
            }`}>
              <span className={`w-1.5 h-6 rounded-full ${theme === 'sombre-or' ? 'bg-amber-500' : 'bg-blue-600'}`}></span>
              Responsabilités Fonctionnelles Principales
            </h3>
            
            <ul className="space-y-3.5 text-xs">
              {[
                { title: "Gestion Administrative du Registre :", desc: "Inscription et tri des étudiants, affectation des matricules d'élèves incrémentés, et fiches signalétiques." },
                { title: "Modélisation Académique :", desc: "Définition des filières spécialisées, rattachement des matières obligatoires et des crédits en vigueur." },
                { title: "Publication de Supports :", desc: "Téléchargement et catégorisation des livres, énoncés de devoirs et cours par classe et semestre d'études." },
                { title: "Saisie de Notes & Archivage :", desc: "Enregistrement double des notes d'examen et contrôle continu (pondération automatique 60/40)." },
                { title: "Bulletins Officiels :", desc: "Génération et imprimerie de la moyenne semestrielle pondérée de l'élève par rapport aux barèmes." },
                { title: "Accréditation d'Accès :", desc: "Octroi d'autorisations exceptionnelles permettant aux élèves d'accéder aux cours d'autres filières." }
              ].map((role, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className={`${theme === 'sombre-or' ? 'text-amber-400' : 'text-blue-600'} mt-0.5 font-bold`}>✓</span>
                  <div className={theme === 'sombre-or' ? 'text-slate-300' : 'text-gray-600'}>
                    <strong className={theme === 'sombre-or' ? 'text-amber-350' : 'text-slate-800'}>{role.title}</strong> {role.desc}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Security & Academic Quality Charter */}
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 transition ${
            theme === 'sombre-or' 
              ? 'bg-slate-900 border-amber-500/20 text-white shadow-amber-950/10' 
              : 'bg-white border-gray-150 text-slate-900'
          }`}>
            <h3 className={`font-bold text-sm flex items-center gap-2 border-b pb-3 ${
              theme === 'sombre-or' ? 'text-amber-400 border-amber-500/10' : 'text-slate-900 border-gray-100'
            }`}>
              <span className={`w-1.5 h-6 rounded-full ${theme === 'sombre-or' ? 'bg-amber-500' : 'bg-teal-600'}`}></span>
              Conformité Académique & Charte de Qualité
            </h3>

            <div className={`p-4 rounded-xl text-xs leading-relaxed space-y-3 border transition ${
              theme === 'sombre-or' 
                ? 'bg-slate-950/50 border-amber-500/15 text-slate-350' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <p>
                Afin de garantir l'excellence de la gestion administrative et l'évaluation équitable au sein de l'établissement, nos directives requièrent :
              </p>
              <div className="space-y-2 text-[11px] font-medium">
                <div className={`flex gap-2 items-center p-2.5 rounded-lg border transition ${
                  theme === 'sombre-or' ? 'bg-slate-900/60 border-amber-500/10 text-slate-200' : 'bg-white border-gray-150 text-slate-800'
                }`}>
                  <span className={theme === 'sombre-or' ? 'text-amber-500' : 'text-teal-600'}>📊</span>
                  <span><strong>Calcul Direct et Pondéré</strong> (Contrôles continus et examens normalisés)</span>
                </div>
                <div className={`flex gap-2 items-center p-2.5 rounded-lg border transition ${
                  theme === 'sombre-or' ? 'bg-slate-900/60 border-amber-500/10 text-slate-200' : 'bg-white border-gray-150 text-slate-800'
                }`}>
                  <span className={theme === 'sombre-or' ? 'text-amber-500' : 'text-teal-600'}>👤</span>
                  <span><strong>Affectation nominative d'Élèves</strong> (Filtre actif par matricule scolaire unique)</span>
                </div>
                <div className={`flex gap-2 items-center p-2.5 rounded-lg border transition ${
                  theme === 'sombre-or' ? 'bg-slate-900/60 border-amber-500/10 text-slate-200' : 'bg-white border-gray-150 text-slate-800'
                }`}>
                  <span className={theme === 'sombre-or' ? 'text-amber-500' : 'text-teal-600'}>🔒</span>
                  <span><strong>Sécurisation administrative</strong> (Archivage et traçabilité des droits de consultation)</span>
                </div>
              </div>
            </div>

            <div className={`text-xs leading-relaxed pt-2 ${theme === 'sombre-or' ? 'text-amber-200/50' : 'text-gray-500'}`}>
              L'intégration centralisée des dossiers scolaires garantit la cohérence des bulletins d'évaluation et prévient les erreurs de comptabilisation de notes.
            </div>
          </div>
        </div>

        {/* Action Button Section with great visual importance */}
        <div className={`border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm transition ${
          theme === 'sombre-or' 
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/25 text-white' 
            : 'bg-blue-50 border-blue-150 text-indigo-900'
        }`} id="load-data-banner">
          <div>
            <h4 className={`font-extrabold text-xs uppercase tracking-wider ${theme === 'sombre-or' ? 'text-amber-450' : 'text-blue-900'}`}>Données, KPI scolaires & Historiques</h4>
            <p className={`text-xs mt-1 font-medium ${theme === 'sombre-or' ? 'text-slate-350' : 'text-blue-800'}`}>Déverrouillez la vue statistique globale de l'établissement (élèves inscrits, moyennes générales, logs de requêtes).</p>
          </div>
          
          <button
            onClick={() => setShowData(true)}
            className={`w-full md:w-auto px-8 py-3.5 font-bold text-xs tracking-wider uppercase rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0 ${
              theme === 'sombre-or' 
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-amber-500/15' 
                : 'bg-blue-900 hover:bg-slate-900 text-white'
            }`}
            id="btn-reveal-admin-data"
          >
            <Users className="w-4 h-4 shrink-0" />
            Accéder et charger les données scolaires
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="admin-dashboard-container">
      {/* Dynamic Ribbon to collapse back or reset instructions */}
      <div className={`border rounded-xl p-3.5 px-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs shadow-sm transition ${
        theme === 'sombre-or'
          ? 'bg-slate-900 border-amber-500/20 text-slate-300'
          : 'bg-white border-gray-200 text-gray-500'
      }`} id="dashboard-loaded-notif">
        <span className="flex items-center gap-2 leading-relaxed">
          <span className={`w-2.5 h-2.5 rounded-full animate-ping shrink-0 ${theme === 'sombre-or' ? 'bg-amber-450' : 'bg-emerald-500'}`}></span>
          <span>Données de gestion de l'école chargées avec succès !</span>
        </span>
        <button 
          onClick={() => setShowData(false)}
          className={`text-[10px] font-bold transition duration-100 whitespace-nowrap cursor-pointer px-3 py-1.5 rounded-lg border ${
            theme === 'sombre-or'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
              : 'bg-blue-50/55 text-blue-950 border-blue-200 hover:text-red-650 hover:bg-red-50 hover:border-red-200'
          }`}
          id="btn-hide-admin-data"
        >
          ← Revenir à la description de Rôle
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KPI 1 */}
        <div 
          className={`p-6 rounded-xl shadow-sm border-l-4 flex items-center justify-between transition ${
            theme === 'sombre-or'
              ? 'bg-slate-900 border-amber-500 text-white border-l-amber-500 shadow-amber-950/20'
              : 'bg-white border-gray-150 border-l-blue-600'
          }`}
          id="stat-students"
        >
          <div>
            <span className={`text-sm font-semibold uppercase ${theme === 'sombre-or' ? 'text-amber-300/80' : 'text-gray-500'}`}>Étudiants Inscrits</span>
            <h3 className={`text-3xl font-black mt-1 ${theme === 'sombre-or' ? 'text-amber-400 font-mono tracking-tight' : 'text-gray-950'}`}>{totalStudents}</h3>
          </div>
          <div className={`p-3 rounded-lg transition ${theme === 'sombre-or' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-50 text-blue-600'}`}>
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div 
          className={`p-6 rounded-xl shadow-sm border-l-4 flex items-center justify-between transition ${
            theme === 'sombre-or'
              ? 'bg-slate-900 border-amber-500 text-white border-l-amber-500 shadow-amber-950/20'
              : 'bg-white border-gray-150 border-l-teal-600'
          }`}
          id="stat-filieres"
        >
          <div>
            <span className={`text-sm font-semibold uppercase ${theme === 'sombre-or' ? 'text-amber-300/80' : 'text-gray-500'}`}>Filières Actives</span>
            <h3 className={`text-3xl font-bold mt-1 ${theme === 'sombre-or' ? 'text-amber-400 font-mono tracking-tight' : 'text-gray-950'}`}>{totalFilieres}</h3>
          </div>
          <div className={`p-3 rounded-lg transition ${theme === 'sombre-or' ? 'bg-amber-500/10 text-amber-400' : 'bg-teal-50 text-teal-600'}`}>
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Student Portal Access Lock Control */}
      <div className={`p-6 rounded-xl border shadow-sm transition-all duration-300 ${
        theme === 'sombre-or'
          ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/20 text-white shadow-amber-950/10'
          : 'bg-white border-gray-200 text-slate-900'
      }`} id="student-portal-lock-control">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className={`font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 ${
              theme === 'sombre-or' ? 'text-amber-400' : 'text-blue-900'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isPortalLocked ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span>Statut de l'Espace Étudiant</span>
            </h4>
            <p className={`text-xs leading-relaxed font-semibold ${theme === 'sombre-or' ? 'text-slate-350' : 'text-slate-705'}`}>
              {isPortalLocked 
                ? "L'accès à l'espace étudiant est temporairement fermé par la direction."
                : "L'espace étudiant est ouvert. Les étudiants peuvent se connecter normalement."}
            </p>
            <p className={`text-[11px] leading-relaxed ${theme === 'sombre-or' ? 'text-slate-500' : 'text-gray-500'}`}>
              {isPortalLocked
                ? "Aucun étudiant ne peut s'authentifier ou accéder à ses notes, cours et historiques."
                : "Les connexions, consultations de bulletins et téléchargements de cours sont actifs."}
            </p>
          </div>
          <button
            type="button"
            onClick={onTogglePortalLock}
            className={`w-full sm:w-auto px-5 py-3 font-bold text-xs tracking-wider uppercase rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0 ${
              isPortalLocked
                ? (theme === 'sombre-or'
                    ? 'bg-emerald-650 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/10 font-black'
                    : 'bg-emerald-750 hover:bg-emerald-700 text-white shadow-emerald-750/10')
                : (theme === 'sombre-or'
                    ? 'bg-rose-650 hover:bg-rose-600 text-white shadow-rose-950/20'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10')
            }`}
          >
            {isPortalLocked ? (
              <>
                <Unlock className="w-4 h-4" />
                <span>Réouvrir l'Espace Étudiant</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Fermer l'Espace Étudiant</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Recent activities and access logs */}
      <div className="grid grid-cols-1 gap-6">
        {/* Access logs list */}
        <div className={`rounded-xl shadow-sm border overflow-hidden transition ${
          theme === 'sombre-or'
            ? 'bg-slate-900 border-amber-500/20 text-slate-100'
            : 'bg-white border-gray-200'
        }`} id="access-logs-card">
          <div className={`px-6 py-4 border-b flex items-center justify-between transition ${
            theme === 'sombre-or' ? 'bg-slate-950 border-amber-500/15' : 'bg-gray-50 border-gray-100 bg-stripe'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${theme === 'sombre-or' ? 'text-amber-400' : 'text-teal-600'}`} />
              <h3 className={`font-bold ${theme === 'sombre-or' ? 'text-amber-400 font-black' : 'text-gray-800'}`}>Historique d'accès (Inter-Filières)</h3>
            </div>
            <button 
              onClick={() => onNavigate('autorisations')}
              className={`text-xs font-semibold transition ${theme === 'sombre-or' ? 'text-amber-400 hover:text-amber-350 hover:underline' : 'text-teal-600 hover:underline'}`}
            >
              Gérer les droits
            </button>
          </div>
          <div className={`divide-y ${theme === 'sombre-or' ? 'divide-amber-500/10' : 'divide-gray-100'}`}>
            {getRecentLogs().length === 0 ? (
              <p className={`p-6 text-sm text-center block ${theme === 'sombre-or' ? 'text-amber-200/40' : 'text-gray-500'}`}>Aucune consultation inter-filières enregistrée</p>
            ) : (
              getRecentLogs().map(log => (
                <div key={log.id} className={`p-4 flex justify-between items-center transition ${theme === 'sombre-or' ? 'hover:bg-slate-850/40' : 'hover:bg-slate-50'}`}>
                  <div>
                    <span className={`text-sm font-semibold ${theme === 'sombre-or' ? 'text-slate-100' : 'text-gray-800'}`}>{log.studentName}</span>
                    <p className={`text-xs mt-1 ${theme === 'sombre-or' ? 'text-slate-400' : 'text-gray-500'}`}>
                      A accédé à la filière : <span className={`font-semibold ${theme === 'sombre-or' ? 'text-amber-400 font-bold' : 'text-teal-700'}`}>{log.filiereName}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                      theme === 'sombre-or' 
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                        : 'text-gray-400 bg-gray-100 border-none'
                    }`}>
                      {log.date}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
