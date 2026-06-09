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
  BookOpen, LogOut, Terminal, LayoutDashboard, Key, Shield, Info, Lightbulb,
  ArrowLeft, Menu, X, CreditCard, DollarSign, Trash2
} from 'lucide-react';

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
    return saved ? JSON.parse(saved) : INITIAL_ETUDIANTS;
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
  
  // Navigation
  const [adminActiveTab, setAdminActiveTab] = useState<string>('dashboard');
  const [showCodeExplorer, setShowCodeExplorer] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // Login credentials states
  const [loginRole, setLoginRole] = useState<'admin' | 'student'>('admin');
  const [usernameInput, setUsernameInput] = useState('admin@ecole.com'); // Prefilled for easy dev testing
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [selectedFiliereId, setSelectedFiliereId] = useState<number>(1); // Default to first filiere to ensure easy experience
  const [loginError, setLoginError] = useState<string>('');

  React.useEffect(() => {
    setLoginError('');
  }, [usernameInput, passwordInput, loginRole, selectedFiliereId]);

  // Multi-admin addition state
  const [adminList, setAdminList] = useState<Administrateur[]>(() => {
    const saved = localStorage.getItem('school_admins');
    return saved ? JSON.parse(saved) : INITIAL_ADMINS;
  });
  const [newAdminNom, setNewAdminNom] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [showAdminForm, setShowAdminForm] = useState(false);

  // Global filters for the Administrator workspace
  const [globalFiliereId, setGlobalFiliereId] = useState<number>(0);
  const [globalSemestreId, setGlobalSemestreId] = useState<number>(INITIAL_SEMESTRES[0]?.id || 0);

  const [globalAnneeScolaire, setGlobalAnneeScolaire] = useState<string>(() => {
    return localStorage.getItem('school_global_annee_scolaire') || "2025-2026";
  });

  React.useEffect(() => {
    localStorage.setItem('school_global_annee_scolaire', globalAnneeScolaire);
  }, [globalAnneeScolaire]);

  // Filtered lists based on globally selected academic year
  const filteredSemestres = React.useMemo(() => {
    return semestres.filter(s => s.annee_scolaire === globalAnneeScolaire);
  }, [semestres, globalAnneeScolaire]);

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
      id: adminList.length + 1,
      nom: newAdminNom,
      email: newAdminEmail,
      mot_de_passe: newAdminPass
    }]);
    setNewAdminNom("");
    setNewAdminEmail("");
    setNewAdminPass("");
    setShowAdminForm(false);
    alert("Compte Administrateur enregistré avec succès !");
  };

  // --- LOGIN VALIDATION ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginRole === 'admin') {
      const foundAdmin = adminList.find(a => a.email.toLowerCase() === usernameInput.toLowerCase() && a.mot_de_passe === passwordInput);
      if (foundAdmin) {
        setLoginError('');
        setUserRole('admin');
        setActiveAdminName(foundAdmin.nom);
        setAdminActiveTab('dashboard');
      } else {
        setLoginError("Adresse E-mail ou Mot de passe Administrateur incorrect. Saisissez admin@ecole.com et admin123 pour tester.");
      }
    } else {
      const foundStudent = etudiants.find(e => e.matricule.toUpperCase() === usernameInput.toUpperCase() && e.mot_de_passe === passwordInput);
      if (foundStudent) {
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
    setShowCodeExplorer(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans overflow-x-hidden relative" id="layout-app-root">
      
      {/* 1. VISITOR / AUTHENTICATION LANDING SCREEN */}
      {userRole === 'guest' && (
        <div className="flex-grow flex items-center justify-center p-4 md:p-8" id="guest-screen-parent">
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-150 grid grid-cols-1 lg:grid-cols-12">
            
            {/* Informational banner left */}
            <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-blue-850 to-slate-900 p-8 md:p-12 text-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl text-blue-900 font-extrabold text-xl flex items-center justify-center shadow">GS</div>
                  <h1 className="font-extrabold text-lg tracking-tight">EcolePortail</h1>
                </div>

                <div className="mt-8 space-y-4">
                  <h2 className="text-xl md:text-2xl font-black leading-tight">Système unifié de Gestion Académique</h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Une solution professionnelle développée selon un cahier des charges strict : 
                    PHP procédural sécurisé, stockage relationnel optimisé incluant des semestres paramétrables et des autorisations d'accès partagées.
                  </p>
                </div>
              </div>

              {/* PHP Code Info card */}
              <div className="bg-white/10 p-5 rounded-2xl border border-white/10 mt-8">
                <div className="flex items-center gap-2 mb-2 text-blue-300">
                  <Terminal className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Explorateur PHP intégré</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Consultez à tout moment le code source PHP et SQL natif correspondant à chaque écran pour votre hébergement final ! Les fichiers réels sont disponibles sous <code className="bg-slate-950 px-1 py-0.5 rounded text-white text-[10px]">/school_php</code>.
                </p>
              </div>
            </div>

            {/* Standard Login right */}
            <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Portail de Connexion</h3>
              <p className="text-xs text-slate-500 mt-1">Saisissez vos identifiants pour rejoindre l'établissement scolaire.</p>

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
                      onClick={() => { setLoginRole('student'); setUsernameInput('ETU20250001'); setPasswordInput('student123'); setSelectedFiliereId(1); }}
                      className={`py-3 text-center rounded-xl border font-bold transition flex items-center justify-center gap-2 ${loginRole === 'student' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-slate-705 hover:bg-gray-100'}`}
                    >
                      <Users className="w-4 h-4" />
                      Espace Étudiant
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setLoginRole('admin'); setUsernameInput('admin@ecole.com'); setPasswordInput('admin123'); }}
                      className={`py-3 text-center rounded-xl border font-bold transition flex items-center justify-center gap-2 ${loginRole === 'admin' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-805' : 'border-gray-200 text-slate-705 hover:bg-gray-100'}`}
                    >
                      <Key className="w-4 h-4" />
                      Administration
                    </button>
                  </div>
                </div>

                {/* Dropdown for Student Filière Selection */}
                {loginRole === 'student' && (
                  <div id="filiere-login-dropdown-wrapper">
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-900" />
                      Sélectionner votre Filière Académique <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedFiliereId}
                      onChange={e => setSelectedFiliereId(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-600 text-slate-900 bg-white text-xs font-bold"
                      required
                    >
                      <option value="">-- Choisir une filière --</option>
                      {filieres.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.nom_filiere}
                        </option>
                      ))}
                    </select>
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
                    placeholder={loginRole === 'admin' ? "Ex: admin@ecole.com" : "Ex: ETU20250001"}
                    className="form-control.text-sm w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-600 text-slate-900 bg-white"
                    required
                  />
                </div>

                {/* Password field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Mot de passe de sécurité</label>
                  </div>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Enter security password"
                    className="form-control.text-sm w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-600 text-slate-900 bg-white"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2"
                >
                  Confirmer et se connecter
                </button>
              </form>

              {/* Developer Assist presets */}
              <div className="mt-8 pt-6 border-t border-gray-150">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  Gabarits Rapides de Démonstration (Bac à sable)
                </span>
                
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <button 
                    onClick={() => handleQuickLogin('admin', 'admin@ecole.com', 'admin123')}
                    className="p-2 border rounded-lg hover:bg-blue-50 text-left transition flex justify-between items-center bg-gray-50 text-slate-700"
                  >
                    <span>🔑 Direct: <strong>Admin général</strong></span>
                    <span className="text-[10px] text-gray-400 bg-white border px-1.5 rounded font-mono">admin123</span>
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('student', 'ETU20250001', 'student123')}
                    className="p-2 border rounded-lg hover:bg-blue-50 text-left transition flex justify-between items-center bg-gray-50 text-slate-700"
                  >
                    <span>🎓 Direct: <strong>Élève (Philippe)</strong></span>
                    <span className="text-[10px] text-gray-400 bg-white border px-1.5 rounded font-mono">student123</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 2. ADMIN PANEL CONTAINER WRAPPER */}
      {userRole === 'admin' && (
        <div className={`flex-grow flex pt-[60px] lg:pt-0 ${(adminActiveTab !== 'dashboard' || showCodeExplorer) ? 'flex-col bg-slate-50' : 'flex-col lg:flex-row'}`} id="admin-workspace-layer">
          
          {/* Main Lateral Sidebar as requested ("Menu latéral") */}
          {(adminActiveTab === 'dashboard' && !showCodeExplorer) && (
            <aside className="hidden lg:flex w-full lg:w-64 bg-slate-900 text-slate-100 shrink-0 flex-col justify-between border-r border-slate-800 p-4">
            <div>
              {/* Brand icon */}
              <div className="logo-area flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
                <div className="w-9 h-9 bg-white text-slate-900 rounded-lg flex items-center justify-center font-black text-lg">GS</div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight text-white">Scolaire Direction</h3>
                  <span className="text-[10px] text-gray-400">Rôle : Administration</span>
                </div>
              </div>

              {/* Navigation Menu Links */}
              <nav>
                <ul className="space-y-1">
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('dashboard'); setShowCodeExplorer(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${adminActiveTab === 'dashboard' && !showCodeExplorer ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Vue d'Ensemble
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('etudiants'); setShowCodeExplorer(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${adminActiveTab === 'etudiants' && !showCodeExplorer ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      <Users className="w-4 h-4" />
                      Gestion Étudiants
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('filieres'); setShowCodeExplorer(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${adminActiveTab === 'filieres' && !showCodeExplorer ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      Filières Académiques
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('semestres'); setShowCodeExplorer(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${adminActiveTab === 'semestres' && !showCodeExplorer ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      <Calendar className="w-4 h-4" />
                      Semestres d'Études
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('cours'); setShowCodeExplorer(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${adminActiveTab === 'cours' && !showCodeExplorer ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      <FileText className="w-4 h-4" />
                      Supports de Cours
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('notes'); setShowCodeExplorer(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${adminActiveTab === 'notes' && !showCodeExplorer ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      <Award className="w-4 h-4" />
                      Saisie des Notes
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('bulletins'); setShowCodeExplorer(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${adminActiveTab === 'bulletins' && !showCodeExplorer ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      <BookOpen className="w-4 h-4" />
                      Génération Bulletins
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('autorisations'); setShowCodeExplorer(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${adminActiveTab === 'autorisations' && !showCodeExplorer ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Autorisations d'Accès
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('paiements'); setShowCodeExplorer(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${adminActiveTab === 'paiements' && !showCodeExplorer ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Gestion des Paiements
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setAdminActiveTab('corbeille'); setShowCodeExplorer(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition ${adminActiveTab === 'corbeille' && !showCodeExplorer ? 'bg-red-650 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-red-400'}`}
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      Corbeille ({trash.length})
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Quick Administrator credentials panel */}
            <div className="mt-8 border-t border-slate-800 pt-4">
              <span className="text-[10px] text-gray-500 uppercase block tracking-wider font-bold mb-2">Administrateurs :</span>
              <div className="flex flex-col gap-1 text-[11px] text-gray-400 mb-3">
                {adminList.map(adm => (
                  <div key={adm.id} className="flex justify-between items-center py-1">
                    <span className="text-slate-200 truncate pr-2">👤 {adm.nom}</span>
                    <span className="text-[9px] text-gray-500 truncate">{adm.email}</span>
                  </div>
                ))}
              </div>

              {!showAdminForm ? (
                <button 
                  onClick={() => setShowAdminForm(true)}
                  className="w-full text-center py-1 bg-slate-800 text-slate-200 rounded text-[10px] font-bold"
                >
                  + Ajouter un Admin
                </button>
              ) : (
                <form onSubmit={handleAddAdmin} className="space-y-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px]">
                  <input 
                    type="text" 
                    placeholder="Nom"
                    value={newAdminNom}
                    onChange={e => setNewAdminNom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-2 py-1 text-slate-100 outline-none"
                    required
                  />
                  <input 
                    type="email" 
                    placeholder="Email"
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
                  <div className="flex gap-1 justify-end">
                    <button type="button" onClick={() => setShowAdminForm(false)} className="text-gray-400 p-1">Annuler</button>
                    <button type="submit" className="text-blue-400 font-bold p-1">Créer</button>
                  </div>
                </form>
              )}

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
            </div>
          </aside>
          )}

          {/* Right Work Panel layout */}
          <main className="flex-1 flex flex-col min-w-0">
            {adminActiveTab !== 'dashboard' || showCodeExplorer ? (
              // Focused full-screen workspace layout for deep work on any individual tab
              <div className="flex-grow p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto select-none animate-fade-in space-y-6 pb-8 md:pb-8">
                
                {/* Custom minimalist path header with back button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-150 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setAdminActiveTab('dashboard');
                        setShowCodeExplorer(false);
                      }} 
                      className="group flex items-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md whitespace-nowrap shrink-0"
                      id="btn-back-to-dashboard"
                    >
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      <span>Retour Tableau de Bord</span>
                    </button>
                    <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                    <div>
                      <h2 className="text-sm font-black text-slate-905 tracking-tight uppercase">
                        {showCodeExplorer ? "Explorateur de Code PHP & SQL Natifs" : (
                          <>
                            {adminActiveTab === 'etudiants' && "Inscriptions & Gestion Élèves"}
                            {adminActiveTab === 'filieres' && "Modélisation des Filières Académiques"}
                            {adminActiveTab === 'semestres' && "Gestion des Périodes Pédagogiques"}
                            {adminActiveTab === 'cours' && "Supports Didactiques Multi-Filières"}
                            {adminActiveTab === 'notes' && "Gestionnaire de Bulletins & Notes"}
                            {adminActiveTab === 'bulletins' && "Génération Dynamique de Bulletins"}
                            {adminActiveTab === 'autorisations' && "Liaisons Inter-parcours & Droits"}
                            {adminActiveTab === 'paiements' && "Suivi Énergique des Paiements"}
                            {adminActiveTab === 'corbeille' && "Corbeille & Récupération de Données"}
                          </>
                        )}
                      </h2>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                        {showCodeExplorer ? "Aperçu de la structure et du code source exact des fichiers PHP et SQL réels." : (
                          <>
                            {adminActiveTab === 'etudiants' && "Registre de gestion des élèves, classes et parcours."}
                            {adminActiveTab === 'filieres' && "Configuration des filières et définition des matières pédagogiques par filière."}
                            {adminActiveTab === 'semestres' && "Suivi temporel, définition des années scolaires et des semestres d'évaluation."}
                            {adminActiveTab === 'cours' && "Partage, catégorisation et mise en ligne des supports d'études par matière."}
                            {adminActiveTab === 'notes' && "Saisie des évaluations et notes d'examen par matière."}
                            {adminActiveTab === 'bulletins' && "Visualisation et édition des relevés de notes semestriels."}
                            {adminActiveTab === 'autorisations' && "Accréditations exceptionnelles d'accès de consultation inter-filières pour étudiants."}
                            {adminActiveTab === 'paiements' && "Suivi de la scolarité et encaissement des frais scolaires."}
                            {adminActiveTab === 'corbeille' && "Restaurez ou purgez définitivement vos enregistrements supprimés."}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* SÉLECTEUR GLOBAL D'ANNÉE ACADÉMIQUE */}
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 space-x-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setGlobalAnneeScolaire("2024-2025")}
                        className={`text-[9px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          globalAnneeScolaire === "2024-2025"
                            ? "bg-blue-600 text-white shadow"
                            : "text-slate-650 hover:text-slate-900 hover:bg-white/50"
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
                            ? "bg-blue-600 text-white shadow"
                            : "text-slate-650 hover:text-slate-900 hover:bg-white/50"
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
                            ? "bg-blue-600 text-white shadow"
                            : "text-slate-650 hover:text-slate-900 hover:bg-white/50"
                        }`}
                        title="Année Suivante"
                      >
                        Suivant (26-27)
                      </button>
                    </div>

                    {/* Global Filters on Active Deep Workspace */}
                    {!showCodeExplorer && adminActiveTab !== 'dashboard' && (
                      <>
                        <div className="flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-3">
                          <span className="font-extrabold uppercase text-slate-400 tracking-wider">Filière active :</span>
                          <select
                            value={globalFiliereId}
                            onChange={e => setGlobalFiliereId(Number(e.target.value))}
                            className="bg-transparent border-none text-xs font-bold text-blue-900 outline-none cursor-pointer focus:ring-0 p-0 text-ellipsis truncate max-w-[160px]"
                          >
                            <option value={0}>Toutes les filières</option>
                            {filieres.map(f => (
                              <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-3">
                          <span className="font-extrabold uppercase text-slate-400 tracking-wider">Période :</span>
                          <select
                            value={globalSemestreId}
                            onChange={e => setGlobalSemestreId(Number(e.target.value))}
                            className="bg-transparent border-none text-xs font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 p-0"
                          >
                            <option value={0}>Toutes les périodes</option>
                            {filteredSemestres
                              .filter(s => !globalFiliereId || Number(s.filiere_id) === Number(globalFiliereId))
                              .map(s => (
                                <option key={s.id} value={s.id}>{s.nom_semestre}</option>
                              ))}
                          </select>
                        </div>
                      </>
                    )}

                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold tracking-wide">
                      Enregistrement session : Actif ✔
                    </span>
                  </div>
                </div>

                {/* Sub-container wrapper for the actual active component content */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  {adminActiveTab === 'etudiants' && (
                        <EtudiantsTab 
                          etudiants={etudiants}
                          filieres={filieres}
                          classes={classes}
                          onAddEtudiant={handleAddEtudiant}
                          onUpdateEtudiant={handleUpdateEtudiant}
                          onDeleteEtudiant={handleDeleteEtudiant}
                          onAddPaiement={handleAddPaiement}
                          globalFiliereId={globalFiliereId}
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
                        />
                      )}
                </div>
              </div>
            ) : (
              // Standard layout for Dashboard: lateral navigation sidebar + general stats
              <>
                <header className="bg-white border-b border-gray-150 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                  <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">
                      Tableau de Bord Administratif
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Plateforme moderne de gestion scolaire unifiée.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* SÉLECTEUR GLOBAL D'ANNÉE ACADÉMIQUE */}
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 space-x-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setGlobalAnneeScolaire("2024-2025")}
                        className={`text-[9px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          globalAnneeScolaire === "2024-2025"
                            ? "bg-blue-600 text-white shadow"
                            : "text-slate-650 hover:text-slate-900 hover:bg-white/50"
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
                            ? "bg-blue-600 text-white shadow"
                            : "text-slate-650 hover:text-slate-900 hover:bg-white/50"
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
                            ? "bg-blue-600 text-white shadow"
                            : "text-slate-650 hover:text-slate-900 hover:bg-white/50"
                        }`}
                        title="Année Suivante"
                      >
                        Suivant (26-27)
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-3">
                      <span className="font-extrabold uppercase text-slate-400 tracking-wider">Filière active :</span>
                      <select
                        value={globalFiliereId}
                        onChange={e => setGlobalFiliereId(Number(e.target.value))}
                        className="bg-transparent border-none text-xs font-bold text-blue-900 outline-none cursor-pointer focus:ring-0 p-0 text-ellipsis truncate max-w-[160px]"
                      >
                        <option value={0}>Toutes les filières</option>
                        {filieres.map(f => (
                          <option key={f.id} value={f.id}>{f.nom_filiere}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-3">
                      <span className="font-extrabold uppercase text-slate-400 tracking-wider">Période :</span>
                      <select
                        value={globalSemestreId}
                        onChange={e => setGlobalSemestreId(Number(e.target.value))}
                        className="bg-transparent border-none text-xs font-bold text-slate-800 outline-none cursor-pointer focus:ring-0 p-0"
                      >
                        {filteredSemestres.map(s => (
                          <option key={s.id} value={s.id}>{s.nom_semestre}</option>
                        ))}
                      </select>
                    </div>

                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-105 border border-slate-200 px-3 py-1 rounded-sm font-semibold tracking-wide">
                      Enregistrement session : Actif ✔
                    </span>
                  </div>
                </header>

                <div className="flex-grow p-6 overflow-y-auto max-w-7xl w-full mx-auto select-none pb-6 lg:pb-6">
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
                {showCodeExplorer ? "Code Source PHP/SQL" :
                 adminActiveTab === 'dashboard' ? "Admin - Vue d'Ensemble" :
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
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/60 transition active:scale-95 text-slate-200 outline-none"
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
                onClick={() => { setAdminActiveTab('dashboard'); setShowCodeExplorer(false); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'dashboard' && !showCodeExplorer ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Tableau de Bord / Vue d'Ensemble</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('etudiants'); setShowCodeExplorer(false); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'etudiants' && !showCodeExplorer ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Users className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Inscriptions & Gestion Élèves</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('filieres'); setShowCodeExplorer(false); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'filieres' && !showCodeExplorer ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <GraduationCap className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Configuration des Filières</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('semestres'); setShowCodeExplorer(false); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'semestres' && !showCodeExplorer ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Calendar className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Semestres & Cycles</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('cours'); setShowCodeExplorer(false); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'cours' && !showCodeExplorer ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <FileText className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Partage des Supports d'Étude</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('notes'); setShowCodeExplorer(false); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'notes' && !showCodeExplorer ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Award className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Saisie des Notes / Évals</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('bulletins'); setShowCodeExplorer(false); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'bulletins' && !showCodeExplorer ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <BookOpen className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Génération des Bulletins</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('autorisations'); setShowCodeExplorer(false); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'autorisations' && !showCodeExplorer ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Crédits d'Accès Inter-filières</span>
              </button>

              <button 
                onClick={() => { setAdminActiveTab('paiements'); setShowCodeExplorer(false); setAdminMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-bold transition ${adminActiveTab === 'paiements' && !showCodeExplorer ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-300 hover:bg-slate-800'}`}
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
          {/* Top banner button to go back or view logs */}
          <div className="bg-slate-950 text-slate-300 p-2.5 px-6 flex justify-between items-center text-xs select-none">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Scolarité d'étude sécurisée connectée l'étudiant
            </span>
            <div className="flex gap-2">
              <button 
                onClick={handleLogout}
                className="bg-red-650/40 hover:bg-slate-800 hover:text-red-400 p-1 px-2.5 rounded font-black transition cursor-pointer"
              >
                Sortir de session
              </button>
            </div>
          </div>

          <StudentPortal 
            activeStudent={activeStudent}
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
        </div>
      )}

      {/* Standard bottom footer unrequested info constraint omitted */}
    </div>
  );
}
