import React, { useState } from 'react';
import { Filiere, Etudiant, Matiere, Semestre } from '../types';
import { 
  GraduationCap, BookOpen, Plus, Trash2, Edit, Book, 
  ChevronDown, ChevronUp, Save, X, Layers, Sparkles 
} from 'lucide-react';

const getCreditValidationInfo = (val: number | string) => {
  const valStr = String(val).trim();
  if (valStr === "") {
    return {
      isValid: false,
      className: "!border-rose-500 !bg-rose-950/20",
      helperText: "Requis",
      isError: true
    };
  }
  const num = Number(valStr);
  if (isNaN(num) || num < 1 || num > 15 || !Number.isInteger(num)) {
    return {
      isValid: false,
      className: "!border-rose-500 !bg-rose-950/20 !text-rose-250 focus:!ring-rose-500/30",
      helperText: "Entier de 1 à 15 crédits",
      isError: true
    };
  }
  return {
    isValid: true,
    className: "!border-emerald-500 !bg-emerald-950/25 !text-emerald-250 focus:!ring-emerald-500/30",
    helperText: "Valide ✓",
    isError: false
  };
};

interface FilieresTabProps {
  filieres: Filiere[];
  etudiants: Etudiant[];
  onAddFiliere: (filiere: Omit<Filiere, 'id'>) => void;
  onUpdateFiliere: (filiere: Filiere) => void;
  onDeleteFiliere: (id: number) => void;
  matieres: Matiere[];
  onAddMatiere: (matiere: Omit<Matiere, 'id'>) => void;
  onUpdateMatiere: (matiere: Matiere) => void;
  onDeleteMatiere: (id: number) => void;
  semestres: Semestre[];
}

export default function FilieresTab({ 
  filieres, 
  etudiants, 
  onAddFiliere, 
  onUpdateFiliere, 
  onDeleteFiliere,
  matieres,
  onAddMatiere,
  onUpdateMatiere,
  onDeleteMatiere,
  semestres
}: FilieresTabProps) {
  const [showFiliereForm, setShowFiliereForm] = useState(false);
  const [editingFiliere, setEditingFiliere] = useState<Filiere | null>(null);
  
  const [nomFiliere, setNomFiliere] = useState("");
  const [description, setDescription] = useState("");

  // Matiere forms states
  const [expandedFiliereId, setExpandedFiliereId] = useState<number | null>(null);
  const [showMatiereForm, setShowMatiereForm] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState<Matiere | null>(null);
  
  const [nomMatiere, setNomMatiere] = useState("");
  const [codeMatiere, setCodeMatiere] = useState("");
  const [creditMatiere, setCreditMatiere] = useState<number>(3);
  const [semestreId, setSemestreId] = useState<number>(0);

  // States for the direct side matiere assignment form
  const [sideFiliereId, setSideFiliereId] = useState<number>(filieres[0]?.id || 0);
  const [sideNomMatiere, setSideNomMatiere] = useState("");
  const [sideCodeMatiere, setSideCodeMatiere] = useState("");
  const [sideCreditMatiere, setSideCreditMatiere] = useState<number>(3);
  const [sideSemestreId, setSideSemestreId] = useState<number>(0);

  const resetForm = () => {
    setNomFiliere("");
    setDescription("");
    setEditingFiliere(null);
  };

  const resetMatiereForm = () => {
    setNomMatiere("");
    setCodeMatiere("");
    setCreditMatiere(3);
    setSemestreId(0);
    setEditingMatiere(null);
    setShowMatiereForm(false);
  };

  const handleSideMatiereSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetFiliereId = sideFiliereId || filieres[0]?.id || 0;
    if (!targetFiliereId) {
      alert("Veuillez d'abord créer ou sélectionner une filière.");
      return;
    }
    if (!sideNomMatiere || !sideCodeMatiere) {
      alert("Veuillez remplir le nom et le code de la matière.");
      return;
    }

    onAddMatiere({
      nom_matiere: sideNomMatiere,
      code_matiere: sideCodeMatiere,
      credits: sideCreditMatiere,
      filiere_id: targetFiliereId,
      semestre_id: sideSemestreId > 0 ? sideSemestreId : undefined
    });

    // Reset side form but keep the selected filiere for easier batch entry
    setSideNomMatiere("");
    setSideCodeMatiere("");
    setSideCreditMatiere(3);
    setSideSemestreId(0);

    // Expand the affected filière list automatically to give instant visual feedback
    setExpandedFiliereId(targetFiliereId);
    alert(`La matière "${sideNomMatiere}" a bien été ajoutée et associée à la filière ! Scroll down ou consultez l'aperçu de la filière pour la voir.`);
  };

  const handleEdit = (filiere: Filiere) => {
    setEditingFiliere(filiere);
    setNomFiliere(filiere.nom_filiere);
    setDescription(filiere.description);
    setShowFiliereForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomFiliere) return;

    if (editingFiliere) {
      onUpdateFiliere({
        ...editingFiliere,
        nom_filiere: nomFiliere,
        description
      });
    } else {
      onAddFiliere({
        nom_filiere: nomFiliere,
        description
      });
    }

    resetForm();
    setShowFiliereForm(false);
  };

  // Matiere actions
  const handleStartAddMatiere = () => {
    setEditingMatiere(null);
    setNomMatiere("");
    setCodeMatiere("");
    setCreditMatiere(3);
    setSemestreId(0);
    setShowMatiereForm(true);
  };

  const handleStartEditMatiere = (m: Matiere) => {
    setEditingMatiere(m);
    setNomMatiere(m.nom_matiere);
    setCodeMatiere(m.code_matiere);
    setCreditMatiere(m.credits);
    setSemestreId(m.semestre_id || 0);
    setShowMatiereForm(true);
  };

  const handleMatiereSubmit = (e: React.FormEvent, filiereId: number) => {
    e.preventDefault();
    if (!nomMatiere || !codeMatiere) {
      alert("Veuillez remplir le nom et le code de la matière");
      return;
    }

    if (editingMatiere) {
      onUpdateMatiere({
        ...editingMatiere,
        nom_matiere: nomMatiere,
        code_matiere: codeMatiere,
        credits: creditMatiere,
        semestre_id: semestreId > 0 ? semestreId : undefined
      });
    } else {
      onAddMatiere({
        nom_matiere: nomMatiere,
        code_matiere: codeMatiere,
        credits: creditMatiere,
        filiere_id: filiereId,
        semestre_id: semestreId > 0 ? semestreId : undefined
      });
    }

    resetMatiereForm();
  };

  return (
    <div className="space-y-6" id="filieres-management-container">
      {/* Header bar */}
      <div className="flex justify-between items-center bg-transparent">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Programmes Académiques & Filières</h3>
          <p className="text-xs text-gray-500 mt-1">Structurez l'offre éducative en gérant les filières et leurs matières obligatoires.</p>
        </div>
        <button 
          onClick={() => { setShowFiliereForm(!showFiliereForm); if (showFiliereForm) resetForm(); }}
          className="btn btn-primary inline-flex items-center gap-2"
          id="btn-toggle-filiere"
        >
          <Plus className="w-4 h-4" />
          {showFiliereForm ? "Retour" : "Créer une Filière"}
        </button>
      </div>

      {/* Editor addition/modification of filiére */}
      {showFiliereForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4" id="filiere-editor-card">
          <h4 className="text-md font-bold text-blue-900 border-b border-gray-100 pb-2">
            {editingFiliere ? `Modifier : ${editingFiliere.nom_filiere}` : "Nouvelle Spécialité Académique"}
          </h4>

          <div className="form-group">
            <label className="form-label">Nom de la filière <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={nomFiliere}
              onChange={e => setNomFiliere(e.target.value)}
              placeholder="Ex: Informatique de Gestion"
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descriptif & Objectifs pédagogiques de la filière</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrire brièvement les compétences cibles de la filière..."
              rows={3}
              className="form-control"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => { setShowFiliereForm(false); resetForm(); }} 
              className="btn bg-white border border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {editingFiliere ? "Mettre à jour la Filière" : "Ajouter la Filière"}
            </button>
          </div>
        </form>
      )}

      {/* Grid of existing Majors styled professionally */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="filieres-main-layout">
        
        {/* Left column: 8 columns width on XL screens */}
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="filieres-grid-container">
            {filieres.map(f => {
              // Dynamic calculation of students registered
              const enrolledStudents = etudiants.filter(e => e.filiere_id === f.id);
              const filiereMatieres = matieres.filter(m => m.filiere_id === f.id);
              const isExpanded = expandedFiliereId === f.id;
              
              return (
                <div key={f.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-blue-400 hover:shadow transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="bg-blue-50 p-2.5 rounded-lg text-blue-700 shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEdit(f)}
                          className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition"
                          title="Éditer la filière"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            onDeleteFiliere(f.id);
                          }}
                          className="p-1.5 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded transition"
                          title="Supprimer la filière"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-lg font-bold text-gray-900 leading-snug">{f.nom_filiere}</h4>
                      <p className="text-sm text-gray-650 leading-relaxed mt-2">{f.description || "Aucune description fournie pour le moment."}</p>
                    </div>

                    {/* Sub-matières indicator */}
                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                          <Book className="w-4 h-4 text-blue-650" />
                          <span>Syllabus de Matières ({filiereMatieres.length})</span>
                        </div>
                        <button
                          onClick={() => {
                            setExpandedFiliereId(isExpanded ? null : f.id);
                            resetMatiereForm();
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5"
                        >
                          {isExpanded ? (
                            <>Masquer <ChevronUp className="w-3.5 h-3.5" /></>
                          ) : (
                            <>Gérer les matières <ChevronDown className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      </div>

                      {/* Program Subjects expansion area */}
                      {isExpanded && (
                        <div className="mt-4 bg-slate-50 border border-gray-250 rounded-xl p-4 space-y-4" id={`matiere-manager-${f.id}`}>
                          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span className="text-xs font-black uppercase text-gray-400 tracking-wide">Matières Enregistrées</span>
                            {!showMatiereForm && (
                              <button
                                type="button"
                                onClick={handleStartAddMatiere}
                                className="bg-blue-50 text-blue-800 hover:bg-blue-150 rounded px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1 transition"
                              >
                                <Plus className="w-3 h-3" /> Ajouter une Matière
                              </button>
                            )}
                          </div>

                          {/* Add/Edit Subform inside card */}
                          {showMatiereForm && (
                            <form onSubmit={(e) => handleMatiereSubmit(e, f.id)} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                  {editingMatiere ? "Modifier la Matière" : "Nouvelle Matière"}
                                </span>
                                <button 
                                  type="button" 
                                  onClick={resetMatiereForm}
                                  className="text-gray-400 hover:text-gray-650"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                <div className="form-group sm:col-span-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Nom de la matière *</label>
                                  <input 
                                    type="text"
                                    value={nomMatiere}
                                    onChange={e => setNomMatiere(e.target.value)}
                                    className="form-control w-full py-1.5"
                                    placeholder="Ex: Algorithmique avancée"
                                    required
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Code matière *</label>
                                  <input 
                                    type="text"
                                    value={codeMatiere}
                                    onChange={e => setCodeMatiere(e.target.value)}
                                    className="form-control w-full py-1.5"
                                    placeholder="Ex: IG-104"
                                    required
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Semestre Associé *</label>
                                  <select
                                    value={semestreId || ""}
                                    onChange={e => setSemestreId(Number(e.target.value))}
                                    className="form-control w-full py-1.5 bg-white font-bold"
                                    required
                                  >
                                    <option value="">Choisir...</option>
                                    {semestres.filter(s => s.filiere_id === f.id).map(s => (
                                      <option key={s.id} value={s.id}>{s.nom_semestre}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-4 pt-1">
                                <div className="flex flex-col items-start gap-1">
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">Crédits (ECTS) :</label>
                                    <input 
                                      type="number"
                                      min="1"
                                      max="15"
                                      value={creditMatiere}
                                      onChange={e => setCreditMatiere(Number(e.target.value))}
                                      className={`form-control py-1 px-2 w-16 text-center text-xs font-bold ${getCreditValidationInfo(creditMatiere).className}`}
                                      required
                                    />
                                  </div>
                                  {getCreditValidationInfo(creditMatiere).helperText && (
                                    <span className={`text-[9px] font-bold block ${getCreditValidationInfo(creditMatiere).isError ? 'text-rose-450' : 'text-emerald-450'}`}>
                                      {getCreditValidationInfo(creditMatiere).helperText}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    type="button" 
                                    onClick={resetMatiereForm} 
                                    className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                                  >
                                    Annuler
                                  </button>
                                  <button 
                                    type="submit" 
                                    className="px-3 py-1.5 bg-blue-900 text-white hover:bg-slate-900 rounded text-xs font-bold inline-flex items-center gap-1"
                                  >
                                    <Save className="w-3.5 h-3.5" /> Enregistrer
                                  </button>
                                </div>
                              </div>
                            </form>
                          )}

                          {/* Display of existing subjects */}
                          {filiereMatieres.length === 0 ? (
                            <p className="text-center py-4 bg-white rounded-lg border border-dashed text-gray-500 text-xs">Aucune matière enregistrée pour le moment.</p>
                          ) : (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
                              <div className="overflow-x-auto w-full">
                                <table className="custom-table w-full text-xs">
                                  <thead>
                                    <tr className="bg-gray-55 border-b border-gray-200">
                                      <th className="py-2.5 px-3 text-[10px] uppercase font-bold text-gray-400">Code</th>
                                      <th className="py-2.5 px-3 text-[10px] uppercase font-bold text-gray-400">Matière</th>
                                      <th className="py-2.5 px-3 text-[10px] uppercase font-bold text-gray-400">Semestre</th>
                                      <th className="py-2.5 px-3 text-[10px] uppercase font-bold text-gray-400 text-center">Crédits</th>
                                      <th className="py-2.5 px-3 text-[10px] uppercase font-bold text-gray-400 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filiereMatieres.map(m => (
                                      <tr key={m.id} className="hover:bg-slate-50 border-b border-gray-100 last:border-b-0">
                                        <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{m.code_matiere}</td>
                                        <td className="py-2.5 px-3 font-medium text-gray-700">{m.nom_matiere}</td>
                                        <td className="py-2.5 px-3 text-gray-650">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-105">
                                            {semestres.find(s => s.id === m.semestre_id)?.nom_semestre || "Non défini"}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-bold text-gray-600">{m.credits}</td>
                                        <td className="py-2.5 px-3 text-right">
                                          <div className="inline-flex gap-2">
                                            <button 
                                              onClick={() => handleStartEditMatiere(m)}
                                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                              title="Modifier la matière"
                                            >
                                              <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                              onClick={() => {
                                                onDeleteMatiere(m.id);
                                              }}
                                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                              title="Retirer la matière"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Major Footer Details */}
                  <div className="bg-gray-55 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span>Effectif Scolaire :</span>
                    </div>
                    <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full">
                      {enrolledStudents.length} inscrit{enrolledStudents.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: 4 columns width on XL screens. Sticky quick-assign form */}
        <div className="xl:col-span-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 sticky top-4" id="direct-matiere-assigner-card">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <BookOpen className="w-5 h-5 text-blue-900" />
              <div>
                <h4 className="font-bold text-gray-950 text-sm">Attribuer une Matière à une Filière</h4>
                <p className="text-[11px] text-gray-400">Attribuez rapidement une matière obligatoire à un parcours d'étude.</p>
              </div>
            </div>

            <form onSubmit={handleSideMatiereSubmit} className="space-y-4 text-xs font-medium">
              <div className="form-group">
                <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider block mb-1">Filière Académique Cible *</label>
                <select 
                  value={sideFiliereId || (filieres[0]?.id || "")}
                  onChange={e => {
                    const fid = Number(e.target.value);
                    setSideFiliereId(fid);
                    setSideSemestreId(0); // Reset selected semester
                  }}
                  className="form-control text-xs w-full py-2 bg-white font-bold"
                  required
                >
                  <option value="">Sélectionner la filière...</option>
                  {filieres.map(f => (
                    <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider block mb-1">Semestre Cible *</label>
                <select 
                  value={sideSemestreId || ""}
                  onChange={e => setSideSemestreId(Number(e.target.value))}
                  className="form-control text-xs w-full py-2 bg-white font-bold"
                  required
                >
                  <option value="">Sélectionner le semestre...</option>
                  {semestres.filter(s => s.filiere_id === (sideFiliereId || filieres[0]?.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.nom_semestre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider block mb-1">Nom de la Matière *</label>
                <input 
                  type="text"
                  value={sideNomMatiere}
                  onChange={e => setSideNomMatiere(e.target.value)}
                  placeholder="Ex: Analyse Financière"
                  className="form-control text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider block mb-1">Code Matière *</label>
                  <input 
                    type="text"
                    value={sideCodeMatiere}
                    onChange={e => setSideCodeMatiere(e.target.value)}
                    placeholder="Ex: CF-202"
                    className="form-control text-xs uppercase font-mono"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-black uppercase text-gray-600 tracking-wider block mb-1">Crédits (ECTS) *</label>
                  <input 
                    type="number"
                    min="1"
                    max="15"
                    value={sideCreditMatiere}
                    onChange={e => setSideCreditMatiere(Number(e.target.value))}
                    className={`form-control text-xs text-center font-bold ${getCreditValidationInfo(sideCreditMatiere).className}`}
                    required
                  />
                  {getCreditValidationInfo(sideCreditMatiere).helperText && (
                    <span className={`text-[9px] font-bold mt-1 block ${getCreditValidationInfo(sideCreditMatiere).isError ? 'text-rose-450' : 'text-emerald-450'}`}>
                      {getCreditValidationInfo(sideCreditMatiere).helperText}
                    </span>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full justify-center py-2.5 font-bold text-xs flex items-center gap-2 mt-2"
              >
                <Plus className="w-4 h-4" /> Enregistrer la Matière
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
