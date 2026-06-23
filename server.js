const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.DOCS_PASSWORD;

if (!PASSWORD) {
  console.error('DOCS_PASSWORD environment variable is not set. Aborting.');
  process.exit(1);
}

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8 // 8 hours
  }
}));

// Serve all public assets (HTML, CSS, JS) — documents/ is NOT in here
app.use(express.static(path.join(__dirname, 'public')));

app.get('/auth-check', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

app.post('/login', (req, res) => {
  if (req.body.password === PASSWORD) {
    req.session.authenticated = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Protected file route — only reachable with a valid session
app.get('/documents/:file', (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).send('Nicht autorisiert.');
  }
  const filename = path.basename(req.params.file); // blocks path traversal
  const filepath = path.join(__dirname, 'private', 'documents', filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).send('Datei nicht gefunden.');
  }
  res.download(filepath);
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
