import React, { useState } from 'react';
import { Semestre, Note, Cours } from '../types';
import { Calendar, Plus, Trash2, Milestone } from 'lucide-react';

interface SemestresTabProps {
  semestres: Semestre[];
  notes: Note[];
  cours: Cours[];
  anneesScolaires?: string[];
  onAddSemestre: (semestre: Omit<Semestre, 'id'>) => void;
  onDeleteSemestre: (id: number) => void;
}

export default function SemestresTab({ 
  semestres, 
  notes, 
  cours, 
  anneesScolaires = [], 
  onAddSemestre, 
  onDeleteSemestre 
}: SemestresTabProps) {
  const allYears = Array.from(new Set([
    ...anneesScolaires,
    ...semestres.map(s => s.annee_scolaire)
  ].filter(Boolean))).sort();
  if (allYears.length === 0) {
    allYears.push("2025-2026", "2026-2027", "2024-2025");
  }

  const [nomSemestre, setNomSemestre] = useState("");
  const [anneeScolaire, setAnneeScolaire] = useState(() => allYears.includes("2025-2026") ? "2025-2026" : (allYears[0] || "2025-2026"));
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomSemestre || !anneeScolaire) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    onAddSemestre({
      nom_semestre: nomSemestre,
      annee_scolaire: anneeScolaire
    });

    setNomSemestre("");
    setShowForm(false);
  };

  return (
    <div className="space-y-6" id="semestres-container">
      <div className="flex justify-between items-center bg-transparent">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Périodes d'Études & Semestres</h3>
          <p className="text-xs text-gray-500 mt-1">Gérez la chronologie de configuration des bulletins de notes scolaires.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary inline-flex items-center gap-2"
          id="btn-add-semestre"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Retour" : "Créer un Semestre"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4" id="semestre-form">
          <h4 className="text-md font-bold text-blue-900 border-b border-gray-100 pb-2">Ajouter un Nouveau Semestre</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Nom du Semestre <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={nomSemestre}
                onChange={e => setNomSemestre(e.target.value)}
                placeholder="Ex: Semestre 1 ou Semestre de Rattrapage"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Année Scolaire <span className="text-red-500">*</span></label>
              <select 
                value={anneeScolaire}
                onChange={e => setAnneeScolaire(e.target.value)}
                className="form-control font-semibold text-slate-900"
                required
              >
                {allYears.map(yr => (
                  <option key={yr} value={yr}>Année Académique {yr}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="btn bg-white border border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">Enregistrer la période</button>
          </div>
        </form>
      )}

      {/* Semesters list layout */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" id="semestres-list-card">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h4 className="font-bold text-gray-800">Semestres Enregistrés</h4>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Période d'évaluation</th>
                <th>Année Scolaire</th>
                <th>Courses Liés</th>
                <th>Évaluations / Notes associées</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {semestres.map(s => {
                // Calculate counts
                const linkedCourses = cours.filter(c => c.semestre_id === s.id).length;
                const linkedGrades = notes.filter(n => n.semestre_id === s.id).length;

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="font-semibold text-gray-950 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span>{s.nom_semestre}</span>
                    </td>
                    <td>
                      <span className="bg-gray-100 font-mono text-xs px-2.5 py-1 rounded text-gray-700 font-bold">
                        {s.annee_scolaire}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">{linkedCourses} cours enregistré{linkedCourses > 1 ? 's':''}</td>
                    <td className="text-sm text-gray-500">{linkedGrades} note{linkedGrades > 1 ? 's':''} validée{linkedGrades > 1 ? 's':''}</td>
                    <td className="text-right">
                      <button 
                        onClick={() => {
                          // Warn if items exist
                          if (linkedCourses > 0 || linkedGrades > 0) {
                            if (!confirm(`Attention: ce semestre possède ${linkedCourses} cours et ${linkedGrades} notes. Supprimer ce semestre va détacher ou invalider ces données. Confirmer quand même la suppression ?`)) {
                              return;
                            }
                          } else {
                            if (!confirm(`Supprimer le semestre : ${s.nom_semestre} ?`)) return;
                          }
                          onDeleteSemestre(s.id);
                        }}
                        className="p-1 px-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs inline-flex items-center gap-1 font-semibold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
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
