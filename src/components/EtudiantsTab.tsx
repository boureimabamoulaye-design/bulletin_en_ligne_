import React, { useState } from 'react';
import { Etudiant, Filiere, Classe, Paiement } from '../types';
import { UserPlus, Search, Edit2, Trash2, Shield, Eye, EyeOff, Wand2, Keyboard, Check, AlertTriangle, CreditCard, GraduationCap } from 'lucide-react';

interface EtudiantsTabProps {
  etudiants: Etudiant[];
  filieres: Filiere[];
  classes: Classe[];
  onAddEtudiant: (student: Omit<Etudiant, 'id'>) => void;
  onUpdateEtudiant: (student: Etudiant) => void;
  onDeleteEtudiant: (id: number) => void;
  onAddPaiement?: (paiement: Omit<Paiement, 'id'>) => void;
  globalFiliereId?: number;
}

export default function EtudiantsTab({ 
  etudiants, 
  filieres, 
  classes, 
  onAddEtudiant, 
  onUpdateEtudiant, 
  onDeleteEtudiant, 
  onAddPaiement,
  globalFiliereId 
}: EtudiantsTabProps) {
  const [search, setSearch] = useState("");
  const [filiereFilter, setFiliereFilter] = useState<number>(0);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Etudiant | null>(null);

  // Form input states
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [sexe, setSexe] = useState<'M' | 'F'>("M");
  const [dateNaissance, setDateNaissance] = useState("2004-01-01");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [filiereId, setFiliereId] = useState<number>(globalFiliereId && globalFiliereId > 0 ? globalFiliereId : (filieres[0]?.id || 0));
  const [classeId, setClasseId] = useState<number>(classes[0]?.id || 0);
  const [motDePasse, setMotDePasse] = useState("student123");
  const [showPassword, setShowPassword] = useState(false);

  // Optional enrollment payment states
  const [enregistrerPaiement, setEnregistrerPaiement] = useState(false);
  const [montantPaiement, setMontantPaiement] = useState(50000);
  const [methodePaiement, setMethodePaiement] = useState<'Carte' | 'Espèces' | 'Chèque' | 'Virement' | 'Mobile Money'>('Mobile Money');
  const [recuPaiement, setRecuPaiement] = useState("");

  // Advanced matricule states
  const [matriculeMode, setMatriculeMode] = useState<'auto' | 'manual'>('auto');
  const [matriculePrefix, setMatriculePrefix] = useState<'ETU' | 'INS' | 'ACAD'>('ETU');
  const [customMatricule, setCustomMatricule] = useState("");

  const resetForm = () => {
    setNom("");
    setPrenom("");
    setSexe("M");
    setDateNaissance("2004-01-01");
    setTelephone("");
    setEmail("");
    setAdresse("");
    setFiliereId(globalFiliereId && globalFiliereId > 0 ? globalFiliereId : (filieres[0]?.id || 0));
    setClasseId(classes[0]?.id || 0);
    setMotDePasse("student123");
    setMatriculeMode('auto');
    setMatriculePrefix('ETU');
    setCustomMatricule("");
    setEditingStudent(null);
    setEnregistrerPaiement(false);
    setMontantPaiement(50000);
    setMethodePaiement('Mobile Money');
    setRecuPaiement("");
  };

  const handleEdit = (student: Etudiant) => {
    setEditingStudent(student);
    setNom(student.nom);
    setPrenom(student.prenom);
    setSexe(student.sexe);
    setDateNaissance(student.date_naissance);
    setTelephone(student.telephone);
    setEmail(student.email);
    setAdresse(student.adresse);
    setFiliereId(student.filiere_id);
    setClasseId(student.classe_id);
    setMotDePasse(student.mot_de_passe);
    setMatriculeMode('manual');
    setCustomMatricule(student.matricule);
    setShowForm(true);
  };

  // Check if a manual custom matricule has already been taken by someone else
  const isDuplicateMatricule = (m: string) => {
    if (!m) return false;
    const formatted = m.trim().toUpperCase();
    return etudiants.some(e => e.matricule === formatted && e.id !== editingStudent?.id);
  };

  // Generate an elegant, dynamic academic registration number
  const nextId = etudiants.length > 0 ? Math.max(...etudiants.map(x => x.id)) + 1 : 1;
  const currentYear = new Date().getFullYear();

  const getAutoMatricule = () => {
    const prefix = matriculePrefix;
    const yearSuffix = currentYear % 100;
    const seq = String(nextId).padStart(4, '0');
    
    // Class suffix representation
    const cl = classes.find(c => c.id === classeId);
    let classSlug = "XS";
    if (cl) {
      const match = cl.nom_classe.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        classSlug = match[1].toUpperCase();
      } else {
        classSlug = cl.nom_classe.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase();
      }
    }
    
    return `${prefix}-${yearSuffix}${classSlug}-${seq}`;
  };

  const activeMatricule = editingStudent 
    ? editingStudent.matricule 
    : (matriculeMode === 'auto' ? getAutoMatricule() : customMatricule.trim().toUpperCase());

  // Luxury Card color styling map based on Filiere selection (fits gold & slate themes)
  const getFiliereGradient = (id: number) => {
    switch (id) {
      case 1: // Informatique de Gestion
        return "from-[#080d1a] via-[#10172e] to-[#0d162a] border-[#c5a880]/30 text-slate-100";
      case 2: // Réseaux et Télécommunications
        return "from-[#071314] via-[#0b1d22] to-[#041217] border-[#c0a27a]/30 text-emerald-100";
      case 3: // Comptabilité et Finance
        return "from-[#0d091a] via-[#15102a] to-[#12081e] border-[#c5a880]/30 text-purple-100";
      case 4: // Marketing Digital & Communication
        return "from-[#170e0a] via-[#241510] to-[#1a0c06] border-[#dfcbb0]/30 text-orange-100";
      default:
        return "from-[#080a12] via-[#14172a] to-[#080a12] border-[#252b47] text-slate-100";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenom || !email) {
      alert("Veuillez remplir les informations obligatoires (Nom, Prénom, Email)");
      return;
    }

    if (matriculeMode === 'manual' && isDuplicateMatricule(customMatricule)) {
      alert("Erreur de validation: Le matricule choisi est déjà réservé par un autre élève.");
      return;
    }

    if (editingStudent) {
      onUpdateEtudiant({
        ...editingStudent,
        matricule: activeMatricule,
        nom: nom.toUpperCase(),
        prenom,
        sexe,
        date_naissance: dateNaissance,
        telephone,
        email,
        adresse,
        photo: "",
        filiere_id: filiereId,
        classe_id: classeId,
        mot_de_passe: motDePasse
      });
    } else {
      onAddEtudiant({
        matricule: activeMatricule,
        nom: nom.toUpperCase(),
        prenom,
        sexe,
        date_naissance: dateNaissance,
        telephone,
        email,
        adresse,
        photo: "",
        filiere_id: filiereId,
        classe_id: classeId,
        mot_de_passe: motDePasse
      });

      if (enregistrerPaiement && onAddPaiement) {
        onAddPaiement({
          etudiant_id: nextId,
          montant: Number(montantPaiement),
          date_paiement: new Date().toISOString().split('T')[0],
          type_frais: 'Inscription',
          methode: methodePaiement,
          statut: 'Payé',
          recu_numero: recuPaiement || `REC-${currentYear}-INSC-${String(nextId).padStart(4, '0')}`,
          annee_scolaire: `${currentYear}-${currentYear + 1}`,
          notes: `Frais d'inscription réglés lors de l'enrôlement de l'élève (Matricule: ${activeMatricule})`
        });
      }
    }

    resetForm();
    setShowForm(false);
  };

  const filteredEtudiants = etudiants.filter(s => {
    const matchesSearch = 
      s.nom.toLowerCase().includes(search.toLowerCase()) || 
      s.prenom.toLowerCase().includes(search.toLowerCase()) ||
      s.matricule.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    
    const finalFiliereFilter = (globalFiliereId && globalFiliereId > 0) ? globalFiliereId : filiereFilter;
    const matchesFiliere = finalFiliereFilter === 0 || s.filiere_id === finalFiliereFilter;

    return matchesSearch && matchesFiliere;
  });

  return (
    <div className="space-y-6" id="etudiants-management-container">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-gray-900">Enseignes Étudiantes</h3>
        <button 
          onClick={() => { setShowForm(!showForm); if(showForm) resetForm(); }}
          className="btn btn-primary inline-flex items-center gap-2 cursor-pointer select-none"
          id="btn-toggle-student-form"
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? "Masquer le formulaire" : "Inscrire un Étudiant"}
        </button>
      </div>

      {/* Editor addition/modification container */}
      {showForm && (
        <div className="bg-[#111422] p-5 sm:p-6 rounded-2xl shadow-xl border border-[#20253e]" id="student-editor-card">
          <h4 className="text-sm font-bold text-slate-100 mb-4 border-b border-[#20253e] pb-3 flex justify-between items-center flex-wrap gap-2">
            <span className="font-sans tracking-wide uppercase font-black text-[#c5a880]">
              {editingStudent ? `Modifier le dossier : ${editingStudent.matricule}` : "Formulaire de Nouvelle Inscription Scolaire"}
            </span>
            <span className="text-[10px] bg-[#20253e] text-[#c5a880] px-3 py-1 rounded-full border border-blue-900/30">
              Rentrée Académique {currentYear}
            </span>
          </h4>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column (Covers Form Fields) */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="form-group">
                <label className="form-label text-slate-400">Nom de famille <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={nom} 
                  onChange={e => setNom(e.target.value)} 
                  placeholder="Ex: KOUASSI" 
                  className="form-control" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400">Prénom(s) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={prenom} 
                  onChange={e => setPrenom(e.target.value)} 
                  placeholder="Ex: Jean-Philippe" 
                  className="form-control" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400">E-mail institutionnel <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="nom.prenom@ecole.com" 
                  className="form-control" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400">Téléphone de contact</label>
                <input 
                  type="text" 
                  value={telephone} 
                  onChange={e => setTelephone(e.target.value)} 
                  placeholder="+225 00000000" 
                  className="form-control" 
                />
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400">Filière d'Étude Principale <span className="text-red-500">*</span></label>
                <select 
                  value={filiereId} 
                  onChange={e => setFiliereId(Number(e.target.value))} 
                  className="form-control font-semibold"
                  required
                >
                  {filieres.map(f => (
                    <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400">Classe / Niveau <span className="text-red-500">*</span></label>
                <select 
                  value={classeId} 
                  onChange={e => setClasseId(Number(e.target.value))} 
                  className="form-control font-semibold font-mono text-slate-100"
                  required
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.nom_classe}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400">Sexe</label>
                <select 
                  value={sexe} 
                  onChange={e => setSexe(e.target.value as 'M' | 'F')} 
                  className="form-control font-semibold"
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400">Date de Naissance <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  value={dateNaissance} 
                  onChange={e => setDateNaissance(e.target.value)} 
                  className="form-control font-mono font-medium text-slate-100" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400">Adresse physique domicile</label>
                <input 
                  type="text" 
                  value={adresse} 
                  onChange={e => setAdresse(e.target.value)} 
                  placeholder="Quartier, Commune, Ville" 
                  className="form-control" 
                />
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400 flex items-center justify-between">
                  <span>Mot de Passe du Compte</span>
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-[#c5a880] hover:underline flex items-center gap-1 cursor-pointer select-none"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPassword ? "Masquer" : "Afficher"}
                  </button>
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={motDePasse} 
                    onChange={e => setMotDePasse(e.target.value)} 
                    className="form-control pr-10" 
                    required 
                  />
                  <Shield className="absolute right-3 top-3 w-4 h-4 text-emerald-500" />
                </div>
              </div>

            </div>

            {/* Right Column: Holographic ID Student Card Live Preview + Matricule Saisie Module */}
            <div className="bg-[#14172a] p-4 rounded-xl border border-[#20253e] flex flex-col justify-between space-y-4">
              
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    🪪 Aperçu de Carte Scolaire
                  </span>
                  {matriculeMode === 'auto' ? (
                    <span className="text-[8.5px] bg-[#071314] text-teal-400 border border-teal-900 px-1.5 py-0.5 rounded font-black font-mono">🌟 AUTO</span>
                  ) : (
                    <span className="text-[8.5px] bg-[#1a0e06] text-amber-501 border border-amber-900 px-1.5 py-0.5 rounded font-black font-mono">✍️ MANUEL</span>
                  )}
                </div>

                {/* Digital Card Rendering Box */}
                {(() => {
                  const selFiliere = filieres.find(f => f.id === filiereId);
                  const selClasse = classes.find(c => c.id === classeId);
                  const gradient = getFiliereGradient(filiereId);
                  
                  return (
                    <div className={`w-full bg-gradient-to-br ${gradient} p-4 rounded-xl border relative shadow-2xl overflow-hidden transition-all duration-300 min-h-[195px] flex flex-col justify-between select-none`}>
                      {/* Stylized background lines */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a880]/5 rounded-full blur-2xl pointer-events-none"></div>
                      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-[#c5a880]/5 rounded-full blur-xl pointer-events-none"></div>
                      
                      {/* Card Header area */}
                      <div className="flex justify-between items-start border-b border-[#252b47] pb-2">
                        <div className="text-left font-serif">
                          <h6 className="text-[9.5px] tracking-widest font-black uppercase text-[#dfcbb0] leading-none">
                            GROUPE SCOLAIRE ACADÉMIQUE
                          </h6>
                          <span className="text-[6.5px] font-mono tracking-widest text-[#bfcbde] uppercase leading-none block mt-0.5">
                            BAMAKO • EXCELLENCE & SAVOIR
                          </span>
                        </div>
                        {/* Gold smartchip rendering */}
                        <div className="w-5.5 h-4 bg-gradient-to-br from-yellow-300 via-[#c5a880] to-[#8a7251] rounded border border-[#dfcbb0]/40 flex flex-col justify-center items-center shrink-0 shadow-inner">
                          <div className="grid grid-cols-3 gap-[1px] w-4 h-2.5">
                            <div className="border border-[#111422]/20 rounded-[1px]"></div>
                            <div className="border border-[#111422]/20 rounded-[1px]"></div>
                            <div className="border border-[#111422]/20 rounded-[1px]"></div>
                          </div>
                        </div>
                      </div>

                      {/* Card main row information */}
                      <div className="flex gap-3 my-2.5 items-center">
                        {/* Profile Initials Emblem (Remplace la photo stock) */}
                        <div className="w-11 h-11 bg-gradient-to-br from-[#c5a880]/20 to-[#dfcbb0]/10 border border-[#c5a880]/50 rounded-full shrink-0 relative flex items-center justify-center shadow-lg">
                          <span className="font-serif font-black text-xs text-[#dfcbb0] tracking-wider">
                            {nom && prenom ? `${nom.charAt(0).toUpperCase()}${prenom.charAt(0).toUpperCase()}` : "ET"}
                          </span>
                        </div>

                        {/* Name and scholastic attributes */}
                        <div className="flex-1 space-y-1 min-w-0 text-left">
                          <div className="space-y-[1px]">
                            <span className="text-[6px] tracking-wide text-gray-500 uppercase leading-none block">Identité Étudiant</span>
                            <p className="font-sans font-black text-[11px] leading-tight text-[#ffffff] uppercase truncate tracking-wide">
                              {nom ? nom.toUpperCase() : "..."}
                            </p>
                            <p className="font-sans font-semibold text-[8px] leading-none text-[#dfcbb0] truncate">
                              {prenom || "..."}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-1 pb-1">
                            <div>
                              <span className="text-[5.5px] uppercase text-slate-500 block">Filière</span>
                              <span className="text-[7.5px] font-black block truncate leading-tight text-[#bfcbde]">
                                {selFiliere ? selFiliere.nom_filiere : "A définir"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[5.5px] uppercase text-slate-500 block">Classe / Niveau</span>
                              <span className="text-[7.5px] font-mono font-black block truncate leading-tight text-[#c5a880]">
                                {selClasse ? selClasse.nom_classe : "Optionnelle"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer containing final active matricule & security layout */}
                      <div className="pt-2 border-t border-[#252b47] flex justify-between items-center bg-[#0d101d]/40 px-2 py-1 rounded">
                        <div className="text-left">
                          <span className="text-[5.5px] font-bold uppercase text-slate-500 block leading-none">Matricule Scolaire</span>
                          <span className="font-mono text-[10.5px] font-black text-[#c5a880] tracking-wider block">
                            {activeMatricule || "ENT-2026-XXXX"}
                          </span>
                        </div>

                        {/* Custom Barcode using precise CSS stripes */}
                        <div className="bg-[#14172a]/80 p-1 rounded-sm border border-[#20253e] flex items-center gap-[1px] h-6 overflow-hidden shrink-0 select-none">
                          <div className="w-0.5 h-4 bg-slate-400"></div>
                          <div className="w-1 h-4 bg-slate-400"></div>
                          <div className="w-[1px] h-4 bg-transparent"></div>
                          <div className="w-0.5 h-4 bg-slate-400"></div>
                          <div className="w-[1px] h-4 bg-transparent"></div>
                          <div className="w-1.5 h-4 bg-slate-400"></div>
                          <div className="w-0.5 h-4 bg-slate-400"></div>
                          <div className="w-[1px] h-4 bg-transparent"></div>
                          <div className="w-0.5 h-4 bg-slate-400"></div>
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>

              {/* Advanced Matricule Allocation Console */}
              <div className="bg-[#0f1220] p-3.5 rounded-xl border border-[#20253e] space-y-3 text-left">
                <div className="flex justify-between items-center pb-1 border-b border-[#20253e]">
                  <span className="text-[9.5px] font-black uppercase text-[#dfcbb0] tracking-wider block">
                    Modèle de Saisie du Matricule
                  </span>
                  {editingStudent && (
                    <span className="text-[8px] bg-amber-900/40 text-[#c5a880] border border-[#c5a880]/30 px-2 py-0.5 rounded font-bold uppercase select-none">
                      Lecture Seule
                    </span>
                  )}
                </div>

                {!editingStudent ? (
                  <>
                    {/* Aligned Tabs for Choice generation Mode */}
                    <div className="grid grid-cols-2 gap-1 bg-[#14172a] p-1 rounded-lg border border-[#20253e]">
                      <button
                        type="button"
                        onClick={() => setMatriculeMode('auto')}
                        className={`py-1 rounded text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          matriculeMode === 'auto'
                            ? 'bg-blue-600/30 text-white border border-blue-500/40 font-extrabold'
                            : 'text-slate-400 hover:text-slate-250'
                        }`}
                      >
                        <Wand2 className="w-3 h-3 stroke-[2.5] text-[#c5a880]" /> Auto-générer
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatriculeMode('manual')}
                        className={`py-1 rounded text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          matriculeMode === 'manual'
                            ? 'bg-[#c5a880]/20 text-white border border-[#c5a880]/40 font-extrabold'
                            : 'text-slate-400 hover:text-slate-250'
                        }`}
                      >
                        <Keyboard className="w-3 h-3 stroke-[2.5]" /> Saisie Libre
                      </button>
                    </div>

                    {/* Active Mode UI Content */}
                    {matriculeMode === 'auto' ? (
                      <div className="space-y-2 pt-1">
                        <span className="text-[9px] text-[#bfcbde] font-semibold block leading-none">
                          Sélectionnez le préfixe de base de l'inscription :
                        </span>
                        
                        <div className="flex gap-1.5 font-mono">
                          {(['ETU', 'INS', 'ACAD'] as const).map(pfx => {
                            const isSelected = matriculePrefix === pfx;
                            return (
                              <button
                                key={pfx}
                                type="button"
                                onClick={() => setMatriculePrefix(pfx)}
                                className={`flex-grow py-1 px-1.5 rounded text-[10px] font-black border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#c5a880] text-[#111422] border-[#c0a27a]'
                                    : 'bg-[#14172a] text-slate-400 border-[#20253e] hover:text-slate-100'
                                }`}
                              >
                                {pfx}
                              </button>
                            );
                          })}
                        </div>
                        
                        <span className="text-[8.5px] text-slate-400 italic leading-snug block mt-1">
                          Formule dynamique : <strong className="text-slate-200 font-mono">{activeMatricule}</strong>. Ce code intègre l'année en cours, le niveau de classe d'étude et le compteur séquentiel élève.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[9px] text-[#bfcbde] font-semibold block">
                          Nouveau matricule personnalisé <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={customMatricule}
                            onChange={e => setCustomMatricule(e.target.value)}
                            placeholder="Saisir (Ex: ETTI-26L3-9999)"
                            className="form-control font-mono font-bold tracking-wider text-xs uppercase pr-9 placeholder:text-slate-600 placeholder:italic select-text"
                            required={matriculeMode === 'manual'}
                          />
                          <div className="absolute right-3 top-3">
                            {customMatricule.trim() === "" ? (
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" title="Saisie en cours..."></div>
                            ) : isDuplicateMatricule(customMatricule) ? (
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-bounce" title="Doublon détecté !"></div>
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Matricule valide et libre"></div>
                            )}
                          </div>
                        </div>

                        {/* Duplication error state alerts inside custom panel */}
                        {customMatricule.trim() !== "" && (
                          <div className="pt-1 select-none">
                            {isDuplicateMatricule(customMatricule) ? (
                              <div className="p-1 px-2 bg-red-950/20 border border-red-900/40 rounded flex items-center gap-1 text-[9px] font-bold text-red-400">
                                <AlertTriangle className="w-3 h-3 shrink-0 text-red-500" />
                                <span>Matricule attribué à un autre élève</span>
                              </div>
                            ) : (
                              <div className="p-1 px-2 bg-emerald-950/20 border border-emerald-900/30 rounded flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                                <Check className="w-3 h-3 shrink-0 text-emerald-400" />
                                <span>Identifiant unique disponible</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-2.5 bg-[#14172a] rounded-lg border border-[#20253e] text-center font-mono space-y-1">
                    <span className="text-[8.5px] uppercase tracking-wide text-slate-500 block">Scolarité native scellée</span>
                    <strong className="text-xs font-black text-slate-100 tracking-wider block">{activeMatricule}</strong>
                    <p className="text-[8px] text-slate-400 leading-relaxed font-sans">
                      Les matricules sont des clés d'archives non éditables pour garantir la cohérence des bulletins de notes historiques.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Volet Financier d'Inscription (Only for new registrations) */}
            {!editingStudent && (
              <div className="lg:col-span-3 bg-[#171a2a] p-4 rounded-xl border border-teal-900/40 mt-2 mb-1">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#20253e]">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-teal-400 font-extrabold text-xs uppercase tracking-wider">
                    <input 
                      type="checkbox" 
                      checked={enregistrerPaiement} 
                      onChange={e => {
                        const checked = e.target.checked;
                        setEnregistrerPaiement(checked);
                        if (checked && !recuPaiement) {
                          setRecuPaiement(`REC-${currentYear}-INSC-${String(nextId).padStart(4, '0')}`);
                        }
                      }}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-[#111422] border-[#20253e]"
                    />
                    <span>💰 Enregistrer directement le paiement d'inscription</span>
                  </label>
                  <span className="text-[9px] bg-teal-950 text-teal-400 px-2 py-0.5 rounded border border-teal-900/30 font-bold select-none">
                    Saisie intégrée
                  </span>
                </div>

                {enregistrerPaiement && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in p-1">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Montant Versement d’Inscription (CFA)</label>
                      <input 
                        type="number"
                        value={montantPaiement}
                        onChange={e => setMontantPaiement(Number(e.target.value))}
                        className="form-control bg-[#111422] text-[#c5a880] border-[#20253e] font-mono font-bold"
                        required={enregistrerPaiement}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Canal de Règlement</label>
                      <select
                        value={methodePaiement}
                        onChange={e => setMethodePaiement(e.target.value as any)}
                        className="form-control bg-[#111422] border-[#20253e] text-slate-100 font-bold"
                      >
                        <option value="Mobile Money">Mobile Money (Wave/Orange/MTN)</option>
                        <option value="Espèces">Espèces (Guichet)</option>
                        <option value="Chèque">Chèque d’Établissement</option>
                        <option value="Virement">Virement Bancaire</option>
                        <option value="Carte">Carte de Crédit</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Numéro du Reçu Financier d’Inscription</label>
                      <input 
                        type="text"
                        value={recuPaiement}
                        onChange={e => setRecuPaiement(e.target.value)}
                        placeholder="Ex: REC-2026-INSC-0042"
                        className="form-control bg-[#111422] text-slate-100 border-[#20253e] font-mono uppercase font-bold"
                        required={enregistrerPaiement}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Validation row buttons */}
            <div className="lg:col-span-3 flex justify-end gap-3 pt-4 border-t border-[#20253e] shrink-0">
              <button 
                type="button" 
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 hover:bg-slate-300 bg-white text-[#111422] rounded-lg text-xs font-bold transition cursor-pointer select-none border border-[#20253e]"
              >
                Annuler l'Inscription
              </button>
              <button 
                type="submit" 
                disabled={matriculeMode === 'manual' && isDuplicateMatricule(customMatricule)}
                className={`btn btn-primary font-black text-xs py-2 px-5 cursor-pointer uppercase tracking-wider select-none ${
                  matriculeMode === 'manual' && isDuplicateMatricule(customMatricule)
                    ? 'opacity-40 cursor-not-allowed text-slate-400 border-none'
                    : ''
                }`}
              >
                {editingStudent ? "Enregistrer les modifications" : "Inscrire & Émettre la Carte"}
              </button>
            </div>
            
          </form>
        </div>
      )}

      {/* Filter and search utilities */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3" id="students-filter-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Moteur de Recherche Globale (Temps Réel)</h4>
            <p className="text-[11px] text-gray-550">Filtrage instantané des élèves par Nom, Prénom, Matricule, ou E-mail.</p>
          </div>
          <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1.5 self-start sm:self-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            {filteredEtudiants.length} étudiant{filteredEtudiants.length > 1 ? 's' : ''} trouvé{filteredEtudiants.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher par Nom, Prénom, Matricule..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control pl-11 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 placeholder-slate-400"
            />
            {search && (
              <button 
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2 text-[10px] bg-slate-150 hover:bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-md transition-colors"
                title="Effacer la recherche"
              >
                Vider
              </button>
            )}
          </div>
          {(!globalFiliereId || globalFiliereId === 0) ? (
            <div>
              <select 
                value={filiereFilter}
                onChange={e => setFiliereFilter(Number(e.target.value))}
                className="form-control py-2 text-xs font-semibold border-gray-300 bg-white"
              >
                <option value={0}>Toutes les filières académiques</option>
                {filieres.map(f => (
                  <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-2 rounded-xl border border-blue-150 w-full text-center">
                Filière : {filieres.find(f => f.id === globalFiliereId)?.nom_filiere || "Verrouillée"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Student List View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id="students-list-card">
        <div className="overflow-x-auto w-full">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom & Prénoms</th>
                <th>Sexe</th>
                <th>Filière de Base</th>
                <th>Classe</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEtudiants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500 text-sm">
                    Aucun étudiant ne correspond à vos filtres de recherche.
                  </td>
                </tr>
              ) : (
                filteredEtudiants.map(student => {
                  const f = filieres.find(x => x.id === student.filiere_id);
                  const c = classes.find(x => x.id === student.classe_id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition">
                      <td>
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs select-all">
                          {student.matricule}
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold text-gray-950">{student.nom}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{student.prenom}</div>
                      </td>
                      <td className="text-xs text-gray-500">{student.sexe}</td>
                      <td className="text-sm font-medium text-blue-700">{f ? f.nom_filiere : "Inconnue"}</td>
                      <td>
                        <span className="text-xs font-semibold bg-blue-50 text-blue-800 px-2.5 py-1 rounded">
                          {c ? c.nom_classe : "L1"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-2">
                          <button 
                            onClick={() => handleEdit(student)}
                            className="p-1 px-2.5 bg-gray-100 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition text-xs flex items-center gap-1 font-semibold"
                          >
                            <Edit2 className="w-3 h-3" />
                            Mod
                          </button>
                          <button 
                            onClick={() => {
                              onDeleteEtudiant(student.id);
                            }}
                            className="p-1 px-2 bg-red-50 text-red-600 hover:bg-red-100 rounded transition text-xs flex items-center gap-1 font-semibold"
                          >
                            <Trash2 className="w-3 h-3" />
                            Suppr
                          </button>
                        </div>
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
  );
}
