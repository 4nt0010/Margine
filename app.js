// ---------------------------------------------------------------------------
// Margine — logica applicativa
// ---------------------------------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider, deleteUser
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, deleteDoc,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCI8RBbxe2rfnwcuxggWKnpKJGj81tT9Uw",
  authDomain: "margine-6f8dd.firebaseapp.com",
  projectId: "margine-6f8dd",
  storageBucket: "margine-6f8dd.firebasestorage.app",
  messagingSenderId: "990757017012",
  appId: "1:990757017012:web:9b6ddb7a6f6f938f2ccee1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const PALETTE = [
  { key: "mustard", hex: "#E7B44A" },
  { key: "teal", hex: "#5C9186" },
  { key: "rose", hex: "#D98098" },
  { key: "denim", hex: "#6C8FB8" },
  { key: "plum", hex: "#9A7CAE" }
];

function colorHex(key) {
  const found = PALETTE.find(c => c.key === key);
  return found ? found.hex : PALETTE[0].hex;
}

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------

const views = {
  auth: document.getElementById("auth-view"),
  list: document.getElementById("list-view"),
  editor: document.getElementById("editor-view"),
  account: document.getElementById("account-view"),
  materie: document.getElementById("materie-view"),
  timetable: document.getElementById("timetable-view"),
  materiaDetail: document.getElementById("materia-detail-view"),
  archive: document.getElementById("archive-view")
};

const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authError = document.getElementById("auth-error");
const authSubmit = document.getElementById("auth-submit");
const authSwitchBtn = document.getElementById("auth-switch-btn");
const authSwitchText = document.getElementById("auth-switch-text");
const authTagline = document.getElementById("auth-tagline");

const accountBtn = document.getElementById("account-btn");
const accountBackBtn = document.getElementById("account-back-btn");
const accountAvatar = document.getElementById("account-avatar");
const accountEmailEl = document.getElementById("account-email");
const accountMetaEl = document.getElementById("account-meta");
const passwordForm = document.getElementById("password-form");
const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");
const pwMsg = document.getElementById("pw-msg");
const signoutBtn = document.getElementById("signout-btn");
const deleteAccountBtn = document.getElementById("delete-account-btn");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const chipsRow = document.getElementById("chips-row");
const cardsGrid = document.getElementById("cards-grid");
const emptyState = document.getElementById("empty-state");
const newNoteBtn = document.getElementById("new-note-btn");

const newnoteBackdrop = document.getElementById("newnote-backdrop");
const newnoteBlank = document.getElementById("newnote-blank");
const newnoteTemplate = document.getElementById("newnote-template");
const newnoteClose = document.getElementById("newnote-close");

const backBtn = document.getElementById("back-btn");
const pinBtn = document.getElementById("pin-btn");
const moreBtn = document.getElementById("more-btn");
const moreBackdrop = document.getElementById("more-backdrop");
const moreClose = document.getElementById("more-close");
const duplicateBtn = document.getElementById("duplicate-btn");
const historyBtn = document.getElementById("history-btn");
const printBtn = document.getElementById("print-btn");
const deleteBtn = document.getElementById("delete-btn");
const saveIndicator = document.getElementById("save-indicator");
const editorMeta = document.getElementById("editor-meta");
const colorDotsEl = document.getElementById("color-dots");
const subjectInput = document.getElementById("subject-input");
const titleInput = document.getElementById("title-input");
const bodyEditor = document.getElementById("body-editor");

const styleSelect = document.getElementById("style-select");
const boldBtn = document.getElementById("bold-btn");
const italicBtn = document.getElementById("italic-btn");
const underlineBtn = document.getElementById("underline-btn");
const highlightBtn = document.getElementById("highlight-btn");
const fineUnderlineBtn = document.getElementById("fine-underline-btn");
const listBtn = document.getElementById("list-btn");
const numberedListBtn = document.getElementById("numbered-list-btn");
const checklistBtn = document.getElementById("checklist-btn");
const alignLeftBtn = document.getElementById("align-left-btn");
const alignCenterBtn = document.getElementById("align-center-btn");
const alignRightBtn = document.getElementById("align-right-btn");
const tableBtn = document.getElementById("table-btn");
const columnsBtn = document.getElementById("columns-btn");
const tocBtn = document.getElementById("toc-btn");
const deleteTableBtn = document.getElementById("delete-table-btn");

const themeSelect = document.getElementById("theme-select");
const fontsizeSelect = document.getElementById("fontsize-select");
const densitySelect = document.getElementById("density-select");
const widthSelect = document.getElementById("width-select");

const materieBtn = document.getElementById("materie-btn");
const materieBackBtn = document.getElementById("materie-back-btn");
const materiaAddBtn = document.getElementById("materia-add-btn");
const materieList = document.getElementById("materie-list");
const materieEmpty = document.getElementById("materie-empty");
const materiaFormBackdrop = document.getElementById("materia-form-backdrop");
const materiaFormTitle = document.getElementById("materia-form-title");
const materiaNameInput = document.getElementById("materia-name-input");
const materiaColorDots = document.getElementById("materia-color-dots");
const materiaSaveBtn = document.getElementById("materia-save-btn");
const materiaDeleteBtn = document.getElementById("materia-delete-btn");
const materiaFormClose = document.getElementById("materia-form-close");

const timetableBtn = document.getElementById("timetable-btn");
const timetableBackBtn = document.getElementById("timetable-back-btn");
const slotAddBtn = document.getElementById("slot-add-btn");
const dayTabs = document.getElementById("day-tabs");
const slotList = document.getElementById("slot-list");
const timetableEmpty = document.getElementById("timetable-empty");
const slotFormBackdrop = document.getElementById("slot-form-backdrop");
const slotFormTitle = document.getElementById("slot-form-title");
const slotDaySelect = document.getElementById("slot-day-select");
const slotStartInput = document.getElementById("slot-start-input");
const slotEndInput = document.getElementById("slot-end-input");
const slotSubjectSelect = document.getElementById("slot-subject-select");
const slotRoomInput = document.getElementById("slot-room-input");
const slotSaveBtn = document.getElementById("slot-save-btn");
const slotDeleteBtn = document.getElementById("slot-delete-btn");
const slotFormClose = document.getElementById("slot-form-close");

const materiaDetailBackBtn = document.getElementById("materia-detail-back-btn");
const materiaDetailEditBtn = document.getElementById("materia-detail-edit-btn");
const materiaDetailTitle = document.getElementById("materia-detail-title");
const materiaDetailGrid = document.getElementById("materia-detail-grid");
const materiaDetailEmpty = document.getElementById("materia-detail-empty");

const archiveNavBtn = document.getElementById("archive-nav-btn");
const archiveBackBtn = document.getElementById("archive-back-btn");
const archiveGrid = document.getElementById("archive-grid");
const archiveEmpty = document.getElementById("archive-empty");

const addColumnBtn = document.getElementById("add-column-btn");
const deleteColumnBtn = document.getElementById("delete-column-btn");
const archiveBtn = document.getElementById("archive-btn");
const archiveBtnLabel = document.getElementById("archive-btn-label");

const versionBackdrop = document.getElementById("version-backdrop");
const versionList = document.getElementById("version-list");
const versionClose = document.getElementById("version-close");

const toastEl = document.getElementById("toast");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentUser = null;
let notesCache = [];
let subjectsCache = [];
let timetableCache = [];
let unsubscribeNotes = null;
let unsubscribeUserDoc = null;
let unsubscribeSubjects = null;
let unsubscribeTimetable = null;
let activeSubjectFilter = "";
let currentSort = "recenti";
let authMode = "login"; // or "register"
let editingMateriaId = null;
let currentMateriaDetailName = null;
let editorReturnView = "list";
let editingSlotId = null;
let activeDayTab = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

let currentNoteId = null;
let currentNoteSnapshot = null; // last known-saved state of the open note
let saveTimer = null;
let lastActiveBlock = null;

// ---------------------------------------------------------------------------
// View switching
// ---------------------------------------------------------------------------

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle("active", key === name);
  });
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

authSwitchBtn.addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  authError.textContent = "";
  if (authMode === "register") {
    authSubmit.textContent = "Crea account";
    authSwitchText.textContent = "Hai già un account?";
    authSwitchBtn.textContent = "Accedi";
    authTagline.textContent = "Crea un account per iniziare a prendere appunti.";
  } else {
    authSubmit.textContent = "Accedi";
    authSwitchText.textContent = "Non hai un account?";
    authSwitchBtn.textContent = "Registrati";
    authTagline.textContent = "Accedi per ritrovare i tuoi appunti su ogni dispositivo.";
  }
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  authSubmit.disabled = true;
  const email = authEmail.value.trim();
  const password = authPassword.value;
  try {
    if (authMode === "login") {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    authError.textContent = friendlyAuthError(err.code);
  } finally {
    authSubmit.disabled = false;
  }
});

function friendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-email": return "Email non valida.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Email o password non corrette.";
    case "auth/email-already-in-use": return "Esiste già un account con questa email.";
    case "auth/weak-password": return "La password deve avere almeno 6 caratteri.";
    default: return "Qualcosa è andato storto. Riprova.";
  }
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (unsubscribeNotes) { unsubscribeNotes(); unsubscribeNotes = null; }
  if (unsubscribeUserDoc) { unsubscribeUserDoc(); unsubscribeUserDoc = null; }
  if (unsubscribeSubjects) { unsubscribeSubjects(); unsubscribeSubjects = null; }
  if (unsubscribeTimetable) { unsubscribeTimetable(); unsubscribeTimetable = null; }

  if (user) {
    authForm.reset();
    showView("list");
    subscribeNotes(user.uid);
    subscribeSubjects(user.uid);
    subscribeTimetable(user.uid);
    unsubscribeUserDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const prefs = (snap.exists() && snap.data().prefs) || {};
      applyPrefs(prefs);
    });
  } else {
    notesCache = [];
    subjectsCache = [];
    timetableCache = [];
    showView("auth");
  }
});

// ---------------------------------------------------------------------------
// Aspetto — temi e preferenze di visualizzazione
// ---------------------------------------------------------------------------

function applyPrefs(prefs) {
  const theme = prefs.theme || "quaderno";
  const fontSize = prefs.fontSize || "m";
  const density = prefs.density || "normale";
  const width = prefs.width || "a4";

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-fontsize", fontSize);
  document.documentElement.setAttribute("data-density", density);
  document.documentElement.setAttribute("data-width", width);

  themeSelect.value = theme;
  fontsizeSelect.value = fontSize;
  densitySelect.value = density;
  widthSelect.value = width;
}

async function savePrefs() {
  if (!currentUser) return;
  const prefs = {
    theme: themeSelect.value,
    fontSize: fontsizeSelect.value,
    density: densitySelect.value,
    width: widthSelect.value
  };
  applyPrefs(prefs);
  try {
    await setDoc(doc(db, "users", currentUser.uid), { prefs }, { merge: true });
  } catch (err) {
    console.error("Impossibile salvare le preferenze di aspetto", err);
  }
}

themeSelect.addEventListener("change", savePrefs);
fontsizeSelect.addEventListener("change", savePrefs);
densitySelect.addEventListener("change", savePrefs);
widthSelect.addEventListener("change", savePrefs);

accountBtn.addEventListener("click", () => {
  openAccountView();
});
accountBackBtn.addEventListener("click", () => showView("list"));

materieBtn.addEventListener("click", () => showView("materie"));
materieBackBtn.addEventListener("click", () => showView("list"));

timetableBtn.addEventListener("click", () => {
  renderDayTabs();
  renderSlotList();
  showView("timetable");
});
timetableBackBtn.addEventListener("click", () => showView("list"));

archiveNavBtn.addEventListener("click", () => {
  renderArchiveGrid();
  showView("archive");
});
archiveBackBtn.addEventListener("click", () => showView("list"));

materiaDetailBackBtn.addEventListener("click", () => showView("materie"));
materiaDetailEditBtn.addEventListener("click", () => {
  const materia = subjectsCache.find(s => s.name === currentMateriaDetailName);
  if (materia) openMateriaForm(materia);
});

function openMateriaDetail(materiaName) {
  currentMateriaDetailName = materiaName;
  const materia = subjectsCache.find(s => s.name === materiaName);
  materiaDetailTitle.textContent = materiaName;
  materiaDetailTitle.style.borderLeft = materia ? `3px solid ${colorHex(materia.color)}` : "";
  materiaDetailTitle.style.paddingLeft = materia ? "8px" : "";
  renderMateriaDetailGrid();
  showView("materiaDetail");
}

function renderMateriaDetailGrid() {
  const notes = notesCache
    .filter(n => !n.archived && n.subject === currentMateriaDetailName)
    .sort((a, b) => tsToMillis(b.updatedAt) - tsToMillis(a.updatedAt));
  materiaDetailGrid.innerHTML = "";
  materiaDetailEmpty.style.display = notes.length ? "none" : "block";
  notes.forEach(note => materiaDetailGrid.appendChild(buildNoteCard(note, "materiaDetail")));
}

function renderArchiveGrid() {
  const notes = notesCache
    .filter(n => n.archived)
    .sort((a, b) => tsToMillis(b.updatedAt) - tsToMillis(a.updatedAt));
  archiveGrid.innerHTML = "";
  archiveEmpty.style.display = notes.length ? "none" : "block";
  notes.forEach(note => archiveGrid.appendChild(buildNoteCard(note, "archive")));
}

// ---------------------------------------------------------------------------
// Notes: realtime list
// ---------------------------------------------------------------------------

function notesCol() {
  return collection(db, "users", currentUser.uid, "notes");
}

function subscribeNotes(uid) {
  // niente orderBy lato server: un documento senza il campo updatedAt verrebbe
  // escluso in silenzio da Firestore. Ordiniamo lato client in renderList().
  unsubscribeNotes = onSnapshot(collection(db, "users", uid, "notes"), (snap) => {
    notesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderChips();
    renderList();
    renderMaterieList();
  });
}

function subscribeSubjects(uid) {
  unsubscribeSubjects = onSnapshot(collection(db, "users", uid, "subjects"), (snap) => {
    subjectsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "it"));
    renderChips();
    renderMaterieList();
    refreshSubjectSelects();
    renderSlotList();
  });
}

function subscribeTimetable(uid) {
  unsubscribeTimetable = onSnapshot(collection(db, "users", uid, "timetable"), (snap) => {
    timetableCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderSlotList();
  });
}

function tsToMillis(ts) {
  if (!ts) return Date.now(); // scrittura ancora in transito: la trattiamo come "adesso"
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  return Date.now();
}

function renderChips() {
  const current = activeSubjectFilter;
  chipsRow.innerHTML = "";
  chipsRow.appendChild(makeChip("Tutti", "", null));
  subjectsCache.forEach(s => chipsRow.appendChild(makeChip(s.name, s.name, s.color)));

  const stillExists = subjectsCache.some(s => s.name === current);
  if (current && !stillExists) activeSubjectFilter = "";
  [...chipsRow.children].forEach(c => {
    c.classList.toggle("active", c.dataset.subject === activeSubjectFilter);
  });
}

function makeChip(label, value, color) {
  const btn = document.createElement("button");
  btn.className = "chip";
  btn.dataset.subject = value;
  if (color) {
    btn.innerHTML = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${colorHex(color)};margin-right:6px;vertical-align:middle;"></span>${escapeHTML(label)}`;
  } else {
    btn.textContent = label;
  }
  btn.addEventListener("click", () => {
    activeSubjectFilter = value;
    [...chipsRow.children].forEach(c => c.classList.toggle("active", c === btn));
    renderList();
  });
  return btn;
}

searchInput.addEventListener("input", renderList);
sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  renderList();
});

function buildNoteCard(note, returnView) {
  const card = document.createElement("button");
  card.className = "note-card";
  card.style.background = colorHex(note.color);

  const excerpt = htmlToPlainText(note.bodyHTML || "").slice(0, 160);
  const dateLabel = formatDate(note.updatedAt);

  card.innerHTML = `
    ${note.pinned ? `<svg class="card-pin" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 17v5M5 15.24V15a2 2 0 0 1 .89-1.66L8 12V5a1 1 0 0 1-1-1V3h10v1a1 1 0 0 1-1 1v7l2.11 1.34A2 2 0 0 1 19 15v.24Z"/></svg>` : ""}
    ${note.subject ? `<div class="card-subject">${escapeHTML(note.subject)}</div>` : ""}
    <div class="card-title">${escapeHTML(note.title || "Senza titolo")}</div>
    ${excerpt ? `<div class="card-excerpt">${escapeHTML(excerpt)}</div>` : ""}
    <div class="card-date">${dateLabel}</div>
  `;
  card.addEventListener("click", () => {
    editorReturnView = returnView || "list";
    openEditor(note.id);
  });
  return card;
}

function renderList() {
  const term = searchInput.value.trim().toLowerCase();

  let filtered = notesCache.filter(n => {
    if (n.archived) return false;
    if (activeSubjectFilter && (n.subject || "") !== activeSubjectFilter) return false;
    if (!term) return true;
    return (n.title || "").toLowerCase().includes(term) ||
           (n.subject || "").toLowerCase().includes(term) ||
           htmlToPlainText(n.bodyHTML || "").toLowerCase().includes(term);
  });

  filtered.sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    if (currentSort === "alfabetico") {
      return (a.title || "").localeCompare(b.title || "", "it");
    }
    if (currentSort === "materia") {
      const s = (a.subject || "").localeCompare(b.subject || "", "it");
      if (s !== 0) return s;
      return (a.title || "").localeCompare(b.title || "", "it");
    }
    // recenti — ordiniamo lato client per updatedAt (più recente prima)
    return tsToMillis(b.updatedAt) - tsToMillis(a.updatedAt);
  });

  cardsGrid.innerHTML = "";
  emptyState.style.display = filtered.length ? "none" : "block";
  filtered.forEach(note => cardsGrid.appendChild(buildNoteCard(note)));
}

function formatDate(ts) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" }) +
         " · " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function htmlToPlainText(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "").replace(/\s+/g, " ").trim();
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// New note
// ---------------------------------------------------------------------------

const LESSON_TEMPLATE_HTML =
  "<h2>Argomenti trattati</h2><p><br></p><h2>Domande</h2><p><br></p><h2>Da approfondire</h2><p><br></p>";

newNoteBtn.addEventListener("click", () => newnoteBackdrop.classList.add("active"));
newnoteClose.addEventListener("click", () => newnoteBackdrop.classList.remove("active"));
newnoteBackdrop.addEventListener("click", (e) => {
  if (e.target === newnoteBackdrop) newnoteBackdrop.classList.remove("active");
});
newnoteBlank.addEventListener("click", () => {
  newnoteBackdrop.classList.remove("active");
  createNote("");
});
newnoteTemplate.addEventListener("click", () => {
  newnoteBackdrop.classList.remove("active");
  createNote(LESSON_TEMPLATE_HTML);
});

async function createNote(initialBodyHTML) {
  const defaults = {
    title: "",
    subject: "",
    bodyHTML: initialBodyHTML || "",
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)].key,
    pinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    versions: []
  };
  const ref = await addDoc(notesCol(), defaults);
  currentNoteSnapshot = { ...defaults, updatedAt: new Date(), createdAt: new Date() };
  currentNoteId = ref.id;
  loadIntoEditor({ id: ref.id, ...defaults, updatedAt: null, createdAt: null });
  showView("editor");
  setTimeout(() => titleInput.focus(), 50);
}

// ---------------------------------------------------------------------------
// Editor: open / close
// ---------------------------------------------------------------------------

function openEditor(noteId) {
  const note = notesCache.find(n => n.id === noteId);
  if (!note) return;
  currentNoteId = noteId;
  currentNoteSnapshot = { ...note };
  loadIntoEditor(note);
  showView("editor");
}

function loadIntoEditor(note) {
  const subj = note.subject || "";
  if (subj && ![...subjectInput.options].some(o => o.value === subj)) {
    const opt = document.createElement("option");
    opt.value = subj;
    opt.textContent = subj;
    subjectInput.appendChild(opt);
  }
  subjectInput.value = subj;
  updateSubjectBanner();
  titleInput.value = note.title || "";
  autoResizeTitle();
  bodyEditor.innerHTML = note.bodyHTML || "";
  renderColorDots(note.color || "mustard");
  saveIndicator.textContent = "";
  styleSelect.value = "p";
  pinBtn.classList.toggle("pinned", !!note.pinned);
  bodyEditor.classList.toggle("two-col", !!note.columns);
  columnsBtn.classList.toggle("active", !!note.columns);
  archiveBtn.dataset.archived = note.archived ? "true" : "false";
  archiveBtnLabel.textContent = note.archived ? "Rimuovi dall'archivio" : "Archivia appunto";
  updateWordCount();
}

backBtn.addEventListener("click", () => {
  flushSave();
  if (editorReturnView === "materiaDetail") renderMateriaDetailGrid();
  if (editorReturnView === "archive") renderArchiveGrid();
  showView(editorReturnView || "list");
  editorReturnView = "list";
});

pinBtn.addEventListener("click", async () => {
  if (!currentNoteId || !currentUser) return;
  const newPinned = !pinBtn.classList.contains("pinned");
  pinBtn.classList.toggle("pinned", newPinned);
  currentNoteSnapshot = { ...currentNoteSnapshot, pinned: newPinned };
  try {
    await setDoc(doc(db, "users", currentUser.uid, "notes", currentNoteId), { pinned: newPinned }, { merge: true });
  } catch (err) {
    console.error(err);
  }
});

moreBtn.addEventListener("click", () => moreBackdrop.classList.add("active"));
moreClose.addEventListener("click", () => moreBackdrop.classList.remove("active"));
moreBackdrop.addEventListener("click", (e) => {
  if (e.target === moreBackdrop) moreBackdrop.classList.remove("active");
});

duplicateBtn.addEventListener("click", async () => {
  if (!currentNoteId || !currentUser) return;
  moreBackdrop.classList.remove("active");
  flushSave();
  const defaults = {
    title: titleInput.value ? `${titleInput.value} (copia)` : "",
    subject: subjectInput.value,
    bodyHTML: bodyEditor.innerHTML,
    color: currentSelectedColor(),
    pinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    versions: []
  };
  const ref = await addDoc(notesCol(), defaults);
  currentNoteSnapshot = { ...defaults, updatedAt: new Date(), createdAt: new Date() };
  currentNoteId = ref.id;
  loadIntoEditor({ id: ref.id, ...defaults, updatedAt: null, createdAt: null });
  toast("Appunto duplicato");
});

archiveBtn.addEventListener("click", async () => {
  if (!currentNoteId || !currentUser) return;
  moreBackdrop.classList.remove("active");
  const newArchived = archiveBtn.dataset.archived !== "true";
  archiveBtn.dataset.archived = newArchived ? "true" : "false";
  archiveBtnLabel.textContent = newArchived ? "Rimuovi dall'archivio" : "Archivia appunto";
  currentNoteSnapshot = { ...currentNoteSnapshot, archived: newArchived };
  try {
    await setDoc(doc(db, "users", currentUser.uid, "notes", currentNoteId), { archived: newArchived }, { merge: true });
    toast(newArchived ? "Appunto archiviato" : "Appunto ripristinato");
  } catch (err) {
    console.error(err);
  }
});

function renderColorDots(activeKey) {
  colorDotsEl.innerHTML = "";
  PALETTE.forEach(c => {
    const dot = document.createElement("button");
    dot.className = "color-dot" + (c.key === activeKey ? " active" : "");
    dot.style.background = c.hex;
    dot.addEventListener("click", () => {
      [...colorDotsEl.children].forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
      scheduleSave();
    });
    dot.dataset.color = c.key;
    colorDotsEl.appendChild(dot);
  });
}

function currentSelectedColor() {
  const active = colorDotsEl.querySelector(".color-dot.active");
  return active ? active.dataset.color : "mustard";
}

// ---------------------------------------------------------------------------
// Conteggio parole
// ---------------------------------------------------------------------------

function updateWordCount() {
  const text = (bodyEditor.textContent || "").trim();
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));
  editorMeta.textContent = words
    ? `${words} parol${words === 1 ? "a" : "e"} · ${minutes} min di lettura`
    : "";
}

// ---------------------------------------------------------------------------
// Title autosize
// ---------------------------------------------------------------------------

function autoResizeTitle() {
  titleInput.style.height = "auto";
  titleInput.style.height = titleInput.scrollHeight + "px";
}
titleInput.addEventListener("input", () => { autoResizeTitle(); scheduleSave(); });
titleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); bodyEditor.focus(); }
});
function updateSubjectBanner() {
  const name = subjectInput.value;
  if (!name) {
    subjectInput.style.background = "";
    subjectInput.classList.add("subject-empty");
    return;
  }
  subjectInput.classList.remove("subject-empty");
  const s = subjectsCache.find(s => s.name === name);
  subjectInput.style.background = colorHex(s ? s.color : "mustard");
}

subjectInput.addEventListener("change", () => { updateSubjectBanner(); scheduleSave(); });

// ---------------------------------------------------------------------------
// Body editor — automatic formatting
// ---------------------------------------------------------------------------

// Questa chiamata era senza protezione: se il browser la rifiuta (successo non
// garantito su tutte le versioni di Safari), interrompe l'esecuzione dell'intero
// script da questo punto in poi — cioè tutto ciò che viene cablato più sotto
// (tabelle, evidenziatore, colonne, materie, orario, archivio, stampa...) non
// verrebbe mai collegato ai pulsanti. Non è indispensabile al funzionamento
// dell'editor, quindi la rendiamo innocua in ogni caso.
try {
  document.execCommand && document.execCommand("defaultParagraphSeparator", false, "p");
} catch (err) {
  console.warn("defaultParagraphSeparator non supportato, continuo comunque:", err);
}

function getCurrentBlock() {
  const sel = window.getSelection();
  if (!sel || !sel.anchorNode) return null;
  let node = sel.anchorNode;
  while (node && node.parentElement !== bodyEditor) {
    if (node === bodyEditor) return null;
    node = node.parentElement;
  }
  return node;
}

function getCurrentLi() {
  const sel = window.getSelection();
  if (!sel || !sel.anchorNode) return null;
  const el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
  const li = el && el.closest ? el.closest("li") : null;
  return li && bodyEditor.contains(li) ? li : null;
}

function applyInlineFormatting(text) {
  let out = escapeHTML(text);
  out = out.replace(/\*\*([^\*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out;
}

function finalizeBlock(el) {
  if (!el || !el.isConnected || !bodyEditor.contains(el)) return;
  if (el.tagName === "TABLE" || el.classList.contains("toc-block")) return;
  if (el.tagName === "LI") {
    if (el.closest("ul.checklist")) return; // non toccare il segno di spunta
    const raw = el.textContent;
    el.innerHTML = applyInlineFormatting(raw);
    return;
  }
  if (el.tagName === "H1" || el.tagName === "H2") {
    el.innerHTML = applyInlineFormatting(el.textContent);
    return;
  }
  const raw = el.textContent;
  const trimmed = raw.trim();

  if (!trimmed) return;

  if (/^([-*])\s+/.test(trimmed)) {
    const content = trimmed.replace(/^([-*])\s+/, "");
    const li = document.createElement("li");
    li.innerHTML = applyInlineFormatting(content);

    const prev = el.previousElementSibling;
    if (prev && prev.tagName === "UL" && !prev.classList.contains("checklist")) {
      prev.appendChild(li);
      el.remove();
    } else {
      const ul = document.createElement("ul");
      ul.appendChild(li);
      el.replaceWith(ul);
    }
    return;
  }

  el.innerHTML = applyInlineFormatting(raw);
}

function insertChecklistCheckbox(li) {
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.setAttribute("contenteditable", "false");
  li.insertBefore(cb, li.firstChild);
  li.insertBefore(document.createTextNode(" "), cb.nextSibling);
}

function getCurrentCell() {
  const sel = window.getSelection();
  if (!sel || !sel.anchorNode) return null;
  const el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
  const cell = el && el.closest ? el.closest("td,th") : null;
  return cell && bodyEditor.contains(cell) ? cell : null;
}

function placeCursorIn(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function placeCursorAtEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function handleTableTab(shiftKey) {
  const cell = getCurrentCell();
  if (!cell) return false;
  const row = cell.parentElement;
  const cellsInRow = [...row.children];
  const cellIndex = cellsInRow.indexOf(cell);

  if (!shiftKey) {
    if (cellIndex < cellsInRow.length - 1) {
      placeCursorIn(cellsInRow[cellIndex + 1]);
    } else if (row.nextElementSibling) {
      placeCursorIn(row.nextElementSibling.children[0]);
    } else {
      // ultima cella della tabella: aggiunge una nuova riga, come in Word
      const newRow = document.createElement("tr");
      cellsInRow.forEach(() => {
        const td = document.createElement("td");
        td.innerHTML = "<br>";
        newRow.appendChild(td);
      });
      row.parentElement.appendChild(newRow);
      placeCursorIn(newRow.children[0]);
      scheduleSave();
    }
  } else if (cellIndex > 0) {
    placeCursorIn(cellsInRow[cellIndex - 1]);
  } else if (row.previousElementSibling) {
    const prevCells = row.previousElementSibling.children;
    placeCursorIn(prevCells[prevCells.length - 1]);
  }
  return true;
}

bodyEditor.addEventListener("keydown", (e) => {
  const isCmd = e.metaKey || e.ctrlKey;

  if (isCmd && ["1", "2", "3"].includes(e.key)) {
    e.preventDefault();
    const map = { "1": "p", "2": "h1", "3": "h2" };
    document.execCommand("formatBlock", false, map[e.key]);
    styleSelect.value = map[e.key];
    scheduleSave();
    return;
  }

  if (e.key === "Tab") {
    e.preventDefault();
    if (handleTableTab(e.shiftKey)) return;
    // rientro/uscita di livello nelle liste, come in Word/Pages
    document.execCommand(e.shiftKey ? "outdent" : "indent");
    return;
  }

  if (e.key === "Enter" && !e.shiftKey) {
    const li = getCurrentLi();

    if (li && li.closest("ul.checklist")) {
      e.preventDefault();
      const ul = li.closest("ul.checklist");
      if (li.textContent.trim() === "") {
        // elemento vuoto: esce dalla checklist invece di crearne un altro
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        ul.insertAdjacentElement("afterend", p);
        li.remove();
        if (!ul.children.length) ul.remove();
        placeCursorIn(p);
      } else {
        const newLi = document.createElement("li");
        insertChecklistCheckbox(newLi);
        li.insertAdjacentElement("afterend", newLi);
        placeCursorAtEnd(newLi);
      }
      scheduleSave();
      return;
    }

    if (li) {
      if (li.textContent.trim() === "") {
        // uscita da un elemento vuoto — il browser lo porta fuori dalla lista; normalizziamo il blocco risultante
        setTimeout(() => {
          const nb = getCurrentBlock();
          if (nb && nb.tagName !== "LI" && nb.tagName !== "UL" && nb.tagName !== "OL") finalizeBlock(nb);
        }, 0);
      } else {
        setTimeout(() => {
          const nb = getCurrentLi();
          if (nb) finalizeBlock(nb);
        }, 0);
      }
      return;
    }

    const block = getCurrentBlock();
    if (block) setTimeout(() => finalizeBlock(block), 0);
  }
});

bodyEditor.addEventListener("input", () => {
  lastActiveBlock = getCurrentLi() || getCurrentBlock();
  updateWordCount();
  scheduleSave();
});

bodyEditor.addEventListener("blur", () => {
  if (lastActiveBlock) finalizeBlock(lastActiveBlock);
});

bodyEditor.addEventListener("change", (e) => {
  if (e.target && e.target.matches && e.target.matches('input[type="checkbox"]')) {
    const li = e.target.closest("li");
    if (li) li.classList.toggle("checked", e.target.checked);
    scheduleSave();
  }
});

// ---------------------------------------------------------------------------
// Toolbar — stili paragrafo, formattazione, elenchi, allineamento
// ---------------------------------------------------------------------------

// Senza questo, toccare un pulsante della toolbar fa perdere la selezione del
// testo nell'editor prima ancora che il click scatti (in particolare rompeva
// evidenziatore e sottolineatura fine, che dipendono dal testo selezionato).
document.querySelectorAll(".format-toolbar button").forEach(el => {
  el.addEventListener("mousedown", (e) => e.preventDefault());
});

styleSelect.addEventListener("change", () => {
  bodyEditor.focus();
  document.execCommand("formatBlock", false, styleSelect.value);
  scheduleSave();
});

boldBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("bold"); scheduleSave(); });
italicBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("italic"); scheduleSave(); });
underlineBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("underline"); scheduleSave(); });
listBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("insertUnorderedList"); scheduleSave(); });
numberedListBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("insertOrderedList"); scheduleSave(); });
alignLeftBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("justifyLeft"); scheduleSave(); });
alignCenterBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("justifyCenter"); scheduleSave(); });
alignRightBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("justifyRight"); scheduleSave(); });

checklistBtn.addEventListener("click", () => {
  bodyEditor.focus();
  const li = getCurrentLi();
  if (li && li.closest("ul.checklist")) return; // già dentro una checklist

  const ul = document.createElement("ul");
  ul.className = "checklist";
  const newLi = document.createElement("li");
  insertChecklistCheckbox(newLi);
  ul.appendChild(newLi);

  const block = getCurrentBlock();
  if (block && block.tagName === "P" && block.textContent.trim() === "") {
    block.replaceWith(ul);
  } else if (block) {
    block.insertAdjacentElement("afterend", ul);
  } else {
    bodyEditor.appendChild(ul);
  }

  placeCursorAtEnd(newLi);
  scheduleSave();
});

function toggleInlineWrap(tag, className) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (!bodyEditor.contains(range.commonAncestorContainer)) return;

  let container = range.commonAncestorContainer;
  if (container.nodeType === 3) container = container.parentElement;
  const existing = container && container.closest ? container.closest("." + className) : null;

  if (existing && bodyEditor.contains(existing)) {
    // basta appoggiare il cursore dentro (anche senza riselezionare) per togliere l'effetto
    const parent = existing.parentNode;
    while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
    parent.removeChild(existing);
    sel.removeAllRanges();
    scheduleSave();
    return;
  }

  if (sel.isCollapsed) return; // niente selezionato: non c'è testo da evidenziare/sottolineare

  const wrapper = document.createElement(tag);
  wrapper.className = className;
  try {
    range.surroundContents(wrapper);
  } catch (err) {
    const contents = range.extractContents();
    wrapper.appendChild(contents);
    range.insertNode(wrapper);
  }
  sel.removeAllRanges();
  scheduleSave();
}

highlightBtn.addEventListener("click", () => { bodyEditor.focus(); toggleInlineWrap("mark", "hl"); });
fineUnderlineBtn.addEventListener("click", () => { bodyEditor.focus(); toggleInlineWrap("span", "fine-underline"); });

// ---------------------------------------------------------------------------
// Tabelle
// ---------------------------------------------------------------------------

tableBtn.addEventListener("click", () => {
  bodyEditor.focus();

  const table = document.createElement("table");
  table.className = "note-table";
  for (let r = 0; r < 3; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < 3; c++) {
      const td = document.createElement("td");
      td.innerHTML = "<br>";
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  const block = getCurrentBlock();
  if (block && block.tagName === "P" && block.textContent.trim() === "") {
    block.replaceWith(table);
  } else if (block) {
    block.insertAdjacentElement("afterend", table);
  } else {
    bodyEditor.appendChild(table);
  }

  const trailingP = document.createElement("p");
  trailingP.innerHTML = "<br>";
  table.insertAdjacentElement("afterend", trailingP);

  placeCursorIn(table.rows[0].cells[0]);
  scheduleSave();
});

deleteTableBtn.addEventListener("click", () => {
  moreBackdrop.classList.remove("active");
  const cell = getCurrentCell();
  const table = cell && cell.closest("table");
  if (table) {
    table.remove();
    scheduleSave();
  } else {
    toast("Metti il cursore dentro la tabella da eliminare");
  }
});

addColumnBtn.addEventListener("click", () => {
  moreBackdrop.classList.remove("active");
  const cell = getCurrentCell();
  const table = cell && cell.closest("table");
  if (!table) { toast("Metti il cursore dentro la tabella"); return; }
  const colIndex = [...cell.parentElement.children].indexOf(cell);
  [...table.rows].forEach(row => {
    const td = document.createElement("td");
    td.innerHTML = "<br>";
    const refCell = row.children[colIndex];
    if (refCell && refCell.nextElementSibling) {
      row.insertBefore(td, refCell.nextElementSibling);
    } else {
      row.appendChild(td);
    }
  });
  scheduleSave();
});

deleteColumnBtn.addEventListener("click", () => {
  moreBackdrop.classList.remove("active");
  const cell = getCurrentCell();
  const table = cell && cell.closest("table");
  if (!table) { toast("Metti il cursore dentro la colonna da eliminare"); return; }
  const colIndex = [...cell.parentElement.children].indexOf(cell);
  if (cell.parentElement.children.length <= 1) {
    table.remove(); // era l'unica colonna: la tabella non ha più senso
  } else {
    [...table.rows].forEach(row => {
      if (row.children[colIndex]) row.children[colIndex].remove();
    });
  }
  scheduleSave();
});

// ---------------------------------------------------------------------------
// Colonne
// ---------------------------------------------------------------------------

columnsBtn.addEventListener("click", () => {
  bodyEditor.classList.toggle("two-col");
  columnsBtn.classList.toggle("active", bodyEditor.classList.contains("two-col"));
  scheduleSave();
});

// ---------------------------------------------------------------------------
// Indice automatico
// ---------------------------------------------------------------------------

tocBtn.addEventListener("click", () => {
  moreBackdrop.classList.remove("active");
  const headings = [...bodyEditor.querySelectorAll("h1,h2")].filter(h => !h.closest(".toc-block"));
  if (!headings.length) {
    toast("Aggiungi almeno un titolo o un sottotitolo");
    return;
  }
  headings.forEach((h, i) => { if (!h.id) h.id = "sec-" + Date.now() + "-" + i; });

  const existing = bodyEditor.querySelector(".toc-block");
  if (existing) existing.remove();

  const tocDiv = document.createElement("div");
  tocDiv.className = "toc-block";
  tocDiv.setAttribute("contenteditable", "false");
  tocDiv.innerHTML = '<div class="toc-title">Indice</div>' + headings.map(h =>
    `<a class="toc-link${h.tagName === "H2" ? " toc-sub" : ""}" href="#${h.id}">${escapeHTML(h.textContent)}</a>`
  ).join("");

  bodyEditor.insertBefore(tocDiv, bodyEditor.firstChild);
  scheduleSave();
  toast("Indice generato");
});

bodyEditor.addEventListener("click", (e) => {
  const link = e.target.closest("a.toc-link");
  if (!link) return;
  e.preventDefault();
  const id = link.getAttribute("href").slice(1);
  const target = bodyEditor.querySelector(`#${CSS.escape(id)}`);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
});

function selectionHasAncestor(selector) {
  const sel = window.getSelection();
  if (!sel || !sel.anchorNode) return false;
  const el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
  if (!el || !bodyEditor.contains(el)) return false;
  return !!el.closest(selector);
}

function updateToolbarState() {
  const toggle = (btn, cmd) => {
    try { btn.classList.toggle("active", document.queryCommandState(cmd)); }
    catch (e) { /* ignore */ }
  };
  // grassetto/corsivo/sottolineato/evidenziatore: controlliamo direttamente il DOM,
  // più affidabile di queryCommandState su alcuni browser (es. Safari)
  boldBtn.classList.toggle("active", selectionHasAncestor("b,strong"));
  italicBtn.classList.toggle("active", selectionHasAncestor("i,em"));
  underlineBtn.classList.toggle("active", selectionHasAncestor("u"));
  highlightBtn.classList.toggle("active", selectionHasAncestor(".hl"));
  fineUnderlineBtn.classList.toggle("active", selectionHasAncestor(".fine-underline"));

  toggle(listBtn, "insertUnorderedList");
  toggle(numberedListBtn, "insertOrderedList");
  toggle(alignLeftBtn, "justifyLeft");
  toggle(alignCenterBtn, "justifyCenter");
  toggle(alignRightBtn, "justifyRight");

  try {
    const block = document.queryCommandValue("formatBlock").toLowerCase();
    styleSelect.value = (block === "h1" || block === "h2") ? block : "p";
  } catch (e) { /* ignore */ }
}

document.addEventListener("selectionchange", () => {
  if (document.activeElement === bodyEditor) updateToolbarState();
});

// ---------------------------------------------------------------------------
// Autosave + version backups
// ---------------------------------------------------------------------------

function scheduleSave() {
  saveIndicator.textContent = "Modifiche non salvate…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNote, 1500);
}

function flushSave() {
  clearTimeout(saveTimer);
  saveNote();
}

async function saveNote() {
  if (!currentNoteId || !currentUser) return;

  const payload = {
    title: titleInput.value,
    subject: subjectInput.value,
    bodyHTML: bodyEditor.innerHTML,
    color: currentSelectedColor(),
    pinned: pinBtn.classList.contains("pinned"),
    columns: bodyEditor.classList.contains("two-col"),
    archived: archiveBtn.dataset.archived === "true",
    updatedAt: serverTimestamp()
  };

  // rotate up to 2 backups using the last known-saved snapshot
  let versions = (currentNoteSnapshot && currentNoteSnapshot.versions) || [];
  if (currentNoteSnapshot) {
    const changed =
      currentNoteSnapshot.title !== payload.title ||
      currentNoteSnapshot.subject !== payload.subject ||
      currentNoteSnapshot.bodyHTML !== payload.bodyHTML;
    if (changed && (currentNoteSnapshot.title || currentNoteSnapshot.bodyHTML)) {
      versions = [
        {
          title: currentNoteSnapshot.title || "",
          subject: currentNoteSnapshot.subject || "",
          bodyHTML: currentNoteSnapshot.bodyHTML || "",
          savedAt: new Date().toISOString()
        },
        ...versions
      ].slice(0, 2);
    }
  }
  payload.versions = versions;

  try {
    await setDoc(doc(db, "users", currentUser.uid, "notes", currentNoteId), payload, { merge: true });
    currentNoteSnapshot = { ...currentNoteSnapshot, ...payload };
    saveIndicator.textContent = "Salvato";
    setTimeout(() => { if (saveIndicator.textContent === "Salvato") saveIndicator.textContent = ""; }, 1500);
  } catch (err) {
    saveIndicator.textContent = "Errore nel salvataggio";
    console.error(err);
  }
}

// ---------------------------------------------------------------------------
// Version history
// ---------------------------------------------------------------------------

historyBtn.addEventListener("click", () => {
  moreBackdrop.classList.remove("active");
  const versions = (currentNoteSnapshot && currentNoteSnapshot.versions) || [];
  versionList.innerHTML = "";

  if (!versions.length) {
    versionList.innerHTML = `<p style="color:var(--ink-faint); font-size:14px; padding:8px 4px;">Nessuna versione precedente salvata ancora.</p>`;
  } else {
    versions.forEach((v, i) => {
      const row = document.createElement("div");
      row.className = "version-item";
      const when = v.savedAt ? new Date(v.savedAt).toLocaleString("it-IT", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
      }) : "";
      row.innerHTML = `
        <div>
          <div class="v-label">${i === 0 ? "Salvataggio precedente" : "Due salvataggi fa"}</div>
          <div class="v-sub">${escapeHTML(v.title || "Senza titolo")} · ${when}</div>
        </div>
      `;
      const restoreBtn = document.createElement("button");
      restoreBtn.className = "version-restore";
      restoreBtn.textContent = "Ripristina";
      restoreBtn.addEventListener("click", () => {
        titleInput.value = v.title || "";
        subjectInput.value = v.subject || "";
        updateSubjectBanner();
        bodyEditor.innerHTML = v.bodyHTML || "";
        autoResizeTitle();
        versionBackdrop.classList.remove("active");
        toast("Versione ripristinata");
        scheduleSave();
      });
      row.appendChild(restoreBtn);
      versionList.appendChild(row);
    });
  }

  versionBackdrop.classList.add("active");
});

versionClose.addEventListener("click", () => versionBackdrop.classList.remove("active"));
versionBackdrop.addEventListener("click", (e) => {
  if (e.target === versionBackdrop) versionBackdrop.classList.remove("active");
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

deleteBtn.addEventListener("click", async () => {
  if (!currentNoteId) return;
  moreBackdrop.classList.remove("active");
  const ok = window.confirm("Eliminare definitivamente questo appunto?");
  if (!ok) return;
  clearTimeout(saveTimer);
  await deleteDoc(doc(db, "users", currentUser.uid, "notes", currentNoteId));
  currentNoteId = null;
  showView("list");
  toast("Appunto eliminato");
});

// ---------------------------------------------------------------------------
// Print / export
// ---------------------------------------------------------------------------

const printOptionsBackdrop = document.getElementById("print-options-backdrop");
const printFontsizeSelect = document.getElementById("print-fontsize-select");
const printConfirmBtn = document.getElementById("print-confirm-btn");
const printOptionsClose = document.getElementById("print-options-close");

printBtn.addEventListener("click", () => {
  moreBackdrop.classList.remove("active");
  printOptionsBackdrop.classList.add("active");
});

printOptionsClose.addEventListener("click", () => printOptionsBackdrop.classList.remove("active"));
printOptionsBackdrop.addEventListener("click", (e) => {
  if (e.target === printOptionsBackdrop) printOptionsBackdrop.classList.remove("active");
});

const PRINT_SIZE_SCALE = { s: 0.87, m: 1, l: 1.15, xl: 1.3 };

printConfirmBtn.addEventListener("click", () => {
  printOptionsBackdrop.classList.remove("active");
  runPrint(PRINT_SIZE_SCALE[printFontsizeSelect.value] || 1);
});

function runPrint(scale) {
  flushSave();
  const pt = (base) => (base * scale).toFixed(1) + "pt";

  const subject = subjectInput.value || "";
  const title = titleInput.value || "Senza titolo";
  const dateStr = new Date().toLocaleDateString("it-IT", {
    day: "numeric", month: "long", year: "numeric"
  });
  const bodyHTML = bodyEditor.innerHTML;
  const pageFormat = document.documentElement.getAttribute("data-width") || "a4";
  const pageRule = {
    a4: "size: A4; margin: 20mm 18mm;",
    letter: "size: letter; margin: 1in;",
    larga: "margin: 15mm;"
  }[pageFormat] || "size: A4; margin: 20mm 18mm;";

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const printDoc = iframe.contentWindow.document;
  printDoc.open();
  printDoc.write(`<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${escapeHTML(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  @page { ${pageRule} }
  * { box-sizing: border-box; }
  body { font-family: 'Work Sans', sans-serif; color: #1a1a1a; margin: 0; }
  .p-subject { font-size: ${pt(11)}; color: #666; margin-bottom: 4pt; }
  .p-title { font-family: 'Fraunces', Georgia, serif; font-size: ${pt(26)}; font-weight: 500; margin-bottom: 4pt; }
  .p-date { font-size: ${pt(9.5)}; color: #888; margin-bottom: 22pt; }
  .p-body { font-size: ${pt(11.5)}; line-height: 1.55; }
  .p-body p { margin: 0 0 10pt; text-align: justify; }
  .p-body .block-heading { font-weight: 600; font-size: ${pt(12.5)}; margin: 16pt 0 6pt; }
  .p-body ul { margin: 0 0 10pt; padding-left: 18pt; }
  .p-body li { margin-bottom: 3pt; }
  .p-body h1 { font-family: 'Fraunces', Georgia, serif; font-size: ${pt(16)}; font-weight: 600; margin: 16pt 0 6pt; }
  .p-body h2 { font-family: 'Fraunces', Georgia, serif; font-size: ${pt(13)}; font-weight: 600; margin: 13pt 0 5pt; }
  .p-body table.note-table { border-collapse: collapse; width: 100%; margin: 0 0 10pt; }
  .p-body table.note-table td { border: 1px solid #999; padding: 5pt 7pt; font-size: ${pt(10.5)}; }
  .p-body .toc-block { background: #f2f2f2; border-radius: 6pt; padding: 10pt 12pt; margin: 0 0 14pt; }
  .p-body .toc-title { font-weight: 600; font-size: ${pt(8.5)}; text-transform: uppercase; color: #777; margin-bottom: 5pt; }
  .p-body .toc-link { display: block; font-size: ${pt(10)}; color: #1a1a1a; text-decoration: none; padding: 1.5pt 0; }
  .p-body .toc-link.toc-sub { padding-left: 10pt; color: #555; }
  .p-body ul.checklist { list-style: none; padding-left: 2pt; }
  .p-body ul.checklist li { display: flex; align-items: flex-start; gap: 6pt; }
  .p-body ul.checklist li.checked { color: #999; text-decoration: line-through; }
  .p-body.two-col { column-count: 2; column-gap: 20pt; }
  mark.hl { background: rgba(253, 200, 60, 0.45); }
  .fine-underline { text-decoration: underline; text-decoration-thickness: 1px; }
</style>
</head>
<body>
  ${subject ? `<div class="p-subject">${escapeHTML(subject)}</div>` : ""}
  <div class="p-title">${escapeHTML(title)}</div>
  <div class="p-date">${dateStr}</div>
  <div class="p-body${bodyEditor.classList.contains("two-col") ? " two-col" : ""}">${bodyHTML}</div>
</body>
</html>`);
  printDoc.close();

  const removeIframe = () => { if (iframe.parentNode) iframe.remove(); };
  iframe.contentWindow.onafterprint = removeIframe;
  // fallback in case 'afterprint' doesn't fire on this browser
  setTimeout(removeIframe, 60000);

  // give the fonts and layout a moment to settle before opening the print dialog
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 350);
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

function openAccountView() {
  if (!currentUser) return;
  accountEmailEl.textContent = currentUser.email || "";
  accountAvatar.textContent = (currentUser.email || "?").charAt(0).toUpperCase();

  const created = currentUser.metadata && currentUser.metadata.creationTime
    ? new Date(currentUser.metadata.creationTime)
    : null;
  const createdLabel = created
    ? created.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const count = notesCache.length;
  accountMetaEl.textContent =
    (createdLabel ? `Su Margine dal ${createdLabel} · ` : "") +
    `${count} appunt${count === 1 ? "o" : "i"}`;

  pwMsg.textContent = "";
  pwMsg.className = "account-msg";
  passwordForm.reset();

  showView("account");
}

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  pwMsg.textContent = "";
  pwMsg.className = "account-msg";

  const currentPw = currentPasswordInput.value;
  const newPw = newPasswordInput.value;

  try {
    const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPw);
    pwMsg.textContent = "Password aggiornata.";
    pwMsg.className = "account-msg success";
    passwordForm.reset();
  } catch (err) {
    pwMsg.textContent = friendlyAuthError(err.code);
    pwMsg.className = "account-msg error";
  }
});

signoutBtn.addEventListener("click", () => signOut(auth));

deleteAccountBtn.addEventListener("click", async () => {
  const ok = window.confirm(
    "Eliminare definitivamente il tuo account e tutti i tuoi appunti? L'operazione non si può annullare."
  );
  if (!ok) return;

  const pw = window.prompt("Per conferma, inserisci la tua password:");
  if (!pw) return;

  try {
    const credential = EmailAuthProvider.credential(currentUser.email, pw);
    await reauthenticateWithCredential(currentUser, credential);

    await Promise.all(notesCache.map(n =>
      deleteDoc(doc(db, "users", currentUser.uid, "notes", n.id))
    ));

    await deleteUser(currentUser);
    toast("Account eliminato");
  } catch (err) {
    window.alert(friendlyAuthError(err.code));
  }
});

// ---------------------------------------------------------------------------
// Materie
// ---------------------------------------------------------------------------

function renderMaterieList() {
  materieList.innerHTML = "";
  materieEmpty.style.display = subjectsCache.length ? "none" : "block";

  subjectsCache.forEach(s => {
    const count = notesCache.filter(n => !n.archived && n.subject === s.name).length;

    const row = document.createElement("div");
    row.className = "materia-row";

    const openBtn = document.createElement("button");
    openBtn.className = "materia-open";
    openBtn.innerHTML = `
      <span class="materia-color" style="background:${colorHex(s.color)}"></span>
      <span class="materia-name">${escapeHTML(s.name)}</span>
      <span class="materia-count">${count} appunt${count === 1 ? "o" : "i"}</span>
    `;
    openBtn.addEventListener("click", () => openMateriaDetail(s.name));

    const editBtn = document.createElement("button");
    editBtn.className = "materia-edit";
    editBtn.title = "Modifica materia";
    editBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
    editBtn.addEventListener("click", () => openMateriaForm(s));

    row.appendChild(openBtn);
    row.appendChild(editBtn);
    materieList.appendChild(row);
  });
}

function renderMateriaColorDots(activeKey) {
  materiaColorDots.innerHTML = "";
  PALETTE.forEach(c => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "color-dot" + (c.key === activeKey ? " active" : "");
    dot.style.background = c.hex;
    dot.dataset.color = c.key;
    dot.addEventListener("click", () => {
      [...materiaColorDots.children].forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
    });
    materiaColorDots.appendChild(dot);
  });
}

function openMateriaForm(materia) {
  editingMateriaId = materia ? materia.id : null;
  materiaFormTitle.textContent = materia ? "Modifica materia" : "Nuova materia";
  materiaNameInput.value = materia ? materia.name : "";
  renderMateriaColorDots(materia ? materia.color : PALETTE[0].key);
  materiaDeleteBtn.style.display = materia ? "block" : "none";
  materiaFormBackdrop.classList.add("active");
  setTimeout(() => materiaNameInput.focus(), 50);
}

materiaAddBtn.addEventListener("click", () => openMateriaForm(null));
materiaFormClose.addEventListener("click", () => materiaFormBackdrop.classList.remove("active"));
materiaFormBackdrop.addEventListener("click", (e) => {
  if (e.target === materiaFormBackdrop) materiaFormBackdrop.classList.remove("active");
});

materiaSaveBtn.addEventListener("click", async () => {
  const name = materiaNameInput.value.trim();
  if (!name) { materiaNameInput.focus(); return; }
  const activeDot = materiaColorDots.querySelector(".color-dot.active");
  const color = activeDot ? activeDot.dataset.color : PALETTE[0].key;

  try {
    if (editingMateriaId) {
      await setDoc(doc(db, "users", currentUser.uid, "subjects", editingMateriaId), { name, color }, { merge: true });
    } else {
      await addDoc(collection(db, "users", currentUser.uid, "subjects"), { name, color, createdAt: serverTimestamp() });
    }
    materiaFormBackdrop.classList.remove("active");
  } catch (err) {
    console.error(err);
    toast("Errore nel salvataggio della materia");
  }
});

materiaDeleteBtn.addEventListener("click", async () => {
  if (!editingMateriaId) return;
  const ok = window.confirm("Eliminare questa materia? Gli appunti già scritti non verranno toccati.");
  if (!ok) return;
  try {
    await deleteDoc(doc(db, "users", currentUser.uid, "subjects", editingMateriaId));
    materiaFormBackdrop.classList.remove("active");
    toast("Materia eliminata");
  } catch (err) {
    console.error(err);
  }
});

function refreshSubjectSelects() {
  // select materia nell'editor dell'appunto
  const prevSubjectValue = subjectInput.value;
  subjectInput.innerHTML = '<option value="">Nessuna materia</option>';
  subjectsCache.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = s.name;
    subjectInput.appendChild(opt);
  });
  subjectInput.value = prevSubjectValue;
  if (subjectInput.value !== prevSubjectValue && prevSubjectValue) {
    // materia non (più) presente nell'elenco: la mostriamo comunque per non perdere il dato
    const opt = document.createElement("option");
    opt.value = prevSubjectValue;
    opt.textContent = prevSubjectValue;
    subjectInput.appendChild(opt);
    subjectInput.value = prevSubjectValue;
  }

  // select materia nel form dell'orario
  const prevSlotValue = slotSubjectSelect.value;
  slotSubjectSelect.innerHTML = "";
  if (!subjectsCache.length) {
    slotSubjectSelect.innerHTML = '<option value="">Aggiungi prima una materia</option>';
  } else {
    subjectsCache.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      slotSubjectSelect.appendChild(opt);
    });
    slotSubjectSelect.value = prevSlotValue;
  }
}

// ---------------------------------------------------------------------------
// Orario settimanale
// ---------------------------------------------------------------------------

const DAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function renderDayTabs() {
  dayTabs.innerHTML = "";
  DAY_LABELS.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (i === activeDayTab ? " active" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      activeDayTab = i;
      [...dayTabs.children].forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      renderSlotList();
    });
    dayTabs.appendChild(btn);
  });
}

function renderSlotList() {
  const daySlots = timetableCache
    .filter(s => Number(s.day) === activeDayTab)
    .sort((a, b) => (a.start || "").localeCompare(b.start || ""));

  slotList.innerHTML = "";
  timetableEmpty.style.display = daySlots.length ? "none" : "block";

  daySlots.forEach(slot => {
    const subject = subjectsCache.find(s => s.id === slot.subjectId);
    const color = colorHex(subject ? subject.color : "mustard");
    const card = document.createElement("button");
    card.className = "slot-card";
    card.style.setProperty("--slot-color", color);
    card.innerHTML = `
      <div class="slot-time">${slot.start || ""}–${slot.end || ""}</div>
      <div class="slot-info">
        <div class="slot-subject">${escapeHTML(subject ? subject.name : "Materia eliminata")}</div>
        ${slot.room ? `<div class="slot-room">${escapeHTML(slot.room)}</div>` : ""}
      </div>
    `;
    card.addEventListener("click", () => openSlotForm(slot));
    slotList.appendChild(card);
  });
}

function openSlotForm(slot) {
  editingSlotId = slot ? slot.id : null;
  slotFormTitle.textContent = slot ? "Modifica lezione" : "Nuova lezione";
  slotDaySelect.value = String(slot ? slot.day : activeDayTab);
  slotStartInput.value = slot ? slot.start : "09:00";
  slotEndInput.value = slot ? slot.end : "10:00";
  slotRoomInput.value = slot ? (slot.room || "") : "";
  refreshSubjectSelects();
  if (slot) slotSubjectSelect.value = slot.subjectId;
  slotDeleteBtn.style.display = slot ? "block" : "none";
  slotFormBackdrop.classList.add("active");
}

slotAddBtn.addEventListener("click", () => openSlotForm(null));
slotFormClose.addEventListener("click", () => slotFormBackdrop.classList.remove("active"));
slotFormBackdrop.addEventListener("click", (e) => {
  if (e.target === slotFormBackdrop) slotFormBackdrop.classList.remove("active");
});

slotSaveBtn.addEventListener("click", async () => {
  if (!subjectsCache.length) {
    toast("Aggiungi prima una materia");
    return;
  }
  const payload = {
    day: Number(slotDaySelect.value),
    start: slotStartInput.value,
    end: slotEndInput.value,
    subjectId: slotSubjectSelect.value,
    room: slotRoomInput.value.trim()
  };
  try {
    if (editingSlotId) {
      await setDoc(doc(db, "users", currentUser.uid, "timetable", editingSlotId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "users", currentUser.uid, "timetable"), payload);
    }
    slotFormBackdrop.classList.remove("active");
  } catch (err) {
    console.error(err);
    toast("Errore nel salvataggio della lezione");
  }
});

slotDeleteBtn.addEventListener("click", async () => {
  if (!editingSlotId) return;
  const ok = window.confirm("Eliminare questa lezione dall'orario?");
  if (!ok) return;
  try {
    await deleteDoc(doc(db, "users", currentUser.uid, "timetable", editingSlotId));
    slotFormBackdrop.classList.remove("active");
  } catch (err) {
    console.error(err);
  }
});

// ---------------------------------------------------------------------------
// Keyboard: Esc closes version sheet
// ---------------------------------------------------------------------------

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    versionBackdrop.classList.remove("active");
    moreBackdrop.classList.remove("active");
    newnoteBackdrop.classList.remove("active");
    materiaFormBackdrop.classList.remove("active");
    slotFormBackdrop.classList.remove("active");
    printOptionsBackdrop.classList.remove("active");
  }
});
