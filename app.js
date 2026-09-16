// ---------------------------------------------------------------------------
// Margine — logica applicativa
// ---------------------------------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp
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
  editor: document.getElementById("editor-view")
};

const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authError = document.getElementById("auth-error");
const authSubmit = document.getElementById("auth-submit");
const authSwitchBtn = document.getElementById("auth-switch-btn");
const authSwitchText = document.getElementById("auth-switch-text");
const authTagline = document.getElementById("auth-tagline");

const logoutBtn = document.getElementById("logout-btn");
const searchInput = document.getElementById("search-input");
const chipsRow = document.getElementById("chips-row");
const cardsGrid = document.getElementById("cards-grid");
const emptyState = document.getElementById("empty-state");
const newNoteBtn = document.getElementById("new-note-btn");

const backBtn = document.getElementById("back-btn");
const historyBtn = document.getElementById("history-btn");
const printBtn = document.getElementById("print-btn");
const deleteBtn = document.getElementById("delete-btn");
const saveIndicator = document.getElementById("save-indicator");
const colorDotsEl = document.getElementById("color-dots");
const subjectInput = document.getElementById("subject-input");
const titleInput = document.getElementById("title-input");
const bodyEditor = document.getElementById("body-editor");

const boldBtn = document.getElementById("bold-btn");
const italicBtn = document.getElementById("italic-btn");
const listBtn = document.getElementById("list-btn");

const versionBackdrop = document.getElementById("version-backdrop");
const versionList = document.getElementById("version-list");
const versionClose = document.getElementById("version-close");

const toastEl = document.getElementById("toast");

const printArea = document.getElementById("print-area");
const printSubject = document.getElementById("print-subject");
const printTitle = document.getElementById("print-title");
const printDate = document.getElementById("print-date");
const printBody = document.getElementById("print-body");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentUser = null;
let notesCache = [];
let unsubscribeNotes = null;
let activeSubjectFilter = "";
let authMode = "login"; // or "register"

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

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (unsubscribeNotes) { unsubscribeNotes(); unsubscribeNotes = null; }

  if (user) {
    authForm.reset();
    showView("list");
    subscribeNotes(user.uid);
  } else {
    notesCache = [];
    showView("auth");
  }
});

// ---------------------------------------------------------------------------
// Notes: realtime list
// ---------------------------------------------------------------------------

function notesCol() {
  return collection(db, "users", currentUser.uid, "notes");
}

function subscribeNotes(uid) {
  const q = query(collection(db, "users", uid, "notes"), orderBy("updatedAt", "desc"));
  unsubscribeNotes = onSnapshot(q, (snap) => {
    notesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderChips();
    renderList();
  });
}

function renderChips() {
  const subjects = [...new Set(
    notesCache.map(n => (n.subject || "").trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "it"));

  const current = activeSubjectFilter;
  chipsRow.innerHTML = "";
  chipsRow.appendChild(makeChip("Tutti", ""));
  subjects.forEach(s => chipsRow.appendChild(makeChip(s, s)));

  if (!subjects.includes(current)) activeSubjectFilter = "";
  [...chipsRow.children].forEach(c => {
    c.classList.toggle("active", c.dataset.subject === activeSubjectFilter);
  });
}

function makeChip(label, value) {
  const btn = document.createElement("button");
  btn.className = "chip";
  btn.textContent = label;
  btn.dataset.subject = value;
  btn.addEventListener("click", () => {
    activeSubjectFilter = value;
    [...chipsRow.children].forEach(c => c.classList.toggle("active", c === btn));
    renderList();
  });
  return btn;
}

searchInput.addEventListener("input", renderList);

function renderList() {
  const term = searchInput.value.trim().toLowerCase();

  const filtered = notesCache.filter(n => {
    if (activeSubjectFilter && (n.subject || "") !== activeSubjectFilter) return false;
    if (!term) return true;
    return (n.title || "").toLowerCase().includes(term) ||
           (n.subject || "").toLowerCase().includes(term);
  });

  cardsGrid.innerHTML = "";
  emptyState.style.display = filtered.length ? "none" : "block";

  filtered.forEach(note => {
    const card = document.createElement("button");
    card.className = "note-card";
    card.style.background = colorHex(note.color);

    const excerpt = htmlToPlainText(note.bodyHTML || "").slice(0, 160);
    const dateLabel = formatDate(note.updatedAt);

    card.innerHTML = `
      ${note.subject ? `<div class="card-subject">${escapeHTML(note.subject)}</div>` : ""}
      <div class="card-title">${escapeHTML(note.title || "Senza titolo")}</div>
      ${excerpt ? `<div class="card-excerpt">${escapeHTML(excerpt)}</div>` : ""}
      <div class="card-date">${dateLabel}</div>
    `;
    card.addEventListener("click", () => openEditor(note.id));
    cardsGrid.appendChild(card);
  });
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

newNoteBtn.addEventListener("click", async () => {
  const defaults = {
    title: "",
    subject: "",
    bodyHTML: "",
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)].key,
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
});

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
  subjectInput.value = note.subject || "";
  titleInput.value = note.title || "";
  autoResizeTitle();
  bodyEditor.innerHTML = note.bodyHTML || "";
  renderColorDots(note.color || "mustard");
  saveIndicator.textContent = "";
}

backBtn.addEventListener("click", () => {
  flushSave();
  showView("list");
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
subjectInput.addEventListener("input", scheduleSave);

// ---------------------------------------------------------------------------
// Body editor — automatic formatting
// ---------------------------------------------------------------------------

document.execCommand && document.execCommand("defaultParagraphSeparator", false, "p");

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

function applyInlineFormatting(text) {
  let out = escapeHTML(text);
  out = out.replace(/\*\*([^\*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out;
}

function finalizeBlock(el) {
  if (!el || !el.isConnected || !bodyEditor.contains(el)) return;
  if (el.tagName === "LI") {
    const raw = el.textContent;
    el.innerHTML = applyInlineFormatting(raw);
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
    if (prev && prev.tagName === "UL") {
      prev.appendChild(li);
      el.remove();
    } else {
      const ul = document.createElement("ul");
      ul.appendChild(li);
      el.replaceWith(ul);
    }
    return;
  }

  if (trimmed.length <= 42 && /[:：]$/.test(trimmed) && !/^https?:/i.test(trimmed)) {
    const div = document.createElement(el.tagName === "P" ? "p" : "div");
    div.className = "block-heading";
    div.innerHTML = applyInlineFormatting(trimmed);
    el.replaceWith(div);
    return;
  }

  el.innerHTML = applyInlineFormatting(raw);
}

bodyEditor.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    const block = getCurrentBlock();
    if (block && block.tagName !== "LI") {
      setTimeout(() => finalizeBlock(block), 0);
    } else if (block && block.tagName === "LI" && block.textContent.trim() === "") {
      // breaking out of an empty list item — let browser handle, then normalize
      setTimeout(() => {
        const nb = getCurrentBlock();
        if (nb && nb.tagName !== "LI") finalizeBlock(nb);
      }, 0);
    }
  }
});

bodyEditor.addEventListener("input", () => {
  lastActiveBlock = getCurrentBlock();
  scheduleSave();
});

bodyEditor.addEventListener("blur", () => {
  if (lastActiveBlock) finalizeBlock(lastActiveBlock);
});

boldBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("bold"); scheduleSave(); });
italicBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("italic"); scheduleSave(); });
listBtn.addEventListener("click", () => { bodyEditor.focus(); document.execCommand("insertUnorderedList"); scheduleSave(); });

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

printBtn.addEventListener("click", () => {
  flushSave();
  printSubject.textContent = subjectInput.value || "";
  printTitle.textContent = titleInput.value || "Senza titolo";
  printDate.textContent = new Date().toLocaleDateString("it-IT", {
    day: "numeric", month: "long", year: "numeric"
  });
  printBody.innerHTML = bodyEditor.innerHTML;
  window.print();
});

// ---------------------------------------------------------------------------
// Keyboard: Esc closes version sheet
// ---------------------------------------------------------------------------

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && versionBackdrop.classList.contains("active")) {
    versionBackdrop.classList.remove("active");
  }
});
