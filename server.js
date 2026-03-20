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
  host: process.env.DB_HOST || 'infra_postgres',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'jr_tubulacoes',
  user: process.env.DB_USER || 'flowbuilding',
  password: process.env.DB_PASS || '',
});

// Testar conexão
pool.connect()
  .then(() => console.log('✓ Conectado ao PostgreSQL'))
  .catch(err => console.error('❌ Erro ao conectar no banco:', err.message));

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
async function initializeAdmin() {
  try {
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'Sam1530$';

    // Criar tabela se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      )
    `);

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
    } else {
      console.log('✓ Admin já existe');
    }
  } catch (err) {
    console.error('❌ Erro ao inicializar admin:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   JR Tubulação de Gás — Servidor Online     ║
║   Porta: ${PORT}
╚══════════════════════════════════════════════╝
`);
  await initializeAdmin();
});

module.exports = app;
