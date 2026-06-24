import React, { useState } from 'react';
import { Etudiant, Filiere, AutorisationFiliere, HistoriqueAcces } from '../types';
import { ShieldCheck, Plus, Trash2, Calendar, FileText, AlertCircle, Clock } from 'lucide-react';

interface AutorisationsTabProps {
  autorisations: AutorisationFiliere[];
  etudiants: Etudiant[];
  filieres: Filiere[];
  logs: HistoriqueAcces[];
  onAddAutorisation: (auth: Omit<AutorisationFiliere, 'id' | 'date_autorisation'>) => void;
  onDeleteAutorisation: (id: number) => void;
  globalFiliereId?: number;
}

export default function AutorisationsTab({ autorisations, etudiants, filieres, logs, onAddAutorisation, onDeleteAutorisation, globalFiliereId }: AutorisationsTabProps) {
  const [etudiantId, setEtudiantId] = useState<number>(0);
  const [localFiliereId, setLocalFiliereId] = useState<number>(filieres[0]?.id || 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filiereId = globalFiliereId && globalFiliereId > 0 ? globalFiliereId : localFiliereId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actualFiliereId = filiereId;
    if (!etudiantId || !actualFiliereId) {
      alert("Veuillez sélectionner un étudiant de la liste déroulante filtrée.");
      return;
    }

    // Check if authorization already exists
    const alreadyAuthorized = autorisations.some(a => a.etudiant_id === etudiantId && a.filiere_id === actualFiliereId);
    if (alreadyAuthorized) {
      alert("Erreur: cet étudiant dispose d'ores et déjà de cette accréditation d'accès.");
      return;
    }

    onAddAutorisation({
      etudiant_id: etudiantId,
      filiere_id: actualFiliereId,
      autorise_par: "Administrateur Général"
    });

    alert("Autorisation ajoutée avec succès !");
    setEtudiantId(0);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const filteredAutorisations = globalFiliereId && globalFiliereId > 0
    ? autorisations.filter(auth => auth.filiere_id === globalFiliereId)
    : autorisations;

  const filteredLogs = globalFiliereId && globalFiliereId > 0
    ? logs.filter(log => log.filiere_id === globalFiliereId)
    : logs;

  return (
    <div className="space-y-6" id="autorisations-container">
      {/* Upper informational bar explaining the feature */}
      <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl text-blue-900 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm">Fonctionnalité Spéciale : Accréditations Inter-Filières</h4>
          <p className="text-xs text-blue-800 leading-relaxed mt-1">
            Par défaut, un étudiant accède uniquement aux supports de cours de sa filière principale de scolarisation. 
            L'administration peut l'autoriser explicitement à consulter, étudier et télécharger les supports pédagogiques d'un ou plusieurs autres parcours de spécialité (par exemple : un étudiant comptable autorisé à lire le cours de développement logiciel).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Grant permission form */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm xl:col-span-1" id="new-auth-filiere-card">
          <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-gray-100 pb-2">Accorder une Accréditation</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group relative" onMouseLeave={() => setIsDropdownOpen(false)}>
              <label className="form-label text-xs">Étudiant à accréditer</label>
              
              <div className="relative">
                <input 
                  type="text"
                  placeholder="🔍 Saisir un nom, prénom ou matricule..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setEtudiantId(0); // reset selection
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="form-control text-sm pr-10 w-full bg-slate-50 border border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
                >
                  {isDropdownOpen ? '▲' : '▼'}
                </button>
              </div>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50 divide-y divide-slate-100 animate-fade-in">
                  {etudiants.filter(etu => {
                    const term = searchQuery.toLowerCase().trim();
                    if (!term) return true;
                    return (
                      etu.nom.toLowerCase().includes(term) ||
                      etu.prenom.toLowerCase().includes(term) ||
                      etu.matricule.toLowerCase().includes(term)
                    );
                  }).length === 0 ? (
                    <div className="p-3 text-xs text-gray-400 text-center">
                      Aucun élève trouvé
                    </div>
                  ) : (
                    etudiants.filter(etu => {
                      const term = searchQuery.toLowerCase().trim();
                      if (!term) return true;
                      return (
                        etu.nom.toLowerCase().includes(term) ||
                        etu.prenom.toLowerCase().includes(term) ||
                        etu.matricule.toLowerCase().includes(term)
                      );
                    }).map(etu => (
                      <button
                        key={etu.id}
                        type="button"
                        onClick={() => {
                          setEtudiantId(etu.id);
                          setSearchQuery(`${etu.nom} ${etu.prenom} (${etu.matricule})`);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 hover:bg-blue-600 hover:text-white transition-colors duration-150 text-xs flex flex-col ${etudiantId === etu.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-700'}`}
                      >
                        <span className="font-semibold">{etu.nom} {etu.prenom}</span>
                        <span className={`text-[10px] font-mono ${etudiantId === etu.id ? 'text-blue-100' : 'text-slate-450'}`}>Matricule: {etu.matricule}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Filière d'accès autorisée</label>
              {globalFiliereId && globalFiliereId > 0 ? (
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded text-xs font-bold text-blue-900">
                  {filieres.find(f => f.id === globalFiliereId)?.nom_filiere}
                </div>
              ) : (
                <select 
                  value={filiereId}
                  onChange={e => setLocalFiliereId(Number(e.target.value))}
                  className="form-control text-sm"
                  required
                >
                  <option value="">Sélectionner la filière...</option>
                  {filieres.map(f => (
                    <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                  ))}
                </select>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full justify-center mt-3">
              Valider l'Accréditation
            </button>
          </form>
        </div>

        {/* Existing authorizations and logs list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm xl:col-span-2 flex flex-col justify-between" id="active-auths-card">
          <div>
            <div className="px-6 py-4 border-b border-gray-150 bg-gray-50">
              <h4 className="font-bold text-gray-850">Accréditations d'Accès Actives (Inter-Filières)</h4>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="custom-table min-w-[700px] text-xs">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Élève</th>
                    <th>Cours et Filières Autorisés</th>
                    <th>Date d'autorisation</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAutorisations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-gray-500">Aucun étudiant ne possède d'accréditation complémentaire pour cette filière.</td>
                    </tr>
                  ) : (
                    filteredAutorisations.map(auth => {
                      const student = etudiants.find(e => e.id === auth.etudiant_id);
                      const filiere = filieres.find(f => f.id === auth.filiere_id);
                      return (
                        <tr key={auth.id} className="hover:bg-slate-50 transition">
                          <td className="font-mono font-bold text-xs">{student ? student.matricule : "-"}</td>
                          <td>
                            <span className="font-semibold text-slate-900">{student ? `${student.nom} ${student.prenom}` : "Inconnu"}</span>
                          </td>
                          <td>
                            <span className="font-bold text-teal-800 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">
                              {filiere ? filiere.nom_filiere : "Restreinte"}
                            </span>
                          </td>
                          <td className="text-gray-400 font-mono">{auth.date_autorisation || "06/06/2026"}</td>
                          <td>
                            <button 
                              onClick={() => {
                                onDeleteAutorisation(auth.id);
                              }}
                              className="p-1 px-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition font-bold text-xs"
                            >
                              Retirer
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Access history detailed audit table log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" id="detailed-access-audit-card">
        <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between">
          <h4 className="font-bold text-gray-800">Registre d'historique de consultation d'Études (Audit Logs)</h4>
          <span className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded font-bold font-mono">
            {filteredLogs.length} accès enregistrés
          </span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="custom-table min-w-[800px] text-xs">
            <thead>
              <tr>
                <th>Date de Consultation</th>
                <th>Audit ID</th>
                <th>Matricule Étudiant</th>
                <th>Auteur de l'accès</th>
                <th>Filière de cours visée</th>
                <th>Vérification Sécuritaire</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredLogs].reverse().map(log => {
                const student = etudiants.find(e => e.id === log.etudiant_id);
                const filiere = filieres.find(f => f.id === log.filiere_id);
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition border-b border-gray-100">
                    <td className="font-mono text-gray-500">{log.date_acces}</td>
                    <td className="font-mono text-[10px] text-gray-400">#LOG84{log.id}A</td>
                    <td className="font-mono font-bold text-slate-900">{student ? student.matricule : "-"}</td>
                    <td className="font-semibold">{student ? `${student.nom} ${student.prenom}` : "Inconnu"}</td>
                    <td className="font-bold text-blue-700">{filiere ? filiere.nom_filiere : "-"}</td>
                    <td>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        ✔ ACCRÉDITATION ACTIVE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
