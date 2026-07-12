import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import { BookOpen, FileText, HardDrive, HelpCircle, Download, CheckCircle2, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface GuideTabProps {
  adminTheme?: 'sombre-or' | 'clair-pro';
  lastSaved?: string | null;
  isLoadedFromDb?: boolean;
}

export default function GuideTab({ adminTheme = 'sombre-or', lastSaved, isLoadedFromDb }: GuideTabProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const generatePDFGuide = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Colors
      const primaryColor = [197, 168, 128]; // Golden #c5a880
      const secondaryColor = [20, 26, 46]; // Deep Slate #141a2e
      const textDark = [31, 41, 55]; // Charcoal Gray
      const lightGray = [243, 244, 246];

      // Total pages count tracker for footers
      let currentPage = 1;

      const drawHeaderFooter = (pageNum: number) => {
        // Page border decoration
        doc.setDrawColor(220, 225, 230);
        doc.setLineWidth(0.3);
        doc.line(15, 15, 195, 15); // Top header line
        doc.line(15, 280, 195, 280); // Bottom footer line

        // Header text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 110, 125);
        doc.text("PLATEFORME DE GESTION SCOLAIRE UNIFIÉE - SQL", 15, 12);
        doc.setFont("helvetica", "italic");
        doc.text("Guide de l'Utilisateur & Manuel de Fonctionnement", 195, 12, { align: "right" });

        // Footer text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 155, 165);
        const dateStr = new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.text(`Document généré le ${dateStr}`, 15, 285);
        doc.text(`Page ${pageNum} sur 3`, 195, 285, { align: "right" });
      };

      // ----------------- PAGE 1 -----------------
      // Draw Page 1 header/footer
      drawHeaderFooter(1);

      // Title Block
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.rect(15, 22, 180, 45, "F");

      // Title inner text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("MANUEL DE FONCTIONNEMENT", 105, 38, { align: "center" });
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Guide Complet d'Administration de la Plateforme Scolaire", 105, 48, { align: "center" });
      doc.setFontSize(9);
      doc.setTextColor(150, 160, 180);
      doc.text("Version 1.0 (Édition Spéciale) - Base de Données SQL SQLite Intégrée", 105, 56, { align: "center" });

      // Introduction
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("1. INTRODUCTION ET VUE D'ENSEMBLE", 15, 80);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(15, 83, 100, 83);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      
      const introText = "Bienvenue sur votre Plateforme Moderne de Gestion Scolaire. Cette solution logicielle " +
        "unifiée a été spécifiquement conçue pour optimiser l'administration quotidienne, le pilotage académique " +
        "et la transparence financière de votre établissement. Elle réunit en un seul espace de travail intuitif " +
        "toutes les fonctionnalités indispensables : le registre d'inscription des élèves, la modélisation des " +
        "filières pédagogiques, la saisie des notes d'examens, le calcul automatique des moyennes pondérées par " +
        "coefficient, l'émission de bulletins scolaires complets, le partage de ressources numériques, ainsi que " +
        "la comptabilisation des frais de scolarité.";
      
      const introLines = doc.splitTextToSize(introText, 180);
      doc.text(introLines, 15, 90);

      // Storage block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("2. ARCHITECTURE & STOCKAGE DES DONNÉES (SQL)", 15, 142);
      doc.line(15, 145, 120, 145);

      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, 150, 180, 68, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(180, 120, 30); // Golden-orange tone
      doc.text("Où sont stockées vos données personnelles et académiques ?", 20, 157);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      
      const storageDetail = "Toutes les informations gérées sur la plateforme (élèves, administrateurs, filières, " +
        "matières, cours, notes, paiements et corbeille) sont stockées de façon sécurisée et structurée " +
        "dans une base de données relationnelle locale SQLite (fichier physique nommé 'school.db') hébergée sur " +
        "le serveur actif de l'application.\n\n" +
        "Double Synchronisation en Temps Réel :\n" +
        "1. Pour garantir une rapidité absolue et éviter les ralentissements réseau, l'application effectue " +
        "d'abord une persistance instantanée de votre session dans le stockage local de votre navigateur (localStorage).\n" +
        "2. Simultanément, toutes les actions d'écriture, de modification ou de suppression déclenchent une " +
        "requête asynchrone sécurisée vers le serveur Node.js, qui met à jour en temps réel la base de données SQL " +
        "(school.db) via un mécanisme d'écriture transactionnelle robuste.";

      const storageLines = doc.splitTextToSize(storageDetail, 170);
      doc.text(storageLines, 20, 164);

      // Warning block on Page 1
      doc.setFillColor(254, 243, 199); // light yellow
      doc.setDrawColor(251, 191, 36); // amber border
      doc.setLineWidth(0.5);
      doc.rect(15, 226, 180, 22, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(146, 64, 14); // amber-900
      doc.text("TÉMOIN VISUEL DE SÉCURITÉ :", 20, 232);
      doc.setFont("helvetica", "normal");
      doc.text("Un voyant lumineux situé en haut à droite de l'interface admin vous indique en temps réel l'état " +
        "de synchronisation avec le serveur SQL (Vert : Connecté et sauvegardé, Orange : Sauvegarde en cours...).", 20, 238);


      // ----------------- PAGE 2 -----------------
      doc.addPage();
      currentPage++;
      drawHeaderFooter(currentPage);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("3. GUIDE PAS-À-PAS DES MODULES FONCTIONNELS", 15, 25);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(15, 28, 125, 28);

      const modules = [
        {
          title: "A. Tableau de Bord & Historique (Dashboard)",
          desc: "Centralise l'état global de l'établissement sous forme de cartes d'indicateurs de performance (KPIs) : effectifs, taux de réussite, et comptabilité. Il intègre un graphique de répartition des filières et un journal d'activité de sécurité retraçant les accès."
        },
        {
          title: "B. Inscription et Gestion des Étudiants",
          desc: "Dans cet onglet, vous pouvez inscrire un nouvel élève en lui attribuant un matricule unique, une classe d'étude, une filière et l'année scolaire de départ. Le système calcule automatiquement la scolarité due. Vous pouvez également rechercher, modifier ou mettre à la corbeille les fiches étudiants."
        },
        {
          title: "C. Modélisation des Filières Académiques & Matières",
          desc: "Modélisez l'offre de formation de votre établissement. Créez des filières spécifiques (ex: Gestion, Génie Logiciel) et affectez-y des matières pédagogiques avec leur coefficient d'examen (ex: 2, 3, 5) et le nom de l'enseignant titulaire."
        },
        {
          title: "D. Gestion du Calendrier et des Semestres",
          desc: "Configurez les périodes d'évaluation académique (Semestres) et associez-les aux filières correspondantes afin de diviser proprement l'année scolaire en cycles d'évaluation distincts."
        },
        {
          title: "E. Saisie des Notes d'Évaluation",
          desc: "Saisissez les notes de devoirs et d'examens (notées sur 20) pour chaque étudiant. L'interface filtre intelligemment les étudiants éligibles par classe, matière, et semestre pour une saisie fluide et exempte d'erreurs."
        }
      ];

      let currentY = 36;
      modules.forEach(mod => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(mod.title, 15, currentY);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        const lines = doc.splitTextToSize(mod.desc, 180);
        doc.text(lines, 15, currentY + 4.5);
        
        currentY += 10 + (lines.length * 4);
      });


      // ----------------- PAGE 3 -----------------
      doc.addPage();
      currentPage++;
      drawHeaderFooter(currentPage);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("3. GUIDE PAS-À-PAS DES MODULES FONCTIONNELS (SUITE)", 15, 25);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(15, 28, 145, 28);

      const modulesPage3 = [
        {
          title: "F. Génération Dynamique des Bulletins Scolaires",
          desc: "Cette interface calcule instantanément les moyennes des étudiants en fonction des coefficients des matières. Elle génère un relevé de notes au design professionnel, attribue automatiquement les mentions (Excellent, Bien, Passable, etc.), évalue l'admission au semestre et offre un bouton d'impression directe au format papier ou PDF."
        },
        {
          title: "G. Partage de Supports Didactiques",
          desc: "Permet aux enseignants et administrateurs d'uploader ou de référencer des supports de cours (documents, fiches d'exercices ou liens web) triés par matière et niveau de classe pour que les étudiants puissent y accéder."
        },
        {
          title: "H. Autorisations Spéciales d'Accès",
          desc: "Pour les parcours transversaux, accordez temporairement ou de façon permanente à un étudiant inscrit dans une filière spécifique le droit de consulter les cours et les notes d'une filière secondaire sans perturber ses inscriptions principales."
        },
        {
          title: "I. Suivi des Frais de Scolarité & Paiements",
          desc: "Ajustez le montant de la scolarité globale annuelle de l'école. Enregistrez les règlements des étudiants par tranches de paiement. Le module fournit un bilan clair par élève (Montant versé, Reste à payer, État : Payé / Partiel / Non Payé)."
        },
        {
          title: "J. Corbeille et Sécurité anti-perte",
          desc: "Tous les éléments supprimés (étudiants, filières, cours) sont temporairement placés dans la corbeille. Cela permet de restaurer une donnée supprimée par inadvertance en un clic, ou de la purger définitivement du disque dur."
        }
      ];

      currentY = 36;
      modulesPage3.forEach(mod => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(mod.title, 15, currentY);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        const lines = doc.splitTextToSize(mod.desc, 180);
        doc.text(lines, 15, currentY + 4.5);
        
        currentY += 10 + (lines.length * 4);
      });

      // Section 4: Assistance technique
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("4. CONTACT ET ASSISTANCE TECHNIQUE", 15, currentY + 4);
      doc.line(15, currentY + 6.5, 100, currentY + 6.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const assistanceText = "Pour toute question relative à l'utilisation, une demande de sauvegarde physique " +
        "du fichier 'school.db' ou pour une modification de structure de données complexe, vous pouvez " +
        "contacter l'administrateur principal de la plateforme à l'adresse e-mail suivante : " +
        "bourekane223@gmail.com. Le système d'enregistrement automatique SQL est configuré pour " +
        "sauvegarder vos modifications toutes les secondes lors d'une saisie.";
      
      const assistanceLines = doc.splitTextToSize(assistanceText, 180);
      doc.text(assistanceLines, 15, currentY + 12);

      // Save PDF
      doc.save("Manuel_Utilisation_Gestion_Scolaire.pdf");
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error("Erreur lors de la génération du PDF manuel:", err);
      alert("Une erreur est survenue lors du téléchargement du PDF. Veuillez réessayer.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Banner Card */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 ${
        adminTheme === 'sombre-or'
          ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-amber-500/20'
          : 'bg-gradient-to-br from-indigo-50/60 to-white border-indigo-100'
      }`}>
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
              adminTheme === 'sombre-or' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-100 text-indigo-700'
            }`}>
              Manuel Officiel de l'Utilisateur
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-bold ${
              isLoadedFromDb ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Base SQL Active
            </span>
          </div>
          <h3 className={`text-xl font-black uppercase tracking-tight ${
            adminTheme === 'sombre-or' ? 'text-amber-400' : 'text-slate-900'
          }`}>
            Guide Manuel & Fonctionnement à 100%
          </h3>
          <p className={`text-xs leading-relaxed ${
            adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Découvrez comment fonctionne chaque section de votre logiciel scolaire unifié et comprenez exactement où et comment sont stockées toutes vos données académiques et financières.
          </p>
        </div>

        {/* Download Button */}
        <button
          onClick={generatePDFGuide}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase cursor-pointer transform active:scale-95 transition-all duration-300 whitespace-nowrap shrink-0 ${
            downloadSuccess
              ? 'bg-emerald-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)]'
              : adminTheme === 'sombre-or'
                ? 'bg-[#c5a880] text-slate-950 hover:opacity-90 shadow-lg shadow-amber-950/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
          }`}
        >
          {downloadSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 animate-bounce" />
              Guide PDF Téléchargé !
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Télécharger le Manuel PDF
            </>
          )}
        </button>
      </div>

      {/* Grid Documentation Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Storage architecture */}
        <div className={`p-6 rounded-2xl border space-y-4 lg:col-span-1 h-fit ${
          adminTheme === 'sombre-or' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-gray-150'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              adminTheme === 'sombre-or' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <HardDrive className="w-5 h-5" />
            </div>
            <h4 className={`text-sm font-black uppercase tracking-tight ${
              adminTheme === 'sombre-or' ? 'text-slate-200' : 'text-slate-800'
            }`}>
              Où sont mes données ?
            </h4>
          </div>

          <p className={`text-xs leading-relaxed ${
            adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Toutes vos informations de gestion scolaire sont enregistrées de façon centralisée à deux endroits complémentaires :
          </p>

          <div className="space-y-3 pt-2">
            <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
              adminTheme === 'sombre-or' ? 'bg-slate-950/40 border-slate-800' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-amber-500">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Base Relationnelle SQLite
              </div>
              <p className={`text-[11px] leading-relaxed ${
                adminTheme === 'sombre-or' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Un fichier robuste nommé <code className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300">school.db</code> réside sur le serveur. Il stocke les tables relationnelles réelles pour les filières, matières, classes, élèves, notes et paiements.
              </p>
            </div>

            <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
              adminTheme === 'sombre-or' ? 'bg-slate-950/40 border-slate-800' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Cache Local Navigateur
              </div>
              <p className={`text-[11px] leading-relaxed ${
                adminTheme === 'sombre-or' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                L'application enregistre également l'état dans le <code className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-blue-300">localStorage</code> de votre ordinateur pour permettre une vitesse d'affichage instantanée, même sans internet stable.
              </p>
            </div>

            <div className={`p-3 rounded-xl border text-[11px] font-bold leading-relaxed flex items-start gap-2 ${
              adminTheme === 'sombre-or' ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
            }`}>
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>
                Tout changement est instantanément sauvegardé et écrit en arrière-plan sans action manuelle requise de votre part !
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Manual Tabs */}
        <div className={`p-6 rounded-2xl border space-y-6 lg:col-span-2 ${
          adminTheme === 'sombre-or' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-gray-150'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              adminTheme === 'sombre-or' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className={`text-sm font-black uppercase tracking-tight ${
              adminTheme === 'sombre-or' ? 'text-slate-200' : 'text-slate-800'
            }`}>
              Fonctionnement pas-à-pas des Modules
            </h4>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "Vue d'Ensemble & Dashboard",
                desc: "Affiche vos statistiques clés (taux de réussite, effectifs par filière, balance financière) et vous montre en temps réel l'historique d'activité de l'application pour des raisons d'audit et de traçabilité."
              },
              {
                title: "Inscriptions d'Élèves & Classes",
                desc: "Pour inscrire un nouvel élève : cliquez sur '+ Inscrire un étudiant', remplissez les informations personnelles, sélectionnez sa filière, sa classe et l'année scolaire. Le système l'enregistre immédiatement et met à jour sa fiche financière."
              },
              {
                title: "Filières, Matières & Coefficients",
                desc: "Ce module gère vos programmes d'études. Chaque matière créée appartient à une filière et possède un coefficient spécifique qui influencera automatiquement le calcul des bulletins et moyennes des étudiants."
              },
              {
                title: "Saisie de Notes & Bulletins de notes",
                desc: "Le module de notes vous permet de saisir directement les notes d'examens et devoirs (notées sur 20). Une fois saisies, accédez à 'Bulletins' pour générer un relevé complet avec calcul automatique de la moyenne, mentions d'excellence, et de l'état de validation du semestre."
              },
              {
                title: "Frais de Scolarité & Comptabilité",
                desc: "Suivez le statut de règlement de chaque élève. Vous pouvez enregistrer des versements fractionnés. L'interface affiche d'un coup d'oeil les élèves à jour (en règle), en cours de paiement (partiel) ou n'ayant rien versé (non payé)."
              },
              {
                title: "Autorisations spéciales & Corbeille",
                desc: "La gestion d'autorisations permet d'accorder à un étudiant le droit de consulter les cours ou relevés d'une autre filière académique. La corbeille est une sécurité qui recueille tous les éléments supprimés pour vous permettre de les restaurer à tout moment d'un simple clic."
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border text-xs flex gap-3 transition-colors ${
                  adminTheme === 'sombre-or' 
                    ? 'bg-slate-950/20 border-slate-850 hover:border-slate-700' 
                    : 'bg-gray-50 border-gray-150 hover:bg-gray-100/60'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black shrink-0 ${
                  adminTheme === 'sombre-or' ? 'bg-[#c5a880]/15 text-[#c5a880]' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <h5 className={`font-bold uppercase tracking-tight text-[11px] ${
                    adminTheme === 'sombre-or' ? 'text-amber-400' : 'text-slate-800'
                  }`}>
                    {item.title}
                  </h5>
                  <p className={`leading-relaxed text-[11px] ${
                    adminTheme === 'sombre-or' ? 'text-slate-300' : 'text-slate-650'
                  }`}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Technical Note */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        adminTheme === 'sombre-or' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
      }`}>
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className={`font-bold ${adminTheme === 'sombre-or' ? 'text-slate-200' : 'text-slate-800'}`}>
            Remarque sur l'archivage & sauvegarde
          </p>
          <p className={adminTheme === 'sombre-or' ? 'text-slate-400' : 'text-slate-600'}>
            Le fichier physique <code className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-mono">school.db</code> est conservé sur le serveur principal et sert de source de vérité ultime. En téléchargeant le manuel PDF ci-dessus, vous conservez une copie hors ligne complète expliquant en détail le schéma SQL et les interactions opérationnelles de la plateforme.
          </p>
        </div>
      </div>
    </div>
  );
}
