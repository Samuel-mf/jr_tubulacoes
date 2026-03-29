require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;


// ── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', apiLimiter);

// ── Arquivos estáticos ──────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rotas da API ────────────────────────────────────────
const servicesRouter = require('./routes/services');
const galleryRouter = require('./routes/gallery');
const contactRouter = require('./routes/contact');
const authRouter = require('./routes/auth');

app.use('/api/services', servicesRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authRouter);

// ── Config pública ──────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({
    whatsapp: process.env.WHATSAPP_NUMBER || '5519998038607',
    companyName: 'JR Tubulação de Gás e Trabalho em Altura'
  });
});

// ── SPA fallback ────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Inicialização ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   JR Tubulação de Gás — Servidor Online     ║
║   Porta: ${PORT}
╚══════════════════════════════════════════════╝
`);
});

module.exports = app;
