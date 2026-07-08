import React, { useState } from 'react';
import { 
  INITIAL_FILIERES, 
  INITIAL_CLASSES, 
  INITIAL_SEMESTRES, 
  INITIAL_ADMINS, 
  INITIAL_ETUDIANTS, 
  INITIAL_COURS, 
  INITIAL_NOTES, 
  INITIAL_AUTORISATIONS, 
  INITIAL_ACCES_LOGS,
  INITIAL_MATIERES,
  INITIAL_PAIEMENTS
} from './mockData';
import { Filiere, Matiere, Classe, Semestre, Etudiant, Cours, Note, AutorisationFiliere, HistoriqueAcces, Administrateur, Paiement, TrashItem } from './types';

// Tab components
import AdminDashboard from './components/AdminDashboard';
import EtudiantsTab from './components/EtudiantsTab';
import FilieresTab from './components/FilieresTab';
import SemestresTab from './components/SemestresTab';
import CoursTab from './components/CoursTab';
import NotesTab from './components/NotesTab';
import BulletinsTab from './components/BulletinsTab';
import AutorisationsTab from './components/AutorisationsTab';
import PaiementsTab from './components/PaiementsTab';
import CorbeilleTab from './components/CorbeilleTab';
import StudentPortal from './components/StudentPortal';

// Icons
import { 
  Users, GraduationCap, Calendar, FileText, Award, ShieldCheck, 
  BookOpen, LogOut, Terminal, LayoutDashboard, Key, Shield, Info,
  ArrowLeft, Menu, X, CreditCard, DollarSign, Trash2, Pencil, Sun, Moon,
  Lock, ShieldAlert, Eye, EyeOff
} from 'lucide-react';

const shortenSemester = (name: string): string => {
  if (!name) return "";
  return name.replace(/semestre\s*/i, "S");
};

export default function App() {
  // --- REAL-TIME REACT STATE ENGINE WITH LOCALSTORAGE PERSISTENCE ---
  const [filieres, setFilieres] = useState<Filiere[]>(() => {
    const saved = localStorage.getItem('school_filieres');
    return saved ? JSON.parse(saved) : INITIAL_FILIERES;
  });
  const [matieres, setMatieres] = useState<Matiere[]>(() => {
    const saved = localStorage.getItem('school_matieres');
    return saved ? JSON.parse(saved) : INITIAL_MATIERES;
  });
  const [classes, setClasses] = useState<Classe[]>(() => {
    const saved = localStorage.getItem('school_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });
  const [semestres, setSemestres] = useState<Semestre[]>(() => {
    const saved = localStorage.getItem('school_semestres');
    return saved ? JSON.parse(saved) : INITIAL_SEMESTRES;
  });
  const [etudiants, setEtudiants] = useState<Etudiant[]>(() => {
    const saved = localStorage.getItem('school_etudiants');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 10) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing school_etudiants from localStorage", e);
      }
    }
    return INITIAL_ETUDIANTS;
  });
  const [cours, setCours] = useState<Cours[]>(() => {
    const saved = localStorage.getItem('school_cours');
    return saved ? JSON.parse(saved) : INITIAL_COURS;
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('school_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });
  const [autorisations, setAutorisations] = useState<AutorisationFiliere[]>(() => {
    const saved = localStorage.getItem('school_autorisations');
    return saved ? JSON.parse(saved) : INITIAL_AUTORISATIONS;
  });
  const [logs, setLogs] = useState<HistoriqueAcces[]>(() => {
    const saved = localStorage.getItem('school_acces_logs');
    return saved ? JSON.parse(saved) : INITIAL_ACCES_LOGS;
  });
  const [paiements, setPaiements] = useState<Paiement[]>(() => {
    const saved = localStorage.getItem('school_paiements');
    return saved ? JSON.parse(saved) : INITIAL_PAIEMENTS;
  });
  const [scolariteAnnuelle, setScolariteAnnuelle] = useState<number>(() => {
    const saved = localStorage.getItem('school_scolarite_annuelle');
    return saved ? Number(saved) : 1500000;
  });
  const [anneesScolaires, setAnneesScolaires] = useState<string[]>(() => {
    const saved = localStorage.getItem('school_annees_scolaires');
    return saved ? JSON.parse(saved) : ["2025-2026", "2026-2027", "2024-2025"];
  });
  const [trash, setTrash] = useState<TrashItem[]>(() => {
    const saved = localStorage.getItem('school_trash');
    return saved ? JSON.parse(saved) : [];
  });

  // Auth and Nav states
  const [userRole, setUserRole] = useState<'guest' | 'admin' | 'student'>('guest');
  const [activeAdminName, setActiveAdminName] = useState("");
  const [activeStudent, setActiveStudent] = useState<Etudiant | null>(null);

  const [isPortalLocked, setIsPortalLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem('school_portal_locked');
    return saved ? JSON.parse(saved) : false;
  });

  React.useEffect(() => {
    localStorage.setItem('school_portal_locked', JSON.stringify(isPortalLocked));
  }, [isPortalLocked]);
  
  // Navigation
  const [adminActiveTab, setAdminActiveTab] = useState<string>('dashboard');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [adminsUnlocked, setAdminsUnlocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // Login credentials states
  const [loginRole, setLoginRole] = useState<'admin' | 'student'>('admin');
  const [usernameInput, setUsernameInput] = useState(''); // Default empty as requested
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFiliereId, setSelectedFiliereId] = useState<number | "">(""); // Default empty
  const [loginError, setLoginError] = useState<string>('');

  React.useEffect(() => {
    setLoginError('');
  }, [usernameInput, passwordInput, loginRole, selectedFiliereId]);

  // Multi-admin addition state
  const [adminList, setAdminList] = useState<Administrateur[]>(() => {
    const saved = localStorage.getItem('school_admins');
    let parsed: Administrateur[] = saved ? JSON.parse(saved) : INITIAL_ADMINS;
    if (!parsed.some(a => a.email.toLowerCase().trim() === 'bourekane223@gmail.com')) {
      parsed = [
        ...parsed,
        { id: 9999, nom: "Bourekane Admin", email: "bourekane223@gmail.com", mot_de_passe: "admin123" }
      ];
    }
    return parsed;
  });
  const [newAdminNom, setNewAdminNom] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [showAdminForm, setShowAdminForm] = useState(false);

  // Edit Admin states
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null);
  const [editAdminNom, setEditAdminNom] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminPass, setEditAdminPass] = useState("");

  // Global filters for the Administrator workspace
  const [globalFiliereId, setGlobalFiliereId] = useState<number>(0);
  const [globalSemestreId, setGlobalSemestreId] = useState<number>(INITIAL_SEMESTRES[0]?.id || 0);

  const [globalAnneeScolaire, setGlobalAnneeScolaire] = useState<string>(() => {
    return localStorage.getItem('school_global_annee_scolaire') || "2025-2026";
  });

  const [adminTheme, setAdminTheme] = useState<'sombre-or' | 'clair-pro'>(() => {
    return (localStorage.getItem('school_admin_theme') as 'sombre-or' | 'clair-pro') || 'sombre-or';
  });

  React.useEffect(() => {
    localStorage.setItem('school_global_annee_scolaire', globalAnneeScolaire);
  }, [globalAnneeScolaire]);

  React.useEffect(() => {
    localStorage.setItem('school_admin_theme', adminTheme);
  }, [adminTheme]);

  const toggleAdminTheme = () => {
    setAdminTheme(prev => prev === 'sombre-or' ? 'clair-pro' : 'sombre-or');
  };

  // Filtered lists based on globally selected academic year and filiere filter
  const filteredSemestres = React.useMemo(() => {
    let list = semestres.filter(s => s.annee_scolaire === globalAnneeScolaire);
    if (globalFiliereId > 0) {
      list = list.filter(s => !s.filiere_id || Number(s.filiere_id) === Number(globalFiliereId));
    }
    return list;
  }, [semestres, globalAnneeScolaire, globalFiliereId]);

  const filteredPaiements = React.useMemo(() => {
    return paiements.filter(p => !p.annee_scolaire || p.annee_scolaire === globalAnneeScolaire);
  }, [paiements, globalAnneeScolaire]);

  const filteredNotes = React.useMemo(() => {
    const semIds = semestres.filter(s => s.annee_scolaire === globalAnneeScolaire).map(s => s.id);
    return notes.filter(n => semIds.includes(n.semestre_id));
  }, [notes, semestres, globalAnneeScolaire]);

  const filteredCours = React.useMemo(() => {
    const semIds = semestres.filter(s => s.annee_scolaire === globalAnneeScolaire).map(s => s.id);
    return cours.filter(c => semIds.includes(c.semestre_id));
  }, [cours, semestres, globalAnneeScolaire]);

  // Auto-sync active semester when active filiere or active academic year changes
  React.useEffect(() => {
    if (globalSemestreId === 0) return; // Allow staying on 'Toutes les périodes' (0) if selected

    const filteredByYear = semestres.filter(s => s.annee_scolaire === globalAnneeScolaire);
    const filteredByFiliereAndYear = globalFiliereId > 0 
      ? filteredByYear.filter(s => Number(s.filiere_id) === Number(globalFiliereId))
      : filteredByYear;

    if (filteredByFiliereAndYear.length > 0) {
      if (!filteredByFiliereAndYear.some(s => s.id === globalSemestreId)) {
        setGlobalSemestreId(filteredByFiliereAndYear[0].id);
      }
    } else if (filteredByYear.length > 0 && !filteredByYear.some(s => s.id === globalSemestreId)) {
      setGlobalSemestreId(filteredByYear[0].id);
    }
  }, [globalFiliereId, globalAnneeScolaire, semestres, globalSemestreId]);

  // --- SYNC TO LOCAL STORAGE ---
  React.useEffect(() => {
    localStorage.setItem('school_filieres', JSON.stringify(filieres));
  }, [filieres]);
  React.useEffect(() => {
    localStorage.setItem('school_matieres', JSON.stringify(matieres));
  }, [matieres]);
  React.useEffect(() => {
    localStorage.setItem('school_classes', JSON.stringify(classes));
  }, [classes]);
  React.useEffect(() => {
    localStorage.setItem('school_semestres', JSON.stringify(semestres));
  }, [semestres]);
  React.useEffect(() => {
    localStorage.setItem('school_etudiants', JSON.stringify(etudiants));
  }, [etudiants]);
  React.useEffect(() => {
    localStorage.setItem('school_cours', JSON.stringify(cours));
  }, [cours]);
  React.useEffect(() => {
    localStorage.setItem('school_notes', JSON.stringify(notes));
  }, [notes]);
  React.useEffect(() => {
    localStorage.setItem('school_autorisations', JSON.stringify(autorisations));
  }, [autorisations]);
  React.useEffect(() => {
    localStorage.setItem('school_acces_logs', JSON.stringify(logs));
  }, [logs]);
  React.useEffect(() => {
    localStorage.setItem('school_admins', JSON.stringify(adminList));
  }, [adminList]);
  React.useEffect(() => {
    localStorage.setItem('school_paiements', JSON.stringify(paiements));
  }, [paiements]);
  React.useEffect(() => {
    localStorage.setItem('school_scolarite_annuelle', String(scolariteAnnuelle));
  }, [scolariteAnnuelle]);
  React.useEffect(() => {
    localStorage.setItem('school_annees_scolaires', JSON.stringify(anneesScolaires));
  }, [anneesScolaires]);
  React.useEffect(() => {
    localStorage.setItem('school_trash', JSON.stringify(trash));
  }, [trash]);

  // --- ACTIONS (CREATION / MODIFICATION / DELETION) ---
  
  // Payment actions
  const handleAddPaiement = (newP: Omit<Paiement, 'id'>) => {
    const id = paiements.length > 0 ? Math.max(...paiements.map(x => x.id)) + 1 : 1;
    setPaiements([...paiements, { id, ...newP }]);
  };

  const handleUpdatePaiementStatus = (id: number, newStatus: 'Payé' | 'En attente' | 'Remboursé') => {
    setPaiements(paiements.map(p => p.id === id ? { ...p, statut: newStatus } : p));
  };

  const handleUpdatePaiement = (updatedP: Paiement) => {
    setPaiements(paiements.map(p => p.id === updatedP.id ? updatedP : p));
  };

  const handleDeletePaiement = (id: number) => {
    const item = paiements.find(p => Number(p.id) === Number(id));
    if (item) {
      const etu = etudiants.find(e => Number(e.id) === Number(item.etudiant_id));
      const studentName = etu ? `${etu.prenom} ${etu.nom}` : `Étudiant #${item.etudiant_id}`;
      const trashItem: TrashItem = {
        id: `paiement-${id}-${Date.now()}`,
        itemType: 'paiement',
        itemName: `Paiement: N° ${item.recu_numero} - ${item.montant} FCFA de ${studentName} (${item.type_frais})`,
        originalData: item,
        deletedAt: new Date().toISOString()
      };
      setTrash(prev => [trashItem, ...prev]);
    }
    setPaiements(paiements.filter(p => Number(p.id) !== Number(id)));
  };
  
  // Add major (filière)
  const handleAddFiliere = (newF: Omit<Filiere, 'id'>) => {
    const id = filieres.length > 0 ? Math.max(...filieres.map(x => x.id)) + 1 : 1;
    setFilieres([...filieres, { id, ...newF }]);
  };

  // Update major
  const handleUpdateFiliere = (updatedF: Filiere) => {
    setFilieres(filieres.map(f => f.id === updatedF.id ? updatedF : f));
  };

  // Delete major
  const handleDeleteFiliere = (id: number) => {
    const item = filieres.find(f => Number(f.id) === Number(id));
    if (item) {
      const trashItem: TrashItem = {
        id: `filiere-${id}-${Date.now()}`,
        itemType: 'filiere',
        itemName: `Filière: ${item.nom_filiere}`,
        originalData: item,
        deletedAt: new Date().toISOString()
      };
      setTrash(prev => [trashItem, ...prev]);
    }
    setFilieres(filieres.filter(f => Number(f.id) !== Number(id)));
    setMatieres(matieres.filter(m => Number(m.filiere_id) !== Number(id)));
    setCours(cours.filter(c => Number(c.filiere_id) !== Number(id)));
    setNotes(notes.filter(n => {
      const parentCourse = cours.find(c => Number(c.id) === Number(n.cours_id));
      return parentCourse ? Number(parentCourse.filiere_id) !== Number(id) : true;
    }));
    setEtudiants(etudiants.filter(e => Number(e.filiere_id) !== Number(id)));
    setAutorisations(autorisations.filter(a => Number(a.filiere_id) !== Number(id)));
    setLogs(logs.filter(l => Number(l.filiere_id) !== Number(id)));
    setPaiements(paiements.filter(p => {
      const student = etudiants.find(e => Number(e.id) === Number(p.etudiant_id));
      return student ? Number(student.filiere_id) !== Number(id) : true;
    }));
  };

  // Matieres actions
  const handleAddMatiere = (newM: Omit<Matiere, 'id'>) => {
    const id = matieres.length > 0 ? Math.max(...matieres.map(x => x.id)) + 1 : 1;
    setMatieres([...matieres, { id, ...newM }]);
  };

  const handleUpdateMatiere = (updatedM: Matiere) => {
    setMatieres(matieres.map(m => m.id === updatedM.id ? updatedM : m));
  };

  const handleDeleteMatiere = (id: number) => {
    const item = matieres.find(m => Number(m.id) === Number(id));
    if (item) {
      const trashItem: TrashItem = {
        id: `matiere-${id}-${Date.now()}`,
        itemType: 'matiere',
        itemName: `Matière: ${item.nom_matiere} (Code: ${item.code_matiere})`,
        originalData: item,
        deletedAt: new Date().toISOString()
      };
      setTrash(prev => [trashItem, ...prev]);
    }
    setMatieres(matieres.filter(m => Number(m.id) !== Number(id)));
  };

  // Add Semestre (Dynamic Semester option requested)
  const handleAddSemestre = (newS: Omit<Semestre, 'id'>) => {
    const id = semestres.length > 0 ? Math.max(...semestres.map(x => x.id)) + 1 : 1;
    setSemestres([...semestres, { id, ...newS }]);
  };

  // Delete Semestre
  const handleDeleteSemestre = (id: number) => {
    const item = semestres.find(s => s.id === id);
    if (item) {
      const trashItem: TrashItem = {
        id: `semestre-${id}-${Date.now()}`,
        itemType: 'semestre',
        itemName: `Semestre: ${item.nom_semestre} (${item.annee_scolaire})`,
        originalData: item,
        deletedAt: new Date().toISOString()
      };
      setTrash(prev => [trashItem, ...prev]);
    }
    setSemestres(semestres.filter(s => s.id !== id));
  };

  // Add student with custom or automatic matricule
  const handleAddEtudiant = (newE: Omit<Etudiant, 'id'>) => {
    const id = etudiants.length > 0 ? Math.max(...etudiants.map(x => x.id)) + 1 : 1;
    setEtudiants([...etudiants, { id, ...newE }]);
  };

  // Update student
  const handleUpdateEtudiant = (updatedE: Etudiant) => {
    setEtudiants(etudiants.map(e => e.id === updatedE.id ? updatedE : e));
    if (activeStudent && activeStudent.id === updatedE.id) {
      setActiveStudent(updatedE);
    }
  };

  // Delete student
  const handleDeleteEtudiant = (id: number) => {
    const item = etudiants.find(e => e.id === id);
    if (item) {
      const trashItem: TrashItem = {
        id: `etudiant-${id}-${Date.now()}`,
        itemType: 'etudiant',
        itemName: `Étudiant: ${item.prenom} ${item.nom} (Matricule: ${item.matricule})`,
        originalData: item,
        deletedAt: new Date().toISOString()
      };
      setTrash(prev => [trashItem, ...prev]);
    }
    setEtudiants(etudiants.filter(e => e.id !== id));
    setNotes(notes.filter(n => n.etudiant_id !== id));
    setAutorisations(autorisations.filter(a => a.etudiant_id !== id));
  };

  // Delete all students
  const handleDeleteAllEtudiants = () => {
    if (etudiants.length === 0) return;
    const trashItems: TrashItem[] = etudiants.map(item => ({
      id: `etudiant-${item.id}-${Date.now()}`,
      itemType: 'etudiant',
      itemName: `Étudiant: ${item.prenom} ${item.nom} (Matricule: ${item.matricule})`,
      originalData: item,
      deletedAt: new Date().toISOString()
    }));
    setTrash(prev => [...trashItems, ...prev]);
    setEtudiants([]);
    setNotes([]);
    setAutorisations([]);
  };

  // Add course support
  const handleAddCours = (newC: Omit<Cours, 'id' | 'date_ajout'>) => {
    const id = cours.length > 0 ? Math.max(...cours.map(x => x.id)) + 1 : 1;
    const date_ajout = new Date().toISOString().split('T')[0];
    setCours([...cours, { id, date_ajout, ...newC }]);
  };

  // Update course support
  const handleUpdateCours = (updatedC: Cours) => {
    setCours(cours.map(c => c.id === updatedC.id ? updatedC : c));
  };

  // Delete course support
  const handleDeleteCours = (id: number) => {
    const item = cours.find(c => c.id === id);
    if (item) {
      const trashItem: TrashItem = {
        id: `cours-${id}-${Date.now()}`,
        itemType: 'cours',
        itemName: `Support de cours: ${item.titre} (Enseignant: ${item.enseignant})`,
        originalData: item,
        deletedAt: new Date().toISOString()
      };
      setTrash(prev => [trashItem, ...prev]);
    }
    setCours(cours.filter(c => c.id !== id));
    setNotes(notes.filter(n => n.cours_id !== id));
  };

  // Add note
  const handleAddNote = (newN: Omit<Note, 'id' | 'date_ajout'>) => {
    const id = notes.length > 0 ? Math.max(...notes.map(x => x.id)) + 1 : 1;
    const date_ajout = new Date().toISOString().split('T')[0];
    setNotes([...notes, { id, date_ajout, ...newN }]);
  };

  // Add multiple notes at once, automatically creating any missing course modules
  const handleAddNotesWithCourses = (
    newNotesData: {
      etudiant_id: number;
      semestre_id: number;
      credits: number;
      note: number;
      note_classe: number;
      note_examen: number;
      matiere_nom: string;
      matiere_code: string;
    }[]
  ) => {
    const firstItem = newNotesData[0];
    if (!firstItem) return;
    const student = etudiants.find(e => e.id === firstItem.etudiant_id);
    if (!student) return;

    let currentCoursList = [...cours];
    let coursesAdded = false;
    const resolvedNotes: Omit<Note, 'id' | 'date_ajout'>[] = [];

    newNotesData.forEach(item => {
      let targetCours = currentCoursList.find(c => 
        c.titre === item.matiere_nom && 
        c.filiere_id === student.filiere_id && 
        c.semestre_id === item.semestre_id
      );

      if (!targetCours) {
        const nextCoursId = currentCoursList.length > 0 ? Math.max(...currentCoursList.map(x => x.id)) + 1 : 1;
        const date_ajout = new Date().toISOString().split('T')[0];
        targetCours = {
          id: nextCoursId,
          titre: item.matiere_nom,
          description: `Module de cours pour ${item.matiere_nom}`,
          fichier: "",
          filiere_id: student.filiere_id,
          classe_id: student.classe_id,
          semestre_id: item.semestre_id,
          enseignant: "Professeur Principal",
          date_ajout
        };
        currentCoursList.push(targetCours);
        coursesAdded = true;
      }

      resolvedNotes.push({
        etudiant_id: item.etudiant_id,
        cours_id: targetCours.id,
        semestre_id: item.semestre_id,
        note: item.note,
        credits: item.credits,
        note_classe: item.note_classe,
        note_examen: item.note_examen
      });
    });

    if (coursesAdded) {
      setCours(currentCoursList);
    }

    setNotes(prev => {
      let currentId = prev.length > 0 ? Math.max(...prev.map(x => x.id)) : 0;
      const date_ajout = new Date().toISOString().split('T')[0];
      const newItems = resolvedNotes.map(noteItem => {
        currentId++;
        return { id: currentId, date_ajout, ...noteItem };
      });
      return [...prev, ...newItems];
    });
  };

  // Delete note
  const handleDeleteNote = (id: number) => {
    const item = notes.find(n => n.id === id);
    if (item) {
      const etu = etudiants.find(e => e.id === item.etudiant_id);
      const studentName = etu ? `${etu.prenom} ${etu.nom}` : `Étudiant #${item.etudiant_id}`;
      const crs = cours.find(c => c.id === item.cours_id);
      const courseTitle = crs ? crs.titre : `Cours #${item.cours_id}`;
      const trashItem: TrashItem = {
        id: `note-${id}-${Date.now()}`,
        itemType: 'note',
        itemName: `Note de ${item.note}/20 de ${studentName} (${courseTitle})`,
        originalData: item,
        deletedAt: new Date().toISOString()
      };
      setTrash(prev => [trashItem, ...prev]);
    }
    setNotes(notes.filter(n => n.id !== id));
  };

  // Update note
  const handleUpdateNote = (id: number, updatedFields: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updatedFields } : n));
  };

  // Add inter-filière authorization
  const handleAddAutorisation = (newA: Omit<AutorisationFiliere, 'id' | 'date_autorisation'>) => {
    const id = autorisations.length > 0 ? Math.max(...autorisations.map(x => x.id)) + 1 : 1;
    const date_autorisation = new Date().toISOString().split('T')[0];
    setAutorisations([...autorisations, { id, date_autorisation, ...newA }]);
  };

  // Revoke authorization
  const handleDeleteAutorisation = (id: number) => {
    const item = autorisations.find(a => a.id === id);
    if (item) {
      const etu = etudiants.find(e => e.id === item.etudiant_id);
      const studentName = etu ? `${etu.prenom} ${etu.nom}` : `Étudiant #${item.etudiant_id}`;
      const fil = filieres.find(f => f.id === item.filiere_id);
      const filName = fil ? fil.nom_filiere : `Filière #${item.filiere_id}`;
      const trashItem: TrashItem = {
        id: `autorisation-${id}-${Date.now()}`,
        itemType: 'autorisation',
        itemName: `Autorisation d'accès de ${studentName} à la filière ${filName}`,
        originalData: item,
        deletedAt: new Date().toISOString()
      };
      setTrash(prev => [trashItem, ...prev]);
    }
    setAutorisations(autorisations.filter(a => a.id !== id));
  };

  // Trash bin handlers
  const handleRestoreItem = (itemToRestore: TrashItem) => {
    const data = itemToRestore.originalData;
    switch (itemToRestore.itemType) {
      case 'paiement':
        setPaiements(prev => [...prev.filter(p => p.id !== data.id), data]);
        break;
      case 'filiere':
        setFilieres(prev => [...prev.filter(f => f.id !== data.id), data]);
        break;
      case 'matiere':
        setMatieres(prev => [...prev.filter(m => m.id !== data.id), data]);
        break;
      case 'semestre':
        setSemestres(prev => [...prev.filter(s => s.id !== data.id), data]);
        break;
      case 'etudiant':
        setEtudiants(prev => [...prev.filter(e => e.id !== data.id), data]);
        break;
      case 'cours':
        setCours(prev => [...prev.filter(c => c.id !== data.id), data]);
        break;
      case 'note':
        setNotes(prev => [...prev.filter(n => n.id !== data.id), data]);
        break;
      case 'autorisation':
        setAutorisations(prev => [...prev.filter(a => a.id !== data.id), data]);
        break;
    }
    setTrash(prev => prev.filter(t => t.id !== itemToRestore.id));
  };

  const handlePermanentDeleteItem = (id: string) => {
    setTrash(prev => prev.filter(t => t.id !== id));
  };

  const handleEmptyTrash = () => {
    setTrash([]);
  };

  const handleRestoreAll = () => {
    if (trash.length === 0) return;
    
    let restoredPaiements = [...paiements];
    let restoredFilieres = [...filieres];
    let restoredMatieres = [...matieres];
    let restoredSemestres = [...semestres];
    let restoredEtudiants = [...etudiants];
    let restoredCours = [...cours];
    let restoredNotes = [...notes];
    let restoredAutorisations = [...autorisations];

    trash.forEach(itemToRestore => {
      const data = itemToRestore.originalData;
      switch (itemToRestore.itemType) {
        case 'paiement':
          if (!restoredPaiements.some(p => p.id === data.id)) restoredPaiements.push(data);
          break;
        case 'filiere':
          if (!restoredFilieres.some(f => f.id === data.id)) restoredFilieres.push(data);
          break;
        case 'matiere':
          if (!restoredMatieres.some(m => m.id === data.id)) restoredMatieres.push(data);
          break;
        case 'semestre':
          if (!restoredSemestres.some(s => s.id === data.id)) restoredSemestres.push(data);
          break;
        case 'etudiant':
          if (!restoredEtudiants.some(e => e.id === data.id)) restoredEtudiants.push(data);
          break;
        case 'cours':
          if (!restoredCours.some(c => c.id === data.id)) restoredCours.push(data);
          break;
        case 'note':
          if (!restoredNotes.some(n => n.id === data.id)) restoredNotes.push(data);
          break;
        case 'autorisation':
          if (!restoredAutorisations.some(a => a.id === data.id)) restoredAutorisations.push(data);
          break;
      }
    });

    setPaiements(restoredPaiements);
    setFilieres(restoredFilieres);
    setMatieres(restoredMatieres);
    setSemestres(restoredSemestres);
    setEtudiants(restoredEtudiants);
    setCours(restoredCours);
    setNotes(restoredNotes);
    setAutorisations(restoredAutorisations);
    setTrash([]);
  };

  // Log active cross-major file consumption (triggered by student)
  const handleLogAccess = (studentId: number, filiereId: number) => {
    const id = logs.length > 0 ? Math.max(...logs.map(x => x.id)) + 1 : 1;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Put inside logs only if not recently accessed or just append
    setLogs(prev => [...prev, {
      id,
      etudiant_id: studentId,
      filiere_id: filiereId,
      date_acces: formattedDate
    }]);
  };

  // Update password via profile edit
  const handleUpdatePassword = (studentId: number, newPass: string) => {
    setEtudiants(etudiants.map(e => e.id === studentId ? { ...e, mot_de_passe: newPass } : e));
  };

  // Handle addition of modern administrator
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminNom || !newAdminEmail || !newAdminPass) return;
    setAdminList([...adminList, {
      id: adminList.length > 0 ? Math.max(...adminList.map(a => a.id)) + 1 : 1,
      nom: newAdminNom.trim(),
      email: newAdminEmail.trim().toLowerCase(),
      mot_de_passe: newAdminPass.trim()
    }]);
    setNewAdminNom("");
    setNewAdminEmail("");
    setNewAdminPass("");
    setShowAdminForm(false);
    alert("Compte Administrateur enregistré avec succès !");
  };

  const handleDeleteAdmin = (id: number) => {
    const adminToDelete = adminList.find(a => a.id === id);
    if (!adminToDelete) return;
    
    // Prevent deleting when it's the last admin
    if (adminList.length <= 1) {
      alert("Erreur : Impossible de supprimer le dernier administrateur. Il doit y avoir au moins un compte administrateur actif.");
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'administrateur "${adminToDelete.nom}" ?`)) {
      setAdminList(adminList.filter(a => a.id !== id));
      // If deleting the currently logged-in admin, log them out
      if (adminToDelete.nom === activeAdminName) {
        handleLogout();
        alert("Votre compte administrateur a été supprimé. Vous avez été déconnecté.");
      } else {
        alert("Administrateur supprimé avec succès !");
      }
    }
  };

  const handleUpdateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminId || !editAdminNom || !editAdminEmail || !editAdminPass) return;
    
    setAdminList(adminList.map(a => a.id === editingAdminId ? {
      ...a,
      nom: editAdminNom.trim(),
      email: editAdminEmail.trim().toLowerCase(),
      mot_de_passe: editAdminPass.trim()
    } : a));
    
    // Update logged-in session name if editing own account
    const oldAdmin = adminList.find(a => a.id === editingAdminId);
    if (oldAdmin && oldAdmin.nom === activeAdminName) {
      setActiveAdminName(editAdminNom.trim());
    }

    setEditingAdminId(null);
    setEditAdminNom("");
    setEditAdminEmail("");
    setEditAdminPass("");
    alert("Compte Administrateur mis à jour avec succès !");
  };

  const startEditAdmin = (admin: Administrateur) => {
    setEditingAdminId(admin.id);
    setEditAdminNom(admin.nom);
    setEditAdminEmail(admin.email);
    setEditAdminPass(admin.mot_de_passe);
    setShowAdminForm(false); // hide create form if open
  };

  // --- LOGIN VALIDATION ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedUsername = usernameInput.trim();
    const trimmedPassword = passwordInput.trim();

    if (loginRole === 'admin') {
      const foundAdmin = adminList.find(a => 
        a.email.toLowerCase().trim() === trimmedUsername.toLowerCase() && 
        a.mot_de_passe.trim() === trimmedPassword
      );
      if (foundAdmin) {
        setLoginError('');
        setUserRole('admin');
        setActiveAdminName(foundAdmin.nom);
        setAdminActiveTab('dashboard');
      } else {
        setLoginError("Adresse E-mail ou Mot de passe Administrateur incorrect. Veuillez vérifier si l'adresse e-mail a été correctement saisie dans l'onglet Administration.");
      }
    } else {
      const foundStudent = etudiants.find(e => 
        e.matricule.toUpperCase().trim() === trimmedUsername.toUpperCase() && 
        e.mot_de_passe.trim() === trimmedPassword
      );
      if (foundStudent) {
        if (isPortalLocked) {
          setLoginError("L'accès à l'espace étudiant est temporairement fermé par la direction de l'école jusqu'à nouvel ordre.");
          return;
        }

        // If they did not select a filiere, dynamically fallback to their primary one
        let targetFiliereId = selectedFiliereId;
        if (!targetFiliereId) {
          targetFiliereId = foundStudent.filiere_id;
          setSelectedFiliereId(foundStudent.filiere_id);
        }

        const isAuthorized = autorisations.some(a => a.etudiant_id === foundStudent.id && a.filiere_id === targetFiliereId);
        if (foundStudent.filiere_id !== targetFiliereId && !isAuthorized) {
          const selectedFiliereObj = filieres.find(f => f.id === targetFiliereId);
          setLoginError(`Erreur d'accès : Vous n'êtes pas scolarisé ni accrédité pour accéder à la filière "${selectedFiliereObj ? selectedFiliereObj.nom_filiere : ''}".`);
          return;
        }

        setLoginError('');
        setUserRole('student');
        setActiveStudent(foundStudent);
      } else {
        setLoginError("Numéro de matricule ou mot de passe étudiant incorrect. Veuillez vérifier votre saisie.");
      }
    }
  };

  const handleQuickLogin = (role: 'admin' | 'student', username: string, pass: string) => {
    setUsernameInput(username);
    setPasswordInput(pass);
    setLoginRole(role);
    if (role === 'student') {
      const student = etudiants.find(e => e.matricule.toUpperCase() === username.toUpperCase());
      if (student) {
        setSelectedFiliereId(student.filiere_id);
      }
    }
  };

  const handleLogout = () => {
    setUserRole('guest');
    setActiveStudent(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans overflow-x-hidden relative" id="layout-app-root">
      
      {/* 1. VISITOR / AUTHENTICATION LANDING SCREEN */}
      {userRole === 'guest' && (
        <div 
          className="flex-grow flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-cover bg-center" 
          id="guest-screen-parent"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1000&q=60")' }}
        >
          {/* Subtle elegant dim overlay */}
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]" id="guest-bg-overlay"></div>

          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-150 grid grid-cols-1 lg:grid-cols-12 relative z-10">
            
            {/* Informational banner left */}
            <div className="lg:col-span-12 xl:col-span-5 bg-gradient-to-br from-blue-900 via-blue-850 to-slate-900 p-8 md:p-12 text-slate-100 flex flex-col justify-between lg:hidden xl:flex">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl text-blue-900 font-extrabold text-xl flex items-center justify-center shadow">GS</div>
                  <h1 className="font-extrabold text-lg tracking-tight">EcolePortail</h1>
                </div>

                <div className="mt-8 space-y-4">
                  <h2 className="text-xl md:text-2xl font-black leading-tight">Système unifié de Gestion Académique</h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                     Une plateforme académique intégrée offrant un suivi complet de la scolarité, de la saisie des notes, du calcul des moyennes pondérées par crédits LMD, ainsi que du recouvrement des frais de scolarité.
                  </p>
                </div>
              </div>

              {/* Professional Welcome Information Card */}
              <div className="bg-white/10 p-5 rounded-2xl border border-white/10 mt-8">
                <div className="flex items-center gap-2 mb-2 text-blue-300">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Session sécurisée</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                   Connectez-vous à l'aide de vos identifiants pour accéder à vos services et consulter vos documents académiques en temps réel.
                </p>
              </div>
            </div>

            {/* Standard Login right */}
            <div className="col-span-12 xl:col-span-7 p-8 md:p-12 flex flex-col justify-center">
              {/* Grand Logo de l'Université */}
              <div className="flex flex-col items-center mb-6 text-center" id="university-grand-logo">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-900 via-blue-750 to-indigo-800 rounded-full flex items-center justify-center shadow-xl mb-3 border-4 border-slate-100 ring-2 ring-blue-900/10 hover:scale-105 transition-transform duration-300">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
                <div className="font-black text-xs text-blue-900 tracking-widest uppercase">Université des Sciences & Technologies</div>
                <div className="text-[9px] text-slate-400 font-semibold tracking-wider mt-1">Savoir • Innovation • Excellence</div>
              </div>

              <h3 className="text-xl font-black text-gray-900 tracking-tight text-center">Portail de Connexion</h3>
              <p className="text-xs text-slate-500 mt-1 text-center">Saisissez vos identifiants pour rejoindre l'établissement scolaire.</p>

              {loginError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-xs font-semibold" id="login-error-banner">
                  <span className="text-red-650 text-sm mt-[1px]" role="img" aria-label="Avertissement">⚠️</span>
                  <p className="leading-snug">{loginError}</p>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4 text-xs">
                
                {/* Role picker */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Choisir le Type d'accès</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => { setLoginRole('student'); setUsernameInput(''); setPasswordInput(''); setSelectedFiliereId(''); }}
                      className={`py-3 text-center rounded-xl border font-bold transition flex items-center justify-center gap-2 ${loginRole === 'student' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-slate-705 hover:bg-gray-100'}`}
                    >
                      <Users className="w-4 h-4" />
                      Espace Étudiant
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setLoginRole('admin'); setUsernameInput(''); setPasswordInput(''); }}
                      className={`py-3 text-center rounded-xl border font-bold transition flex items-center justify-center gap-2 ${loginRole === 'admin' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-805' : 'border-gray-200 text-slate-705 hover:bg-gray-100'}`}
                    >
                      <Key className="w-4 h-4" />
                      Administration
                    </button>
                  </div>
                </div>

                {/* Dropdown for Student Filière Selection */}
                {loginRole === 'student' && (
                  <div id="filiere-login-dropdown-wrapper" className="space-y-3">
                    {isPortalLocked && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-bold" id="portal-locked-warning-banner">
                        <Lock className="w-4 h-4 text-red-600 shrink-0 animate-pulse" />
                        <p className="leading-snug">L'accès à l'espace étudiant est temporairement fermé par la direction.</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-blue-900" />
                        Sélectionner votre Filière Académique <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedFiliereId}
                        onChange={e => setSelectedFiliereId(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-600 text-slate-900 bg-white text-xs font-bold"
                        required
                        disabled={isPortalLocked}
                      >
                        <option value="">-- Choisir une filière --</option>
                        {filieres.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.nom_filiere}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Email or Matricule */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    {loginRole === 'admin' ? "Adresse E-mail de Direction" : "Numéro de Matricule Étudiant"}
                  </label>
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    placeholder={loginRole === 'admin' ? "Ex: admin@ecole.com" : "Ex: MT-2025-01"}
                    className="form-control.text-sm w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-600 text-slate-900 bg-white"
                    required
                    disabled={loginRole === 'student' && isPortalLocked}
                  />
                  
                  {/* Role Mismatch Helper */}
                  {loginRole === 'student' && usernameInput.includes('@') && (
                    <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-xl text-[11px] font-semibold animate-pulse flex items-center gap-2">
                      <span className="text-sm">💡</span>
                      <p className="leading-snug">
                        Vous avez saisi une adresse e-mail. Veuillez cliquer sur le bouton <strong>"Administration"</strong> ci-dessus pour accéder au compte admin.
                      </p>
                    </div>
                  )}
                  {loginRole === 'admin' && usernameInput.trim() !== '' && !usernameInput.includes('@') && (
                    <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-xl text-[11px] font-semibold animate-pulse flex items-center gap-2">
                       <span className="text-sm">💡</span>
                       <p className="leading-snug">
                         Vous semblez saisir un matricule. Veuillez cliquer sur le bouton <strong>"Espace Étudiant"</strong> ci-dessus pour vous connecter.
                       </p>
                     </div>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Mot de passe de sécurité</label>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder=""
                      className="form-control.text-sm w-full p-3 pr-10 rounded-xl border border-gray-200 outline-none focus:border-blue-600 text-slate-900 bg-white"
                      required
                      disabled={loginRole === 'student' && isPortalLocked}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-blue-600"
                      disabled={loginRole === 'student' && isPortalLocked}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loginRole === 'student' && isPortalLocked}
                  className={`w-full py-3 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                    loginRole === 'student' && isPortalLocked
                      ? 'bg-slate-305 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-blue-900 hover:bg-slate-900'
                  }`}
                >
                  {loginRole === 'student' && isPortalLocked ? (
                    <>
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>Espace Étudiant Fermé</span>
                    </>
                  ) : (
                    "Confirmer et se connecter"
                  )}
                </button>
              </form>



            </div>

          </div>
        </div>
      )}

      {/* 2. ADMIN PANEL CONTAINER WRAPPER */}
      {userRole === 'admin' && (
        <div 
          className={`flex-grow flex pt-[60px] lg:pt-0 transition-colors duration-300 ${
            (adminActiveTab !== 'dashboard') 
              ? `flex-col ${adminTheme === 'sombre-or' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50'}` 
              : `flex-col lg:flex-row ${adminTheme === 'sombre-or' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50'}`
          }`} 
          id="admin-workspace-layer"
        >
          
          {/* Main Lateral Sidebar as requested ("Menu latéral") */}
          {(adminActiveTab === 'dashboard') && (
            <aside className="hidden lg:flex w-full lg:w-64 bg-slate-900 text-slate-100 shrink-0 flex-col justify-between border-r border-slate-800 p-4">
            <div>
              {/* Brand icon */}
              <div className="logo-area flex items-center gap-3 border-b border-slate-800 pb-4 mb-6" id="dashboard-brand-header">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg border shrink-0 transition-all ${
                  adminTheme === 'sombre-or' 
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400/40 shadow-amber-500/10' 
                    : 'bg-gradient-to-br from-blue-650 to-indigo-750 border-slate-750'
                }`}>
                  <GraduationCap className={`w-6 h-6 ${adminTheme === 'sombre-or' ? 'text-slate-950' : 'text-white'}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-xs tracking-wider text-slate-100 uppercase truncate">Université des Sciences</h3>
                  <span className={`text-[9px] font-bold block uppercase tracking-wide leading-none mt-0.5 ${
                    adminTheme === 'sombre-or' ? 'text-amber-400 animate-pulse' : 'text-blue-400'
                  }`}>Administration</span>
                </div>
              </div>

              {/* Navigation Menu Links */}
              <nav>
                <ul className="space-y-1">
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('dashboard'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-150 ${
                        adminActiveTab === 'dashboard' 
                          ? (adminTheme === 'sombre-or' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20' 
                              : 'bg-blue-600 text-white font-bold shadow')
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Vue d'Ensemble
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('etudiants'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-150 ${
                        adminActiveTab === 'etudiants' 
                          ? (adminTheme === 'sombre-or' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20' 
                              : 'bg-blue-600 text-white font-bold shadow')
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Gestion Étudiants
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('filieres'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-150 ${
                        adminActiveTab === 'filieres' 
                          ? (adminTheme === 'sombre-or' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20' 
                              : 'bg-blue-600 text-white font-bold shadow')
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      Filières Académiques
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('semestres'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-150 ${
                        adminActiveTab === 'semestres' 
                          ? (adminTheme === 'sombre-or' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20' 
                              : 'bg-blue-600 text-white font-bold shadow')
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Semestres d'Études
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('cours'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-150 ${
                        adminActiveTab === 'cours' 
                          ? (adminTheme === 'sombre-or' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20' 
                              : 'bg-blue-600 text-white font-bold shadow')
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Supports de Cours
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('notes'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-150 ${
                        adminActiveTab === 'notes' 
                          ? (adminTheme === 'sombre-or' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20' 
                              : 'bg-blue-600 text-white font-bold shadow')
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      Saisie des Notes
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('bulletins'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-150 ${
                        adminActiveTab === 'bulletins' 
                          ? (adminTheme === 'sombre-or' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20' 
                              : 'bg-blue-600 text-white font-bold shadow')
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      Génération Bulletins
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('autorisations'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-150 ${
                        adminActiveTab === 'autorisations' 
                          ? (adminTheme === 'sombre-or' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20' 
                              : 'bg-blue-600 text-white font-bold shadow')
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Autorisations d'Accès
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('paiements'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-150 ${
                        adminActiveTab === 'paiements' 
                          ? (adminTheme === 'sombre-or' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20' 
                              : 'bg-blue-600 text-white font-bold shadow')
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Gestion des Paiements
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('corbeille'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-150 ${
                        adminActiveTab === 'corbeille' 
                          ? (adminTheme === 'sombre-or' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20' 
                              : 'bg-red-650 text-white font-bold shadow')
                          : 'text-slate-400 hover:bg-slate-800 hover:text-red-400'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Corbeille ({trash.length})
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Quick Administrator credentials panel */}
            <div className="mt-8 border-t border-slate-800 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-gray-500 uppercase block tracking-wider font-bold">Administrateurs :</span>
                {adminsUnlocked && (
                  <button 
                    onClick={() => { setAdminsUnlocked(false); setUnlockPassword(""); setUnlockError(""); }}
                    className="text-[9px] text-[#c5a880] hover:underline flex items-center gap-1 cursor-pointer"
                    title="Verrouiller la liste"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    Verrouiller
                  </button>
                )}
              </div>

              {!adminsUnlocked ? (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-center space-y-2">
                  <div className="flex justify-center mb-1">
                    <ShieldAlert className="w-5 h-5 text-amber-500/80 animate-pulse" />
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-medium leading-normal">
                    Accès sécurisé. Saisissez votre mot de passe pour gérer les administrateurs.
                  </p>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setUnlockError("");
                      const currentAdminAcc = adminList.find(a => a.nom === activeAdminName);
                      if (currentAdminAcc && unlockPassword.trim() === currentAdminAcc.mot_de_passe.trim()) {
                        setAdminsUnlocked(true);
                        setUnlockError("");
                      } else {
                        setUnlockError("Mot de passe incorrect.");
                      }
                    }}
                    className="space-y-1.5"
                  >
                    <input 
                      type="password" 
                      placeholder="Mot de passe admin"
                      value={unlockPassword}
                      onChange={e => setUnlockPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 outline-none text-[10px] text-center"
                      required
                    />
                    {unlockError && <p className="text-[8.5px] text-rose-500 font-semibold leading-none">{unlockError}</p>}
                    <button 
                      type="submit"
                      className="w-full bg-[#c5a880] text-slate-950 rounded py-1 text-[10px] font-black hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
                    >
                      Déverrouiller
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1 text-[11px] text-gray-400 mb-3 block">
                    {adminList.map(adm => {
                      if (editingAdminId === adm.id) {
                        return (
                          <form key={adm.id} onSubmit={handleUpdateAdmin} className="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-blue-900 text-[10px] my-1">
                            <div className="text-blue-400 font-bold uppercase text-[8px] tracking-wide">Modifier l'Admin</div>
                            <input 
                              type="text" 
                              placeholder="Nom"
                              value={editAdminNom}
                              onChange={e => setEditAdminNom(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-100 outline-none text-[10px]"
                              required
                            />
                            <input 
                              type="email" 
                              placeholder="Email"
                              value={editAdminEmail}
                              onChange={e => setEditAdminEmail(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-100 outline-none text-[10px]"
                              required
                            />
                            <input 
                              type="password" 
                              placeholder="Mot de passe"
                              value={editAdminPass}
                              onChange={e => setEditAdminPass(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-100 outline-none text-[10px]"
                              required
                            />
                            
                            {/* Information relative aux accès de l'administrateur */}
                            <div className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-[8.5px] font-medium leading-none space-y-1">
                              <p className="font-bold flex items-center gap-1">🏆 Accès Super Admin : Actif</p>
                              <p className="text-[8px] opacity-80 decoration-none">Autorisation totale & illimitée sur tout le site</p>
                            </div>

                            <div className="flex gap-1.5 justify-end text-[9px] pt-1">
                              <button type="button" onClick={() => setEditingAdminId(null)} className="text-gray-400 hover:text-white">Annuler</button>
                              <button type="submit" className="text-blue-400 font-bold hover:text-blue-300">Enregistrer</button>
                            </div>
                          </form>
                        );
                      }
                      return (
                        <div key={adm.id} className="flex justify-between items-center py-1 group/adm hover:bg-slate-850 px-1 rounded transition">
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="text-slate-200 truncate font-semibold">👤 {adm.nom}</span>
                            <span className="text-[9px] text-gray-500 truncate">{adm.email}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover/adm:opacity-100 transition">
                            <button 
                              onClick={() => startEditAdmin(adm)}
                              className="p-1 text-slate-400 hover:text-blue-400 transition"
                              title="Modifier"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAdmin(adm.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!showAdminForm ? (
                    <button 
                      onClick={() => { setShowAdminForm(true); setEditingAdminId(null); }}
                      className="w-full text-center py-1 bg-slate-800 text-slate-200 rounded text-[10px] font-bold cursor-pointer"
                    >
                      + Ajouter un Admin
                    </button>
                  ) : (
                    <form onSubmit={handleAddAdmin} className="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px]">
                      <div className="text-amber-400 font-bold uppercase text-[8px] tracking-wide">Nouvel Administrateur</div>
                      <input 
                        type="text" 
                        placeholder="Nom complet"
                        value={newAdminNom}
                        onChange={e => setNewAdminNom(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded px-2 py-1 text-slate-100 outline-none"
                        required
                      />
                      <input 
                        type="email" 
                        placeholder="Adresse e-mail"
                        value={newAdminEmail}
                        onChange={e => setNewAdminEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded px-2 py-1 text-slate-100 outline-none"
                        required
                      />
                      <input 
                        type="password" 
                        placeholder="Mot de passe"
                        value={newAdminPass}
                        onChange={e => setNewAdminPass(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded px-2 py-1 text-slate-100 outline-none"
                        required
                      />

                      {/* Accréditations par défaut et complètes des Administrateurs */}
                      <div className="p-2 bg-slate-900 border border-amber-500/20 text-slate-300 rounded text-[8.5px] leading-relaxed space-y-1">
                        <span className="font-extrabold uppercase text-amber-400 tracking-wider text-[8px] block">🛡️ Droits & Accréditations</span>
                        <p className="text-slate-400">Ce compte aura par défaut un rôle de <strong>Super-Administrateur Général</strong> avec droits absolus de lecture, écriture et modifications sur :</p>
                        <ul className="grid grid-cols-2 gap-x-1 text-[8px] text-amber-300/90 font-semibold list-none pl-0 mt-1">
                          <li>• Vue d'Ensemble ✔</li>
                          <li>• Gestion Élèves ✔</li>
                          <li>• Notes & Bulletins ✔</li>
                          <li>• Cours & Matières ✔</li>
                          <li>• Paiements & Frais ✔</li>
                          <li>• Droits d'Accès ✔</li>
                        </ul>
                      </div>

                      <div className="flex gap-1 justify-end pt-1">
                        <button type="button" onClick={() => setShowAdminForm(false)} className="text-gray-400 p-1">Annuler</button>
                        <button type="submit" className="text-amber-400 font-bold p-1 hover:text-amber-300">Créer</button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                <span className="text-xs text-slate-300 font-bold truncate pr-2">👤 {activeAdminName}</span>
                <button 
                  onClick={handleLogout}
                  className="p-1 px-2.5 bg-red-600/20 hover:bg-red-650/40 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition leading-none shrink-0"
                  title="Déconnexion"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Quitter
                </button>
              </div>
          </aside>
          )}

          {/* Right Work Panel layout */}
          <main className="flex-1 flex flex-col min-w-0">
            {adminActiveTab !== 'dashboard' ? (
              // Focused full-screen workspace layout for deep work on any individual tab
              <div className="flex-grow p-6 md:p-8 overflow-y-auto w-full mx-auto select-none animate-fade-in space-y-6 pb-8 md:pb-8 max-w-none">
                
                {/* Custom minimalist path header with back button */}
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-xl p-5 border transition-all duration-300 shadow-sm ${
                  adminTheme === 'sombre-or' 
                    ? 'bg-slate-900 border-amber-500/20 text-white shadow-amber-950/20 shadow-md' 
                    : 'bg-white border-gray-150 shadow-sm'
                }`}>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setAdminActiveTab('dashboard');
                      }} 
                      className={`group flex items-center gap-2.5 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0 border ${
                        adminTheme === 'sombre-or'
                          ? 'bg-slate-950/40 border-amber-500/20 text-slate-200 hover:bg-amber-500 hover:border-amber-400 hover:text-slate-950 hover:shadow-[0_4px_20px_rgba(245,158,11,0.25)]'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-900 hover:border-slate-900 hover:text-white shadow-sm hover:shadow-[0_4px_15px_rgba(15,23,42,0.12)]'
                      }`}
                      id="btn-back-to-dashboard"
                    >
                      <span className={`p-1.5 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                        adminTheme === 'sombre-or' 
                          ? 'bg-amber-500/10 group-hover:bg-slate-950/20 text-amber-400 group-hover:text-slate-950' 
                          : 'bg-slate-100 group-hover:bg-white/20 text-slate-600 group-hover:text-white'
                      }`}>
                        <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                      </span>
                      <span className="tracking-wide">Retour Tableau de Bord</span>
                    </button>
                    <div className={`h-8 w-px hidden sm:block ${adminTheme === 'sombre-or' ? 'bg-amber-500/15' : 'bg-gray-200'}`}></div>
                    <div>
                      <h2 className={`text-sm font-black tracking-tight uppercase ${
                        adminTheme === 'sombre-or' ? 'text-amber-400' : 'text-slate-900'
                      }`}>
                        {adminActiveTab === 'etudiants' && "Inscriptions & Gestion Élèves"}
                        {adminActiveTab === 'filieres' && "Modélisation des Filières Académiques"}
                        {adminActiveTab === 'semestres' && "Gestion des Périodes Pédagogiques"}
                        {adminActiveTab === 'cours' && "Supports Didactiques Multi-Filières"}
                        {adminActiveTab === 'notes' && "Gestionnaire de Bulletins & Notes"}
                        {adminActiveTab === 'bulletins' && "Génération Dynamique de Bulletins"}
                        {adminActiveTab === 'autorisations' && "Liaisons Inter-parcours & Droits"}
                        {adminActiveTab === 'paiements' && "Suivi Énergique des Paiements"}
                        {adminActiveTab === 'corbeille' && "Corbeille & Récupération de Données"}
                      </h2>
                      <p className={`text-[10px] font-semibold mt-0.5 ${
                        adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-gray-500'
                      }`}>
                        {adminActiveTab === 'etudiants' && "Registre de gestion des élèves, classes et parcours."}
                        {adminActiveTab === 'filieres' && "Configuration des filières et définition des matières pédagogiques par filière."}
                        {adminActiveTab === 'semestres' && "Suivi temporel, définition des années scolaires et des semestres d'évaluation."}
                        {adminActiveTab === 'cours' && "Partage, catégorisation et mise en ligne des supports d'études par matière."}
                        {adminActiveTab === 'notes' && "Saisie des évaluations et notes d'examen par matière."}
                        {adminActiveTab === 'bulletins' && "Visualisation et édition des relevés de notes semestriels."}
                        {adminActiveTab === 'autorisations' && "Accréditations exceptionnelles d'accès de consultation inter-filières pour étudiants."}
                        {adminActiveTab === 'paiements' && "Suivi de la scolarité et encaissement des frais scolaires."}
                        {adminActiveTab === 'corbeille' && "Restaurez ou purgez définitivement vos enregistrements supprimés."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* THÈME TOGGLE SWITCH */}
                    <button
                      type="button"
                      onClick={toggleAdminTheme}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all duration-200 outline-none active:scale-95 cursor-pointer shrink-0 ${
                        adminTheme === 'sombre-or'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-sm shadow-amber-950/20'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                      title={adminTheme === 'sombre-or' ? "Activer le Thème Clair Professionnel" : "Activer le Thème Sombre & Or"}
                    >
                      {adminTheme === 'sombre-or' ? (
                        <>
                          <Moon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>Mode Sombre & Or</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>Mode Clair Pro</span>
                        </>
                      )}
                    </button>

                    {/* SÉLECTEUR GLOBAL D'ANNÉE ACADÉMIQUE */}
                    <div className={`flex items-center border rounded-xl p-0.5 space-x-0.5 shrink-0 transition-opacity duration-300 ${
                      adminTheme === 'sombre-or' ? 'bg-slate-950 border-amber-500/20' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setGlobalAnneeScolaire("2024-2025")}
                        className={`text-[9px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          globalAnneeScolaire === "2024-2025"
                            ? (adminTheme === 'sombre-or' ? "bg-amber-500 text-slate-950 font-black shadow" : "bg-blue-600 text-white shadow")
                            : (adminTheme === 'sombre-or' ? "text-slate-400 hover:text-white" : "text-slate-650 hover:text-slate-900")
                        }`}
                        title="Année Précédente"
                      >
                        Précédent (24-25)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlobalAnneeScolaire("2025-2026")}
                        className={`text-[9px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          globalAnneeScolaire === "2025-2026"
                            ? (adminTheme === 'sombre-or' ? "bg-amber-500 text-slate-950 font-black shadow" : "bg-blue-600 text-white shadow")
                            : (adminTheme === 'sombre-or' ? "text-slate-400 hover:text-white" : "text-slate-650 hover:text-slate-900")
                        }`}
                        title="Année Courante (Active)"
                      >
                        Courant (25-26)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlobalAnneeScolaire("2026-2027")}
                        className={`text-[9px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          globalAnneeScolaire === "2026-2027"
                            ? (adminTheme === 'sombre-or' ? "bg-amber-500 text-slate-950 font-black shadow" : "bg-blue-600 text-white shadow")
                            : (adminTheme === 'sombre-or' ? "text-slate-400 hover:text-white" : "text-slate-650 hover:text-slate-900")
                        }`}
                        title="Année Suivante"
                      >
                        Suivant (26-27)
                      </button>
                    </div>

                    {/* Global Filters on Active Deep Workspace */}
                    {adminActiveTab !== 'dashboard' && (
                      <>
                        <div className={`flex items-center gap-1 text-[11px] border rounded-lg p-1.5 px-3 transition-colors ${
                          adminTheme === 'sombre-or' ? 'bg-slate-950 border-amber-500/20' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className={`font-extrabold uppercase tracking-wider ${
                            adminTheme === 'sombre-or' ? 'text-amber-400/80' : 'text-slate-400'
                          }`}>Filière active :</span>
                          <select
                            value={globalFiliereId}
                            onChange={e => setGlobalFiliereId(Number(e.target.value))}
                            className={`bg-transparent border-none text-xs font-bold outline-none cursor-pointer focus:ring-0 p-0 text-ellipsis truncate max-w-[160px] ${
                              adminTheme === 'sombre-or' ? 'text-white' : 'text-blue-900'
                            }`}
                          >
                            <option value={0} className={adminTheme === 'sombre-or' ? 'bg-slate-950 text-white' : ''}>Toutes les filières</option>
                            {filieres.map(f => (
                              <option key={f.id} value={f.id} className={adminTheme === 'sombre-or' ? 'bg-slate-950 text-white' : ''}>{f.nom_filiere}</option>
                            ))}
                          </select>
                        </div>

                        <div className={`flex items-center gap-1 text-[11px] border rounded-lg p-1.5 px-3 transition-colors ${
                          adminTheme === 'sombre-or' ? 'bg-slate-950 border-amber-500/20' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className={`font-extrabold uppercase tracking-wider ${
                            adminTheme === 'sombre-or' ? 'text-amber-400/80' : 'text-slate-400'
                          }`}>Période :</span>
                          <select
                            value={globalSemestreId}
                            onChange={e => setGlobalSemestreId(Number(e.target.value))}
                            className={`bg-transparent border-none text-xs font-bold outline-none cursor-pointer focus:ring-0 p-0 ${
                              adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-800'
                            }`}
                          >
                            <option value={0} className={adminTheme === 'sombre-or' ? 'bg-slate-950 text-white' : ''}>Toutes les périodes</option>
                            {filteredSemestres
                              .filter(s => !globalFiliereId || Number(s.filiere_id) === Number(globalFiliereId))
                              .map(s => (
                                <option key={s.id} value={s.id} className={adminTheme === 'sombre-or' ? 'bg-slate-950 text-white' : ''}>{shortenSemester(s.nom_semestre)}</option>
                              ))}
                          </select>
                        </div>
                      </>
                    )}

                    <span className={`text-[10px] uppercase font-bold border px-3 py-1.5 rounded-lg font-semibold tracking-wide ${
                      adminTheme === 'sombre-or' 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}>
                      Enregistrement session : Actif ✔
                    </span>
                  </div>
                </div>

                {/* Sub-container wrapper for the actual active component content */}
                <div className={`rounded-xl border p-6 shadow-sm transition-all duration-300 ${
                  adminTheme === 'sombre-or' 
                    ? 'bg-slate-900 border-amber-500/15 text-slate-100 shadow-amber-950/10 shadow-md' 
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  {adminActiveTab === 'etudiants' && (
                        <EtudiantsTab 
                          etudiants={etudiants}
                          filieres={filieres}
                          classes={classes}
                          onAddEtudiant={handleAddEtudiant}
                          onUpdateEtudiant={handleUpdateEtudiant}
                          onDeleteEtudiant={handleDeleteEtudiant}
                          onDeleteAllEtudiants={handleDeleteAllEtudiants}
                          onAddPaiement={handleAddPaiement}
                          globalFiliereId={globalFiliereId}
                          paiements={paiements}
                          globalAnneeScolaire={globalAnneeScolaire}
                          scolariteAnnuelle={scolariteAnnuelle}
                        />
                      )}

                      {adminActiveTab === 'filieres' && (
                        <FilieresTab 
                          filieres={filieres}
                          etudiants={etudiants}
                          onAddFiliere={handleAddFiliere}
                          onUpdateFiliere={handleUpdateFiliere}
                          onDeleteFiliere={handleDeleteFiliere}
                          matieres={matieres}
                          onAddMatiere={handleAddMatiere}
                          onUpdateMatiere={handleUpdateMatiere}
                          onDeleteMatiere={handleDeleteMatiere}
                          semestres={semestres}
                        />
                      )}

                      {adminActiveTab === 'semestres' && (
                        <SemestresTab 
                          semestres={filteredSemestres}
                          notes={filteredNotes}
                          cours={filteredCours}
                          filieres={filieres}
                          anneesScolaires={anneesScolaires}
                          onAddSemestre={handleAddSemestre}
                          onDeleteSemestre={handleDeleteSemestre}
                        />
                      )}

                      {adminActiveTab === 'cours' && (
                        <CoursTab 
                          cours={filteredCours}
                          filieres={filieres}
                          classes={classes}
                          semestres={filteredSemestres}
                          matieres={matieres}
                          onAddCours={handleAddCours}
                          onUpdateCours={handleUpdateCours}
                          onDeleteCours={handleDeleteCours}
                          globalFiliereId={globalFiliereId}
                          globalSemestreId={globalSemestreId}
                        />
                      )}

                      {adminActiveTab === 'notes' && (
                        <NotesTab 
                          notes={filteredNotes}
                          etudiants={etudiants}
                          cours={filteredCours}
                          semestres={filteredSemestres}
                          matieres={matieres}
                          filieres={filieres}
                          onAddNote={handleAddNote}
                          onAddNotes={handleAddNotesWithCourses}
                          onDeleteNote={handleDeleteNote}
                          onAddCours={handleAddCours}
                          globalFiliereId={globalFiliereId}
                          globalSemestreId={globalSemestreId}
                          onSemestreChange={setGlobalSemestreId}
                          onFiliereChange={setGlobalFiliereId}
                        />
                      )}

                      {adminActiveTab === 'bulletins' && (
                        <BulletinsTab 
                          etudiants={etudiants}
                          notes={filteredNotes}
                          cours={filteredCours}
                          semestres={filteredSemestres}
                          filieres={filieres}
                          classes={classes}
                          matieres={matieres}
                          onUpdateNote={handleUpdateNote}
                          onAddNotes={handleAddNotesWithCourses}
                          onDeleteNote={handleDeleteNote}
                          globalFiliereId={globalFiliereId}
                          globalSemestreId={globalSemestreId}
                          onSemestreChange={setGlobalSemestreId}
                          onFiliereChange={setGlobalFiliereId}
                        />
                      )}

                      {adminActiveTab === 'autorisations' && (
                        <AutorisationsTab 
                          autorisations={autorisations}
                          etudiants={etudiants}
                          filieres={filieres}
                          logs={logs}
                          onAddAutorisation={handleAddAutorisation}
                          onDeleteAutorisation={handleDeleteAutorisation}
                          globalFiliereId={globalFiliereId}
                        />
                      )}

                      {adminActiveTab === 'paiements' && (
                        <PaiementsTab 
                          paiements={paiements}
                          etudiants={etudiants}
                          semestres={filteredSemestres}
                          anneesScolaires={anneesScolaires}
                          onAddAnneeScolaire={(newYr) => {
                            if (newYr && !anneesScolaires.includes(newYr)) {
                              setAnneesScolaires([...anneesScolaires, newYr].sort());
                            }
                          }}
                          scolariteAnnuelle={scolariteAnnuelle}
                          onUpdateScolariteAnnuelle={setScolariteAnnuelle}
                          onAddPaiement={handleAddPaiement}
                          onUpdatePaiementStatus={handleUpdatePaiementStatus}
                          onUpdatePaiement={handleUpdatePaiement}
                          onDeletePaiement={handleDeletePaiement}
                          globalAnneeScolaire={globalAnneeScolaire}
                        />
                      )}

                      {adminActiveTab === 'corbeille' && (
                        <CorbeilleTab 
                          trash={trash}
                          onRestore={handleRestoreItem}
                          onPermanentDelete={handlePermanentDeleteItem}
                          onEmptyTrash={handleEmptyTrash}
                          onRestoreAll={handleRestoreAll}
                        />
                      )}
                </div>
              </div>
            ) : (
              // Standard layout for Dashboard: lateral navigation sidebar + general stats
              <>
                <header className={`border-b px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 transition-all duration-300 ${
                  adminTheme === 'sombre-or' 
                    ? 'bg-slate-900 border-amber-500/20 text-white shadow-amber-950/20 shadow-sm' 
                    : 'bg-white border-gray-150 shadow-sm'
                }`}>
                  <div>
                    <h2 className={`text-lg font-black tracking-tight ${
                      adminTheme === 'sombre-or' ? 'text-amber-400' : 'text-gray-900'
                    }`}>
                      Tableau de Bord Administratif
                    </h2>
                    <p className={`text-xs mt-1 ${
                      adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-gray-500'
                    }`}>Plateforme moderne de gestion scolaire unifiée.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* THÈME TOGGLE SWITCH */}
                    <button
                      type="button"
                      onClick={toggleAdminTheme}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all duration-200 outline-none active:scale-95 cursor-pointer shrink-0 ${
                        adminTheme === 'sombre-or'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-sm shadow-amber-950/20'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                      title={adminTheme === 'sombre-or' ? "Activer le Thème Clair Professionnel" : "Activer le Thème Sombre & Or"}
                    >
                      {adminTheme === 'sombre-or' ? (
                        <>
                          <Moon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>Mode Sombre & Or</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>Mode Clair Pro</span>
                        </>
                      )}
                    </button>

                    {/* SÉLECTEUR GLOBAL D'ANNÉE ACADÉMIQUE */}
                    <div className={`flex items-center border rounded-xl p-0.5 space-x-0.5 shrink-0 transition-opacity duration-300 ${
                      adminTheme === 'sombre-or' ? 'bg-slate-950 border-amber-500/20' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setGlobalAnneeScolaire("2024-2025")}
                        className={`text-[9px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          globalAnneeScolaire === "2024-2025"
                            ? (adminTheme === 'sombre-or' ? "bg-amber-500 text-slate-950 font-black shadow" : "bg-blue-600 text-white shadow")
                            : (adminTheme === 'sombre-or' ? "text-slate-400 hover:text-white" : "text-slate-650 hover:text-slate-900")
                        }`}
                        title="Année Précédente"
                      >
                        Précédent (24-25)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlobalAnneeScolaire("2025-2026")}
                        className={`text-[9px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          globalAnneeScolaire === "2025-2026"
                            ? (adminTheme === 'sombre-or' ? "bg-amber-500 text-slate-950 font-black shadow" : "bg-blue-600 text-white shadow")
                            : (adminTheme === 'sombre-or' ? "text-slate-400 hover:text-white" : "text-slate-650 hover:text-slate-900")
                        }`}
                        title="Année Courante (Active)"
                      >
                        Courant (25-26)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlobalAnneeScolaire("2026-2027")}
                        className={`text-[9px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          globalAnneeScolaire === "2026-2027"
                            ? (adminTheme === 'sombre-or' ? "bg-amber-500 text-slate-950 font-black shadow" : "bg-blue-600 text-white shadow")
                            : (adminTheme === 'sombre-or' ? "text-slate-400 hover:text-white" : "text-slate-650 hover:text-slate-900")
                        }`}
                        title="Année Suivante"
                      >
                        Suivant (26-27)
                      </button>
                    </div>

                    <div className={`flex items-center gap-1 text-[11px] border rounded-lg p-1.5 px-3 transition-colors ${
                      adminTheme === 'sombre-or' ? 'bg-slate-950 border-amber-500/20' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`font-extrabold uppercase tracking-wider ${
                        adminTheme === 'sombre-or' ? 'text-amber-400/80' : 'text-slate-400'
                      }`}>Filière active :</span>
                      <select
                        value={globalFiliereId}
                        onChange={e => setGlobalFiliereId(Number(e.target.value))}
                        className={`bg-transparent border-none text-xs font-bold outline-none cursor-pointer focus:ring-0 p-0 text-ellipsis truncate max-w-[130px] sm:max-w-[260px] ${
                          adminTheme === 'sombre-or' ? 'text-white' : 'text-blue-900'
                        }`}
                      >
                        <option value={0} className={adminTheme === 'sombre-or' ? 'bg-slate-950 text-white' : ''}>Toutes les filières</option>
                        {filieres.map(f => (
                          <option key={f.id} value={f.id} className={adminTheme === 'sombre-or' ? 'bg-slate-950 text-white' : ''}>{f.nom_filiere}</option>
                        ))}
                      </select>
                    </div>

                    <div className={`flex items-center gap-1 text-[11px] border rounded-lg p-1.5 px-3 transition-colors ${
                      adminTheme === 'sombre-or' ? 'bg-slate-950 border-amber-500/20' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`font-extrabold uppercase tracking-wider ${
                        adminTheme === 'sombre-or' ? 'text-amber-400/80' : 'text-slate-400'
                      }`}>Période :</span>
                      <select
                        value={globalSemestreId}
                        onChange={e => setGlobalSemestreId(Number(e.target.value))}
                        className={`bg-transparent border-none text-xs font-bold outline-none cursor-pointer focus:ring-0 p-0 ${
                          adminTheme === 'sombre-or' ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {filteredSemestres.map(s => (
                          <option key={s.id} value={s.id} className={adminTheme === 'sombre-or' ? 'bg-slate-950 text-white' : ''}>{shortenSemester(s.nom_semestre)}</option>
                        ))}
                      </select>
                    </div>

                    <span className={`text-[10px] uppercase font-bold border px-3 py-1 rounded-sm font-semibold tracking-wide ${
                      adminTheme === 'sombre-or' 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                        : 'bg-slate-105 border-slate-200 text-slate-450'
                    }`}>
                      Enregistrement session : Actif ✔
                    </span>
                  </div>
                </header>

                <div className="flex-grow p-6 overflow-y-auto max-w-none w-full mx-auto select-none pb-6 lg:pb-6">
                  <AdminDashboard 
                    etudiants={etudiants} 
                    filieres={filieres} 
                    cours={filteredCours} 
                    notes={filteredNotes} 
                    semestres={filteredSemestres}
                    logs={logs}
                    onNavigate={(tab) => setAdminActiveTab(tab)}
                    globalFiliereId={globalFiliereId}
                    globalSemestreId={globalSemestreId}
                    theme={adminTheme}
                    isPortalLocked={isPortalLocked}
                    onTogglePortalLock={() => setIsPortalLocked(!isPortalLocked)}
                  />
                </div>
              </>
            )}
          </main>
        </div>
      )}

      {/* Admin Sticky Top Navigation Bar for Mobile Phones */}
      {userRole === 'admin' && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 z-50 shadow-[0_4px_16px_rgba(0,0,0,0.30)]">
          <div className="flex justify-between items-center px-4 py-3 h-[60px]">
            <span className="text-white font-extrabold text-xs sm:text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>
                {adminActiveTab === 'dashboard' ? "Admin - Vue d'Ensemble" :
                 adminActiveTab === 'etudiants' ? "Admin - Élèves" :
                 adminActiveTab === 'filieres' ? "Admin - Filières" :
                 adminActiveTab === 'semestres' ? "Admin - Semestres" :
                 adminActiveTab === 'cours' ? "Admin - Supports" :
                 adminActiveTab === 'notes' ? "Admin - Notes" :
                 adminActiveTab === 'bulletins' ? "Admin - Bulletins" :
                 "Admin - Autorisations"}
              </span>
            </span>
            
            {/* Hamburger Menu Icon */}
            <button 
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/60 transition active:scale-95 text-slate-200 outline-none"
              aria-label="Menu"
            >
              {adminMenuOpen ? (
                <X className="w-5 h-5 shrink-0 text-white" />
              ) : (
                <span className="text-xl leading-none font-extrabold">☰</span>
              )}
            </button>
          </div>

          {/* Admin Hamburger Dropdown menu panel */}
          {adminMenuOpen && (
            <div className="absolute top-[60px] left-0 right-0 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl max-h-[75vh] overflow-y-auto py-3 px-4 flex flex-col gap-1 z-50">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold px-2 pb-1.5 border-b border-slate-900 mb-1">
                Espace d'Administration
              </p>
              
              <button 
                onClick={() => { setAdminActiveTab('dashboard'); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Tableau de Bord / Vue d'Ensemble</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('etudiants'); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'etudiants' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Users className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Inscriptions & Gestion Élèves</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('filieres'); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'filieres' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <GraduationCap className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Configuration des Filières</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('semestres'); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'semestres' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Calendar className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Semestres & Cycles</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('cours'); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'cours' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <FileText className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Partage des Supports d'Étude</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('notes'); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'notes' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Award className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Saisie des Notes / Évals</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('bulletins'); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'bulletins' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <BookOpen className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Génération des Bulletins</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('autorisations'); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'autorisations' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Crédits d'Accès Inter-filières</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('paiements'); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'paiements' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <CreditCard className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Gestion des Paiements</span>
              </button>

              <div className="border-t border-slate-900 my-1 pt-1.5 flex flex-col gap-1.5">
                <button 
                  onClick={() => { handleLogout(); setAdminMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition bg-red-950/50 text-red-250 hover:bg-red-900 hover:text-white"
                >
                  <LogOut className="w-4 h-4 shrink-0 text-red-400" />
                  <span>DÉCONNEXION DE SESSION</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. STUDENT PORTAL CONTAINER WRAPPER */}
      {userRole === 'student' && activeStudent && (
        <div className="flex-grow">
          {isPortalLocked ? (
            <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 text-center select-none animate-fade-in">
              <div className="max-w-md bg-slate-950 p-8 rounded-3xl border border-rose-500/20 shadow-2xl shadow-rose-950/20 space-y-6">
                <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Lock className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Espace Étudiant Fermé</h3>
                  <p className="text-xs text-rose-200 leading-relaxed font-semibold">
                    L'accès à l'espace étudiant a été temporairement suspendu par la direction.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Veuillez contacter le secrétariat ou réessayer ultérieurement lorsque l'espace sera réouvert.
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs tracking-wider uppercase transition cursor-pointer"
                >
                  Retourner au portail de connexion
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top banner button to go back or view logs */}
              <div className="bg-slate-950 text-slate-300 p-2.5 px-6 flex justify-between items-center text-xs select-none">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Scolarité d'étude sécurisée connectée l'étudiant
                </span>
              </div>

              <StudentPortal 
                activeStudent={activeStudent}
                etudiants={etudiants}
                notes={filteredNotes}
                cours={filteredCours}
                semestres={filteredSemestres}
                anneesScolaires={anneesScolaires}
                filieres={filieres}
                classes={classes}
                autorisations={autorisations}
                paiements={paiements}
                scolariteAnnuelle={scolariteAnnuelle}
                initialFiliereId={selectedFiliereId}
                onLogAccess={handleLogAccess}
                onUpdatePassword={handleUpdatePassword}
                onLogout={handleLogout}
                globalAnneeScolaire={globalAnneeScolaire}
                onAnneeScolaireChange={setGlobalAnneeScolaire}
              />
            </>
          )}
        </div>
      )}

      {/* Standard bottom footer unrequested info constraint omitted */}
    </div>
  );
}
