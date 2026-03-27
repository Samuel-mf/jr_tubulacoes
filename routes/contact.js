const express = require('express');
const router = express.Router();
const https = require('https');
const { verifyToken } = require('./auth');

// ── Fallback in-memory store (usado quando o banco não está disponível) ──
const fallbackContacts = [];

// ── Helper: valida reCAPTCHA com a API do Google ────────────────────────
function verifyRecaptcha(token) {
  return new Promise((resolve, reject) => {
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    if (!secret) {
      console.warn('[reCAPTCHA] ⚠  RECAPTCHA_SECRET_KEY não definida no .env — pulando validação.');
      return resolve({ success: true, skipped: true });
    }

    const postData = `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`;

    const options = {
      hostname: 'www.google.com',
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Resposta inválida do reCAPTCHA: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ── POST /api/contact — Enviar orçamento (público) ───────────────────────
router.post('/', async (req, res) => {
  console.log('\n[contact] ═══════════════════════════════════════════');
  console.log('[contact] Nova requisição POST /api/contact recebida');
  console.log('[contact] Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    const { name, phone, email, service_interest, message, recaptchaToken } = req.body;

    // ── 1. Validação básica de campos ──────────────────────────────────
    console.log('[contact] Passo 1: Validando campos obrigatórios...');
    if (!name || !phone) {
      console.warn('[contact] ✗ Validação falhou: nome ou telefone ausente.');
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    }
    console.log('[contact] ✓ Campos obrigatórios OK.');

    // ── 2. Validação do reCAPTCHA ──────────────────────────────────────
    console.log('[contact] Passo 2: Validando reCAPTCHA...');
    if (!recaptchaToken) {
      console.warn('[contact] ✗ recaptchaToken ausente no body.');
      return res.status(400).json({ error: 'Token do reCAPTCHA não encontrado. Recarregue a página e tente novamente.' });
    }

    let captchaResult;
    try {
      captchaResult = await verifyRecaptcha(recaptchaToken);
      console.log('[contact] Resposta reCAPTCHA Google:', JSON.stringify(captchaResult));
    } catch (captchaErr) {
      console.error('[contact] ✗ Erro ao contactar API do reCAPTCHA:', captchaErr.message);
      // Não bloquear envio se a API do Google falhou — apenas logar
      captchaResult = { success: true, skipped: true, reason: 'API indisponível' };
    }

    if (!captchaResult.success && !captchaResult.skipped) {
      console.warn('[contact] ✗ reCAPTCHA inválido. Erros:', captchaResult['error-codes']);
      return res.status(400).json({
        error: 'Verificação reCAPTCHA falhou. Por favor, tente novamente.',
        details: captchaResult['error-codes']
      });
    }
    console.log('[contact] ✓ reCAPTCHA OK' + (captchaResult.skipped ? ' (pulado — sem chave configurada)' : '.'));

    // ── 3. Persistência no banco de dados ──────────────────────────────
    console.log('[contact] Passo 3: Tentando salvar no banco de dados...');
    const pool = req.app.get('db');

    let savedContact = null;
    let usedFallback = false;

    try {
      const result = await pool.query(
        `INSERT INTO contacts (name, phone, email, service_interest, message)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, phone, email || null, service_interest || null, message || null]
      );
      savedContact = result.rows[0];
      console.log('[contact] ✓ Contato salvo no banco. ID:', savedContact.id);
    } catch (dbErr) {
      console.error('[contact] ✗ Erro ao salvar no banco PostgreSQL:', dbErr.message);
      console.error('[contact]   Código do erro:', dbErr.code);
      console.error('[contact]   Dica: verifique se o banco está rodando e se a tabela "contacts" existe.');

      // Fallback: salvar em memória para não perder o lead
      console.log('[contact] → Usando armazenamento temporário em memória como fallback...');
      const fallback = {
        id: Date.now(),
        name, phone,
        email: email || null,
        service_interest: service_interest || null,
        message: message || null,
        created_at: new Date().toISOString(),
        fallback: true
      };
      fallbackContacts.push(fallback);
      savedContact = fallback;
      usedFallback = true;
      console.log('[contact] ✓ Salvo em memória (fallback). Total em memória:', fallbackContacts.length);
    }

    // ── 4. Resposta de sucesso ──────────────────────────────────────────
    console.log('[contact] ✓ Processo concluído com', usedFallback ? 'FALLBACK (sem banco)' : 'banco de dados');
    console.log('[contact] ═══════════════════════════════════════════\n');

    return res.status(201).json({
      message: 'Orçamento enviado com sucesso! Entraremos em contato em breve.',
      contact: savedContact,
      ...(usedFallback && { warning: 'Banco de dados temporariamente indisponível. Contato registrado localmente.' })
    });

  } catch (err) {
    console.error('[contact] ✗ ERRO INESPERADO na rota de contato:', err);
    console.error('[contact]   Mensagem:', err.message);
    console.error('[contact]   Stack:', err.stack);
    console.log('[contact] ═══════════════════════════════════════════\n');
    return res.status(500).json({ error: 'Erro interno ao processar orçamento. Tente novamente.' });
  }
});

// ── GET /api/contact — Listar contatos (admin) ──────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query(
      'SELECT * FROM contacts ORDER BY created_at DESC'
    );

    // Incluir também os contatos em memória (fallback), se houver
    const allContacts = [...result.rows, ...fallbackContacts.filter(c => c.fallback)];
    res.json(allContacts);
  } catch (err) {
    console.error('[contact] Erro ao listar contatos:', err.message);

    // Se o banco falhar, retornar apenas os que estão em memória
    if (fallbackContacts.length > 0) {
      return res.json(fallbackContacts);
    }
    res.status(500).json({ error: 'Erro ao buscar contatos.' });
  }
});

// ── PUT /api/contact/:id/read — Marcar como lido (admin) ────────────────
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
    console.error('[contact] Erro ao atualizar contato:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar contato.' });
  }
});

// ── DELETE /api/contact/:id — Remover contato (admin) ───────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.get('db');
    await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
    res.json({ message: 'Contato removido.' });
  } catch (err) {
    console.error('[contact] Erro ao remover contato:', err.message);
    res.status(500).json({ error: 'Erro ao remover contato.' });
  }
});

module.exports = router;
