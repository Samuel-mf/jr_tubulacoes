const express = require('express');
const router = express.Router();
const https = require('https');
const { callExecutor } = require('../lib/executor');


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

    // ── 3. Delegar ao executor-service via Command Bus ─────────────────
    console.log('[contact] Passo 3: Enviando ao executor-service...');

    const executorResponse = await callExecutor('process_contact_form', {
      name,
      phone,
      email: email || null,
      service_interest: service_interest || null,
      message: message || null,
    });

    console.log('[contact] Resposta do executor-service:', JSON.stringify(executorResponse.body));

    if (!executorResponse.body.success) {
      const errMsg = executorResponse.body?.error?.message || 'Erro ao processar formulário no servidor.';
      console.warn('[contact] ✗ executor-service retornou erro:', errMsg);
      return res.status(executorResponse.statusCode >= 400 ? executorResponse.statusCode : 500).json({
        error: errMsg
      });
    }

    // ── 4. Resposta de sucesso ──────────────────────────────────────────
    console.log('[contact] ✓ Processo concluído com sucesso via executor-service.');
    console.log('[contact] ═══════════════════════════════════════════\n');

    return res.status(201).json({
      message: 'Orçamento enviado com sucesso! Entraremos em contato em breve.',
    });

  } catch (err) {
    console.error('[contact] ✗ ERRO INESPERADO na rota de contato:', err.message);
    console.log('[contact] ═══════════════════════════════════════════\n');
    return res.status(500).json({ error: 'Erro interno ao processar orçamento. Tente novamente.' });
  }
});

module.exports = router;
