const DOCS = [
  { title: 'Bewerbungsschreiben', desc: 'Mein persönliches Bewerbungsschreiben für Praktikumsbewerbungen.', file: 'bewerbungsschreiben.pdf' },
  { title: 'Lebenslauf',          desc: 'Mein vollständiger Lebenslauf als PDF-Dokument.',                  file: 'lebenslauf.pdf' },
  { title: 'Zeugnis',             desc: 'Mein aktuellstes Schulzeugnis.',                                   file: 'zeugnis.pdf' },
  { title: 'Modulnotenübersicht', desc: 'Übersicht der Noten aus allen abgeschlossenen Schulmodulen.',      file: 'modulnoten.pdf' },
  { title: 'Sprachzertifikat',    desc: 'Cambridge B2 First Certificate oder vergleichbares Sprachzertifikat.', file: 'sprachzertifikat.pdf' },
];

function renderDocs() {
  const grid = document.getElementById('docsGrid');
  grid.innerHTML = DOCS.map(doc => `
    <div class="doc-card">
      <h3>${doc.title}</h3>
      <p>${doc.desc}</p>
      <a class="btn-download" href="/documents/${doc.file}" download>PDF herunterladen</a>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', async function () {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar .navButton').forEach(function (link) {
    if (link.getAttribute('href').split('/').pop() === currentPage) {
      link.classList.add('active');
    }
  });

  if (document.getElementById('loginArea')) {
    const res = await fetch('/auth-check');
    const { authenticated } = await res.json();
    if (authenticated) showProtectedContent();
  }
});

function showProtectedContent() {
  document.getElementById('loginArea').style.display = 'none';
  const docsArea = document.getElementById('docsArea');
  const aboutContent = document.getElementById('aboutContent');
  if (docsArea) { renderDocs(); docsArea.style.display = 'block'; }
  if (aboutContent) aboutContent.style.display = 'block';
}

async function checkLogin() {
  const password = document.getElementById('loginPass').value;
  const error = document.getElementById('loginError');
  const btn = document.querySelector('#loginArea .btn');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      error.style.display = 'none';
      showProtectedContent();
    } else {
      error.style.display = 'block';
    }
  } catch {
    error.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Anmelden';
  }
}

async function logout() {
  await fetch('/logout', { method: 'POST' });
  const docsGrid = document.getElementById('docsGrid');
  const docsArea = document.getElementById('docsArea');
  const aboutContent = document.getElementById('aboutContent');
  if (docsGrid) docsGrid.innerHTML = '';
  if (docsArea) docsArea.style.display = 'none';
  if (aboutContent) aboutContent.style.display = 'none';
  document.getElementById('loginArea').style.display = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').style.display = 'none';
}
