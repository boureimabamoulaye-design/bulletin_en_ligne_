import React, { useState } from 'react';
import { Cours, Filiere, Classe, Semestre, Matiere } from '../types';
import { BookOpen, Calendar, HelpCircle, FileText, Download, Plus, Trash2, Edit } from 'lucide-react';

interface CoursTabProps {
  cours: Cours[];
  filieres: Filiere[];
  classes: Classe[];
  semestres: Semestre[];
  matieres: Matiere[];
  onAddCours: (course: Omit<Cours, 'id' | 'date_ajout'>) => void;
  onUpdateCours: (course: Cours) => void;
  onDeleteCours: (id: number) => void;
  globalFiliereId?: number;
  globalSemestreId?: number;
}

export default function CoursTab({ cours, filieres, classes, semestres, matieres, onAddCours, onUpdateCours, onDeleteCours, globalFiliereId, globalSemestreId }: CoursTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Cours | null>(null);

  // Form states
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [fichier, setFichier] = useState("nouveau_cours.pdf");
  const [fichierData, setFichierData] = useState<string | undefined>(undefined);
  const [fichierTaille, setFichierTaille] = useState<string | undefined>(undefined);
  const [filiereId, setFiliereId] = useState<number>(globalFiliereId && globalFiliereId > 0 ? globalFiliereId : (filieres[0]?.id || 0));
  const [classeId, setClasseId] = useState<number>(classes[0]?.id || 0);
  const [semestreId, setSemestreId] = useState<number>(globalSemestreId && globalSemestreId > 0 ? globalSemestreId : (semestres[0]?.id || 0));
  const [enseignant, setEnseignant] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const currentFiliereMatieres = matieres.filter(m => m.filiere_id === filiereId);

  const resetForm = () => {
    setTitre("");
    setDescription("");
    setFichier("nouveau_cours.pdf");
    setFichierData(undefined);
    setFichierTaille(undefined);
    setFiliereId(globalFiliereId && globalFiliereId > 0 ? globalFiliereId : (filieres[0]?.id || 0));
    setClasseId(classes[0]?.id || 0);
    setSemestreId(globalSemestreId && globalSemestreId > 0 ? globalSemestreId : (semestres[0]?.id || 0));
    setEnseignant("");
    setEditingCourse(null);
  };

  const handleEdit = (course: Cours) => {
    setEditingCourse(course);
    setTitre(course.titre);
    setDescription(course.description);
    setFichier(course.fichier);
    setFichierData(course.fichierData);
    setFichierTaille(course.fichierTaille);
    setFiliereId(course.filiere_id);
    setClasseId(course.classe_id);
    setSemestreId(course.semestre_id);
    setEnseignant(course.enseignant);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFichier(file.name);
        setFichierData(reader.result as string);
        const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
        setFichierTaille(`${sizeInMb} Mo`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFichier(file.name);
        setFichierData(reader.result as string);
        const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
        setFichierTaille(`${sizeInMb} Mo`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre || !enseignant) {
      alert("Le titre et l'enseignant sont obligatoires !");
      return;
    }

    if (editingCourse) {
      onUpdateCours({
        ...editingCourse,
        titre,
        description,
        fichier,
        fichierData,
        fichierTaille,
        filiere_id: filiereId,
        classe_id: classeId,
        semestre_id: semestreId,
        enseignant
      });
    } else {
      onAddCours({
        titre,
        description,
        fichier,
        fichierData,
        fichierTaille,
        filiere_id: filiereId,
        classe_id: classeId,
        semestre_id: semestreId,
        enseignant
      });
    }

    resetForm();
    setShowForm(false);
  };

  const triggerDownload = (course: Cours) => {
    if (course.fichierData) {
      const link = document.createElement('a');
      link.href = course.fichierData;
      link.download = course.fichier;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const text = `Support de cours scolaire : ${course.fichier}.\nDéveloppé dans le cadre du projet de gestion d'école. Protégé par copyright.`;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = course.fichier.endsWith(".pdf") ? course.fichier : `${course.fichier}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Filter courses dynamically based on global filters
  const filteredCours = cours.filter(course => {
    const matchesFiliere = !globalFiliereId || globalFiliereId === 0 || course.filiere_id === globalFiliereId;
    const matchesSemestre = !globalSemestreId || globalSemestreId === 0 || course.semestre_id === globalSemestreId;
    return matchesFiliere && matchesSemestre;
  });

  return (
    <div className="space-y-6" id="cours-management-container">
      {/* Header bar */}
      <div className="flex justify-between items-center bg-transparent">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Bibliothèque & Supports de Cours</h3>
          <p className="text-xs text-gray-500 mt-1">Syllabus de cours et documents PDF d'études téléchargeables.</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="btn btn-primary inline-flex items-center gap-2"
          id="btn-add-cours"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Retour" : "Créer un Thème de Cours"}
        </button>
      </div>

      {/* Editor Add/Mod course */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4" id="cours-form">
          <h4 className="text-md font-bold text-blue-900 border-b border-gray-100 pb-2">
            {editingCourse ? `Éditer le cours : ${editingCourse.titre}` : "Nouveau Programme de Cours Module"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Matière de la filière (Sélection suggérée) <span className="text-red-500">*</span></label>
              {currentFiliereMatieres.length > 0 ? (
                <div className="space-y-2">
                  <select
                    className="form-control"
                    value={currentFiliereMatieres.some(m => m.nom_matiere === titre) ? titre : ""}
                    onChange={e => {
                      if (e.target.value) {
                        setTitre(e.target.value);
                      }
                    }}
                  >
                    <option value="">-- Sélectionner une matière ou saisie libre ci-dessous --</option>
                    {currentFiliereMatieres.map(m => (
                      <option key={m.id} value={m.nom_matiere}>
                        {m.nom_matiere} ({m.code_matiere})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded">
                  Aucune matière enregistrée pour cette filière dans l'onglet Filières. Saisie libre activée.
                </p>
              )}
              <input 
                type="text" 
                value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="Ex: Éléments de Macroéconomie"
                className="form-control mt-2"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Directeur / Enseignant titulaire <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={enseignant}
                onChange={e => setEnseignant(e.target.value)}
                placeholder="Ex: Dr. Koné Amadou"
                className="form-control"
                required
              />
            </div>

            <div className="form-group col-span-1 md:col-span-2">
              <label className="form-label font-bold text-gray-700 text-xs mb-1 block">Fichier de cours (PDF, Word, PPT ou tout autre format)</label>
              
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                  isDragging 
                    ? "border-blue-500 bg-blue-50" 
                    : fichierData 
                      ? "border-emerald-300 bg-emerald-50/50" 
                      : "border-gray-200 hover:border-blue-400 bg-gray-50/50"
                }`}
                onClick={() => document.getElementById('course-file-upload')?.click()}
                id="file-dropzone-cours"
              >
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="course-file-upload" 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" 
                />
                
                {fichierData ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-950 truncate max-w-md">{fichier}</p>
                      <p className="text-[10px] text-gray-500">
                        Fichier chargé avec succès {fichierTaille ? `(${fichierTaille})` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFichier("nouveau_cours.pdf");
                        setFichierData(undefined);
                        setFichierTaille(undefined);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-red-650 bg-red-50 hover:bg-red-150 border border-red-200 rounded-md transition"
                    >
                      Supprimer et remplacer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Download className="w-8 h-8 text-slate-400 mx-auto animate-bounce" />
                    <p className="text-xs font-semibold text-slate-700">
                      Glissez-déposez le document de leçon ici, ou <span className="text-blue-600 underline">parcourez vos fichiers</span>
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Supports d'études réels acceptés (PDF, Word, PPT, Excel, etc.)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Semestre concerné <span className="text-red-500">*</span></label>
              <select 
                value={semestreId}
                onChange={e => setSemestreId(Number(e.target.value))}
                className="form-control"
                required
              >
                {semestres.map(s => (
                  <option key={s.id} value={s.id}>{s.nom_semestre} ({s.annee_scolaire})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Filière concernée <span className="text-red-500">*</span></label>
              <select 
                value={filiereId}
                onChange={e => setFiliereId(Number(e.target.value))}
                className="form-control"
                required
              >
                {filieres.map(f => (
                  <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Niveau de structure <span className="text-red-500">*</span></label>
              <select 
                value={classeId}
                onChange={e => setClasseId(Number(e.target.value))}
                className="form-control"
                required
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.nom_classe}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group col-span-1 md:col-span-2">
              <label className="form-label">Résumé / Description abrégée du cours</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez les chapitres de cours abordés..."
                rows={3}
                className="form-control"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => { setShowForm(false); resetForm(); }}
              className="btn bg-white border border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCourse ? "Enregistrer les modifications" : "Enregistrer le Cours"}
            </button>
          </div>
        </form>
      )}

      {/* Courses display container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="courses-cards-container">
        {filteredCours.length === 0 ? (
          <p className="p-8 text-center bg-white rounded-xl border border-gray-200 text-gray-500 text-sm col-span-2">Aucun cours disponible.</p>
        ) : (
          filteredCours.map(course => {
            const f = filieres.find(x => x.id === course.filiere_id);
            const cl = classes.find(x => x.id === course.classe_id);
            const sem = semestres.find(x => x.id === course.semestre_id);

            return (
              <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between hover:border-blue-400 group transition">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-blue-700 font-mono tracking-tight uppercase bg-blue-50 px-2 py-1 rounded">
                      {cl ? cl.nom_classe : "Indéterminé"}
                    </span>
                    <div className="flex gap-1 bg-transparent">
                      <button 
                        onClick={() => handleEdit(course)}
                        className="p-1 hover:bg-gray-100 text-gray-400 hover:text-blue-600 rounded"
                        title="Éditer le cours"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          onDeleteCours(course.id);
                        }}
                        className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded"
                        title="Supprimer le cours"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-md font-bold text-gray-900 mt-2 hover:text-blue-900 leading-tight">
                    {course.titre}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">Enseignant : <span className="font-semibold text-gray-700">{course.enseignant}</span></p>

                  <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">
                    {course.description || "Aucun résumé de cours fourni."}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-4">
                    <span className="text-[10px] font-semibold text-gray-650 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      Filière: {f ? f.nom_filiere : "Restreinte"}
                    </span>
                    <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full">
                      Période: {sem ? sem.nom_semestre : "S1"}
                    </span>
                  </div>
                </div>

                {/* PDF footer file selector and sim */}
                {course.fichier && (
                  <div className="bg-slate-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 truncate">
                      <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="truncate">{course.fichier}</span>
                    </div>
                    <button 
                      onClick={() => triggerDownload(course)}
                      className="p-1 px-2 hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200 bg-white rounded font-bold text-[10px] inline-flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                      title="Télécharger"
                    >
                      <Download className="w-3 h-3" />
                      Télécharger {course.fichierTaille ? `(${course.fichierTaille})` : ''}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
