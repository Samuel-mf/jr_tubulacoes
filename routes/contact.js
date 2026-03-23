const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');

// ── POST /api/contact — Enviar orçamento (público) ──────
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, service_interest, message } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    }
    
    const pool = req.app.get('db');
    const result = await pool.query(
      `INSERT INTO contacts (name, phone, email, service_interest, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, phone, email || null, service_interest || null, message || null]
    );
    
    res.status(201).json({ 
      message: 'Orçamento enviado com sucesso! Entraremos em contato em breve.',
      contact: result.rows[0]
    });
  } catch (err) {
    console.error('Erro ao salvar contato:', err);
    res.status(500).json({ error: 'Erro ao enviar orçamento.' });
  }
});

// ── GET /api/contact — Listar contatos (admin) ──────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query(
      'SELECT * FROM contacts ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar contatos:', err);
    res.status(500).json({ error: 'Erro ao buscar contatos.' });
  }
});

// ── PUT /api/contact/:id/read — Marcar como lido (admin)─
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.get('db');
    await pool.query(
      'UPDATE contacts SET is_read = TRUE WHERE id = $1',
      [id]
    );
    res.json({ message: 'Contato marcado como lido.' });
  } catch (err) {
    console.error('Erro ao atualizar contato:', err);
    res.status(500).json({ error: 'Erro ao atualizar contato.' });
  }
});

// ── DELETE /api/contact/:id — Remover contato (admin) ───
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.get('db');
    await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
    res.json({ message: 'Contato removido.' });
  } catch (err) {
    console.error('Erro ao remover contato:', err);
    res.status(500).json({ error: 'Erro ao remover contato.' });
  }
});

module.exports = router;
