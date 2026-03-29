const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const { callExecutor } = require('../lib/executor');

// ── GET /api/gallery — Listar imagens (público) ──────────────────────────
router.get('/', async (req, res) => {
  try {
    const { service_id } = req.query;
    const input = service_id ? { service_id } : {};

    const response = await callExecutor('gallery_list', input);

    if (!response.body.success) {
      return res.status(500).json({ error: response.body.error || 'Erro ao buscar imagens.' });
    }

    res.json(response.body.result.images);
  } catch (err) {
    console.error('[gallery] Erro ao listar:', err.message);
    res.status(500).json({ error: 'Erro ao buscar imagens.' });
  }
});

// ── POST /api/gallery/upload-url — Solicitar Signed URL (admin) ──────────
// Etapa 1 do fluxo de upload:
//   Admin frontend → GET signed URL → PUT direto no R2 → POST /gallery/metadata
router.post('/upload-url', verifyToken, async (req, res) => {
  try {
    const { fileName, contentType, resourceId, display_order } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName e contentType são obrigatórios.' });
    }

    const response = await callExecutor('generate_upload_url', {
      fileName,
      contentType,
      resourceType: 'gallery',
      resourceId: resourceId || 'default',
      display_order,
    });

    if (!response.body.success) {
      return res.status(500).json({ error: response.body.error || 'Erro ao gerar URL de upload.' });
    }

    // Retorna { uploadUrl, fileKey, publicUrl } para o frontend
    res.json(response.body.result);
  } catch (err) {
    console.error('[gallery] Erro ao gerar upload URL:', err.message);
    res.status(500).json({ error: 'Erro ao gerar URL de upload.' });
  }
});

// ── POST /api/gallery/metadata — Salvar metadado após upload no R2 (admin)
// Etapa 2 do fluxo de upload:
//   Após PUT direto no R2, o frontend confirma o upload salvando os metadados.
router.post('/metadata', verifyToken, async (req, res) => {
  try {
    const { file_key, public_url, caption, service_id, display_order } = req.body;

    if (!file_key || !public_url) {
      return res.status(400).json({ error: 'file_key e public_url são obrigatórios.' });
    }

    const response = await callExecutor('gallery_save_metadata', {
      file_key,
      public_url,
      caption,
      service_id,
      display_order,
    });

    if (!response.body.success) {
      return res.status(500).json({ error: response.body.error || 'Erro ao salvar metadado.' });
    }

    res.status(201).json(response.body.result.image);
  } catch (err) {
    console.error('[gallery] Erro ao salvar metadado:', err.message);
    res.status(500).json({ error: 'Erro ao salvar metadado.' });
  }
});

// ── DELETE /api/gallery/:id — Remover imagem (admin) ────────────────────
// O executor delega a exclusão do arquivo ao r2-api e remove o metadado do banco.
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const response = await callExecutor('gallery_delete', { id });

    if (!response.body.success) {
      const status = response.body.error === 'Imagem não encontrada.' ? 404 : 500;
      return res.status(status).json({ error: response.body.error || 'Erro ao remover imagem.' });
    }

    res.json({ message: 'Imagem removida com sucesso.' });
  } catch (err) {
    console.error('[gallery] Erro ao remover:', err.message);
    res.status(500).json({ error: 'Erro ao remover imagem.' });
  }
});

module.exports = router;
