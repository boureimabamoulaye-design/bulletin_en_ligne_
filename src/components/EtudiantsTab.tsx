import React, { useState } from 'react';
import { Etudiant, Filiere, Classe, Paiement } from '../types';
import { UserPlus, Search, Edit2, Trash2, Shield, Eye, EyeOff, Wand2, Keyboard, Check, AlertTriangle, CreditCard, GraduationCap, ChevronLeft, ChevronRight, Sliders, LayoutList } from 'lucide-react';

interface EtudiantsTabProps {
  etudiants: Etudiant[];
  filieres: Filiere[];
  classes: Classe[];
  onAddEtudiant: (student: Omit<Etudiant, 'id'>) => void;
  onUpdateEtudiant: (student: Etudiant) => void;
  onDeleteEtudiant: (id: number) => void;
  onAddPaiement?: (paiement: Omit<Paiement, 'id'>) => void;
  globalFiliereId?: number;
  paiements?: Paiement[];
  globalAnneeScolaire?: string;
  scolariteAnnuelle?: number;
}

export default function EtudiantsTab({ 
  etudiants, 
  filieres, 
  classes, 
  onAddEtudiant, 
  onUpdateEtudiant, 
  onDeleteEtudiant, 
  onAddPaiement,
  globalFiliereId,
  paiements = [],
  globalAnneeScolaire = "2025-2026",
  scolariteAnnuelle = 1500000
}: EtudiantsTabProps) {
  const [search, setSearch] = useState("");
  const [filiereFilter, setFiliereFilter] = useState<number>(0);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Etudiant | null>(null);

  // Pagination states for bulk performance (800+ students)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // New features: View modes, data masking, and student list hide option
  const [viewMode, setViewMode] = useState<'table' | 'carousel'>('table');
  const [isListHidden, setIsListHidden] = useState(false);
  const [isMasked, setIsMasked] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  React.useEffect(() => {
    setCurrentPage(1);
    setCarouselIndex(0);
  }, [search, filiereFilter, globalFiliereId]);

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

  const totalPages = Math.max(1, Math.ceil(filteredEtudiants.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEtudiants = filteredEtudiants.slice(startIndex, startIndex + itemsPerPage);

  const formatCFA = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val).replace('XOF', 'CFA');
  };

  const maskText = (text: string, type: 'name' | 'email' | 'phone' | 'date' | 'address' | 'matricule') => {
    if (!isMasked) return text;
    if (!text) return "Non renseigné";
    if (type === 'name') {
      const nameParts = text.split(' ');
      return nameParts.map(p => p.substring(0, Math.max(1, Math.floor(p.length / 3))) + "••••").join(' ');
    }
    if (type === 'matricule') {
      return text.substring(0, 4) + "••••";
    }
    if (type === 'email') {
      const emailParts = text.split('@');
      if (emailParts.length === 2) {
        return emailParts[0].substring(0, Math.min(2, emailParts[0].length)) + "••••@" + emailParts[1];
      }
      return "••••@••••.•••";
    }
    if (type === 'phone') {
      return text.substring(0, Math.min(5, text.length)) + " •• •• ••";
    }
    if (type === 'date') {
      return "••••-••-••";
    }
    if (type === 'address') {
      return "Adresse confidentielle";
    }
    return "••••";
  };

  return (
    <div className="space-y-6" id="etudiants-management-container">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-150">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#c5a880] bg-[#c5a880]/10 px-2.5 py-1 rounded-md border border-[#c5a880]/20">
            Registre des Inscriptions
          </span>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Inscrivez les étudiants, gérez leurs classes et affectez leurs matricules scolaires.</p>
        </div>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-150 hover:bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-md transition-colors"
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

       {/* Dynamic Controls for View Mode & Data Masking */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-100 p-4 rounded-xl border border-slate-200 select-none shadow-xs" id="students-view-controls">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-500 mr-1">Format de Vue :</span>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer border ${
              viewMode === 'table'
                ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Tableau Classique</span>
          </button>
          
          <button
            type="button"
            onClick={() => setViewMode('carousel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer border ${
              viewMode === 'carousel'
                ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Carrousel Défilant ({filteredEtudiants.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Data Masking Toggle */}
          <button
            type="button"
            onClick={() => setIsMasked(!isMasked)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 border transition cursor-pointer ${
              isMasked
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm font-black'
                : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Masquer/Censurer les informations confidentielles"
          >
            <Shield className={`w-3.5 h-3.5 ${isMasked ? 'animate-pulse text-amber-100' : ''}`} />
            <span>{isMasked ? "Données Masquées" : "Masquer les Infos"}</span>
          </button>

          {/* List Visibility Toggle */}
          <button
            type="button"
            onClick={() => setIsListHidden(!isListHidden)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 border transition cursor-pointer ${
              isListHidden
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm animate-pulse'
                : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {isListHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isListHidden ? "Afficher les Élèves" : "Masquer la Liste"}</span>
          </button>
        </div>
      </div>

      {isListHidden ? (
        <div className="bg-slate-50 p-10 rounded-2xl border border-dashed border-slate-300 text-center space-y-4 max-w-lg mx-auto" id="students-hidden-card">
          <div className="w-16 h-16 bg-slate-150 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-200 shadow-sm">
            <EyeOff className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Liste des Étudiants Masquée</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Pour des raisons de discrétion visuelle ou de fluidité de l'écran, l'affichage direct est actuellement masqué.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsListHidden(false)}
            className="px-5 py-2.5 bg-blue-900 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md uppercase tracking-wider mx-auto block"
          >
            Révéler et afficher la liste
          </button>
        </div>
      ) : (
        (() => {
          if (filteredEtudiants.length === 0) {
            return (
              <div className="bg-white p-10 rounded-xl border border-gray-200 text-center text-slate-500 font-bold text-sm">
                Aucun étudiant ne correspond à vos filtres de recherche.
              </div>
            );
          }

          if (viewMode === 'table') {
            return (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in" id="students-list-card">
                <div className="overflow-x-auto w-full">
                  <table className="custom-table min-w-[850px]">
                    <thead>
                      <tr>
                        <th>Matricule</th>
                        <th>Nom & Prénoms</th>
                        <th>Sexe</th>
                        <th>Filière de Base</th>
                        <th>Classe</th>
                        <th>Scolarité ({globalAnneeScolaire})</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEtudiants.map(student => {
                        const f = filieres.find(x => x.id === student.filiere_id);
                        const c = classes.find(x => x.id === student.classe_id);
                        
                        // Calculate student payment stats for selected academic year
                        const studentPayments = paiements.filter(p => p.etudiant_id === student.id && p.statut === 'Payé' && p.annee_scolaire === globalAnneeScolaire);
                        const totalPaid = studentPayments.reduce((sum, p) => sum + p.montant, 0);
                        const remainingDues = scolariteAnnuelle - totalPaid;
                        const isLate = totalPaid < scolariteAnnuelle;

                        const formattedRemaining = isMasked ? "•••••• CFA" : formatCFA(remainingDues);
                        const formattedPaid = isMasked ? "•••••• CFA" : formatCFA(totalPaid);
                        const formattedAnnual = isMasked ? "•••••• CFA" : formatCFA(scolariteAnnuelle);

                        return (
                          <tr key={student.id} className="hover:bg-slate-50 transition">
                            <td>
                              <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs select-all">
                                {maskText(student.matricule, 'matricule')}
                              </span>
                            </td>
                            <td>
                              <div className="font-semibold text-gray-950">{maskText(student.nom, 'name')}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{maskText(student.prenom, 'name')}</div>
                            </td>
                            <td className="text-xs text-gray-500">{student.sexe}</td>
                            <td className="text-sm font-medium text-blue-700">{f ? f.nom_filiere : "Inconnue"}</td>
                            <td>
                              <span className="text-xs font-semibold bg-blue-50 text-blue-800 px-2.5 py-1 rounded">
                                {c ? c.nom_classe : "L1"}
                              </span>
                            </td>
                            <td>
                              {isLate ? (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                    totalPaid > 0 
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-sm' 
                                      : 'bg-rose-50 text-rose-800 border-rose-200 shadow-sm'
                                  }`}>
                                    <span className="relative flex h-2 w-2">
                                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${totalPaid > 0 ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
                                      <span className={`relative inline-flex rounded-full h-2 w-2 ${totalPaid > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                                    </span>
                                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${totalPaid > 0 ? 'text-amber-600' : 'text-rose-600'}`} />
                                    <span className="uppercase tracking-wider">
                                      {totalPaid > 0 ? "Retard (Partiel)" : "Retard (Impayé)"}
                                    </span>
                                  </span>
                                  <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                                    Reste : <strong className="font-mono text-rose-600 font-extrabold">{formattedRemaining}</strong>
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-mono">
                                    Validé: {formattedPaid} / {formattedAnnual}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-250 shadow-sm">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    <span>RÉGLÉ</span>
                                  </span>
                                  <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                                    Solde de scolarité apuré
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-mono">
                                    {formattedPaid} / {formattedAnnual}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="text-right">
                              <div className="inline-flex gap-2">
                                <button 
                                  onClick={() => handleEdit(student)}
                                  className="p-1 px-2.5 bg-gray-100 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition text-xs flex items-center gap-1 font-semibold cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Mod
                                </button>
                                <button 
                                  onClick={() => {
                                    if(confirm(`Voulez-vous vraiment supprimer l'étudiant ${student.nom} ${student.prenom} ?`)) {
                                      onDeleteEtudiant(student.id);
                                    }
                                  }}
                                  className="p-1 px-2 bg-red-50 text-red-600 hover:bg-red-100 rounded transition text-xs flex items-center gap-1 font-semibold cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Suppr
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination controls for bulk rendering support */}
                {filteredEtudiants.length > itemsPerPage && (
                  <div className="bg-slate-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                    <span className="text-xs font-semibold text-slate-500">
                      Affichage de <strong className="text-slate-800">{startIndex + 1}</strong> à <strong className="text-slate-800">{Math.min(startIndex + itemsPerPage, filteredEtudiants.length)}</strong> sur <strong className="text-slate-800">{filteredEtudiants.length}</strong> étudiants
                    </span>
                    <div className="inline-flex items-center -space-x-px gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          currentPage === 1
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900 cursor-pointer'
                        }`}
                      >
                        Précédent
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                          let pageNum = index + 1;
                          if (currentPage > 3 && totalPages > 5) {
                            if (currentPage + 2 > totalPages) {
                              pageNum = totalPages - 4 + index;
                            } else {
                              pageNum = currentPage - 2 + index;
                            }
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-black transition cursor-pointer ${
                                currentPage === pageNum
                                  ? 'bg-blue-900 text-white shadow-sm'
                                  : 'bg-white hover:bg-slate-100 text-slate-650 border border-slate-300'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          currentPage === totalPages
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900 cursor-pointer'
                        }`}
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Render Carousel Slider View
          const activeIndex = Math.min(Math.max(0, carouselIndex), filteredEtudiants.length - 1);
          const student = filteredEtudiants[activeIndex];

          const f = filieres.find(x => x.id === student.filiere_id);
          const c = classes.find(x => x.id === student.classe_id);
          
          const studentPayments = paiements.filter(p => p.etudiant_id === student.id && p.statut === 'Payé' && p.annee_scolaire === globalAnneeScolaire);
          const totalPaid = studentPayments.reduce((sum, p) => sum + p.montant, 0);
          const remainingDues = scolariteAnnuelle - totalPaid;
          const isLate = totalPaid < scolariteAnnuelle;

          const progressPct = Math.min(100, Math.round((totalPaid / scolariteAnnuelle) * 100));

          const initials = `${student.prenom[0] || ""}${student.nom[0] || ""}`.toUpperCase();
          const isMale = student.sexe === 'M';

          const formattedRemaining = isMasked ? "•••••• CFA" : formatCFA(remainingDues);
          const formattedPaid = isMasked ? "•••••• CFA" : formatCFA(totalPaid);
          const formattedAnnual = isMasked ? "•••••• CFA" : formatCFA(scolariteAnnuelle);

          // Get nearby indices for horizontal scrolling previews
          const nearbyIndices: number[] = [];
          for (let d = -2; d <= 2; d++) {
            const idx = activeIndex + d;
            if (idx >= 0 && idx < filteredEtudiants.length) {
              nearbyIndices.push(idx);
            }
          }

          return (
            <div className="space-y-6 animate-fade-in" id="students-carousel-view">
              {/* Main ID Badge and school fees details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Large Virtual ID Badge card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl shadow-xl border border-slate-850 p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px]" id="carousel-student-badge">
                  
                  {/* Backdrop abstract shapes */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none"></div>

                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4 select-none">
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-5 h-5 text-amber-400" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 font-sans">CARTE SCOLAIRE NUMÉRIQUE</h4>
                        <p className="text-[9px] text-slate-400 font-mono">ACADEMIC CARD • {globalAnneeScolaire}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full">
                      {c ? c.nom_classe : "L1"}
                    </span>
                  </div>

                  {/* ID Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-grow">
                    
                    {/* Left: Avatar initial frame */}
                    <div className="md:col-span-4 flex flex-col items-center text-center space-y-2">
                      <div className={`w-24 h-24 rounded-2xl border-2 shadow-md flex items-center justify-center font-black text-2xl relative overflow-hidden select-none ${
                        isMale 
                          ? 'bg-gradient-to-tr from-blue-900/40 to-cyan-900/40 text-cyan-400 border-cyan-500/30' 
                          : 'bg-gradient-to-tr from-rose-900/40 to-pink-900/40 text-pink-400 border-pink-500/30'
                      }`}>
                        {initials}
                        <span className="absolute bottom-1 right-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-950/80 text-white">
                          {student.sexe}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Matricule Officiel</span>
                        <code className="text-xs font-bold font-mono text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                          {maskText(student.matricule, 'matricule')}
                        </code>
                      </div>
                    </div>

                    {/* Right: Personal specifications */}
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      
                      <div>
                        <span className="text-[10px] text-slate-550 font-black uppercase tracking-wider block">Nom de famille</span>
                        <p className="text-sm font-extrabold text-white uppercase tracking-wide">{maskText(student.nom, 'name')}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-550 font-black uppercase tracking-wider block">Prénom(s)</span>
                        <p className="text-sm font-bold text-slate-100">{maskText(student.prenom, 'name')}</p>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-550 font-black uppercase tracking-wider block">Filière Académique</span>
                        <p className="text-xs font-bold text-blue-400 leading-snug">{f ? f.nom_filiere : "Inconnue"}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-550 font-black uppercase tracking-wider block">Téléphone</span>
                        <p className="text-xs font-mono font-bold text-slate-300">{maskText(student.telephone, 'phone')}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-550 font-black uppercase tracking-wider block">E-mail</span>
                        <p className="text-xs font-mono font-bold text-slate-300 truncate select-all" title={student.email}>
                          {maskText(student.email, 'email')}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-550 font-black uppercase tracking-wider block">Date de Naissance</span>
                        <p className="text-xs font-mono font-semibold text-slate-300">{maskText(student.date_naissance, 'date')}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-550 font-black uppercase tracking-wider block">Adresse de Résidence</span>
                        <p className="text-xs font-semibold text-slate-300 truncate" title={student.adresse}>
                          {maskText(student.adresse, 'address')}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Card bottom actions */}
                  <div className="flex justify-between items-center border-t border-slate-850 pt-4 mt-4 select-none flex-wrap gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">Modifiez ou supprimez ce dossier à tout moment</span>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => handleEdit(student)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-450" />
                        <span>Modifier</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (confirm(`Confirmez-vous la suppression de l'étudiant ${student.nom} ${student.prenom} ?`)) {
                            onDeleteEtudiant(student.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/20 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-450" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* 2. School fees financial visualizer */}
                <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-6 flex flex-col justify-between" id="carousel-student-payments">
                  <div className="space-y-5">
                    <div className="flex justify-between items-start select-none">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">CONTRÔLE FINANCIER</h4>
                        <p className="text-xs text-slate-800 font-bold mt-1">Scolarité : {formattedAnnual}</p>
                      </div>
                      {isLate ? (
                        <span className="bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                          Retard
                        </span>
                      ) : (
                        <span className="bg-emerald-50 border border-emerald-250 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                          En Règle
                        </span>
                      )}
                    </div>

                    {/* Progress tracking gauge */}
                    <div className="space-y-1.5 select-none">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-500">Taux d'acquittement</span>
                        <span className={isLate ? "text-amber-600 font-extrabold" : "text-emerald-600 font-extrabold"}>
                          {isMasked ? "•• %" : `${progressPct}%`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200 p-0.5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isLate ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100 select-none">
                      <div className="py-2.5 flex justify-between items-center text-xs">
                        <span className="text-slate-550 font-semibold">Total Réglé :</span>
                        <strong className="text-emerald-600 font-mono font-extrabold">{formattedPaid}</strong>
                      </div>
                      <div className="py-2.5 flex justify-between items-center text-xs">
                        <span className="text-slate-550 font-semibold">Reste à recouvrer :</span>
                        <strong className={`font-mono font-extrabold ${isLate ? 'text-rose-600' : 'text-slate-800'}`}>
                          {formattedRemaining}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 select-none">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-[10px] text-slate-500 font-semibold leading-relaxed">
                      Scolarité due pour l'année académique active. Enregistrez les règlements dans l'onglet des paiements.
                    </div>
                  </div>
                </div>

              </div>

              {/* Range Scrubber and Navigation handles */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 select-none shadow-xs">
                
                {/* Back navigation */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={activeIndex === 0}
                    onClick={() => setCarouselIndex(0)}
                    className="px-2.5 py-2 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-black text-[10px]"
                    title="Premier étudiant"
                  >
                    |&lt;&lt;
                  </button>
                  <button
                    type="button"
                    disabled={activeIndex === 0}
                    onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                    className="px-4 py-2 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Précédent</span>
                  </button>
                </div>

                {/* Timeline Range Scrubber */}
                <div className="flex-grow max-w-lg w-full text-center space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={filteredEtudiants.length - 1}
                    value={activeIndex}
                    onChange={e => setCarouselIndex(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] font-black text-slate-500 font-mono">
                    <span>DÉBUT (1)</span>
                    <span className="text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-150 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      FICHE D'ÉTUDIANT {activeIndex + 1} SUR {filteredEtudiants.length}
                    </span>
                    <span>FIN ({filteredEtudiants.length})</span>
                  </div>
                </div>

                {/* Forward navigation */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={activeIndex === filteredEtudiants.length - 1}
                    onClick={() => setCarouselIndex(prev => Math.min(filteredEtudiants.length - 1, prev + 1))}
                    className="px-4 py-2 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                  >
                    <span>Suivant</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={activeIndex === filteredEtudiants.length - 1}
                    onClick={() => setCarouselIndex(filteredEtudiants.length - 1)}
                    className="px-2.5 py-2 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-black text-[10px]"
                    title="Dernier étudiant"
                  >
                    &gt;&gt;|
                  </button>
                </div>

              </div>

              {/* Strip previews tape of adjacent students */}
              <div className="space-y-2.5 select-none" id="carousel-adjacent-filmstrip">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Bande Défilante (Cliquez pour faire défiler directement) :</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {nearbyIndices.map(idx => {
                    const nearStud = filteredEtudiants[idx];
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={nearStud.id}
                        type="button"
                        onClick={() => setCarouselIndex(idx)}
                        className={`p-3 rounded-xl border text-left transition duration-250 cursor-pointer flex flex-col justify-between h-20 shadow-xs ${
                          isActive
                            ? 'bg-blue-900 text-white border-blue-900 shadow-md scale-102 font-bold'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-250 hover:border-slate-300'
                        }`}
                      >
                        <code className={`text-[9px] font-mono font-bold block ${isActive ? 'text-amber-300' : 'text-slate-500'}`}>
                          {maskText(nearStud.matricule, 'matricule')}
                        </code>
                        <div className="truncate font-sans font-black text-[11px] leading-tight uppercase mt-1">
                          {maskText(nearStud.nom, 'name')}
                        </div>
                        <div className={`truncate text-[9px] ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                          {nearStud.prenom}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })()
      )}
    </div>
  );
}
