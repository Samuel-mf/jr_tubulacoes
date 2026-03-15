const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { verifyToken } = require('./auth');

// ── Configuração do Multer ──────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagem não suportado. Use JPG, PNG, WebP ou GIF.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ── GET /api/gallery — Listar imagens (público) ─────────
router.get('/', async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { service_id } = req.query;
    
    let query = 'SELECT g.*, s.title as service_title FROM gallery g LEFT JOIN services s ON g.service_id = s.id';
    let params = [];
    
    if (service_id) {
      query += ' WHERE g.service_id = $1';
      params.push(service_id);
    }
    
    query += ' ORDER BY g.display_order ASC, g.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar galeria:', err);
    res.status(500).json({ error: 'Erro ao buscar imagens.' });
  }
});

// ── POST /api/gallery — Upload de imagem (admin) ────────
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }
    
    const { caption, service_id, display_order } = req.body;
    const imagePath = '/uploads/' + req.file.filename;
    
    const pool = req.app.get('db');
    const result = await pool.query(
      `INSERT INTO gallery (image_path, caption, service_id, display_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [imagePath, caption || null, service_id || null, display_order || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao fazer upload:', err);
    res.status(500).json({ error: 'Erro ao salvar imagem.' });
  }
});

// ── DELETE /api/gallery/:id — Remover imagem (admin) ────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.get('db');
    
    // Buscar caminho da imagem
    const img = await pool.query('SELECT image_path FROM gallery WHERE id = $1', [id]);
    
    if (img.rows.length === 0) {
      return res.status(404).json({ error: 'Imagem não encontrada.' });
    }
    
    // Remover arquivo do disco
    const filePath = path.join(__dirname, '..', img.rows[0].image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remover do banco
    await pool.query('DELETE FROM gallery WHERE id = $1', [id]);
    
    res.json({ message: 'Imagem removida com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover imagem:', err);
    res.status(500).json({ error: 'Erro ao remover imagem.' });
  }
});

module.exports = router;
