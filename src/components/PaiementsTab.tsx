import React, { useState } from 'react';
import { Etudiant, Paiement, Semestre } from '../types';
import { 
  DollarSign, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  X, 
  CheckCircle, 
  Printer, 
  Trash2, 
  FileText,
  BadgePercent,
  Check,
  CreditCard,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface PaiementsTabProps {
  etudiants: Etudiant[];
  paiements: Paiement[];
  semestres: Semestre[];
  anneesScolaires: string[];
  onAddAnneeScolaire: (annee: string) => void;
  scolariteAnnuelle: number;
  onUpdateScolariteAnnuelle: (newAmount: number) => void;
  onAddPaiement: (paiement: Omit<Paiement, 'id'>) => void;
  onUpdatePaiementStatus: (id: number, newStatus: 'Payé' | 'En attente' | 'Remboursé') => void;
  onDeletePaiement: (id: number) => void;
}

export default function PaiementsTab({ 
  etudiants, 
  paiements, 
  semestres = [],
  anneesScolaires = [],
  onAddAnneeScolaire,
  scolariteAnnuelle,
  onUpdateScolariteAnnuelle,
  onAddPaiement, 
  onUpdatePaiementStatus, 
  onDeletePaiement 
}: PaiementsTabProps) {
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [fraisFilter, setFraisFilter] = useState<string>("ALL");
  const [methodeFilter, setMethodeFilter] = useState<string>("ALL");
  const [statutFilter, setStatutFilter] = useState<string>("ALL");

  // Dynamically compile unique list of academic years
  const uniqueAnneeScolaires = Array.from(new Set([
    ...anneesScolaires,
    ...semestres.map(s => s.annee_scolaire),
    ...paiements.map(p => p.annee_scolaire)
  ].filter(Boolean)));
  if (uniqueAnneeScolaires.length === 0) {
    uniqueAnneeScolaires.push("2025-2026", "2026-2027", "2024-2025");
  }

  // Current filtered academic year
  const [anneeFilter, setAnneeFilter] = useState<string>(() => {
    return uniqueAnneeScolaires.includes("2025-2026") ? "2025-2026" : (uniqueAnneeScolaires[0] || "2025-2026");
  });

  const [showAddAnneeInline, setShowAddAnneeInline] = useState(false);
  const [newAnneeInput, setNewAnneeInput] = useState("");

  // Record modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEtudiantId, setSelectedEtudiantId] = useState<number>(0);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [showModalDropdown, setShowModalDropdown] = useState(false);
  const [montant, setMontant] = useState<number>(300000);
  const [typeFrais, setTypeFrais] = useState<'Scolarité' | 'Inscription' | 'Examen' | 'Autre'>('Scolarité');
  const [methode, setMethode] = useState<'Carte' | 'Espèces' | 'Chèque' | 'Virement' | 'Mobile Money'>('Mobile Money');
  const [statut, setStatut] = useState<'Payé' | 'En attente' | 'Remboursé'>('Payé');
  const [recuNumero, setRecuNumero] = useState("");
  const [modalAnneeScolaire, setModalAnneeScolaire] = useState("2025-2026");
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");

  // Print view state for receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState<Paiement | null>(null);

  // Editable Tuition state
  const [isEditingTuition, setIsEditingTuition] = useState(false);
  const [tuitionValue, setTuitionValue] = useState(String(scolariteAnnuelle));

  // Academic Year restricted payments
  const paymentsForYear = paiements.filter(p => !anneeFilter || p.annee_scolaire === anneeFilter);

  // Financial KPIs tailored for this academic year
  const totalReceived = paymentsForYear
    .filter(p => p.statut === 'Payé')
    .reduce((sum, p) => sum + p.montant, 0);

  const totalPending = paymentsForYear
    .filter(p => p.statut === 'En attente')
    .reduce((sum, p) => sum + p.montant, 0);

  const totalRefunded = paymentsForYear
    .filter(p => p.statut === 'Remboursé')
    .reduce((sum, p) => sum + p.montant, 0);

  const formatCFA = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val);
  };

  // Generate a random high quality receipt number
  const openAddModal = () => {
    const nextReceiptNum = `REC-2026-${String(paiements.length + 1).padStart(3, '0')}`;
    setRecuNumero(nextReceiptNum);
    setSelectedEtudiantId(0);
    setModalSearchQuery("");
    setShowModalDropdown(false);
    setModalAnneeScolaire(anneeFilter);
    setIsModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEtudiantId || !montant) return;

    onAddPaiement({
      etudiant_id: Number(selectedEtudiantId),
      montant: Number(montant),
      date_paiement: datePaiement,
      type_frais: typeFrais,
      methode,
      statut,
      recu_numero: recuNumero || `REC-${Date.now()}`,
      annee_scolaire: modalAnneeScolaire,
      notes
    });

    setIsModalOpen(false);
    // Reset defaults
    setMontant(300000);
    setNotes("");
  };

  const statusColors: Record<string, string> = {
    'Payé': 'bg-emerald-50 text-emerald-800 border-emerald-250 font-bold',
    'En attente': 'bg-amber-50 text-amber-800 border-amber-250 font-bold animate-pulse',
    'Remboursé': 'bg-slate-100 text-slate-800 border-slate-300'
  };

  // Filter payment list
  const filteredPaiements = paiements.filter(p => {
    const etu = etudiants.find(e => e.id === p.etudiant_id);
    const studentName = etu ? `${etu.nom} ${etu.prenom} ${etu.matricule}`.toLowerCase() : "";
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) || p.recu_numero.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFrais = fraisFilter === "ALL" || p.type_frais === fraisFilter;
    const matchesMethode = methodeFilter === "ALL" || p.methode === methodeFilter;
    const matchesStatut = statutFilter === "ALL" || p.statut === statutFilter;
    const matchesAnnee = !anneeFilter || p.annee_scolaire === anneeFilter;

    return matchesSearch && matchesFrais && matchesMethode && matchesStatut && matchesAnnee;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="paiements-management-console">
      {/* Dynamic Finance Dashboard header */}
      <div className="bg-gradient-to-br from-teal-900 to-sky-955 p-6 rounded-2xl text-white shadow-md border border-teal-850 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <span className="text-[10px] bg-teal-500/30 text-teal-250 border border-teal-500/40 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
            Établissement & Finances
          </span>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-400" />
            Module de Paiements & Trésorerie
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Suivi académique de la scolarité par élève, émission de quittances PDF imprimables, validation d'écritures comptables mobiles et état de recouvrement annuel des caisses.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="flex flex-col gap-1 min-w-[190px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-teal-300 font-extrabold uppercase tracking-wider">Année de Consultation</span>
              <button 
                onClick={() => setShowAddAnneeInline(!showAddAnneeInline)}
                className="text-[10px] text-teal-200 font-extrabold hover:text-white transition flex items-center gap-0.5"
                title="Ajouter une année scolaire"
              >
                {showAddAnneeInline ? "Annuler" : "＋ Ajouter une année"}
              </button>
            </div>
            {showAddAnneeInline ? (
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={newAnneeInput}
                  onChange={e => setNewAnneeInput(e.target.value)}
                  placeholder="Ex: 2026-2027"
                  className="p-1.5 px-2.5 bg-slate-900/90 border border-teal-500/60 text-xs font-bold text-white rounded-xl focus:outline-none w-28 placeholder:text-gray-500"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const trimmed = newAnneeInput.trim();
                      if (trimmed) {
                        onAddAnneeScolaire(trimmed);
                        setAnneeFilter(trimmed);
                        setNewAnneeInput("");
                        setShowAddAnneeInline(false);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = newAnneeInput.trim();
                    if (!trimmed) return;
                    if (trimmed.length < 4) {
                      alert("Veuillez saisir un format valide (Ex: 2026-2027).");
                      return;
                    }
                    onAddAnneeScolaire(trimmed);
                    setAnneeFilter(trimmed);
                    setNewAnneeInput("");
                    setShowAddAnneeInline(false);
                  }}
                  className="p-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] cursor-pointer"
                >
                  OK
                </button>
              </div>
            ) : (
              <select
                value={anneeFilter}
                onChange={e => setAnneeFilter(e.target.value)}
                className="p-2 py-2 bg-slate-900/80 text-white font-extrabold text-xs rounded-xl border border-teal-700/60 focus:outline-none cursor-pointer"
              >
                {uniqueAnneeScolaires.map(yr => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white font-semibold">
                    Année Scolaire {yr}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={openAddModal}
            className="bg-white hover:bg-slate-50 text-teal-900 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-slate-200 mt-2 sm:mt-0 font-sans"
          >
            <Plus className="w-4 h-4 text-teal-700 stroke-[3px]" />
            Enregistrer un Versement
          </button>
        </div>
      </div>

      {/* Configuration globale du montant de la scolarité annuelle */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/60 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <h3 className="font-extrabold text-teal-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>⚙️ Configuration de la Scolarité Annuelle</span>
            <span className="bg-teal-200/50 text-teal-850 px-2 py-0.5 rounded text-[10px] font-mono font-bold leading-none">
              Configurable
            </span>
          </h3>
          <p className="text-[11px] text-teal-800">
            Fixez le montant forfaitaire annuel exigé de référence par élève pour le calcul de l'état de recouvrement global et des restes à payer.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditingTuition ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="number"
                  value={tuitionValue}
                  onChange={e => setTuitionValue(e.target.value)}
                  className="pl-3 pr-10 py-1.5 bg-white border border-teal-350 rounded-lg text-xs font-extrabold text-teal-950 focus:outline-none focus:ring-1 focus:ring-teal-600 w-36"
                  placeholder="Ex: 1500000"
                  autoFocus
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] font-bold text-teal-600 font-mono">CFA</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const amt = parseInt(tuitionValue, 10);
                  if (!isNaN(amt) && amt > 0) {
                    onUpdateScolariteAnnuelle(amt);
                    setIsEditingTuition(false);
                  }
                }}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-850 text-white font-bold text-xs rounded-lg shadow-sm transition cursor-pointer"
              >
                Sauver
              </button>
              <button
                type="button"
                onClick={() => {
                  setTuitionValue(String(scolariteAnnuelle));
                  setIsEditingTuition(false);
                }}
                className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 font-semibold">
              <span className="text-sm font-black text-teal-950 bg-teal-100/75 border border-teal-250 px-3 py-1 rounded-lg font-mono">
                {formatCFA(scolariteAnnuelle)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTuitionValue(String(scolariteAnnuelle));
                  setIsEditingTuition(true);
                }}
                className="px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-900 border border-teal-250 font-bold text-xs rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
              >
                ✏️ Modifier
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analytical KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Encaissements Validés</span>
            <strong className="text-lg text-slate-900 font-extrabold block tracking-tight mt-0.5">{formatCFA(totalReceived)}</strong>
            <span className="text-[9px] text-emerald-600 font-semibold block mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-600" /> Versements approuvés
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Verrements en Attente</span>
            <strong className="text-lg text-slate-900 font-extrabold block tracking-tight mt-0.5">{formatCFA(totalPending)}</strong>
            <span className="text-[9px] text-amber-600 font-semibold block mt-1 flex items-center gap-0.5 animate-pulse">
              ● En attente de validation
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Remboursements Comptables</span>
            <strong className="text-lg text-slate-900 font-extrabold block tracking-tight mt-0.5">{formatCFA(totalRefunded)}</strong>
            <span className="text-[9px] text-slate-500 font-medium block mt-1">
              Frais restitués ou annulés
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
            <BadgePercent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Taux de Recouvrement Global</span>
            <strong className="text-lg text-slate-900 font-extrabold block tracking-tight mt-0.5">
              {Math.round(((totalReceived) / (etudiants.length * scolariteAnnuelle || 1)) * 100)} %
            </strong>
            <span className="text-[9px] text-blue-600 font-semibold block mt-1">
              Sur {etudiants.length} élèves inscrits ({anneeFilter})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols width on large screens): Search, filter controls & transaction logs listing */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Filtering bar panel */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Chercher par élève (Nom/Matricule) ou reçu..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 select-text"
                />
              </div>

              {/* Reset filter button */}
              {(searchTerm || fraisFilter !== "ALL" || methodeFilter !== "ALL" || statutFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFraisFilter("ALL");
                    setMethodeFilter("ALL");
                    setStatutFilter("ALL");
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtres :</span>
              </div>

              {/* Type Frais selector */}
              <select
                value={fraisFilter}
                onChange={e => setFraisFilter(e.target.value)}
                className="p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Tous les frais</option>
                <option value="Scolarité">Scolarité seulement</option>
                <option value="Inscription">Inscription seulement</option>
                <option value="Examen">Frais d'Examen</option>
                <option value="Autre">Autres frais</option>
              </select>

              {/* Methode selector */}
              <select
                value={methodeFilter}
                onChange={e => setMethodeFilter(e.target.value)}
                className="p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Toutes les méthodes</option>
                <option value="Carte">Carte Bancaire</option>
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
                <option value="Virement">Virement bancaire</option>
                <option value="Mobile Money">Mobile Money (Orange/MTN/Wave)</option>
              </select>

              {/* Statut selector */}
              <select
                value={statutFilter}
                onChange={e => setStatutFilter(e.target.value)}
                className="p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="Payé">Payé</option>
                <option value="En attente">En attente</option>
                <option value="Remboursé">Remboursé</option>
              </select>
            </div>
          </div>

          {/* Transaction logs list */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-150 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>📓 Grand Livre de Caisse Scolaire</span>
                <span className="bg-slate-100 text-slate-700 rounded-full px-2.5 py-0.5 text-[10px] font-mono">
                  {filteredPaiements.length} enregistrements
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider select-none">
                    <th className="py-3 px-4">N° Reçu</th>
                    <th className="py-3 px-4">Élève</th>
                    <th className="py-3 px-4">Rubrique / Frais</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4">Date & Canal</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPaiements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 px-4 text-center text-gray-500 italic">
                        Aucun bordereau de versement ne correspond à vos filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredPaiements.map(p => {
                      const student = etudiants.find(e => e.id === p.etudiant_id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 flex items-center gap-0.5 whitespace-nowrap">
                            <span className="text-teal-600">■</span> {p.recu_numero}
                          </td>
                          <td className="py-3 px-4">
                            {student ? (
                              <div className="font-semibold text-slate-800">
                                {student.nom} {student.prenom}
                                <span className="block font-mono text-[9px] text-slate-400 font-bold uppercase mt-0.5">{student.matricule}</span>
                              </div>
                            ) : (
                              <span className="text-red-500">Étudiant supprimé ({p.etudiant_id})</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-blue-200">
                              {p.type_frais}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatCFA(p.montant)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{p.date_paiement}</div>
                            <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">{p.methode}</span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 text-[10px] rounded-lg border leading-none ${statusColors[p.statut]}`}>
                              {p.statut}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Approvals toggle */}
                              {p.statut === 'En attente' && (
                                <button
                                  onClick={() => onUpdatePaiementStatus(p.id, 'Payé')}
                                  title="Valider le paiement"
                                  className="p-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              
                              {/* View Receipt Button */}
                              <button
                                onClick={() => setSelectedReceipt(p)}
                                title="Aperçu & Quittance de caisse"
                                className="p-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded transition cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Receipt Button */}
                              <button
                                onClick={() => {
                                  onDeletePaiement(p.id);
                                }}
                                title="Supprimer définitivement"
                                className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

        {/* Right Column: Students Tuition Tracker coverage progress list */}
        <div className="xl:col-span-1 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-4 h-fit max-h-[800px] overflow-y-auto">
          <div className="flex items-center gap-1.5 border-b border-gray-150 pb-3">
            <DollarSign className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">État de recouvrement par élève</h3>
          </div>

          <div className="space-y-4">
            {etudiants.map(student => {
              // Calculate total paid by this student for this academic year
              const studentPayments = paiements.filter(p => p.etudiant_id === student.id && p.statut === 'Payé' && p.annee_scolaire === anneeFilter);
              const totalStudentPaid = studentPayments.reduce((sum, p) => sum + p.montant, 0);
              
              const pctCoverage = Math.min(100, Math.round((totalStudentPaid / scolariteAnnuelle) * 100));
              const remainingDues = scolariteAnnuelle - totalStudentPaid;

              return (
                <div key={student.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <strong className="text-slate-900 font-extrabold text-xs block truncate leading-snug">
                        {student.nom} {student.prenom}
                      </strong>
                      <span className="font-mono text-[9px] text-slate-400 block font-bold mt-0.5">{student.matricule}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                      totalStudentPaid >= scolariteAnnuelle 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : totalStudentPaid > 0 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {totalStudentPaid >= scolariteAnnuelle 
                        ? 'Réglé' 
                        : totalStudentPaid > 0 
                        ? 'Partiel' 
                        : 'Impayé'}
                    </span>
                  </div>

                  {/* Coverage indicators */}
                  <div className="space-y-1 text-[11px] font-medium text-slate-600">
                    <div className="flex justify-between">
                      <span>Total Validé :</span>
                      <strong className="text-slate-800 font-bold">{formatCFA(totalStudentPaid)} / {formatCFA(scolariteAnnuelle)}</strong>
                    </div>

                    {remainingDues > 0 ? (
                      <div className="flex justify-between text-[10px] text-rose-600 font-bold">
                        <span>Reste à percevoir :</span>
                        <span>{formatCFA(remainingDues)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-[10px] text-emerald-600 font-bold">
                        <span>Solde apuré :</span>
                        <span>0 CFA</span>
                      </div>
                    )}
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="relative w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        pctCoverage >= 100 ? 'bg-emerald-500' : pctCoverage > 50 ? 'bg-blue-500' : 'bg-amber-500'
                      }`} 
                      style={{ width: `${pctCoverage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODAL: REGISTER VERSEMENT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-zoom-in">
            <div className="bg-slate-900 px-5 py-3.5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-400 stroke-[2.5]" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">Enregistrer un Versement Élève</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Form Body Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-semibold scrollbar-thin">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 space-y-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 relative">
                    <div className="flex justify-between items-center text-slate-700">
                      <label className="font-extrabold flex items-center gap-1">
                        <span>👤 Choisir l'Élève Payeur</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold">
                        Saisie filtre activée
                      </span>
                    </div>

                    {/* Saisie textuelle de recherche avec bouton de bascule */}
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={modalSearchQuery}
                          onFocus={() => setShowModalDropdown(true)}
                          onChange={e => {
                            const val = e.target.value;
                            setModalSearchQuery(val);
                            setShowModalDropdown(true);
                            
                            // Auto-select the first match if any, otherwise reset if query is empty
                            const lower = val.toLowerCase().trim();
                            if (lower === "") {
                              setSelectedEtudiantId(0);
                            } else {
                              const matches = etudiants.filter(x => 
                                x.nom.toLowerCase().includes(lower) || 
                                x.prenom.toLowerCase().includes(lower) || 
                                x.matricule.toLowerCase().includes(lower)
                              );
                              if (matches.length > 0) {
                                setSelectedEtudiantId(matches[0].id);
                              } else {
                                setSelectedEtudiantId(0);
                              }
                            }
                          }}
                          placeholder="Saisissez son nom, prénom, ou matricule..."
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 select-text"
                        />
                        {modalSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalSearchQuery("");
                              setSelectedEtudiantId(0);
                              setShowModalDropdown(true);
                            }}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Toggle explicite pour afficher/masquer la liste */}
                      <button
                        type="button"
                        onClick={() => setShowModalDropdown(!showModalDropdown)}
                        className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-250 rounded-lg text-slate-600 transition flex items-center gap-1 font-bold shadow-sm cursor-pointer"
                        title={showModalDropdown ? "Masquer la liste" : "Afficher la liste"}
                      >
                        <span className="text-[10px] hidden sm:inline">Liste</span>
                        {showModalDropdown ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>

                    {/* Liste déroulante masquée par défaut (Floating Suggestions Panel) */}
                    {showModalDropdown && (
                      <div className="absolute left-3.5 right-3.5 mt-1 bg-white border border-slate-250 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {(() => {
                          const filtered = etudiants.filter(etu => {
                            const lower = modalSearchQuery.toLowerCase();
                            return etu.nom.toLowerCase().includes(lower) || 
                                   etu.prenom.toLowerCase().includes(lower) || 
                                   etu.matricule.toLowerCase().includes(lower);
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="p-3 text-center text-slate-400 italic">
                                Aucun élève trouvé
                              </div>
                            );
                          }

                          return filtered.map(etu => {
                            const isSelected = etu.id === selectedEtudiantId;
                            return (
                              <button
                                key={etu.id}
                                type="button"
                                onClick={() => {
                                  setSelectedEtudiantId(etu.id);
                                  setModalSearchQuery(`${etu.nom.toUpperCase()} ${etu.prenom} (${etu.matricule})`);
                                  setShowModalDropdown(false);
                                }}
                                className={`w-full text-left p-2.5 text-xs hover:bg-slate-50 transition flex items-center justify-between font-bold ${
                                  isSelected ? 'bg-teal-50 text-teal-950' : 'text-slate-700'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className={isSelected ? 'text-teal-700 font-extrabold' : 'text-slate-900'}>
                                    {etu.nom.toUpperCase()} {etu.prenom}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    Matricule : {etu.matricule}
                                  </span>
                                </div>
                                {isSelected && (
                                  <span className="text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 leading-none shrink-0">
                                    Sélectionné
                                  </span>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}

                    {/* Mini fiche récapitulative de l'élève choisi */}
                    {(() => {
                      const selEtu = etudiants.find(x => x.id === selectedEtudiantId);
                      if (!selEtu) {
                        return (
                          <div className="p-2 bg-amber-50/60 border border-amber-200 rounded-lg text-[10.5px] text-amber-800 font-bold mt-1.5 flex items-center gap-1.5">
                            <span>⚠️ Aucun élève sélectionné. Saisissez son nom ci-dessus ou cliquez sur "Liste" pour le repérer.</span>
                          </div>
                        );
                      }
                      return (
                        <div className="p-2 bg-teal-50/50 border border-teal-200/60 rounded-lg flex items-center justify-between text-[11px] text-slate-700 font-bold mt-1.5">
                          <span>
                            🌍 Sélectionné : <strong className="text-teal-800 uppercase">{selEtu.nom} {selEtu.prenom}</strong> ({selEtu.matricule})
                          </span>
                          <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded font-extrabold font-mono leading-none shrink-0">
                            Confirmé
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Numéro du Reçu <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={recuNumero}
                      onChange={e => setRecuNumero(e.target.value)}
                      placeholder="REC-YYYY-XXX"
                      className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600 font-mono font-bold select-text"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Montant Perçu (CFA) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={montant}
                      onChange={e => setMontant(Number(e.target.value))}
                      placeholder="Montant total perçu"
                      className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600 font-mono font-bold select-text"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Date du Versement <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={datePaiement}
                      onChange={e => setDatePaiement(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Rubrique / Type de Frais</label>
                    <select
                      value={typeFrais}
                      onChange={e => setTypeFrais(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="Scolarité">Scolarité</option>
                      <option value="Inscription">Inscription</option>
                      <option value="Examen">Examen / Evaluation</option>
                      <option value="Autre">Autre Frais</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Canal de Règlement</label>
                    <select
                      value={methode}
                      onChange={e => setMethode(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="Mobile Money">Mobile Money (Orange/Wave...)</option>
                      <option value="Espèces">Espèces (Guichet)</option>
                      <option value="Chèque">Chèque d'Établissement</option>
                      <option value="Virement">Virement Bancaire (Compte principal)</option>
                      <option value="Carte">Carte Bancaire / En ligne</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Statut initial</label>
                    <select
                      value={statut}
                      onChange={e => setStatut(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="Payé">Payé (Encaissé)</option>
                      <option value="En attente">En attente de validation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Année Scolaire <span className="text-red-500">*</span></label>
                    <select
                      value={modalAnneeScolaire}
                      onChange={e => setModalAnneeScolaire(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none font-bold text-teal-950"
                    >
                      {uniqueAnneeScolaires.map(yr => (
                        <option key={yr} value={yr}>Année Académique {yr}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-500 block mb-1">Remarques / Notes complémentaires</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Ex: Premier versement du premier trimestre..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none resize-none h-16 select-text"
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Non-Scrolling Button bar */}
              <div className="flex gap-3 justify-end px-5 py-3.5 bg-slate-50 border-t border-slate-150 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-250 text-slate-600 rounded-xl font-bold transition cursor-pointer select-none"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selectedEtudiantId}
                  className={`px-5 py-2 rounded-xl font-extrabold uppercase shadow-sm transition flex items-center justify-center text-xs select-none ${
                    !selectedEtudiantId
                      ? 'bg-slate-250 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                      : 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-md'
                  }`}
                >
                  Valider l'Enregistrement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT RECEIPT PREVIEW (QUITTANCE OFFICIELE) */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs select-text">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-zoom-in flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="bg-slate-900 px-4 sm:px-5 py-3 text-white flex justify-between items-center shrink-0">
              <span className="font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase font-mono">Quittance de caisse</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => window.print()}
                  className="p-1 px-3 bg-teal-600 text-white font-extrabold uppercase hover:bg-teal-500 rounded text-[9px] sm:text-[10px] shadow transition cursor-pointer flex items-center gap-1 h-7"
                >
                  <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> imprimer
                </button>
                <button 
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt template to print */}
            <div className="p-3 sm:p-6 overflow-y-auto bg-white flex-grow font-serif printable-invoice scrollbar-thin">
              <div className="border border-slate-800 sm:border-[3px] sm:border-slate-900 p-3 sm:p-6 space-y-4 sm:space-y-6">
                
                {/* Header of the school */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-400 sm:border-b-2 sm:border-slate-900 pb-3 sm:pb-4">
                  <div className="text-left font-sans space-y-0.5">
                    <h2 className="text-sm sm:text-md font-black tracking-tight text-slate-950 uppercase">GROUPE SCOLAIRE ACADÉMIQUE</h2>
                    <p className="text-[8.5px] sm:text-[9px] text-slate-500 font-bold">République du Mali / Service de Trésorerie Centrale</p>
                    <p className="text-[8px] text-slate-400 font-medium">B.P. 1204 - Tel: +223 20 22 45 67 - Bamako</p>
                  </div>
                  <div className="text-left sm:text-right font-sans w-full sm:w-auto">
                    <span className="bg-slate-950 text-white px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[11px] font-mono tracking-widest font-extrabold uppercase inline-block">
                      QUITTANCE Comptable
                    </span>
                    <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-800 mt-1">N° : {selectedReceipt.recu_numero}</p>
                    <p className="text-[8.5px] sm:text-[9px] text-slate-500 mt-0.5">Émis le : {selectedReceipt.date_paiement}</p>
                  </div>
                </div>

                {/* Subtitle */}
                <p className="text-center italic text-[10px] sm:text-xs text-slate-600 uppercase tracking-wider sm:tracking-widest font-bold">
                  BORDEREAU D'ENCAISSEMENT COMPTABLE & DE SCOLARITÉ
                </p>

                {/* Bill content */}
                <div className="space-y-3 sm:space-y-3.5 text-xs text-slate-900 leading-snug font-sans">
                  
                  {/* Student details */}
                  <div className="bg-slate-50 border border-slate-300 p-2.5 sm:p-3 rounded space-y-1">
                    <div className="flex flex-col sm:flex-row">
                      <span className="w-full sm:w-24 text-slate-400">Élève Payeur :</span>
                      <strong className="text-slate-950 font-bold">
                        {(() => {
                          const s = etudiants.find(e => e.id === selectedReceipt.etudiant_id);
                          return s ? `${s.nom.toUpperCase()} ${s.prenom}` : "N/A";
                        })()}
                      </strong>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <span className="w-full sm:w-24 text-slate-400">Matricule :</span>
                      <strong className="text-slate-950 font-mono font-bold">
                        {(() => {
                          const s = etudiants.find(e => e.id === selectedReceipt.etudiant_id);
                          return s ? s.matricule : "N/A";
                        })()}
                      </strong>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <span className="w-full sm:w-24 text-slate-400">Classe / Cycle :</span>
                      <strong className="text-slate-950 font-semibold font-mono">
                        {(() => {
                          const s = etudiants.find(e => e.id === selectedReceipt.etudiant_id);
                          return s ? s.email : "N/A";
                        })()}
                      </strong>
                    </div>
                  </div>

                  {/* Pricing table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-sans border-t-2 border-b-2 border-slate-900 mt-4 leading-normal min-w-[380px]">
                      <thead>
                        <tr className="border-b border-slate-350 text-slate-600 text-[9px] sm:text-[10px] font-extrabold uppercase">
                          <th className="py-2 text-left">Description de la Rubrique</th>
                          <th className="py-2 text-center">Canal de Règlement</th>
                          <th className="py-2 text-right">Montant Perçu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-2 px-1">
                            <strong className="text-slate-950 block">{selectedReceipt.type_frais}</strong>
                            <span className="text-[10px] text-slate-500 italic block mt-0.5">
                              {selectedReceipt.notes || "Sans remarques particulières"}
                            </span>
                          </td>
                          <td className="py-2 text-center font-mono font-medium text-slate-800">
                            {selectedReceipt.methode}
                          </td>
                          <td className="py-2 text-right font-mono font-bold text-slate-950 text-xs sm:text-sm">
                            {formatCFA(selectedReceipt.montant)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Total summary */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-3 mt-4 gap-2">
                    <div className="text-[10px] font-sans text-slate-500 font-bold uppercase tracking-wider">
                      Statut d'écriture : <span className="bg-emerald-150 text-emerald-905 px-2 py-0.5 rounded font-black font-mono">{selectedReceipt.statut}</span>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <span className="text-[9px] text-gray-400 uppercase font-extrabold tracking-wider block">MONTANT TOTAL RÉGLÉ :</span>
                      <strong className="text-md sm:text-lg font-mono font-black text-slate-950 tracking-tight">{formatCFA(selectedReceipt.montant)}</strong>
                    </div>
                  </div>

                  {/* Decisive footer stamps */}
                  <div className="grid grid-cols-2 text-center text-[9px] sm:text-[10px] pt-4 font-sans leading-tight gap-4">
                    <div>
                      <span className="text-slate-400 font-extrabold uppercase block tracking-wider">L'agent Comptable Trésorier</span>
                      <span className="text-[8px] sm:text-[9px] text-slate-300 font-extrabold block mt-6 sm:mt-8 italic">(Signature & Cachet)</span>
                      <div className="mt-2 border-b border-gray-400 w-16 sm:w-24 mx-auto"></div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-extrabold uppercase block tracking-wider">L'Établissement D'Études</span>
                      <span className="text-[8px] sm:text-[9px] text-slate-300 font-extrabold block mt-6 sm:mt-8 italic">(Cachet de Validation)</span>
                      <div className="mt-2 border-b border-gray-400 w-16 sm:w-24 mx-auto"></div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            <div className="bg-slate-50 px-4 sm:px-5 py-3 border-t border-slate-200 text-center shrink-0 flex gap-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-full py-2 bg-slate-200 hover:bg-slate-250 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer select-none"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
