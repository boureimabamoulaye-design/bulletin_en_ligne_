import React, { useState } from 'react';
import { Etudiant, Filiere, Cours, Note, HistoriqueAcces, Semestre } from '../types';
import { Users, GraduationCap, FileText, TrendingUp, Award, Clock, ArrowLeft } from 'lucide-react';

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
}

export default function AdminDashboard({ etudiants, filieres, cours, notes, semestres, logs, onNavigate, globalFiliereId, globalSemestreId }: AdminDashboardProps) {
  const [showData, setShowData] = useState(true);

  // Stats calculations
  const filteredStudents = globalFiliereId && globalFiliereId > 0 
    ? etudiants.filter(e => e.filiere_id === globalFiliereId) 
    : etudiants;

  const filteredCoursItems = globalFiliereId && globalFiliereId > 0
    ? cours.filter(c => c.filiere_id === globalFiliereId)
    : cours;

  const filteredNotes = notes.filter(n => {
    const student = etudiants.find(e => e.id === n.etudiant_id);
    const matchesFiliere = !globalFiliereId || globalFiliereId === 0 || (student && student.filiere_id === globalFiliereId);
    const matchesSemestre = !globalSemestreId || globalSemestreId === 0 || n.semestre_id === globalSemestreId;
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
        const student = etudiants.find(e => e.id === grade.etudiant_id);
        const course = cours.find(c => c.id === grade.cours_id);
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
        const student = etudiants.find(e => e.id === log.etudiant_id);
        return !globalFiliereId || globalFiliereId === 0 || (student && student.filiere_id === globalFiliereId);
      })
      .sort((a, b) => b.id - a.id)
      .slice(0, 5)
      .map(log => {
        const student = etudiants.find(e => e.id === log.etudiant_id);
        const filiere = filieres.find(f => f.id === log.filiere_id);
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
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-2xl text-white shadow-md relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center p-6 select-none pointer-events-none">
            <Award className="w-64 h-64 rotate-12 text-white" />
          </div>
          <div className="relative z-10 space-y-4 max-w-2xl">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
              Fiche de Poste & Rôle de Direction
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
              Direction Globale de la Scolarité & Validation Pédagogique
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              L'administrateur scolaire est garant de la conformité des inscriptions, de la structure relationnelle des filières d'enseignement, de la centralisation des supports didactiques, et de la validation impartiale des bulletins de notes semestriels officiels.
            </p>
          </div>
        </div>

        {/* Roles Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Functional roles */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              Responsabilités Fonctionnelles Principales
            </h3>
            
            <ul className="space-y-3.5 text-xs text-gray-600">
              <li className="flex items-start gap-2.5">
                <span className="text-blue-600 mt-1 font-bold">✓</span>
                <div>
                  <strong>Gestion Administrative du Registre :</strong> Inscription et tri des étudiants, affectation des matricules d'élèves incrémentés, et fiches signalétiques.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-600 mt-1 font-bold">✓</span>
                <div>
                  <strong>Modélisation Académique :</strong> Définition des filières spécialisées, rattachement des matières obligatoires et des crédits en vigueur.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-600 mt-1 font-bold">✓</span>
                <div>
                  <strong>Publication de Supports :</strong> Téléchargement et catégorisation des livres, énoncés de devoirs et cours par classe et semestre d'études.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-600 mt-1 font-bold">✓</span>
                <div>
                  <strong>Saisie de Notes & Archivage :</strong> Enregistrement double des notes d'examen et contrôle continu (pondération automatique 60/40).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-600 mt-1 font-bold">✓</span>
                <div>
                  <strong>Bulletins Officiels :</strong> Génération et imprimerie de la moyenne semestrielle pondérée de l'élève par rapport aux barèmes.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-600 mt-1 font-bold">✓</span>
                <div>
                  <strong>Accréditation d'Accès :</strong> Octroi d'autorisations exceptionnelles permettant aux élèves d'accéder aux cours d'autres filières.
                </div>
              </li>
            </ul>
          </div>

          {/* Column 2: Security & Academic Quality Charter */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="w-1.5 h-6 bg-teal-600 rounded-full"></span>
              Conformité Académique & Charte de Qualité
            </h3>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-700 text-xs leading-relaxed space-y-3">
              <p>
                Afin de garantir l'excellence de la gestion administrative et l'évaluation équitable au sein de l'établissement, nos directives requièrent :
              </p>
              <div className="space-y-2 text-[11px] font-medium text-slate-800">
                <div className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-gray-150">
                  <span className="text-teal-600">📊</span>
                  <span><strong>Calcul Direct et Pondéré</strong> (Contrôles continus et examens normalisés)</span>
                </div>
                <div className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-gray-150">
                  <span className="text-teal-600">👤</span>
                  <span><strong>Affectation nominative d'Élèves</strong> (Filtre actif par matricule scolaire unique)</span>
                </div>
                <div className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-gray-150">
                  <span className="text-teal-600">🔒</span>
                  <span><strong>Sécurisation administrative</strong> (Archivage et traçabilité des droits de consultation)</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 leading-relaxed pt-2">
              L'intégration centralisée des dossiers scolaires garantit la cohérence des bulletins d'évaluation et prévient les erreurs de comptabilisation de notes.
            </div>
          </div>
        </div>

        {/* Action Button Section with great visual importance */}
        <div className="bg-blue-50 border border-blue-150 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm" id="load-data-banner">
          <div>
            <h4 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider">Données, KPI scolaires & Historiques</h4>
            <p className="text-xs text-blue-800 mt-1 font-medium">Déverrouillez la vue statistique globale de l'établissement (élèves inscrits, moyennes générales, logs de requêtes).</p>
          </div>
          
          <button
            onClick={() => setShowData(true)}
            className="w-full md:w-auto px-8 py-3.5 bg-blue-900 hover:bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0"
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
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 px-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-gray-500 shadow-sm" id="dashboard-loaded-notif">
        <span className="flex items-center gap-2 leading-relaxed">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0"></span>
          <span>Données de gestion de l'école chargées avec succès !</span>
        </span>
        <button 
          onClick={() => setShowData(false)}
          className="text-[10px] text-blue-950 hover:text-red-650 hover:bg-red-50 border border-blue-200 hover:border-red-200 px-3 py-1.5 rounded-lg bg-blue-50/55 font-bold transition duration-100 whitespace-nowrap cursor-pointer"
          id="btn-hide-admin-data"
        >
          ← Revenir à la description de Rôle
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KPI 1 */}
        <div 
          className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-600 flex items-center justify-between"
          id="stat-students"
        >
          <div>
            <span className="text-sm font-semibold text-gray-500 uppercase">Étudiants Inscrits</span>
            <h3 className="text-3xl font-bold text-gray-950 mt-1">{totalStudents}</h3>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div 
          className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-teal-600 flex items-center justify-between"
          id="stat-filieres"
        >
          <div>
            <span className="text-sm font-semibold text-gray-500 uppercase">Filières Actives</span>
            <h3 className="text-3xl font-bold text-gray-950 mt-1">{totalFilieres}</h3>
          </div>
          <div className="bg-teal-50 p-3 rounded-lg text-teal-600">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent activities and access logs */}
      <div className="grid grid-cols-1 gap-6">
        {/* Access logs list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id="access-logs-card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 bg-stripe">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-gray-800">Historique d'accès (Inter-Filières)</h3>
            </div>
            <button 
              onClick={() => onNavigate('autorisations')}
              className="text-xs text-teal-600 hover:underline font-semibold"
            >
              Gérer les droits
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {getRecentLogs().length === 0 ? (
              <p className="p-6 text-sm text-center text-gray-500 block">Aucune consultation inter-filières enregistrée</p>
            ) : (
              getRecentLogs().map(log => (
                <div key={log.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{log.studentName}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      A accédé à la filière : <span className="font-semibold text-teal-700">{log.filiereName}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">
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
