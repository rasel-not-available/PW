#!/usr/bin/env node
// Verschlüsselt alle privaten Dateien für die Website.
// Ausführen wenn du Dokumente oder Inhalte aktualisierst:
//   node tools/encrypt-docs.js DEIN_PASSWORT

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const password = process.argv[2];
if (!password) {
  console.error('Verwendung: node tools/encrypt-docs.js <passwort>');
  process.exit(1);
}

const SALT = Buffer.from('portfolio-docs-v1');
const key = crypto.pbkdf2Sync(password, SALT, 100000, 32, 'sha256');
const OUT = path.join(__dirname, '../docs/documents');

function encrypt(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

// Validierungstoken damit der Login ohne PDF-Download prüfen kann ob das Passwort stimmt
fs.writeFileSync(path.join(OUT, 'validate.enc'), encrypt(Buffer.from('authorized')));
console.log('✓ validate.enc');

// Lebenslauf-Inhalt
const aboutPath = path.join(__dirname, '../private/about.html');
if (fs.existsSync(aboutPath)) {
  fs.writeFileSync(path.join(OUT, 'about.enc'), encrypt(fs.readFileSync(aboutPath)));
  console.log('✓ about.enc');
} else {
  console.warn('⚠ private/about.html nicht gefunden — übersprungen');
}

// Dokumente-Inhalt (Download-Karten)
const docsPath = path.join(__dirname, '../private/docs-content.html');
if (fs.existsSync(docsPath)) {
  fs.writeFileSync(path.join(OUT, 'docs-content.enc'), encrypt(fs.readFileSync(docsPath)));
  console.log('✓ docs-content.enc');
} else {
  console.warn('⚠ private/docs-content.html nicht gefunden — übersprungen');
}

// PDFs
const docsDir = path.join(__dirname, '../private/documents');
const pdfs = fs.readdirSync(docsDir).filter(f => f.endsWith('.pdf'));
if (pdfs.length === 0) {
  console.warn('⚠ Keine PDFs in private/documents/ gefunden');
}
for (const file of pdfs) {
  fs.writeFileSync(path.join(OUT, file + '.enc'), encrypt(fs.readFileSync(path.join(docsDir, file))));
  console.log(`✓ ${file}.enc`);
}

console.log('\nFertig. Jetzt: git add docs/documents && git push');
