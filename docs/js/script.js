const SALT = new TextEncoder().encode('portfolio-docs-v1');

let derivedKey = null;

document.addEventListener('DOMContentLoaded', function () {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar .navButton').forEach(function (link) {
    if (link.getAttribute('href').split('/').pop() === currentPage) {
      link.classList.add('active');
    }
  });
});

async function deriveKey(password) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

async function aesDecrypt(encData, key) {
  const iv = encData.slice(0, 12);
  const tag = encData.slice(12, 28);
  const ciphertext = encData.slice(28);
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
}

async function fetchAndDecrypt(path, key) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('not found');
  return aesDecrypt(new Uint8Array(await res.arrayBuffer()), key);
}

async function checkLogin() {
  const password = document.getElementById('loginPass').value;
  const error = document.getElementById('loginError');
  const btn = document.querySelector('#loginArea .btn');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const key = await deriveKey(password);
    const validation = await fetchAndDecrypt('../documents/validate.enc', key);
    if (new TextDecoder().decode(validation) !== 'authorized') throw new Error();

    derivedKey = key;
    error.style.display = 'none';
    await showProtectedContent();
  } catch {
    error.style.display = 'block';
    derivedKey = null;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Anmelden';
  }
}

async function showProtectedContent() {
  document.getElementById('loginArea').style.display = 'none';
  const content = document.getElementById('protectedContent');

  if (content.dataset.page === 'about') {
    const html = await fetchAndDecrypt('../documents/about.enc', derivedKey);
    content.innerHTML = new TextDecoder().decode(html);
  } else if (content.dataset.page === 'documents') {
    const html = await fetchAndDecrypt('../documents/docs-content.enc', derivedKey);
    content.innerHTML = new TextDecoder().decode(html);
  }

  content.style.display = 'block';
}

async function downloadDoc(filename, btn) {
  if (!derivedKey) return;
  const original = btn.textContent;
  btn.textContent = 'Lädt…';
  btn.disabled = true;

  try {
    const decrypted = await fetchAndDecrypt('../documents/' + filename + '.enc', derivedKey);
    const blob = new Blob([decrypted], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    alert('Fehler beim Herunterladen der Datei.');
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}

function logout() {
  derivedKey = null;
  const content = document.getElementById('protectedContent');
  content.innerHTML = '';
  content.style.display = 'none';
  document.getElementById('loginArea').style.display = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').style.display = 'none';
}
