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
  editor: document.getElementById("editor-view"),
  account: document.getElementById("account-view")
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

const styleSelect = document.getElementById("style-select");
const boldBtn = document.getElementById("bold-btn");
const italicBtn = document.getElementById("italic-btn");
const underlineBtn = document.getElementById("underline-btn");
const listBtn = document.getElementById("list-btn");
const numberedListBtn = document.getElementById("numbered-list-btn");
const alignLeftBtn = document.getElementById("align-left-btn");
const alignCenterBtn = document.getElementById("align-center-btn");
const alignRightBtn = document.getElementById("align-right-btn");

const versionBackdrop = document.getElementById("version-backdrop");
const versionList = document.getElementById("version-list");
const versionClose = document.getElementById("version-close");

const toastEl = document.getElementById("toast");

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

accountBtn.addEventListener("click", () => {
  openAccountView();
});
accountBackBtn.addEventListener("click", () => showView("list"));

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
  styleSelect.value = "p";
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
  if (e.key === "Tab") {
    // rientro/uscita di livello nelle liste, come in Word/Pages
    e.preventDefault();
    document.execCommand(e.shiftKey ? "outdent" : "indent");
  }
});

bodyEditor.addEventListener("input", () => {
  lastActiveBlock = getCurrentBlock();
  scheduleSave();
});

bodyEditor.addEventListener("blur", () => {
  if (lastActiveBlock) finalizeBlock(lastActiveBlock);
});

// ---------------------------------------------------------------------------
// Toolbar — stili paragrafo, formattazione, elenchi, allineamento
// ---------------------------------------------------------------------------

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

function updateToolbarState() {
  const toggle = (btn, cmd) => {
    try { btn.classList.toggle("active", document.queryCommandState(cmd)); }
    catch (e) { /* ignore */ }
  };
  toggle(boldBtn, "bold");
  toggle(italicBtn, "italic");
  toggle(underlineBtn, "underline");
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

  const subject = subjectInput.value || "";
  const title = titleInput.value || "Senza titolo";
  const dateStr = new Date().toLocaleDateString("it-IT", {
    day: "numeric", month: "long", year: "numeric"
  });
  const bodyHTML = bodyEditor.innerHTML;

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
  @page { margin: 20mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Work Sans', sans-serif; color: #1a1a1a; margin: 0; }
  .p-subject { font-size: 11pt; color: #666; margin-bottom: 4pt; }
  .p-title { font-family: 'Fraunces', Georgia, serif; font-size: 26pt; font-weight: 500; margin-bottom: 4pt; }
  .p-date { font-size: 9.5pt; color: #888; margin-bottom: 22pt; }
  .p-body { font-size: 11.5pt; line-height: 1.55; }
  .p-body p { margin: 0 0 10pt; text-align: justify; }
  .p-body .block-heading { font-weight: 600; font-size: 12.5pt; margin: 16pt 0 6pt; }
  .p-body ul { margin: 0 0 10pt; padding-left: 18pt; }
  .p-body li { margin-bottom: 3pt; }
</style>
</head>
<body>
  ${subject ? `<div class="p-subject">${escapeHTML(subject)}</div>` : ""}
  <div class="p-title">${escapeHTML(title)}</div>
  <div class="p-date">${dateStr}</div>
  <div class="p-body">${bodyHTML}</div>
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
});

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
// Keyboard: Esc closes version sheet
// ---------------------------------------------------------------------------

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && versionBackdrop.classList.contains("active")) {
    versionBackdrop.classList.remove("active");
  }
});
