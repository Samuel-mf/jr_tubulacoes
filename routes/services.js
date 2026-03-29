const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const { callExecutor } = require('../lib/executor');

// ── GET /api/services — Listar ativos (público) ──────────────────────────
router.get('/', async (req, res) => {
  try {
    const response = await callExecutor('list_services', {});
    if (!response.body.success) {
      return res.status(500).json({ error: response.body.error || 'Erro ao buscar serviços.' });
    }
    res.json(response.body.result.services);
  } catch (err) {
    console.error('[services] Erro ao listar:', err.message);
    res.status(500).json({ error: 'Erro ao buscar serviços.' });
  }
});

// ── GET /api/services/all — Listar todos (admin) ─────────────────────────
router.get('/all', verifyToken, async (req, res) => {
  try {
    const response = await callExecutor('list_services_all', {});
    if (!response.body.success) {
      return res.status(500).json({ error: response.body.error || 'Erro ao buscar serviços.' });
    }
    res.json(response.body.result.services);
  } catch (err) {
    console.error('[services] Erro ao listar (admin):', err.message);
    res.status(500).json({ error: 'Erro ao buscar serviços.' });
  }
});

// ── POST /api/services — Criar (admin) ───────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, icon, cover_image, display_order } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    const response = await callExecutor('create_service', {
      title, description, icon, cover_image, display_order
    });

    if (!response.body.success) {
      return res.status(500).json({ error: response.body.error || 'Erro ao criar serviço.' });
    }

    res.status(201).json(response.body.result.service);
  } catch (err) {
    console.error('[services] Erro ao criar:', err.message);
    res.status(500).json({ error: 'Erro ao criar serviço.' });
  }
});

// ── PUT /api/services/:id — Atualizar (admin) ────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, cover_image, display_order, is_active } = req.body;

    const response = await callExecutor('update_service', {
      id, title, description, icon, cover_image, display_order, is_active
    });

    if (!response.body.success) {
      const status = response.body.error === 'Serviço não encontrado.' ? 404 : 500;
      return res.status(status).json({ error: response.body.error || 'Erro ao atualizar serviço.' });
    }

    res.json(response.body.result.service);
  } catch (err) {
    console.error('[services] Erro ao atualizar:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar serviço.' });
  }
});

// ── DELETE /api/services/:id — Remover (admin) ───────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const response = await callExecutor('delete_service', { id });

    if (!response.body.success) {
      const status = response.body.error === 'Serviço não encontrado.' ? 404 : 500;
      return res.status(status).json({ error: response.body.error || 'Erro ao remover serviço.' });
    }

    res.json({ message: 'Serviço removido com sucesso.' });
  } catch (err) {
    console.error('[services] Erro ao remover:', err.message);
    res.status(500).json({ error: 'Erro ao remover serviço.' });
  }
});

module.exports = router;
