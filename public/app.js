// =========================================================
// STATE MANAGEMENT & CACHE
// =========================================================
let currentUser = null;
let loginRole = "admin"; // 'admin' | 'student'
let activeTab = "dashboard";
let globalFiliereId = 0;
let globalSemestreId = 0;
let globalSchoolYear = "2025-2026";
let adminTheme = "sombre-or";
let compactScroll = true;

// Cached API Lists
let cache = {
  students: [],
  filieres: [],
  classes: [],
  semestres: [],
  cours: [],
  notes: [],
  paiements: [],
  logs: [],
  trash: [],
  config: { scolariteAnnuelle: 1500000, anneesScolaires: ["2025-2026", "2026-2027", "2024-2025"] }
};

// =========================================================
// INITIALIZATION
// =========================================================
window.addEventListener("DOMContentLoaded", () => {
  // Try to load cached session if any
  const savedUser = localStorage.getItem("school_user");
  const savedTheme = localStorage.getItem("school_theme");
  const savedCompact = localStorage.getItem("school_compact");

  if (savedTheme) {
    adminTheme = savedTheme;
  }
  if (savedCompact !== null) {
    compactScroll = savedCompact === "true";
  }

  applyTheme();
  applyCompactScroll();

  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showAuthenticatedPortal();
    } catch (e) {
      localStorage.removeItem("school_user");
      showLoginScreen();
    }
  } else {
    showLoginScreen();
  }

  // Initialize Lucide Icons
  lucide.createIcons();
});

// =========================================================
// SCREEN NAVIGATOR
// =========================================================
function showLoginScreen() {
  document.getElementById("login-screen").classList.remove("view-hidden");
  document.getElementById("admin-portal").classList.add("view-hidden");
  document.getElementById("student-portal").classList.add("view-hidden");
}

function showAuthenticatedPortal() {
  document.getElementById("login-screen").classList.add("view-hidden");
  
  if (currentUser.role === "admin") {
    document.getElementById("admin-portal").classList.remove("view-hidden");
    document.getElementById("student-portal").classList.add("view-hidden");
    document.getElementById("connected-user-name").textContent = currentUser.name || "Bourekane Admin";
    loadAllData();
  } else {
    document.getElementById("admin-portal").classList.add("view-hidden");
    document.getElementById("student-portal").classList.remove("view-hidden");
    document.getElementById("student-header-name").textContent = `${currentUser.student.prenom} ${currentUser.student.nom}`;
    document.getElementById("student-header-matricule").textContent = currentUser.student.matricule;
    loadAllData();
  }
}

// =========================================================
// AUTH & LOGIN LOGIC
// =========================================================
function setLoginRole(role) {
  loginRole = role;
  const adminBtn = document.getElementById("role-admin-btn");
  const studentBtn = document.getElementById("role-student-btn");
  const label = document.getElementById("username-label");
  const icon = document.getElementById("username-icon");
  const input = document.getElementById("username-input");

  if (role === "admin") {
    adminBtn.className = "flex items-center justify-center gap-2 py-2 px-4 text-xs font-black rounded-lg transition-all text-amber-400 bg-amber-500/10 border border-amber-500/25";
    studentBtn.className = "flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg transition-all text-slate-400 hover:text-slate-200";
    label.textContent = "Adresse Email Administrateur";
    input.placeholder = "nom@ecole.com";
    icon.setAttribute("data-lucide", "mail");
  } else {
    studentBtn.className = "flex items-center justify-center gap-2 py-2 px-4 text-xs font-black rounded-lg transition-all text-amber-400 bg-amber-500/10 border border-amber-500/25";
    adminBtn.className = "flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg transition-all text-slate-400 hover:text-slate-200";
    label.textContent = "Matricule ou Email de l'Étudiant";
    input.placeholder = "Ex: ETU20250001 ou email...";
    icon.setAttribute("data-lucide", "user");
  }
  lucide.createIcons();
}

function togglePasswordVisibility() {
  const input = document.getElementById("password-input");
  const icon = document.getElementById("eye-icon");
  if (input.type === "password") {
    input.type = "text";
    icon.setAttribute("data-lucide", "eye-off");
  } else {
    input.type = "password";
    icon.setAttribute("data-lucide", "eye");
  }
  lucide.createIcons();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const username = document.getElementById("username-input").value.trim();
  const password = document.getElementById("password-input").value;
  const errorContainer = document.getElementById("login-error-container");
  const errorMsg = document.getElementById("login-error-msg");

  errorContainer.classList.add("view-hidden");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: loginRole, username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Une erreur s'est produite lors de l'authentification.");
    }

    currentUser = data;
    localStorage.setItem("school_user", JSON.stringify(currentUser));
    showAuthenticatedPortal();
  } catch (err) {
    errorMsg.textContent = err.message;
    errorContainer.classList.remove("view-hidden");
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem("school_user");
  document.getElementById("username-input").value = "";
  document.getElementById("password-input").value = "";
  showLoginScreen();
}

// =========================================================
// API DATA SYNC
// =========================================================
async function loadAllData() {
  try {
    const [
      resStudents,
      resFilieres,
      resClasses,
      resSemestres,
      resCours,
      resNotes,
      resPaiements,
      resLogs,
      resTrash,
      resConfig
    ] = await Promise.all([
      fetch("/api/etudiants").then(r => r.json()),
      fetch("/api/filieres").then(r => r.json()),
      fetch("/api/classes").then(r => r.json()),
      fetch("/api/semestres").then(r => r.json()),
      fetch("/api/cours").then(r => r.json()),
      fetch("/api/notes").then(r => r.json()),
      fetch("/api/paiements").then(r => r.json()),
      fetch("/api/historique").then(r => r.json()),
      fetch("/api/trash").then(r => r.json()),
      fetch("/api/config").then(r => r.json())
    ]);

    cache.students = resStudents;
    cache.filieres = resFilieres;
    cache.classes = resClasses;
    cache.semestres = resSemestres;
    cache.cours = resCours;
    cache.notes = resNotes;
    cache.paiements = resPaiements;
    cache.logs = resLogs;
    cache.trash = resTrash;
    cache.config = resConfig;

    // Set initial active global semestre if not set
    if (globalSemestreId === 0 && cache.semestres.length > 0) {
      // Find a semester matching active school year
      const activeSem = cache.semestres.find(s => s.annee_scolaire === globalSchoolYear);
      globalSemestreId = activeSem ? activeSem.id : cache.semestres[0].id;
    }

    // Populate dropdowns
    populateDropdownFilters();

    // Render active views
    renderActivePanel();

  } catch (err) {
    console.error("Critical error while caching school databases:", err);
  }
}

function populateDropdownFilters() {
  // Filiere selector
  const filiereSelect = document.getElementById("global-filiere-select");
  if (filiereSelect) {
    // Keep first option 'Toutes les filieres'
    filiereSelect.innerHTML = `<option value="0" class="bg-slate-950 text-white">Toutes les filières</option>`;
    cache.filieres.forEach(f => {
      filiereSelect.innerHTML += `<option value="${f.id}" class="bg-slate-950 text-white">${f.nom_filiere}</option>`;
    });
    filiereSelect.value = globalFiliereId;
  }

  // Semestre selector (filtered by selected academic year)
  const semestreSelect = document.getElementById("global-semestre-select");
  if (semestreSelect) {
    semestreSelect.innerHTML = "";
    const filteredSems = cache.semestres.filter(s => s.annee_scolaire === globalSchoolYear);
    
    filteredSems.forEach(s => {
      semestreSelect.innerHTML += `<option value="${s.id}" class="bg-slate-950 text-white">${s.nom_semestre}</option>`;
    });

    if (filteredSems.length > 0) {
      // If previous globalSemestreId is not in filtered, choose first
      if (!filteredSems.some(s => s.id === globalSemestreId)) {
        globalSemestreId = filteredSems[0].id;
      }
      semestreSelect.value = globalSemestreId;
    } else {
      semestreSelect.innerHTML = `<option value="0" class="bg-slate-950 text-white">Aucun semestre</option>`;
      globalSemestreId = 0;
    }
  }

  // Student filter classe dropdown
  const filterClasse = document.getElementById("student-filter-classe");
  if (filterClasse) {
    filterClasse.innerHTML = `<option value="ALL">Toutes les classes</option>`;
    cache.classes.forEach(c => {
      filterClasse.innerHTML += `<option value="${c.id}">${c.nom_classe}</option>`;
    });
  }

  // Form selections
  populateFormSelectors();
}

function populateFormSelectors() {
  const sFiliere = document.getElementById("form-student-filiere");
  const sClasse = document.getElementById("form-student-classe");
  const semFiliere = document.getElementById("form-semestre-filiere");
  const cFiliere = document.getElementById("form-cours-filiere");
  const cClasse = document.getElementById("form-cours-classe");
  const cSemestre = document.getElementById("form-cours-semestre");
  const nStudent = document.getElementById("form-note-etudiant");
  const nCours = document.getElementById("form-note-cours");
  const nSemestre = document.getElementById("form-note-semestre");
  const pStudent = document.getElementById("form-pay-etudiant");
  const aStudent = document.getElementById("form-aut-etudiant");
  const aFiliere = document.getElementById("form-aut-filiere");

  if (sFiliere) {
    sFiliere.innerHTML = cache.filieres.map(f => `<option value="${f.id}">${f.nom_filiere}</option>`).join("");
  }
  if (sClasse) {
    sClasse.innerHTML = cache.classes.map(c => `<option value="${c.id}">${c.nom_classe}</option>`).join("");
  }
  if (semFiliere) {
    semFiliere.innerHTML = cache.filieres.map(f => `<option value="${f.id}">${f.nom_filiere}</option>`).join("");
  }
  if (cFiliere) {
    cFiliere.innerHTML = cache.filieres.map(f => `<option value="${f.id}">${f.nom_filiere}</option>`).join("");
  }
  if (cClasse) {
    cClasse.innerHTML = cache.classes.map(c => `<option value="${c.id}">${c.nom_classe}</option>`).join("");
  }
  if (cSemestre) {
    cSemestre.innerHTML = cache.semestres.map(s => `<option value="${s.id}">${s.nom_semestre} (${s.annee_scolaire})</option>`).join("");
  }
  if (nStudent) {
    nStudent.innerHTML = cache.students.map(e => `<option value="${e.id}">${e.nom} ${e.prenom} (${e.matricule})</option>`).join("");
  }
  if (nCours) {
    nCours.innerHTML = cache.cours.map(c => `<option value="${c.id}">${c.titre} - Prof. ${c.enseignant}</option>`).join("");
  }
  if (nSemestre) {
    nSemestre.innerHTML = cache.semestres.map(s => `<option value="${s.id}">${s.nom_semestre} (${s.annee_scolaire})</option>`).join("");
  }
  if (pStudent) {
    pStudent.innerHTML = cache.students.map(e => `<option value="${e.id}">${e.nom} ${e.prenom} (${e.matricule})</option>`).join("");
  }
  if (aStudent) {
    aStudent.innerHTML = cache.students.map(e => `<option value="${e.id}">${e.nom} ${e.prenom} (${e.matricule})</option>`).join("");
  }
  if (aFiliere) {
    aFiliere.innerHTML = cache.filieres.map(f => `<option value="${f.id}">${f.nom_filiere}</option>`).join("");
  }
}

// =========================================================
// TAB CONTROLLER
// =========================================================
function setActiveTab(tabName) {
  activeTab = tabName;
  
  // Update left sidebar active buttons styling
  const tabIds = ["dashboard", "etudiants", "filieres", "semestres", "cours", "notes", "bulletins", "autorisations", "paiements", "corbeille"];
  tabIds.forEach(id => {
    const btn = document.getElementById(`tab-btn-${id}`);
    if (btn) {
      if (id === tabName) {
        if (adminTheme === "sombre-or") {
          btn.className = "w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow shadow-amber-500/20";
        } else {
          btn.className = "w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all bg-blue-650 text-white shadow";
        }
      } else {
        btn.className = "w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all text-slate-400 hover:bg-slate-800 hover:text-slate-200";
      }
    }
  });

  renderActivePanel();
}

function renderActivePanel() {
  if (currentUser.role === "admin") {
    // Hide all panels
    const panels = ["dashboard", "etudiants", "filieres", "semestres", "cours", "notes", "bulletins", "autorisations", "paiements", "corbeille"];
    panels.forEach(p => {
      document.getElementById(`panel-${p}`).classList.add("view-hidden");
    });

    // Show selected
    document.getElementById(`panel-${activeTab}`).classList.remove("view-hidden");

    // Re-render data for the active panel
    switch (activeTab) {
      case "dashboard":
        renderDashboard();
        break;
      case "etudiants":
        renderStudentsTable();
        break;
      case "filieres":
        renderFilieres();
        break;
      case "semestres":
        renderSemestresTable();
        break;
      case "cours":
        renderCours();
        break;
      case "notes":
        renderNotesTable();
        break;
      case "bulletins":
        renderBulletinsList();
        break;
      case "autorisations":
        renderAutorisationsTable();
        break;
      case "paiements":
        renderPaiementsTable();
        break;
      case "corbeille":
        renderCorbeilleTable();
        break;
    }
  } else {
    // Render student views
    renderStudentDashboard();
  }

  // Re-generate Icons
  lucide.createIcons();
}

// =========================================================
// PANEL RENDERERS: ADMIN
// =========================================================

// 1. Dashboard View
async function renderDashboard() {
  try {
    const statsRes = await fetch("/api/dashboard/stats").then(r => r.json());
    document.getElementById("stat-students-count").textContent = statsRes.totalStudents;
    document.getElementById("stat-avg-grade").textContent = `${Number(statsRes.averageGrade).toFixed(2)} / 20`;
    document.getElementById("stat-courses-count").textContent = statsRes.totalCourses;
    document.getElementById("stat-tuition-sum").textContent = `${formatMoney(statsRes.totalPayments)} FCFA`;

    // Render Database Actions
    const logsTbody = document.getElementById("dashboard-logs-tbody");
    logsTbody.innerHTML = "";
    if (cache.logs.length === 0) {
      logsTbody.innerHTML = `<tr><td colspan="4" class="py-3 text-center text-slate-500 font-medium">Aucun historique d'accès disponible.</td></tr>`;
    } else {
      cache.logs.slice(0, 10).forEach(log => {
        logsTbody.innerHTML += `
          <tr class="border-b border-slate-850 hover:bg-slate-900/40 transition">
            <td class="py-2.5 font-mono text-[10px] text-slate-500">#${log.id}</td>
            <td class="py-2.5 font-bold text-slate-300">${log.utilisateur}</td>
            <td class="py-2.5 text-slate-200">${log.action}</td>
            <td class="py-2.5 font-mono text-[11px] text-slate-400">${formatDateTime(log.date_action)}</td>
          </tr>
        `;
      });
    }
  } catch (err) {
    console.error("Failed to render dashboard stats:", err);
  }
}

// 2. Students View
function renderStudentsTable() {
  const searchInput = document.getElementById("student-search").value.toLowerCase();
  const filterGender = document.getElementById("student-filter-gender").value;
  const filterClasse = document.getElementById("student-filter-classe").value;
  const tbody = document.getElementById("students-table-tbody");
  
  tbody.innerHTML = "";

  // Filtering
  let filtered = cache.students.filter(stud => {
    // Text search
    const matchesText = 
      stud.nom.toLowerCase().includes(searchInput) ||
      stud.prenom.toLowerCase().includes(searchInput) ||
      stud.matricule.toLowerCase().includes(searchInput) ||
      stud.email.toLowerCase().includes(searchInput);

    // Gender filter
    const matchesGender = (filterGender === "ALL") || (stud.sexe === filterGender);

    // Classe filter
    const matchesClasse = (filterClasse === "ALL") || (Number(stud.classe_id) === Number(filterClasse));

    // Global filiere filter
    const matchesGlobalFiliere = (globalFiliereId === 0) || (Number(stud.filiere_id) === Number(globalFiliereId));

    return matchesText && matchesGender && matchesClasse && matchesGlobalFiliere;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-500 font-semibold text-xs uppercase tracking-wider">Aucun étudiant ne correspond à vos filtres.</td></tr>`;
    return;
  }

  filtered.forEach(stud => {
    const filText = getFiliereName(stud.filiere_id);
    const clsText = getClasseName(stud.classe_id);
    const sexoColor = stud.sexe === 'M' ? 'text-blue-400' : 'text-pink-400';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-900/50 transition">
        <td class="p-3.5 font-mono text-xs font-extrabold text-amber-400">${stud.matricule}</td>
        <td class="p-3.5">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center text-[11px] font-black uppercase text-amber-500">
              ${stud.nom.slice(0, 1)}${stud.prenom.slice(0, 1)}
            </div>
            <div>
              <p class="font-extrabold text-white text-xs">${stud.nom} ${stud.prenom}</p>
              <span class="text-[10px] text-slate-400 block truncate max-w-[160px]">${stud.email}</span>
            </div>
          </div>
        </td>
        <td class="p-3.5"><span class="font-bold ${sexoColor}">${stud.sexe}</span></td>
        <td class="p-3.5 font-mono text-[11px] text-slate-300">${formatDate(stud.date_naissance)}</td>
        <td class="p-3.5 font-mono text-[11px] text-slate-300">${stud.telephone || 'Non renseigné'}</td>
        <td class="p-3.5">
          <div class="space-y-0.5">
            <span class="bg-amber-500/10 border border-amber-500/20 text-[#c5a880] text-[9.5px] font-extrabold px-2 py-0.5 rounded-lg block text-center truncate max-w-[160px]">${filText}</span>
            <span class="bg-slate-800 border border-slate-750 text-slate-300 text-[9.5px] font-semibold px-2 py-0.5 rounded-lg block text-center">${clsText}</span>
          </div>
        </td>
        <td class="p-3.5 text-right space-x-1">
          <button onclick="editStudent(${stud.id})" class="p-1.5 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 rounded-lg text-amber-400 transition cursor-pointer" title="Modifier">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteStudent(${stud.id})" class="p-1.5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-lg text-rose-500 transition cursor-pointer" title="Supprimer">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

// 3. Filieres View
function renderFilieres() {
  const container = document.getElementById("filieres-grid");
  container.innerHTML = "";

  if (cache.filieres.length === 0) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-slate-500 font-bold uppercase">Aucune filière n'est définie.</div>`;
    return;
  }

  cache.filieres.forEach(f => {
    // Count how many students inside this filiere
    const count = cache.students.filter(stud => Number(stud.filiere_id) === Number(f.id)).length;
    // Count how many courses inside this filiere
    const coursesCount = cache.cours.filter(c => Number(c.filiere_id) === Number(f.id)).length;

    container.innerHTML += `
      <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-amber-500/30 transition shadow-lg">
        <div>
          <div class="flex items-center gap-3 border-b border-slate-850 pb-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <i data-lucide="layers" class="w-5.5 h-5.5"></i>
            </div>
            <div>
              <h4 class="font-space font-extrabold text-white text-xs leading-tight">${f.nom_filiere}</h4>
              <span class="text-[9px] font-mono text-slate-400 uppercase">ID Filière: #${f.id}</span>
            </div>
          </div>
          <p class="text-slate-400 text-xs leading-relaxed font-medium line-clamp-3">${f.description || 'Aucune description fournie.'}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between">
          <div class="flex gap-2">
            <span class="bg-slate-950 border border-slate-850 text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg">
              ${count} étudiants
            </span>
            <span class="bg-slate-950 border border-slate-850 text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg">
              ${coursesCount} cours
            </span>
          </div>
          <button onclick="deleteFiliere(${f.id})" class="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-500/10 transition cursor-pointer" title="Supprimer définitivement">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  });
  lucide.createIcons();
}

// 4. Semestres View
function renderSemestresTable() {
  const tbody = document.getElementById("semestres-table-tbody");
  tbody.innerHTML = "";

  const filtered = cache.semestres.filter(s => s.annee_scolaire === globalSchoolYear);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-bold uppercase">Aucun semestre pour l'année ${globalSchoolYear}.</td></tr>`;
    return;
  }

  filtered.forEach(sem => {
    const filName = getFiliereName(sem.filiere_id);
    tbody.innerHTML += `
      <tr class="hover:bg-slate-900/50 transition border-b border-slate-850">
        <td class="p-3.5 font-mono text-slate-400 font-bold text-xs">#S-${sem.id}</td>
        <td class="p-3.5 font-black text-white text-xs">${sem.nom_semestre}</td>
        <td class="p-3.5 font-bold text-slate-300">${filName}</td>
        <td class="p-3.5 font-mono text-slate-400">${sem.annee_scolaire}</td>
        <td class="p-3.5 text-right">
          <button onclick="deleteSemestre(${sem.id})" class="p-1.5 hover:bg-rose-500/10 text-rose-500 border border-transparent hover:border-rose-500/20 rounded-lg cursor-pointer transition">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

// 5. Supports de Cours View
function renderCours() {
  const container = document.getElementById("cours-grid");
  container.innerHTML = "";

  // Apply filters: global academic year & filiere
  let filtered = cache.cours.filter(c => {
    const sem = cache.semestres.find(s => s.id === c.semestre_id);
    if (!sem || sem.annee_scolaire !== globalSchoolYear) return false;
    
    // Filiere filter
    if (globalFiliereId !== 0 && Number(c.filiere_id) !== Number(globalFiliereId)) return false;

    // Semestre filter
    if (globalSemestreId !== 0 && Number(c.semestre_id) !== Number(globalSemestreId)) return false;

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-500 font-extrabold uppercase text-xs">Aucun cours disponible pour la sélection active.</div>`;
    return;
  }

  filtered.forEach(c => {
    const filText = getFiliereName(c.filiere_id);
    const clsText = getClasseName(c.classe_id);
    const sem = cache.semestres.find(s => s.id === c.semestre_id);
    const semText = sem ? sem.nom_semestre : "N/A";

    container.innerHTML += `
      <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow hover:border-amber-500/30 transition">
        <div>
          <div class="flex items-center gap-3 border-b border-slate-850 pb-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <i data-lucide="file-text" class="w-5.5 h-5.5"></i>
            </div>
            <div>
              <h4 class="font-space font-extrabold text-white text-xs leading-snug line-clamp-1" title="${c.titre}">${c.titre}</h4>
              <span class="text-[9.5px] font-mono text-amber-500 uppercase font-black">Prof. ${c.enseignant}</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed font-medium line-clamp-3">${c.description || 'Pas de description de cours disponible.'}</p>
          
          <div class="mt-4 flex flex-wrap gap-1">
            <span class="bg-slate-950 border border-slate-850 text-slate-300 text-[9px] font-semibold px-2 py-0.5 rounded-lg">${filText}</span>
            <span class="bg-slate-950 border border-slate-850 text-slate-300 text-[9px] font-semibold px-2 py-0.5 rounded-lg">${clsText}</span>
            <span class="bg-slate-950 border border-slate-850 text-slate-300 text-[9px] font-semibold px-2 py-0.5 rounded-lg">${semText}</span>
          </div>
        </div>

        <div class="mt-5 pt-3.5 border-t border-slate-850 flex items-center justify-between">
          <a href="#" onclick="downloadFileAlert('${c.fichier}')" class="flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-black">
            <i data-lucide="download" class="w-4 h-4 text-amber-500"></i>
            Télécharger (.pdf)
          </a>
          <button onclick="deleteCours(${c.id})" class="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition border border-transparent hover:border-rose-500/20 cursor-pointer">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  });
  lucide.createIcons();
}

function downloadFileAlert(fileName) {
  alert(`Téléchargement initié : Le support de cours "${fileName}" a été envoyé dans votre dossier de téléchargements.`);
}

// 6. Notes View
function renderNotesTable() {
  const tbody = document.getElementById("notes-table-tbody");
  tbody.innerHTML = "";

  // Filter notes based on global filiere & global semestre
  let filtered = cache.notes.filter(n => {
    const student = cache.students.find(s => s.id === n.etudiant_id);
    if (!student) return false;

    // Filter by academic year of note semestre
    const sem = cache.semestres.find(s => s.id === n.semestre_id);
    if (!sem || sem.annee_scolaire !== globalSchoolYear) return false;

    // Filiere filter
    if (globalFiliereId !== 0 && Number(student.filiere_id) !== Number(globalFiliereId)) return false;

    // Semestre filter
    if (globalSemestreId !== 0 && Number(n.semestre_id) !== Number(globalSemestreId)) return false;

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-500 font-extrabold uppercase text-xs">Aucune note saisie pour les filtres actifs.</td></tr>`;
    return;
  }

  filtered.forEach(note => {
    const stud = cache.students.find(s => s.id === note.etudiant_id);
    const cour = cache.cours.find(c => c.id === note.cours_id);
    const sem = cache.semestres.find(s => s.id === note.semestre_id);

    const studName = stud ? `${stud.nom} ${stud.prenom}` : `Inconnu (#${note.etudiant_id})`;
    const courText = cour ? cour.titre : `Cours Inconnu (#${note.cours_id})`;
    const semText = sem ? sem.nom_semestre : "N/A";

    const weighted = Number(note.note) * Number(note.coefficient);
    const noteClass = note.note >= 10 ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-900/50 transition">
        <td class="p-3.5">
          <p class="font-extrabold text-white text-xs">${studName}</p>
          <span class="text-[10px] text-slate-400 font-mono block">${stud ? stud.matricule : ''}</span>
        </td>
        <td class="p-3.5 font-bold text-slate-300 text-xs truncate max-w-[200px]" title="${courText}">${courText}</td>
        <td class="p-3.5"><span class="${noteClass} text-xs">${Number(note.note).toFixed(2)} / 20</span></td>
        <td class="p-3.5 font-extrabold text-center text-slate-300 text-xs">${note.coefficient}</td>
        <td class="p-3.5 font-mono text-slate-100 font-bold text-xs">${weighted.toFixed(2)}</td>
        <td class="p-3.5 font-bold text-slate-400 text-xs">${semText}</td>
        <td class="p-3.5 text-right">
          <button onclick="deleteNote(${note.id})" class="p-1.5 hover:bg-rose-500/10 text-rose-500 border border-transparent hover:border-rose-500/20 rounded-lg cursor-pointer transition">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

// 7. Bulletins Generator List View
function renderBulletinsList() {
  const container = document.getElementById("bulletins-container");
  const searchVal = document.getElementById("bulletin-search-input").value.toLowerCase();
  
  container.innerHTML = "";

  // Only students matching global filiere filter
  let filteredStudents = cache.students.filter(stud => {
    const matchesSearch = 
      stud.nom.toLowerCase().includes(searchVal) ||
      stud.prenom.toLowerCase().includes(searchVal) ||
      stud.matricule.toLowerCase().includes(searchVal);

    const matchesGlobalFiliere = (globalFiliereId === 0) || (Number(stud.filiere_id) === Number(globalFiliereId));

    return matchesSearch && matchesGlobalFiliere;
  });

  if (filteredStudents.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-500 font-black uppercase text-xs">Aucun bulletin disponible à générer pour cette sélection.</div>`;
    return;
  }

  // Generate a map / card for each student with grades calculations for globalSemestreId
  filteredStudents.forEach(stud => {
    // Fetch grades for this student and this semester
    const sNotes = cache.notes.filter(n => Number(n.etudiant_id) === Number(stud.id) && Number(n.semestre_id) === Number(globalSemestreId));
    
    // Compute stats
    let totalWeighted = 0;
    let totalCoefs = 0;
    sNotes.forEach(n => {
      totalWeighted += Number(n.note) * Number(n.coefficient);
      totalCoefs += Number(n.coefficient);
    });

    const average = totalCoefs > 0 ? totalWeighted / totalCoefs : 0;
    const isAdmis = average >= 10;
    const decisionText = sNotes.length === 0 ? "Non évaluable" : (isAdmis ? "Admis" : "Ajourné");
    const decisionColor = sNotes.length === 0 ? "bg-slate-800 text-slate-400" : (isAdmis ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" : "bg-rose-500/15 border border-rose-500/30 text-rose-400");
    const mention = getMention(average);

    container.innerHTML += `
      <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
        <div class="flex items-start justify-between border-b border-slate-850 pb-3 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center font-black text-xs text-amber-500">
              ${stud.nom.slice(0, 1)}${stud.prenom.slice(0, 1)}
            </div>
            <div>
              <h4 class="font-space font-extrabold text-white text-xs leading-none">${stud.nom} ${stud.prenom}</h4>
              <span class="text-[9.5px] font-mono text-amber-500 font-extrabold mt-1 block">${stud.matricule}</span>
            </div>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold ${decisionColor}">
            ${decisionText}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-850">
          <div>
            <span class="text-[9.5px] text-slate-500 uppercase font-black block">Matières Évaluées :</span>
            <span class="font-extrabold text-white mt-0.5 block">${sNotes.length} matières</span>
          </div>
          <div>
            <span class="text-[9.5px] text-slate-500 uppercase font-black block">Moyenne Générale :</span>
            <span class="font-black text-amber-400 mt-0.5 block text-sm">${average > 0 ? average.toFixed(2) + ' / 20' : '-'}</span>
          </div>
          <div>
            <span class="text-[9.5px] text-slate-500 uppercase font-black block">Mention Honorifique :</span>
            <span class="font-bold text-slate-300 mt-0.5 block">${sNotes.length > 0 ? mention : '-'}</span>
          </div>
          <div>
            <span class="text-[9.5px] text-slate-500 uppercase font-black block">Classe / Niveau :</span>
            <span class="font-bold text-slate-300 mt-0.5 block truncate">${getClasseName(stud.classe_id)}</span>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-850 flex justify-between items-center">
          <span class="text-[10px] text-slate-500 italic">Prêt pour impression sécurisée</span>
          <button onclick="printStudentReportCard(${stud.id})" class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer">
            <i data-lucide="printer" class="w-4 h-4"></i>
            Éditer & Imprimer
          </button>
        </div>
      </div>
    `;
  });
  lucide.createIcons();
}

function printStudentReportCard(studentId) {
  // Save active student ID for window print session
  localStorage.setItem("school_print_stud_id", studentId);
  localStorage.setItem("school_print_sem_id", globalSemestreId);
  
  // Clean alert then build printable overlay or trigger window print
  const studentObj = cache.students.find(s => s.id === studentId);
  const semObj = cache.semestres.find(s => s.id === globalSemestreId);
  if (!studentObj || !semObj) return;

  const notesList = cache.notes.filter(n => Number(n.etudiant_id) === Number(studentId) && Number(n.semestre_id) === Number(globalSemestreId));
  
  let rowsHtml = "";
  let totalWeighted = 0;
  let totalCoefs = 0;

  notesList.forEach(n => {
    const courObj = cache.cours.find(c => c.id === n.cours_id);
    const weightVal = Number(n.note) * Number(n.coefficient);
    totalWeighted += weightVal;
    totalCoefs += Number(n.coefficient);

    rowsHtml += `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${courObj ? courObj.titre : 'Matière'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${Number(n.note).toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${n.coefficient}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${weightVal.toFixed(2)}</td>
      </tr>
    `;
  });

  const average = totalCoefs > 0 ? totalWeighted / totalCoefs : 0;
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>Bulletin de Notes - ${studentObj.nom} ${studentObj.prenom}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
          .details { width: 100%; margin-bottom: 20px; font-size: 14px; }
          .details td { padding: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { background-color: #f2f2f2; font-weight: bold; border: 1px solid #ddd; padding: 8px; text-align: left; }
          .summary { margin-top: 25px; padding: 15px; border: 1px solid #333; background: #fafafa; font-size: 14px; width: 320px; margin-left: auto; }
          .summary-row { display: flex; justify-between: space-between; margin-bottom: 6px; }
          .summary-row:last-child { border-top: 1px solid #ccc; padding-top: 6px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">UNIVERSITÉ DES SCIENCES</div>
          <div style="font-size: 11px; letter-spacing: 2px;">RECONNU PAR L'ÉTAT - SECRÉTARIAT ACADÉMIQUE</div>
          <div style="font-size: 13px; font-weight: bold; margin-top: 8px; text-transform: uppercase;">BULLETIN DE NOTES - ${semObj.nom_semestre}</div>
          <div style="font-size: 12px; color: #666;">Année Académique : ${semObj.annee_scolaire}</div>
        </div>

        <table class="details">
          <tr>
            <td style="font-weight: bold; width: 12%;">Nom & Prénom:</td>
            <td>${studentObj.nom} ${studentObj.prenom}</td>
            <td style="font-weight: bold; width: 10%;">Matricule:</td>
            <td style="font-family: monospace;">${studentObj.matricule}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Filière:</td>
            <td>${getFiliereName(studentObj.filiere_id)}</td>
            <td style="font-weight: bold;">Niveau / Classe:</td>
            <td>${getClasseName(studentObj.classe_id)}</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>Cours / Enseignement Académique</th>
              <th style="text-align: center; width: 15%;">Note / 20</th>
              <th style="text-align: center; width: 12%;">Coefficient</th>
              <th style="text-align: center; width: 18%;">Note Pondérée</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Moyenne Générale :</span>
            <span style="font-weight: bold; color: #d97706;">${average.toFixed(2)} / 20</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Mention Honorifique :</span>
            <span style="font-weight: bold;">${getMention(average)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; border-top: 1px solid #ddd; padding-top: 6px;">
            <span style="text-transform: uppercase; font-size: 11px; font-weight: bold;">Décision de Jury :</span>
            <span style="font-weight: bold; text-transform: uppercase; color: ${average >= 10 ? 'green' : 'red'};">${average >= 10 ? 'ADMIS' : 'AJOURNÉ'}</span>
          </div>
        </div>

        <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px;">
          <div style="text-align: center; width: 200px;">
            Le Chef de Scolarité<br><br><br><strong>Signature Autorisée</strong>
          </div>
          <div style="text-align: center; width: 200px;">
            Le Président du Jury<br><br><br><strong>Signature Autorisée</strong>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// 8. Autorisations View
function renderAutorisationsTable() {
  const tbody = document.getElementById("autorisations-table-tbody");
  tbody.innerHTML = "";

  if (cache.autorisations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-500 font-bold uppercase">Aucune autorisation de filières accordée.</td></tr>`;
    return;
  }

  cache.autorisations.forEach(aut => {
    const stud = cache.students.find(s => s.id === aut.etudiant_id);
    const fil = cache.filieres.find(f => f.id === aut.filiere_id);
    
    const studName = stud ? `${stud.nom} ${stud.prenom}` : `Étudiant (#${aut.etudiant_id})`;
    const filName = fil ? fil.nom_filiere : `Filière (#${aut.filiere_id})`;

    tbody.innerHTML += `
      <tr class="hover:bg-slate-900/50 transition">
        <td class="p-3.5 font-mono text-slate-400 font-bold">#AUT-${aut.id}</td>
        <td class="p-3.5">
          <p class="font-extrabold text-white text-xs">${studName}</p>
          <span class="text-[10px] text-slate-400 block">${stud ? stud.matricule : ''}</span>
        </td>
        <td class="p-3.5"><span class="bg-[#c5a880]/15 border border-[#c5a880]/30 text-[#c5a880] text-[10px] font-extrabold px-2.5 py-1 rounded-lg">${filName}</span></td>
        <td class="p-3.5 text-slate-300 font-medium text-xs max-w-[200px] truncate" title="${aut.motif}">${aut.motif || 'Aucun motif de rattrapage'}</td>
        <td class="p-3.5 font-bold text-amber-500 font-space text-xs">${aut.autorise_par}</td>
        <td class="p-3.5 text-right">
          <button onclick="deleteAutorisation(${aut.id})" class="p-1.5 hover:bg-rose-500/10 text-rose-500 border border-transparent hover:border-rose-500/20 rounded-lg cursor-pointer transition">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

// 9. Paiements View
function renderPaiementsTable() {
  const tbody = document.getElementById("paiements-table-tbody");
  tbody.innerHTML = "";

  // Set configuration metrics
  document.getElementById("tuition-annual-config-display").textContent = `${formatMoney(cache.config.scolariteAnnuelle)} FCFA`;
  document.getElementById("tuition-count-display").textContent = `${cache.paiements.length} reçus`;

  let totalDue = cache.config.scolariteAnnuelle * cache.students.length;
  let totalReceived = 0;
  cache.paiements.forEach(p => totalReceived += Number(p.montant));

  let solvabilityRatio = totalDue > 0 ? (totalReceived / totalDue) * 100 : 100;
  document.getElementById("tuition-solvability-percentage").textContent = `${solvabilityRatio.toFixed(1)}%`;

  if (cache.paiements.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-500 font-bold uppercase">Aucun versement enregistré.</td></tr>`;
    return;
  }

  cache.paiements.forEach(pay => {
    const stud = cache.students.find(s => s.id === pay.etudiant_id);
    const studName = stud ? `${stud.nom} ${stud.prenom}` : `Inconnu (#${pay.etudiant_id})`;

    tbody.innerHTML += `
      <tr class="hover:bg-slate-900/50 transition">
        <td class="p-3.5 font-mono text-xs font-black text-amber-500">${pay.recu}</td>
        <td class="p-3.5">
          <p class="font-extrabold text-white text-xs">${studName}</p>
          <span class="text-[10px] text-slate-400 block">${stud ? stud.matricule : ''}</span>
        </td>
        <td class="p-3.5 font-extrabold text-emerald-400 text-xs">${formatMoney(pay.montant)} FCFA</td>
        <td class="p-3.5 font-mono text-slate-300 text-xs">${formatDate(pay.date_paiement)}</td>
        <td class="p-3.5 font-bold text-slate-300 text-xs">${pay.type_paiement}</td>
        <td class="p-3.5 text-right">
          <button onclick="deletePaiement(${pay.id})" class="p-1.5 hover:bg-rose-500/10 text-rose-500 border border-transparent hover:border-rose-500/20 rounded-lg cursor-pointer transition">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

// 10. Corbeille (Trash) View
function renderCorbeilleTable() {
  const tbody = document.getElementById("corbeille-table-tbody");
  tbody.innerHTML = "";

  document.getElementById("trash-badge").textContent = cache.trash.length;

  if (cache.trash.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-500 font-bold uppercase">La corbeille de l'administration est vide.</td></tr>`;
    return;
  }

  cache.trash.forEach(item => {
    let title = "";
    if (item.type === "etudiant") {
      title = `${item.data.nom} ${item.data.prenom} (${item.data.matricule})`;
    } else if (item.type === "cours") {
      title = `Cours : ${item.data.titre}`;
    } else if (item.type === "note") {
      title = `Note de ${item.data.note}/20 - Coeff ${item.data.coefficient}`;
    } else if (item.type === "filiere") {
      title = `Filière : ${item.data.nom_filiere}`;
    } else if (item.type === "semester") {
      title = `Semestre : ${item.data.nom_semestre}`;
    } else if (item.type === "paiement") {
      title = `Reçu ${item.data.recu} d'un montant de ${item.data.montant} FCFA`;
    }

    tbody.innerHTML += `
      <tr class="hover:bg-slate-900/50 transition">
        <td class="p-3.5 font-extrabold text-amber-500 uppercase text-[10px] tracking-wider">${item.type}</td>
        <td class="p-3.5 font-medium text-white text-xs">${title}</td>
        <td class="p-3.5 font-mono text-slate-400 text-xs">${formatDateTime(item.deleted_at)}</td>
        <td class="p-3.5 text-right space-x-1">
          <button onclick="restoreTrashItem(${item.id})" class="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-lg text-[10px] cursor-pointer shadow transition">
            Restaurer
          </button>
          <button onclick="deleteTrashItemPermanently(${item.id})" class="px-3 py-1 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/25 text-rose-300 hover:text-white font-bold rounded-lg text-[10px] cursor-pointer transition">
            Détruire
          </button>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

// =========================================================
// PANEL RENDERERS: STUDENT PORTAL
// =========================================================
function renderStudentDashboard() {
  const stud = currentUser.student;
  document.getElementById("student-portal-welcome-title").textContent = `Félicitations, ${stud.prenom} !`;
  document.getElementById("student-active-filiere-label").textContent = `${getFiliereName(stud.filiere_id)} - ${getClasseName(stud.classe_id)}`;

  // Render course files
  const courseContainer = document.getElementById("student-courses-container");
  courseContainer.innerHTML = "";

  // Find all courses matching student's filiere & classe
  const studentCourses = cache.cours.filter(c => Number(c.filiere_id) === Number(stud.filiere_id) && Number(c.classe_id) === Number(stud.classe_id));
  document.getElementById("student-courses-count-label").textContent = `${studentCourses.length} documents`;

  if (studentCourses.length === 0) {
    courseContainer.innerHTML = `<p class="text-xs text-slate-500 font-bold py-4 text-center">Aucun document n'est publié pour votre classe pour le moment.</p>`;
  } else {
    studentCourses.forEach(c => {
      courseContainer.innerHTML += `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center hover:border-amber-500/30 transition">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <i data-lucide="file-text" class="w-5.5 h-5.5"></i>
            </div>
            <div>
              <p class="font-bold text-white text-xs">${c.titre}</p>
              <span class="text-[10px] text-amber-500 font-bold">Ressource de: Prof. ${c.enseignant}</span>
            </div>
          </div>
          <button onclick="downloadFileAlert('${c.fichier}')" class="p-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:text-amber-400 rounded-lg text-slate-400 transition">
            <i data-lucide="download" class="w-4 h-4"></i>
          </button>
        </div>
      `;
    });
  }

  // Render grades (Fiches de notes / bulletins)
  const notesTbody = document.getElementById("student-notes-tbody");
  notesTbody.innerHTML = "";

  // Student grades
  const studentNotes = cache.notes.filter(n => Number(n.etudiant_id) === Number(stud.id));
  
  let totalWeighted = 0;
  let totalCoefs = 0;

  if (studentNotes.length === 0) {
    notesTbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-500 font-bold">Aucune note n'a encore été saisie par vos professeurs.</td></tr>`;
  } else {
    studentNotes.forEach(n => {
      const courObj = cache.cours.find(c => c.id === n.cours_id);
      const weightVal = Number(n.note) * Number(n.coefficient);
      totalWeighted += weightVal;
      totalCoefs += Number(n.coefficient);

      const colorClass = n.note >= 10 ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold';

      notesTbody.innerHTML += `
        <tr class="hover:bg-slate-900/50 transition">
          <td class="py-2.5 font-bold text-white text-xs">${courObj ? courObj.titre : 'Matière'}</td>
          <td class="py-2.5"><span class="${colorClass} text-xs">${Number(n.note).toFixed(2)} / 20</span></td>
          <td class="py-2.5 text-center font-extrabold text-slate-300 text-xs">${n.coefficient}</td>
          <td class="py-2.5 text-right font-mono text-slate-100 font-bold text-xs">${weightVal.toFixed(2)}</td>
        </tr>
      `;
    });
  }

  // Display calculations
  const average = totalCoefs > 0 ? totalWeighted / totalCoefs : 0;
  document.getElementById("student-notes-total-weighted").textContent = totalWeighted.toFixed(2);
  document.getElementById("student-notes-total-coefs").textContent = totalCoefs;
  
  const gpaLabel = document.getElementById("student-notes-gpa-display");
  gpaLabel.textContent = average > 0 ? `${average.toFixed(2)} / 20` : "0.00 / 20";
  
  const mentionLabel = document.getElementById("student-notes-mention-display");
  mentionLabel.textContent = studentNotes.length > 0 ? getMention(average) : "-";

  const decisionLabel = document.getElementById("student-notes-decision-display");
  if (studentNotes.length === 0) {
    decisionLabel.textContent = "-";
    decisionLabel.className = "px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-800 text-slate-400";
  } else {
    const isAdmis = average >= 10;
    decisionLabel.textContent = isAdmis ? "ADMIS" : "AJOURNÉ";
    decisionLabel.className = isAdmis 
      ? "px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
      : "px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-400";
  }

  // Solvability metrics
  const studentPayments = cache.paiements.filter(p => Number(p.etudiant_id) === Number(stud.id));
  let studentTotalPaid = 0;
  studentPayments.forEach(p => studentTotalPaid += Number(p.montant));

  const remainingToPay = cache.config.scolariteAnnuelle - studentTotalPaid;

  document.getElementById("student-solvability-total").textContent = `${formatMoney(cache.config.scolariteAnnuelle)} FCFA`;
  document.getElementById("student-solvability-remaining").textContent = `${formatMoney(remainingToPay)} FCFA`;

  // Solvability mini table
  const payTbody = document.getElementById("student-payments-tbody");
  payTbody.innerHTML = "";
  if (studentPayments.length === 0) {
    payTbody.innerHTML = `<tr><td colspan="4" class="py-3 text-center text-slate-500 font-bold">Aucun versement n'a encore été enregistré.</td></tr>`;
  } else {
    studentPayments.forEach(p => {
      payTbody.innerHTML += `
        <tr class="hover:bg-slate-900/50 transition">
          <td class="py-2 font-mono text-amber-500 font-bold">${p.recu}</td>
          <td class="py-2 font-extrabold text-emerald-400">${formatMoney(p.montant)} FCFA</td>
          <td class="py-2 font-mono text-slate-400">${formatDate(p.date_paiement)}</td>
          <td class="py-2 text-right text-slate-300">${p.type_paiement}</td>
        </tr>
      `;
    });
  }
  lucide.createIcons();
}

// =========================================================
// HELPER CONVERTERS
// =========================================================
function getFiliereName(filiereId) {
  const f = cache.filieres.find(item => Number(item.id) === Number(filiereId));
  return f ? f.nom_filiere : "Filière Inconnue";
}

function getClasseName(classeId) {
  const c = cache.classes.find(item => Number(item.id) === Number(classeId));
  return c ? c.nom_classe : "Classe Inconnue";
}

function getMention(gpa) {
  if (gpa === 0) return "-";
  if (gpa >= 16) return "Très Bien";
  if (gpa >= 14) return "Bien";
  if (gpa >= 12) return "Assez Bien";
  if (gpa >= 10) return "Passable";
  return "Insuffisant";
}

function formatMoney(amount) {
  return Number(amount).toLocaleString("fr-FR");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return "-";
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return dateTimeStr;
  }
}

// =========================================================
// THEME & COMPACT MANAGER
// =========================================================
function toggleTheme() {
  adminTheme = (adminTheme === "sombre-or") ? "clair-pro" : "sombre-or";
  localStorage.setItem("school_theme", adminTheme);
  applyTheme();
}

function applyTheme() {
  const body = document.getElementById("body-container");
  const header = document.getElementById("admin-header-panel");
  const sidebar = document.getElementById("admin-sidebar");
  const themeText = document.getElementById("theme-btn-text");
  const themeIcon = document.getElementById("theme-btn-icon");

  if (adminTheme === "sombre-or") {
    body.className = "h-full bg-slate-950 font-sans text-slate-100 antialiased theme-sombre-or";
    if (header) header.className = "bg-slate-900 border-b border-amber-500/20 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 transition-all";
    if (sidebar) sidebar.className = "w-full lg:w-64 bg-slate-900 text-slate-100 shrink-0 flex flex-col border-r border-slate-800 p-4 justify-between";
    if (themeText) themeText.textContent = "Mode Sombre & Or";
    if (themeIcon) {
      themeIcon.setAttribute("data-lucide", "moon");
      themeIcon.classList.add("fill-amber-400");
    }
  } else {
    body.className = "h-full bg-slate-50 font-sans text-slate-900 antialiased theme-clair-pro";
    if (header) header.className = "bg-white border-b border-gray-200 text-slate-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 transition-all";
    if (sidebar) sidebar.className = "w-full lg:w-64 bg-slate-100 text-slate-800 shrink-0 flex flex-col border-r border-gray-200 p-4 justify-between";
    if (themeText) themeText.textContent = "Mode Clair Pro";
    if (themeIcon) {
      themeIcon.setAttribute("data-lucide", "sun");
      themeIcon.classList.remove("fill-amber-400");
    }
  }

  // Update tabs style
  setActiveTab(activeTab);
  lucide.createIcons();
}

function toggleCompactScroll() {
  compactScroll = !compactScroll;
  localStorage.setItem("school_compact", String(compactScroll));
  applyCompactScroll();
}

function applyCompactScroll() {
  const btn = document.getElementById("compact-scroll-btn");
  if (!btn) return;

  if (compactScroll) {
    btn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all duration-200 bg-amber-500/15 border-amber-500/40 text-[#c5a880] shadow shadow-amber-950/20";
    btn.innerHTML = `<i data-lucide="minimize-2" class="w-3.5 h-3.5 text-amber-500"></i><span>Hauteur Compacte ✓</span>`;
  } else {
    btn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all duration-200 bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200";
    btn.innerHTML = `<i data-lucide="maximize-2" class="w-3.5 h-3.5 text-slate-400"></i><span>Affichage Étendu</span>`;
  }
  lucide.createIcons();
}

function setGlobalSchoolYear(year) {
  globalSchoolYear = year;
  
  // Highlight year toolbar buttons
  const years = ["2024-2025", "2025-2026", "2026-2027"];
  const mapIds = { "2024-2025": "24", "2025-2026": "25", "2026-2027": "26" };
  
  years.forEach(y => {
    const btn = document.getElementById(`year-btn-${mapIds[y]}`);
    if (btn) {
      if (y === year) {
        btn.className = "text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black shadow transition-all";
      } else {
        btn.className = "text-[10px] font-bold px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-all";
      }
    }
  });

  // Re-fetch or filter semestres
  populateDropdownFilters();
  renderActivePanel();
}

function handleGlobalFiliereChange() {
  globalFiliereId = Number(document.getElementById("global-filiere-select").value);
  renderActivePanel();
}

function handleGlobalSemestreChange() {
  globalSemestreId = Number(document.getElementById("global-semestre-select").value);
  renderActivePanel();
}

// =========================================================
// MODALS WRAPPERS & UTILS
// =========================================================
function openModal(id) {
  document.getElementById(id).classList.remove("view-hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("view-hidden");
}

// =========================================================
// ACTION TRIGGERS (ADD, EDIT, DELETE EXECUTERS)
// =========================================================

// --- ETUDIANTS ---
function openAddStudentModal() {
  document.getElementById("modal-student-title").textContent = "Inscrire un Nouvel Étudiant";
  document.getElementById("form-student-id").value = "";
  document.getElementById("form-student-matricule").value = `ETU2025000${cache.students.length + 1}`;
  document.getElementById("form-student-email").value = "";
  document.getElementById("form-student-nom").value = "";
  document.getElementById("form-student-prenom").value = "";
  document.getElementById("form-student-dob").value = "2004-01-01";
  document.getElementById("form-student-tel").value = "";
  document.getElementById("form-student-adresse").value = "";
  document.getElementById("form-student-pass").value = "";
  
  openModal("modal-student");
}

function editStudent(id) {
  const stud = cache.students.find(s => s.id === id);
  if (!stud) return;

  document.getElementById("modal-student-title").textContent = "Modifier la fiche de l'Étudiant";
  document.getElementById("form-student-id").value = stud.id;
  document.getElementById("form-student-matricule").value = stud.matricule;
  document.getElementById("form-student-email").value = stud.email;
  document.getElementById("form-student-nom").value = stud.nom;
  document.getElementById("form-student-prenom").value = stud.prenom;
  document.getElementById("form-student-dob").value = stud.date_naissance;
  document.getElementById("form-student-tel").value = stud.telephone;
  document.getElementById("form-student-adresse").value = stud.adresse;
  document.getElementById("form-student-filiere").value = stud.filiere_id;
  document.getElementById("form-student-classe").value = stud.classe_id;
  document.getElementById("form-student-pass").value = stud.mot_de_passe;

  openModal("modal-student");
}

async function handleStudentFormSubmit(event) {
  event.preventDefault();
  const id = document.getElementById("form-student-id").value;
  const payload = {
    matricule: document.getElementById("form-student-matricule").value.trim(),
    email: document.getElementById("form-student-email").value.trim(),
    nom: document.getElementById("form-student-nom").value.trim().toUpperCase(),
    prenom: document.getElementById("form-student-prenom").value.trim(),
    sexe: document.getElementById("form-student-sexe").value,
    date_naissance: document.getElementById("form-student-dob").value,
    telephone: document.getElementById("form-student-tel").value.trim(),
    adresse: document.getElementById("form-student-adresse").value.trim(),
    filiere_id: Number(document.getElementById("form-student-filiere").value),
    classe_id: Number(document.getElementById("form-student-classe").value),
    mot_de_passe: document.getElementById("form-student-pass").value || "admin123"
  };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/etudiants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch("/api/etudiants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) throw new Error("Erreur de sauvegarde");
    
    closeModal("modal-student");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteStudent(id) {
  if (!confirm("Voulez-vous vraiment supprimer temporairement cet étudiant ? (Il sera déplacé dans la corbeille SQL)")) return;
  try {
    const res = await fetch(`/api/etudiants/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur lors du déplacement en corbeille");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

// --- FILIERES ---
function openAddFiliereModal() {
  document.getElementById("form-filiere-nom").value = "";
  document.getElementById("form-filiere-desc").value = "";
  openModal("modal-filiere");
}

async function handleFiliereFormSubmit(event) {
  event.preventDefault();
  const payload = {
    nom_filiere: document.getElementById("form-filiere-nom").value.trim(),
    description: document.getElementById("form-filiere-desc").value.trim()
  };

  try {
    const res = await fetch("/api/filieres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Filière existante ou invalide");
    closeModal("modal-filiere");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteFiliere(id) {
  if (!confirm("Attention : Supprimer cette filière entraînera la suppression temporaire rattachée dans la corbeille. Continuer ?")) return;
  try {
    const res = await fetch(`/api/filieres/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

// --- SEMESTRES ---
function openAddSemestreModal() {
  document.getElementById("form-semestre-nom").value = `Semestre ${cache.semestres.length + 1}`;
  openModal("modal-semestre");
}

async function handleSemestreFormSubmit(event) {
  event.preventDefault();
  const payload = {
    nom_semestre: document.getElementById("form-semestre-nom").value.trim(),
    filiere_id: Number(document.getElementById("form-semestre-filiere").value),
    annee_scolaire: document.getElementById("form-semestre-annee").value
  };

  try {
    const res = await fetch("/api/semestres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Erreur de création");
    closeModal("modal-semestre");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteSemestre(id) {
  if (!confirm("Voulez-vous supprimer ce semestre ?")) return;
  try {
    await fetch(`/api/semestres/${id}`, { method: "DELETE" });
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

// --- COURS ---
function openAddCoursModal() {
  document.getElementById("form-cours-titre").value = "";
  document.getElementById("form-cours-desc").value = "";
  document.getElementById("form-cours-fichier").value = `cours_${Date.now().toString().slice(-4)}.pdf`;
  document.getElementById("form-cours-enseignant").value = "M. Bouré";
  openModal("modal-cours");
}

async function handleCoursFormSubmit(event) {
  event.preventDefault();
  const payload = {
    titre: document.getElementById("form-cours-titre").value.trim(),
    description: document.getElementById("form-cours-desc").value.trim(),
    fichier: document.getElementById("form-cours-fichier").value.trim(),
    enseignant: document.getElementById("form-cours-enseignant").value.trim(),
    filiere_id: Number(document.getElementById("form-cours-filiere").value),
    classe_id: Number(document.getElementById("form-cours-classe").value),
    semestre_id: Number(document.getElementById("form-cours-semestre").value)
  };

  try {
    const res = await fetch("/api/cours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Erreur");
    closeModal("modal-cours");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteCours(id) {
  if (!confirm("Voulez-vous supprimer ce cours ?")) return;
  try {
    await fetch(`/api/cours/${id}`, { method: "DELETE" });
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

// --- NOTES ---
function openAddNoteModal() {
  document.getElementById("form-note-valeur").value = "";
  document.getElementById("form-note-coef").value = "2";
  document.getElementById("form-note-credits").value = "3";
  openModal("modal-note");
}

async function handleNoteFormSubmit(event) {
  event.preventDefault();
  const payload = {
    etudiant_id: Number(document.getElementById("form-note-etudiant").value),
    cours_id: Number(document.getElementById("form-note-cours").value),
    note: Number(document.getElementById("form-note-valeur").value),
    coefficient: Number(document.getElementById("form-note-coef").value),
    semestre_id: Number(document.getElementById("form-note-semestre").value),
    credits: Number(document.getElementById("form-note-credits").value)
  };

  try {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Erreur de saisie");
    closeModal("modal-note");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteNote(id) {
  if (!confirm("Supprimer cette note ?")) return;
  try {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

// --- PAIEMENTS ---
function openConfigureTuitionModal() {
  document.getElementById("form-tuition-annual").value = cache.config.scolariteAnnuelle;
  openModal("modal-tuition-config");
}

async function handleConfigureTuitionSubmit(event) {
  event.preventDefault();
  const payload = {
    scolariteAnnuelle: Number(document.getElementById("form-tuition-annual").value),
    anneesScolaires: cache.config.anneesScolaires
  };

  try {
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    closeModal("modal-tuition-config");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

function openAddPaiementModal() {
  document.getElementById("form-pay-montant").value = "500000";
  document.getElementById("form-pay-date").value = new Date().toISOString().split("T")[0];
  document.getElementById("form-pay-recu").value = `REC-2025-00${cache.paiements.length + 1}`;
  openModal("modal-paiement");
}

async function handlePaiementFormSubmit(event) {
  event.preventDefault();
  const payload = {
    etudiant_id: Number(document.getElementById("form-pay-etudiant").value),
    montant: Number(document.getElementById("form-pay-montant").value),
    date_paiement: document.getElementById("form-pay-date").value,
    type_paiement: document.getElementById("form-pay-type").value,
    recu: document.getElementById("form-pay-recu").value.trim()
  };

  try {
    const res = await fetch("/api/paiements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Erreur d'ajout");
    closeModal("modal-paiement");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

async function deletePaiement(id) {
  if (!confirm("Voulez-vous supprimer ce versement ?")) return;
  try {
    await fetch(`/api/paiements/${id}`, { method: "DELETE" });
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

// --- AUTORISATIONS ---
function openAddAutorisationModal() {
  document.getElementById("form-aut-motif").value = "Rattrapage inter-filières exceptionnel";
  openModal("modal-autorisation");
}

async function handleAutorisationFormSubmit(event) {
  event.preventDefault();
  const payload = {
    etudiant_id: Number(document.getElementById("form-aut-etudiant").value),
    filiere_id: Number(document.getElementById("form-aut-filiere").value),
    motif: document.getElementById("form-aut-motif").value.trim(),
    autorise_par: "Secrétariat Général"
  };

  try {
    await fetch("/api/autorisations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    closeModal("modal-autorisation");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteAutorisation(id) {
  if (!confirm("Retirer cette autorisation d'accès ?")) return;
  try {
    await fetch(`/api/autorisations/${id}`, { method: "DELETE" });
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

// --- TRASHRESTORE / PURGE ---
async function restoreTrashItem(id) {
  try {
    const res = await fetch(`/api/trash/restore/${id}`, { method: "POST" });
    if (!res.ok) throw new Error("Échec de la restauration");
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteTrashItemPermanently(id) {
  if (!confirm("Cette suppression sera DÉFINITIVE en base de données SQL. Voulez-vous continuer ?")) return;
  try {
    await fetch(`/api/trash/${id}`, { method: "DELETE" });
    loadAllData();
  } catch (err) {
    alert(err.message);
  }
}
