require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ── PostgreSQL ──────────────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'appdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});


// Tornar pool acessível nas rotas
app.set('db', pool);

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rotas da API ────────────────────────────────────────
const servicesRouter = require('./routes/services');
const galleryRouter = require('./routes/gallery');
const contactRouter = require('./routes/contact');
const authRouter = require('./routes/auth');

app.use('/api/services', servicesRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authRouter);

// ── Rota para config pública (WhatsApp number) ──────────
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
async function initializeAdmin() {
  try {
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    
    const existing = await pool.query(
      'SELECT id FROM admin_users WHERE username = $1',
      [adminUser]
    );
    
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(adminPass, 10);
      await pool.query(
        'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
        [adminUser, hash]
      );
      console.log(`✓ Admin "${adminUser}" criado com sucesso.`);
    }
  } catch (err) {
    console.error('Aviso: Não foi possível inicializar admin —', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   JR Tubulação de Gás — Servidor Online     ║
  ║   http://localhost:${PORT}                      ║
  ╚══════════════════════════════════════════════╝
  `);
  await initializeAdmin();
});

module.exports = app;
