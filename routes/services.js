const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');

// ── GET /api/services — Listar serviços (público) ───────
router.get('/', async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query(
      'SELECT * FROM services WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar serviços:', err);
    res.status(500).json({ error: 'Erro ao buscar serviços.' });
  }
});

// ── GET /api/services/all — Listar todos (admin) ────────
router.get('/all', verifyToken, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query(
      'SELECT * FROM services ORDER BY display_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar serviços:', err);
    res.status(500).json({ error: 'Erro ao buscar serviços.' });
  }
});

// ── POST /api/services — Criar serviço (admin) ─────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, icon, cover_image, display_order } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }
    
    const pool = req.app.get('db');
    const result = await pool.query(
      `INSERT INTO services (title, description, icon, cover_image, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, icon || 'wrench', cover_image || null, display_order || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar serviço:', err);
    res.status(500).json({ error: 'Erro ao criar serviço.' });
  }
});

// ── PUT /api/services/:id — Atualizar serviço (admin) ──
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, cover_image, display_order, is_active } = req.body;
    
    const pool = req.app.get('db');
    const result = await pool.query(
      `UPDATE services 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           icon = COALESCE($3, icon),
           cover_image = COALESCE($4, cover_image),
           display_order = COALESCE($5, display_order),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [title, description, icon, cover_image, display_order, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar serviço:', err);
    res.status(500).json({ error: 'Erro ao atualizar serviço.' });
  }
});

// ── DELETE /api/services/:id — Remover serviço (admin) ──
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.get('db');
    const result = await pool.query(
      'DELETE FROM services WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }
    
    res.json({ message: 'Serviço removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover serviço:', err);
    res.status(500).json({ error: 'Erro ao remover serviço.' });
  }
});

module.exports = router;
