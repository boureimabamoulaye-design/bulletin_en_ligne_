import React, { useState } from 'react';
import { Etudiant, Note, Cours, Semestre, Filiere, Classe } from '../types';
import { Award, Printer, Download, BookOpen, User, Calendar, GraduationCap } from 'lucide-react';

interface BulletinsTabProps {
  etudiants: Etudiant[];
  notes: Note[];
  cours: Cours[];
  semestres: Semestre[];
  filieres: Filiere[];
  classes: Classe[];
  globalFiliereId?: number;
  globalSemestreId?: number;
}

export default function BulletinsTab({ etudiants, notes, cours, semestres, filieres, classes, globalFiliereId, globalSemestreId }: BulletinsTabProps) {
  const [localStudentId, setLocalStudentId] = useState<number>(0);
  const [localSemestreId, setLocalSemestreId] = useState<number>(semestres[0]?.id || 0);

  const eligibleStudents = globalFiliereId && globalFiliereId > 0 
    ? etudiants.filter(e => e.filiere_id === globalFiliereId) 
    : etudiants;

  const selectedStudentId = localStudentId && eligibleStudents.some(e => e.id === localStudentId)
    ? localStudentId
    : 0;

  const selectedSemestreId = globalSemestreId && globalSemestreId > 0 ? globalSemestreId : localSemestreId;

  const activeStudent = etudiants.find(e => e.id === selectedStudentId);
  const activeSem = semestres.find(s => s.id === selectedSemestreId);

  // 1. Filter student grades for the active semester
  const studentGrades = notes.filter(n => n.etudiant_id === selectedStudentId && n.semestre_id === selectedSemestreId);

  // 2. Compute dynamic average (weighted with credits)
  const calculateGPA = (studentId: number, semId: number) => {
    const grades = notes.filter(n => n.etudiant_id === studentId && n.semestre_id === semId);
    if (grades.length === 0) return 0;
    
    let sumNotes = 0;
    let sumCredits = 0;
    grades.forEach(g => {
      sumNotes += Number(g.note) * Number(g.credits);
      sumCredits += Number(g.credits);
    });

    return sumCredits > 0 ? (sumNotes / sumCredits) : 0;
  };

  const activeGPA = calculateGPA(selectedStudentId, selectedSemestreId);

  // 3. Dynamic ranking calculation relative to students in the same level/class
  const getStudentRank = (studentId: number, semId: number) => {
    const studentObj = etudiants.find(e => e.id === studentId);
    if (!studentObj) return { rank: 1, total: 1 };

    // Find all classmates
    const classmates = etudiants.filter(e => e.classe_id === studentObj.classe_id);
    
    // Compute GPA for all classmates in this semester
    const rankList = classmates.map(c => {
      return {
        id: c.id,
        gpa: calculateGPA(c.id, semId)
      };
    }).sort((a, b) => b.gpa - a.gpa);

    const position = rankList.findIndex(item => item.id === studentId);
    return {
      rank: position !== -1 ? position + 1 : 1,
      total: classmates.length
    };
  };

  const { rank: activeRank, total: activeTotalClassmates } = getStudentRank(selectedStudentId, selectedSemestreId);

  // 4. Mention calculator
  const getMention = (averagedGrade: number) => {
    if (averagedGrade >= 18) return "Excellent";
    if (averagedGrade >= 16) return "Très Bien";
    if (averagedGrade >= 14) return "Bien";
    if (averagedGrade >= 12) return "Assez Bien";
    if (averagedGrade >= 10) return "Passable";
    return "Insuffisant";
  };

  const activeMention = getMention(activeGPA);
  const activeDecision = activeGPA >= 10 ? "Admis" : "Ajourné";

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    if (!activeStudent || !activeSem) return;
    
    let reportDoc = `====================================================\n`;
    reportDoc += `         BULLETIN SCOLAIRE OFFICIEL\n`;
    reportDoc += `       GROUPE ACADÉMIQUE DE GESTION\n`;
    reportDoc += `====================================================\n\n`;
    reportDoc += `Matricule : ${activeStudent.matricule}\n`;
    reportDoc += `Nom Complet : ${activeStudent.nom} ${activeStudent.prenom}\n`;
    reportDoc += `Sexe : ${activeStudent.sexe} | Date Naiss : ${activeStudent.date_naissance}\n`;
    reportDoc += `Période : ${activeSem.nom_semestre} (${activeSem.annee_scolaire})\n`;
    reportDoc += `Filière : ${filieres.find(x => x.id === activeStudent.filiere_id)?.nom_filiere}\n`;
    reportDoc += `Classe : ${classes.find(x => x.id === activeStudent.classe_id)?.nom_classe}\n`;
    reportDoc += `----------------------------------------------------\n`;
    reportDoc += `Détails des Évaluations :\n`;
    
    studentGrades.forEach(g => {
      const cTitle = cours.find(x => x.id === g.cours_id)?.titre || "Matière";
      reportDoc += `- ${cTitle} (${g.credits} crédits) : ${Number(g.note).toFixed(2)}/20\n`;
    });
    
    reportDoc += `----------------------------------------------------\n`;
    reportDoc += `MOYENNE GÉNÉRALE : ${activeGPA.toFixed(2)} / 20\n`;
    reportDoc += `RANG : ${activeRank} sur ${activeTotalClassmates} étudiants\n`;
    reportDoc += `MENTION : ${activeMention}\n`;
    reportDoc += `DÉCISION DU JURY : ${activeDecision}\n\n`;
    reportDoc += `Fait à Abidjan, le 06/06/2026\n`;
    reportDoc += `Le Secrétaire Général de Direction\n`;
    
    const element = document.createElement("a");
    const file = new Blob([reportDoc], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `bulletin_${activeStudent.matricule}_${activeSem.nom_semestre.replace(" ", "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6" id="bulletins-container">
      {/* Selector ribbon */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-end" id="bulletins-selectors">
         <div className="flex-1 space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-blue-600" /> Choisir l'Étudiant
          </label>
          <select 
            value={selectedStudentId}
            onChange={e => setLocalStudentId(Number(e.target.value))}
            className="form-control"
          >
            <option value={0}>-- Sélectionner un élève --</option>
            {eligibleStudents.length === 0 ? (
              <option value={0} disabled>Aucun étudiant disponible dans cette filière</option>
            ) : (
              eligibleStudents.map(etu => (
                <option key={etu.id} value={etu.id}>{etu.nom} {etu.prenom} ({etu.matricule})</option>
              ))
            )}
          </select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" /> Période Semestrielle
          </label>
          {globalSemestreId && globalSemestreId > 0 ? (
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-xs font-semibold text-slate-850 h-10 flex items-center">
              {semestres.find(s => s.id === globalSemestreId)?.nom_semestre}
            </div>
          ) : (
            <select 
              value={selectedSemestreId}
              onChange={e => setLocalSemestreId(Number(e.target.value))}
              className="form-control"
            >
              {semestres.map(sem => (
                <option key={sem.id} value={sem.id}>{sem.nom_semestre} ({sem.annee_scolaire})</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            disabled={selectedStudentId === 0}
            className="btn bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            title="Lancer l'impression"
          >
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button 
            onClick={handleDownloadReport}
            disabled={selectedStudentId === 0}
            className="btn btn-primary font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            title="Télécharger le bulletin textuel"
          >
            <Download className="w-4 h-4" /> Certificat PDF
          </button>
        </div>
      </div>

      {/* Main visual display of the report card */}
      {activeStudent && activeSem ? (
        <div className="bg-white p-8 max-w-4xl mx-auto rounded-2xl border-4 border-slate-900 shadow-xl relative overflow-hidden" id="bulletin-official-canvas">
          {/* Subtle decoration background seal */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 pointer-events-none opacity-5 border-8 border-slate-900 rounded-full w-96 h-96 flex items-center justify-center">
            <span className="text-slate-950 font-bold text-3xl tracking-widest text-center">ACADÉMIE<br />SCOLAIRE</span>
          </div>

          {/* Letterhead Header */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start border-b-2 border-slate-800 pb-5 gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 justify-center md:justify-start">
                <BookOpen className="w-6 h-6 text-blue-800" />
                <span>INSTITUT SUPÉRIEUR DES TECHNOLOGIES</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-semibold uppercase">Abidjan - Plateau | Tel: +225 01 02 03 04 05</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Ministère de l'Enseignement Technique & Professionnel</p>
            </div>
            
            <div className="text-center md:text-right border-l-0 md:border-l border-gray-200 pl-0 md:pl-6 shrink-0 font-mono text-xs">
              <strong className="text-slate-950 block">BULLETIN DE NOTES</strong>
              <span className="text-gray-550 block mt-1 bg-slate-100 text-slate-800 py-1 px-3 rounded font-bold uppercase">{activeSem.nom_semestre}</span>
              <span className="text-gray-400 block mt-1">Année {activeSem.annee_scolaire}</span>
            </div>
          </div>

          {/* Identity panel of Student */}
          <div className="my-6 md:flex gap-6 items-start bg-slate-50 border border-slate-200 rounded-xl p-5">
            <GraduationCap 
              className="w-14 h-14 text-slate-800 bg-white p-2.5 rounded-lg border-2 border-slate-900 shadow-md mx-auto md:mx-0 shrink-0 mb-4 md:mb-0" 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs text-slate-850 flex-1">
              <div>
                <dt className="text-gray-400 uppercase font-black tracking-wide">ID Matricule Unifié</dt>
                <dd className="font-mono text-sm font-bold text-slate-900">{activeStudent.matricule}</dd>
              </div>
              <div>
                <dt className="text-gray-400 uppercase font-black tracking-wide">Nom de famille & Prénoms</dt>
                <dd className="text-sm font-black text-slate-950 uppercase">{activeStudent.nom} {activeStudent.prenom}</dd>
              </div>
              <div>
                <dt className="text-gray-400 uppercase font-black tracking-wide">Niveau d'études d'affectation</dt>
                <dd className="font-semibold text-slate-900">{classes.find(c => c.id === activeStudent.classe_id)?.nom_classe}</dd>
              </div>
              <div>
                <dt className="text-gray-400 uppercase font-black tracking-wide">Filière Académique d'Inscription</dt>
                <dd className="font-black text-blue-900 uppercase">
                  {filieres.find(f => f.id === activeStudent.filiere_id)?.nom_filiere}
                </dd>
              </div>
            </div>
          </div>

          {/* Marks table detail */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mt-6">
            <div className="overflow-x-auto w-full">
              <table className="custom-table w-full text-xs" style={{ boxShadow: 'none' }}>
                <thead>
                  <tr className="bg-slate-900 text-slate-100">
                    <th className="font-bold py-2.5 px-4 uppercase text-[10px] text-left">Modules / Cours Validés</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-24">Note CC / Classe (60%)</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-24">Note Examen (40%)</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-24">Moyenne Finale</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-14">Crédits</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-24">Total pondéré</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-24">Mention</th>
                    <th className="font-bold py-2.5 px-3 uppercase text-[10px] text-center w-24">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {studentGrades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500 font-medium">Aucune note n'a été introduite ce semestre.</td>
                    </tr>
                  ) : (
                    studentGrades.map(g => {
                      const courseObj = cours.find(c => c.id === g.cours_id);
                      const finalNote = Number(g.note);
                      const notePonderated = finalNote * Number(g.credits);

                      // Calculate individual mention
                      const getSubjMention = (val: number) => {
                        if (val >= 16) return "Très Bien";
                        if (val >= 14) return "Bien";
                        if (val >= 12) return "Assez Bien";
                        if (val >= 10) return "Passable";
                        return "Ajourné";
                      };

                      const subjStatus = finalNote >= 10 ? "Validé" : "Rattrapage";
                      const subjMention = getSubjMention(finalNote);

                      return (
                        <tr key={g.id} className="border-b border-gray-150 hover:bg-slate-50 transition text-center">
                          <td className="font-bold text-slate-900 py-3 px-4 text-left">
                            <div>{courseObj ? courseObj.titre : "Enseignement Général"}</div>
                          </td>
                          <td className="font-medium text-gray-700">
                            {g.note_classe !== undefined ? `${g.note_classe.toFixed(2)}/20` : "-"}
                          </td>
                          <td className="font-medium text-gray-700">
                            {g.note_examen !== undefined ? `${g.note_examen.toFixed(2)}/20` : "-"}
                          </td>
                          <td className="font-bold text-slate-950 text-sm">
                            {finalNote.toFixed(2)}/20
                          </td>
                          <td className="font-semibold text-gray-550">{g.credits}</td>
                          <td className="font-bold text-slate-850">{notePonderated.toFixed(2)}</td>
                          <td className="font-medium">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              finalNote >= 14 ? "bg-emerald-50 text-emerald-700" :
                              finalNote >= 10 ? "bg-blue-50 text-blue-700" :
                              "bg-rose-50 text-rose-700"
                            }`}>
                              {subjMention}
                            </span>
                          </td>
                          <td>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              finalNote >= 10 
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                : "bg-rose-100 text-rose-800 border border-rose-250"
                            }`}>
                              {subjStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance summary calculation */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-slate-900 pt-5">
            {/* Class Rank and Averages */}
            <div className="space-y-2 border border-dashed border-gray-300 p-4 rounded-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-600">Moyenne Générale de l'Élève :</span>
                <span className="text-lg font-black text-slate-950">{activeGPA > 0 ? `${activeGPA.toFixed(2)}/20` : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-600">Rang de Classement :</span>
                {activeGPA > 0 ? (
                  <span className="font-bold text-slate-900">
                    {activeRank === 1 ? "1er Ex-æquo" : `${activeRank}ème`} sur <span className="font-medium text-slate-500">{activeTotalClassmates} élèves</span>
                  </span>
                ) : (
                  <span className="text-gray-400">Non classé</span>
                )}
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-600">Mention administrative :</span>
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${activeGPA >= 15 ? "bg-emerald-100 text-emerald-800" : activeGPA >= 10 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                  {activeGPA > 0 ? activeMention : "Aucune éval"}
                </span>
              </div>
            </div>

            {/* Decision and dynamic signature section */}
            <div className="bg-slate-50 border border-slate-900 flex flex-col justify-center items-center p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Résultat du conseil de classe</span>
              <h3 className={`text-xl font-black uppercase tracking-tight mt-1 ${activeGPA >= 10 ? "text-emerald-700" : "text-red-700"}`}>
                DÉCISION : {activeGPA > 0 ? activeDecision : "N/A"}
              </h3>
              <p className="text-[10px] text-gray-500 mt-2 font-mono">
                {activeGPA >= 10 ? "L'étudiant est admis à s'inscrire en classe supérieure." : "L'étudiant doit se présenter aux épreuves de rattrapage."}
              </p>
            </div>
          </div>

          {/* Validation section footer */}
          <div className="mt-8 pt-8 border-t border-slate-300 grid grid-cols-2 text-center text-xs">
            <div>
              <span className="font-black text-slate-900 uppercase block">La Direction des Études</span>
              <p className="text-[10px] text-gray-400 mt-0.5 italic">Signature validée électroniquement</p>
              <div className="mt-6 border-b border-gray-400 w-32 mx-auto"></div>
            </div>
            
            <div className="relative">
              <span className="font-black text-slate-900 uppercase block">Le Secrétariat Académique</span>
              <p className="text-[10px] text-gray-400 mt-0.5 italic">Abidjan, le 06 Juin 2026</p>
              <div className="mt-6 border-b border-gray-400 w-32 mx-auto"></div>
              
              {/* Fake dynamic retro-looking administrative seal */}
              <div className="absolute right-4 bottom-[-10px] rounded-full border-4 border-blue-900/40 text-blue-950/40 font-bold uppercase p-3 w-16 h-16 rounded-full flex items-center justify-center font-black tracking-widest text-[8px] transform rotate-12 pointer-events-none select-none">
                SEAL
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-gray-300 p-12 text-center rounded-2xl flex flex-col items-center justify-center gap-3">
          <BookOpen className="w-10 h-10 text-slate-400" />
          <h3 className="font-bold text-slate-200 text-sm">Aucun bulletin de notes ouvert</h3>
          <p className="text-xs text-slate-400 max-w-md">Veuillez sélectionner un élève dans la liste ci-dessus pour charger et générer son relevé de notes semestriel officiel.</p>
        </div>
      )}
    </div>
  );
}
