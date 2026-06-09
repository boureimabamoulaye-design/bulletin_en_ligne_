import { Filiere, Matiere, Classe, Semestre, Etudiant, Cours, Note, AutorisationFiliere, HistoriqueAcces, Administrateur, Paiement } from './types';

export const INITIAL_MATIERES: Matiere[] = [
  // IG
  { id: 1, nom_matiere: "Algorithmique & Structures de Données", code_matiere: "IG-101", credits: 3, filiere_id: 1 },
  { id: 2, nom_matiere: "Bases de Données Relationnelles & SQL", code_matiere: "IG-201", credits: 3, filiere_id: 1 },
  { id: 3, nom_matiere: "Développement Web PHP-MySQL", code_matiere: "IG-301", credits: 4, filiere_id: 1 },
  { id: 4, nom_matiere: "Analyse Mathématique", code_matiere: "IG-102", credits: 2, filiere_id: 1 },
  // RT
  { id: 5, nom_matiere: "Architecture des Réseaux TCP/IP", code_matiere: "RT-101", credits: 3, filiere_id: 2 },
  { id: 6, nom_matiere: "Administration Système Linux", code_matiere: "RT-201", credits: 3, filiere_id: 2 },
  { id: 7, nom_matiere: "Sécurité & Cryptographie", code_matiere: "RT-301", credits: 4, filiere_id: 2 },
  // CF
  { id: 8, nom_matiere: "Comptabilité Générale Intermédiaire", code_matiere: "CF-101", credits: 4, filiere_id: 3 },
  { id: 9, nom_matiere: "Finance d'Entreprise & Budget", code_matiere: "CF-201", credits: 3, filiere_id: 3 },
  { id: 10, nom_matiere: "Fiscalité & Droit des Affaires", code_matiere: "CF-301", credits: 3, filiere_id: 3 },
  // MD
  { id: 11, nom_matiere: "Stratégie de Content Marketing", code_matiere: "MD-101", credits: 3, filiere_id: 4 },
  { id: 12, nom_matiere: "SEO & Growth Hacking", code_matiere: "MD-201", credits: 3, filiere_id: 4 },
  { id: 13, nom_matiere: "Community Management", code_matiere: "MD-301", credits: 2, filiere_id: 4 }
];

export const INITIAL_FILIERES: Filiere[] = [
  {
    id: 1,
    nom_filiere: "Informatique de Gestion",
    description: "Conception de logiciels, gestion de bases de données et systèmes d'information scolaires et d'entreprises."
  },
  {
    id: 2,
    nom_filiere: "Réseaux et Télécommunications",
    description: "Installation, configuration et sécurisation des infrastructures réseaux modernes."
  },
  {
    id: 3,
    nom_filiere: "Comptabilité et Finance",
    description: "Gestion financière, audit, comptabilité générale et analytique d'entreprise."
  },
  {
    id: 4,
    nom_filiere: "Marketing Digital & Communication",
    description: "Stratégies d'acquisition, création de contenu de marque et gestion des médias sociaux."
  }
];

export const INITIAL_CLASSES: Classe[] = [
  { id: 1, nom_classe: "Niveau 1 (N1)" },
  { id: 2, nom_classe: "Niveau 2 (N2)" },
  { id: 3, nom_classe: "Niveau 3 (N3)" }
];

export const INITIAL_SEMESTRES: Semestre[] = [
  // Informatique de Gestion (IG) - id: 1
  { id: 1, nom_semestre: "Semestre 1 (IG)", annee_scolaire: "2025-2026", filiere_id: 1 },
  { id: 2, nom_semestre: "Semestre 2 (IG)", annee_scolaire: "2025-2026", filiere_id: 1 },
  // Réseaux et Télécommunications (RT) - id: 2
  { id: 3, nom_semestre: "Semestre 1 (RT)", annee_scolaire: "2025-2026", filiere_id: 2 },
  { id: 4, nom_semestre: "Semestre 2 (RT)", annee_scolaire: "2025-2026", filiere_id: 2 },
  // Comptabilité et Finance (CF) - id: 3
  { id: 5, nom_semestre: "Semestre 1 (CF)", annee_scolaire: "2025-2026", filiere_id: 3 },
  { id: 6, nom_semestre: "Semestre 2 (CF)", annee_scolaire: "2025-2026", filiere_id: 3 },
  // Marketing Digital & Communication (MD) - id: 4
  { id: 7, nom_semestre: "Semestre 1 (MD)", annee_scolaire: "2025-2026", filiere_id: 4 },
  { id: 8, nom_semestre: "Semestre 2 (MD)", annee_scolaire: "2025-2026", filiere_id: 4 }
];

export const INITIAL_ADMINS: Administrateur[] = [
  { id: 1, nom: "Administrateur Général", email: "admin@ecole.com", mot_de_passe: "admin123" },
  { id: 2, nom: "Marie Dupont", email: "marie.dupont@ecole.com", mot_de_passe: "admin123" }
];

export const INITIAL_ETUDIANTS: Etudiant[] = [
  {
    id: 1,
    matricule: "ETU20250001",
    nom: "KOUASSI",
    prenom: "Jean-Philippe",
    sexe: "M",
    date_naissance: "2003-04-12",
    telephone: "+225 0707070707",
    email: "jean.kouassi@ecole.com",
    adresse: "Abidjan, Cocody",
    photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150&h=150",
    filiere_id: 1, // Informatique de Gestion
    classe_id: 3, // Niveau 3
    mot_de_passe: "student123"
  },
  {
    id: 2,
    matricule: "ETU20250002",
    nom: "DIALLO",
    prenom: "Aïssatou",
    sexe: "F",
    date_naissance: "2004-09-22",
    telephone: "+224 622000000",
    email: "aissatou.diallo@ecole.com",
    adresse: "Conakry, Dixinn",
    photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=150&h=150",
    filiere_id: 2, // Réseaux et Télécommunications
    classe_id: 1, // Niveau 1
    mot_de_passe: "student123"
  },
  {
    id: 3,
    matricule: "ETU20250003",
    nom: "TRAORE",
    prenom: "Adama",
    sexe: "M",
    date_naissance: "2002-11-05",
    telephone: "+223 76000000",
    email: "adama.traore@ecole.com",
    adresse: "Bamako, Faladié",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    filiere_id: 3, // Comptabilité
    classe_id: 2, // Niveau 2
    mot_de_passe: "student123"
  }
];

export const INITIAL_COURS: Cours[] = [
  // IG
  {
    id: 1,
    titre: "Algorithmique & Structures de Données",
    description: "Concepts de base de l'algorithmique, tableaux, pointeurs et listes chaînées.",
    fichier: "cours_algo_n1.pdf",
    filiere_id: 1,
    classe_id: 1,
    semestre_id: 1,
    enseignant: "Dr. Koné Amadou",
    date_ajout: "2025-09-15"
  },
  {
    id: 2,
    titre: "Bases de Données Relationnelles & SQL",
    description: "Modélisation Conceptuelle (MCD), Normalisation et langage SQL (DDL, DML, DQL).",
    fichier: "cours_sql_n2.pdf",
    filiere_id: 1,
    classe_id: 2,
    semestre_id: 1,
    enseignant: "Mme Barry Fatoumata",
    date_ajout: "2025-09-18"
  },
  {
    id: 3,
    titre: "Développement Web PHP-MySQL",
    description: "Programmation web côté serveur, sessions, formulaires et intégration de base de données.",
    fichier: "php_mysql_complet.pdf",
    filiere_id: 1,
    classe_id: 3,
    semestre_id: 1,
    enseignant: "M. Bourekane Ali",
    date_ajout: "2025-10-02"
  },
  // RT
  {
    id: 4,
    titre: "Architecture des Réseaux TCP/IP",
    description: "Modèle OSI, adressage IP, routage statique, dynamique et protocoles applicatifs.",
    fichier: "reseau_tcpip_intro.pdf",
    filiere_id: 2,
    classe_id: 1,
    semestre_id: 3,
    enseignant: "Ing. Touré Aly",
    date_ajout: "2025-09-20"
  },
  {
    id: 5,
    titre: "Administration Système Linux",
    description: "Ligne de commande bash, gestion des utilisateurs, droits de fichiers, services SSH et Web.",
    fichier: "admin_linux_tuto.pdf",
    filiere_id: 2,
    classe_id: 2,
    semestre_id: 4,
    enseignant: "M. Cissé Ibrahim",
    date_ajout: "2026-02-10"
  },
  // CF
  {
    id: 6,
    titre: "Comptabilité Générale Intermédiaire",
    description: "Enregistrement des opérations courantes, TVA, bilan et compte de résultat.",
    fichier: "compta_generale_n1.pdf",
    filiere_id: 3,
    classe_id: 1,
    semestre_id: 5,
    enseignant: "Prof. Sylla Moussa",
    date_ajout: "2025-09-22"
  }
];

export const INITIAL_NOTES: Note[] = [
  // Student 1 (Jean-Philippe) in IG courses
  { id: 1, etudiant_id: 1, cours_id: 2, semestre_id: 1, note: 15.5, credits: 3, date_ajout: "2026-01-15" },
  { id: 2, etudiant_id: 1, cours_id: 3, semestre_id: 1, note: 17.0, credits: 4, date_ajout: "2026-01-20" },
  
  // Student 2 (Aissatou) in RT courses
  { id: 3, etudiant_id: 2, cours_id: 4, semestre_id: 3, note: 14.0, credits: 3, date_ajout: "2026-01-18" },
  
  // Student 3 (Adama) in CF courses
  { id: 4, etudiant_id: 3, cours_id: 6, semestre_id: 5, note: 11.5, credits: 4, date_ajout: "2026-01-19" }
];

export const INITIAL_AUTORISATIONS: AutorisationFiliere[] = [
  { id: 1, etudiant_id: 3, filiere_id: 1, date_autorisation: "2026-03-01", autorise_par: "Administrateur Général" } // Student 3 (Finance) can access Informatique
];

export const INITIAL_ACCES_LOGS: HistoriqueAcces[] = [
  { id: 1, etudiant_id: 3, filiere_id: 1, date_acces: "2026-03-05 14:32:10" },
  { id: 2, etudiant_id: 3, filiere_id: 1, date_acces: "2026-04-12 09:15:33" }
];

export const INITIAL_PAIEMENTS: Paiement[] = [
  { id: 1, etudiant_id: 1, montant: 450000, date_paiement: "2025-09-05", type_frais: "Inscription", methode: "Espèces", statut: "Payé", recu_numero: "REC-2025-001", annee_scolaire: "2025-2026", notes: "Frais d'inscription de rentrée" },
  { id: 2, etudiant_id: 1, montant: 1200000, date_paiement: "2025-10-10", type_frais: "Scolarité", methode: "Mobile Money", statut: "Payé", recu_numero: "REC-2025-014", annee_scolaire: "2025-2026", notes: "Premier versement scolarité semestrielle L3" },
  { id: 3, etudiant_id: 2, montant: 450000, date_paiement: "2025-09-06", type_frais: "Inscription", methode: "Virement", statut: "Payé", recu_numero: "REC-2025-002", annee_scolaire: "2025-2026", notes: "Virement bancaire de rentrée L2" },
  { id: 4, etudiant_id: 2, montant: 1200000, date_paiement: "2025-10-15", type_frais: "Scolarité", methode: "Chèque", statut: "Payé", recu_numero: "REC-2025-022", annee_scolaire: "2025-2026", notes: "Chèque d'acompte scolarité" },
  { id: 5, etudiant_id: 3, montant: 400000, date_paiement: "2025-09-08", type_frais: "Inscription", methode: "Mobile Money", statut: "Payé", recu_numero: "REC-2025-003", annee_scolaire: "2025-2026", notes: "Frais inscription L1" },
  { id: 6, etudiant_id: 3, montant: 950000, date_paiement: "2026-03-05", type_frais: "Scolarité", methode: "Espèces", statut: "En attente", recu_numero: "REC-2026-081", annee_scolaire: "2025-2026", notes: "Deuxième tranche en attente de validation comptable" }
];

