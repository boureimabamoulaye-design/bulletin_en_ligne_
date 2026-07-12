import React, { useState, useEffect } from 'react';
import { Server, Database, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, Terminal, HelpCircle, Link2, Wifi, WifiOff } from 'lucide-react';
import { Filiere, Matiere, Classe, Semestre, Etudiant, Cours, Note, AutorisationFiliere, Paiement, TrashItem } from '../types';

interface WampConnectorProps {
  adminTheme: 'sombre-or' | 'clair-pro';
  
  // Current states
  filieres: Filiere[];
  matieres: Matiere[];
  classes: Classe[];
  semestres: Semestre[];
  etudiants: Etudiant[];
  cours: Cours[];
  notes: Note[];
  autorisations: AutorisationFiliere[];
  paiements: Paiement[];
  trash: TrashItem[];

  // State setters to replace with loaded WAMP data
  setFilieres: React.Dispatch<React.SetStateAction<Filiere[]>>;
  setMatieres: React.Dispatch<React.SetStateAction<Matiere[]>>;
  setClasses: React.Dispatch<React.SetStateAction<Classe[]>>;
  setSemestres: React.Dispatch<React.SetStateAction<Semestre[]>>;
  setEtudiants: React.Dispatch<React.SetStateAction<Etudiant[]>>;
  setCours: React.Dispatch<React.SetStateAction<Cours[]>>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setAutorisations: React.Dispatch<React.SetStateAction<AutorisationFiliere[]>>;
  setPaiements: React.Dispatch<React.SetStateAction<Paiement[]>>;
  setTrash: React.Dispatch<React.SetStateAction<TrashItem[]>>;
  
  // Log message helper
  addLogMessage?: (msg: string) => void;
}

export default function WampConnector({
  adminTheme,
  filieres,
  matieres,
  classes,
  semestres,
  etudiants,
  cours,
  notes,
  autorisations,
  paiements,
  trash,
  setFilieres,
  setMatieres,
  setClasses,
  setSemestres,
  setEtudiants,
  setCours,
  setNotes,
  setAutorisations,
  setPaiements,
  setTrash
}: WampConnectorProps) {
  const [apiUrl, setApiUrl] = useState<string>(() => {
    return localStorage.getItem('school_wamp_url') || 'http://localhost/school_php/api.php';
  });
  
  const [isWampActive, setIsWampActive] = useState<boolean>(() => {
    return localStorage.getItem('school_wamp_active') === 'true';
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString();
    setSyncLogs(prev => [`[${time}] ${text}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    localStorage.setItem('school_wamp_url', apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    localStorage.setItem('school_wamp_active', String(isWampActive));
  }, [isWampActive]);

  // Test ping connection to local WAMP API
  const handleTestConnection = async (showLogs = true) => {
    setConnectionStatus('checking');
    setErrorMessage('');
    setSuccessMessage('');
    if (showLogs) addLog(`Tentative de connexion à WAMP sur ${apiUrl}...`);

    try {
      const response = await fetch(`${apiUrl}?action=ping`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Code HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        setConnectionStatus('connected');
        setSuccessMessage(data.message || 'Connecté à MySQL avec succès !');
        if (showLogs) {
          addLog(`✅ WAMP Connecté ! Serveur MySQL actif. Base: ${data.database || 'gestion_scolaire'}`);
        }
        return true;
      } else {
        throw new Error(data.message || 'Réponse inattendue de l\'API');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      const errMsg = err.message || "Erreur de réseau";
      setErrorMessage(`Connexion impossible. Assurez-vous que WAMP est démarré et que le script PHP est placé dans le dossier www.`);
      if (showLogs) {
        addLog(`❌ Échec de connexion : ${errMsg}. Vérifiez que Apache/MySQL sont démarrés dans WAMP.`);
      }
      return false;
    }
  };

  // Import data from WAMP MySQL to React App
  const handleImportData = async () => {
    setIsSyncing(true);
    addLog("Téléchargement des données depuis la base de données WAMP (MySQL)...");
    
    try {
      const response = await fetch(`${apiUrl}?action=get`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const resData = await response.json();
      if (resData.status === 'success' && resData.data) {
        const d = resData.data;
        
        // Update all local React states
        if (d.filieres) setFilieres(d.filieres);
        if (d.matieres) setMatieres(d.matieres);
        if (d.classes) setClasses(d.classes);
        if (d.semestres) setSemestres(d.semestres);
        if (d.etudiants) setEtudiants(d.etudiants);
        if (d.cours) setCours(d.cours);
        if (d.notes) setNotes(d.notes);
        if (d.autorisations) setAutorisations(d.autorisations);
        if (d.paiements) setPaiements(d.paiements);
        if (d.trash) setTrash(d.trash);

        addLog(`✅ IMPORTATION RÉUSSIE !`);
        addLog(`• ${d.filieres?.length || 0} filières, ${d.matieres?.length || 0} matières`);
        addLog(`• ${d.etudiants?.length || 0} étudiants, ${d.notes?.length || 0} notes chargées.`);
        setSuccessMessage("Données MySQL chargées avec succès dans l'interface !");
      } else {
        throw new Error(resData.message || "Format de données invalide");
      }
    } catch (err: any) {
      addLog(`❌ Erreur d'importation : ${err.message}`);
      setErrorMessage(`Erreur lors de l'importation : ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Export current local React state to WAMP MySQL database
  const handleExportData = async () => {
    setIsSyncing(true);
    addLog("Envoi de l'intégralité des données locales vers MySQL...");

    const payload = {
      filieres,
      matieres,
      classes,
      semestres,
      etudiants,
      cours,
      notes,
      autorisations,
      paiements,
      trash
    };

    try {
      const response = await fetch(`${apiUrl}?action=save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const resData = await response.json();
      if (resData.status === 'success') {
        addLog(`✅ EXPORTATION RÉUSSIE ! Toutes vos données locales ont été enregistrées dans MySQL.`);
        setSuccessMessage("Données exportées et enregistrées avec succès dans WAMP MySQL !");
      } else {
        throw new Error(resData.message || "Erreur de sauvegarde");
      }
    } catch (err: any) {
      addLog(`❌ Erreur d'exportation : ${err.message}`);
      setErrorMessage(`Erreur d'exportation : ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto test connection on mount if active
  useEffect(() => {
    if (isWampActive) {
      handleTestConnection(false);
    }
  }, []);

  return (
    <div className="space-y-6 animate-fade-in" id="wamp-connector-container">
      
      {/* Dynamic Header */}
      <div className={`p-6 rounded-xl border transition shadow-sm ${
        adminTheme === 'sombre-or' 
          ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 border-amber-500/20' 
          : 'bg-blue-50 border-blue-150'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              adminTheme === 'sombre-or' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-100 text-blue-800'
            }`}>
              <Server className="w-6 h-6 shrink-0" />
            </div>
            <div className="space-y-1">
              <h2 className={`text-base font-black uppercase tracking-tight ${
                adminTheme === 'sombre-or' ? 'text-amber-400' : 'text-blue-900'
              }`}>
                Connexion MySQL direct (WAMP Server)
              </h2>
              <p className={`text-xs ${adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-slate-700'}`}>
                Connectez directement ce site React à votre base de données MySQL locale gérée par WAMP ou XAMPP !
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 animate-pulse" />
                  WAMP EN LIGNE
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  HORS-LIGNE (LOCAL)
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Connection Setup / Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-6 rounded-xl border shadow-sm space-y-5 ${
            adminTheme === 'sombre-or' ? 'bg-slate-900 border-amber-500/15' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`font-bold text-sm flex items-center gap-2 border-b pb-2 ${
              adminTheme === 'sombre-or' ? 'text-amber-400 border-amber-500/10' : 'text-slate-950 border-gray-150'
            }`}>
              <Link2 className="w-4 h-4 text-amber-500" />
              Paramètres de l'API WAMP
            </h3>

            {/* Input field */}
            <div className="space-y-2">
              <label className={`text-xs font-bold block ${adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-slate-700'}`}>
                URL de votre API de Synchronisation PHP :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost/school_php/api.php"
                  className={`flex-grow font-mono text-xs p-3 rounded-lg border outline-none transition focus:ring-1 ${
                    adminTheme === 'sombre-or' 
                      ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-amber-500 focus:border-amber-500' 
                      : 'bg-gray-50 border-gray-300 text-slate-900 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <button
                  onClick={() => handleTestConnection(true)}
                  disabled={connectionStatus === 'checking'}
                  className={`px-4 text-xs font-bold rounded-lg border cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
                    adminTheme === 'sombre-or'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50'
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {connectionStatus === 'checking' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Tester'
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Par défaut, l'API est hébergée sur <code className="bg-slate-950/20 p-0.5 rounded font-bold">http://localhost/school_php/api.php</code>.
              </p>
            </div>

            {/* Connection messages */}
            {errorMessage && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2.5 items-start">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex gap-2.5 items-start">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* SYNC ACTIONS */}
            <div className="border-t border-slate-800 pt-5 space-y-4">
              <h4 className={`text-xs font-black uppercase tracking-wider ${adminTheme === 'sombre-or' ? 'text-amber-450' : 'text-slate-800'}`}>
                Synchronisation Manuelle MySQL
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Export Card */}
                <button
                  onClick={handleExportData}
                  disabled={isSyncing || connectionStatus !== 'connected'}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                    connectionStatus !== 'connected'
                      ? 'opacity-50 cursor-not-allowed bg-slate-950/20 border-slate-800'
                      : 'hover:border-amber-500/40 hover:-translate-y-0.5 ' + (adminTheme === 'sombre-or' ? 'bg-slate-950/40 border-slate-800' : 'bg-gray-50 border-gray-200')
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                      <ArrowUpRight className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-amber-500">CLIENT ➔ WAMP</span>
                  </div>
                  <strong className={`block text-xs ${adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-900'}`}>Exporter vers WAMP MySQL</strong>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Écrase et met à jour la base de données WAMP locale avec toutes les données actuellement affichées sur votre site.
                  </p>
                </button>

                {/* Import Card */}
                <button
                  onClick={handleImportData}
                  disabled={isSyncing || connectionStatus !== 'connected'}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                    connectionStatus !== 'connected'
                      ? 'opacity-50 cursor-not-allowed bg-slate-950/20 border-slate-800'
                      : 'hover:border-indigo-500/40 hover:-translate-y-0.5 ' + (adminTheme === 'sombre-or' ? 'bg-slate-950/40 border-slate-800' : 'bg-gray-50 border-gray-200')
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                      <ArrowDownRight className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-indigo-500">WAMP ➔ CLIENT</span>
                  </div>
                  <strong className={`block text-xs ${adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-900'}`}>Importer depuis WAMP MySQL</strong>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Remplace toutes les données actuelles de l'application par celles stockées dans les tables MySQL de votre WAMP.
                  </p>
                </button>

              </div>
            </div>

            {/* Toggle Switch to activate WAMP permanent mode */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              adminTheme === 'sombre-or' ? 'bg-[#0f1322] border-amber-500/10' : 'bg-indigo-50/50 border-indigo-100'
            }`}>
              <div className="space-y-0.5">
                <strong className={`text-xs block ${adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-900'}`}>
                  {isWampActive ? 'Mode WAMP Direct Actif' : 'Activer le mode de stockage direct WAMP'}
                </strong>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Lorsque ce mode est activé, l'application tentera de lire et d'écrire en temps réel directement dans MySQL via WAMP à chaque action !
                </p>
              </div>
              <div>
                <button
                  onClick={() => {
                    if (!isWampActive && connectionStatus !== 'connected') {
                      alert("Veuillez d'abord tester et réussir la connexion à WAMP.");
                      return;
                    }
                    setIsWampActive(!isWampActive);
                    addLog(isWampActive ? "Mode WAMP désactivé. Retour au stockage LocalStorage." : "Mode WAMP activé. Synchronisation temps réel active !");
                  }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                    isWampActive ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    isWampActive ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Sync Logs Console & Guide (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Instructions and help */}
          <div className={`p-5 rounded-xl border shadow-sm space-y-4 ${
            adminTheme === 'sombre-or' ? 'bg-slate-900 border-amber-500/15 text-white' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`font-bold text-xs flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${
              adminTheme === 'sombre-or' ? 'text-amber-400 border-amber-500/10' : 'text-slate-900 border-gray-100'
            }`}>
              <HelpCircle className="w-4 h-4 text-amber-500" />
              Comment ça marche ?
            </h3>
            
            <div className="space-y-3 text-[11px] leading-relaxed text-slate-400">
              <p>
                1. <strong>Fichier d'API</strong> : Nous avons créé le fichier d'API sécurisé <code className="text-amber-400 bg-slate-950/40 p-0.5 rounded font-mono">school_php/api.php</code>.
              </p>
              <p>
                2. <strong>WAMP www/</strong> : Copiez l'intégralité du dossier <code className="text-amber-400 bg-slate-950/40 p-0.5 rounded font-mono">school_php</code> dans votre répertoire <code className="text-slate-300 font-mono">C:/wamp64/www/</code> de Windows.
              </p>
              <p>
                3. <strong>Base de données</strong> : Importez le fichier SQL <code className="text-slate-300 font-mono">school_php/database/db.sql</code> dans phpMyAdmin sous le nom <code className="text-amber-400 font-bold">gestion_scolaire</code>.
              </p>
              <p>
                4. <strong>Autorisation CORS</strong> : L'API PHP inclut les en-têtes CORS nécessaires pour permettre à l'application web de s'y connecter directement et de sauvegarder vos modifications en temps réel !
              </p>
            </div>
          </div>

          {/* Console / Log view */}
          <div className={`p-5 rounded-xl border shadow-sm space-y-3.5 flex flex-col h-[320px] overflow-hidden ${
            adminTheme === 'sombre-or' ? 'bg-[#060810] border-amber-500/15' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            <div className="flex justify-between items-center shrink-0 border-b border-slate-800 pb-2">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-500" />
                Console de synchronisation
              </h4>
              <button
                onClick={() => setSyncLogs([])}
                className="text-[9px] font-bold text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Effacer
              </button>
            </div>

            <div className="flex-grow overflow-y-auto font-mono text-[10px] space-y-1.5 pr-1 select-text scrollbar-thin">
              {syncLogs.length === 0 ? (
                <div className="text-slate-600 italic h-full flex items-center justify-center">
                  Aucun log de synchronisation.
                </div>
              ) : (
                syncLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed border-b border-slate-950 pb-1 text-slate-300">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
