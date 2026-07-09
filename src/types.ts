/**
 * Types et Interfaces pour la Plateforme de Gestion Scolaire
 */

export interface Filiere {
  id: number;
  nom_filiere: string;
  description: string;
}

export interface Matiere {
  id: number;
  nom_matiere: string;
  code_matiere: string;
  credits: number;
  filiere_id: number;
  semestre_id?: number;
}

export interface Classe {
  id: number;
  nom_classe: string;
}

export interface Semestre {
  id: number;
  nom_semestre: string;
  annee_scolaire: string;
  filiere_id?: number;
}

export interface Etudiant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: 'M' | 'F';
  date_naissance: string;
  telephone: string;
  email: string;
  adresse: string;
  photo: string; // Base64 or placeholder URL
  filiere_id: number;
  classe_id: number;
  mot_de_passe: string;
  lieu_naissance?: string;
}

export interface Cours {
  id: number;
  titre: string;
  description: string;
  fichier: string; // Filename / Size info
  filiere_id: number;
  classe_id: number;
  semestre_id: number;
  enseignant: string;
  date_ajout: string;
  fichierData?: string; // Base64 data of the uploaded file
  fichierTaille?: string; // Formatted size of the file
}

export interface Note {
  id: number;
  etudiant_id: number;
  cours_id: number;
  semestre_id: number;
  note: number;
  credits: number;
  date_ajout: string;
  note_classe?: number;
  note_examen?: number;
}

export interface AutorisationFiliere {
  id: number;
  etudiant_id: number;
  filiere_id: number;
  date_autorisation: string;
  autorise_par: string;
}

export interface HistoriqueAcces {
  id: number;
  etudiant_id: number;
  filiere_id: number;
  date_acces: string;
}

export interface Bulletin {
  id: number;
  etudiant_id: number;
  semestre_id: number;
  moyenne_generale: number;
  rang: number;
  mention: string;
  decision: 'Validé' | 'Non validé' | 'Admis' | 'Ajourné';
}

export interface Administrateur {
  id: number;
  nom: string;
  email: string;
  mot_de_passe: string;
}

export interface Paiement {
  id: number;
  etudiant_id: number;
  montant: number;
  date_paiement: string;
  type_frais: 'Scolarité' | 'Inscription' | 'Examen' | 'Autre';
  methode: 'Carte' | 'Espèces' | 'Chèque' | 'Virement' | 'Mobile Money';
  statut: 'Payé' | 'En attente' | 'Remboursé';
  recu_numero: string;
  annee_scolaire: string;
  notes?: string;
}

export interface TrashItem {
  id: string; // Unique string built like "{type}-{originalId}"
  itemType: 'filiere' | 'matiere' | 'semestre' | 'etudiant' | 'cours' | 'note' | 'autorisation' | 'paiement';
  itemName: string; // User-friendly description of what was deleted
  originalData: any; // The original JSON object of the deleted item
  deletedAt: string; // Date-time of deletion (ISO string)
}

