const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const axios = require('axios');
const nodemailer = require('nodemailer');

// ── POST /api/contact — Enviar orçamento (público) ──────
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, service_interest, message, recaptchaToken } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    }

    if (!recaptchaToken) {
      return res.status(400).json({ error: 'Token reCAPTCHA ausente.' });
    }

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret && recaptchaSecret !== 'SuaSecretKeyAqui' && recaptchaSecret !== '6LdAO5QsAAAAAOOMQFAdfu_uFm-Lwj4YuC5V_RnP_placeholder') {
      try {
        const params = new URLSearchParams();
        params.append('secret', recaptchaSecret);
        params.append('response', recaptchaToken);
        
        // Pass params.toString() explicitly and add the header manually to guarantee compatibility
        const recaptchaRes = await axios.post('https://www.google.com/recaptcha/api/siteverify', params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (!recaptchaRes.data.success) {
          console.error('Erro do Google reCAPTCHA:', recaptchaRes.data);
          return res.status(400).json({ error: 'Falha na validação do reCAPTCHA (Success=false).' });
        }
      } catch (axiosErr) {
        console.error('Exceção ao contatar a API do reCAPTCHA:', axiosErr.message);
        return res.status(500).json({ error: 'Erro de conexão com o servidor do reCAPTCHA: ' + axiosErr.message });
      }
    }
    
    const pool = req.app.get('db');
    const result = await pool.query(
      `INSERT INTO contacts (name, phone, email, service_interest, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, phone, email || null, service_interest || null, message || null]
    );

    // Tentativa de envio de e-mail assíncrona
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'SuaSenhaDeAppAqui') {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: 'jrtubulacaodegas@gmail.com',
          subject: `Novo Pedido de Orçamento: ${name}`,
          text: `Você recebeu um novo contato pelo site.\n\nNome: ${name}\nTelefone: ${phone}\nE-mail: ${email || 'Não informado'}\nServiço: ${service_interest || 'Não informado'}\nMensagem: ${message || 'Não informada'}\n\nAcesse o painel para gerenciar os contatos.`
        };

        await transporter.sendMail(mailOptions);
        console.log('E-mail enviado com sucesso para o administrador.');
      } else {
        console.log('E-mail não enviado: credenciais faltando ou placeholder no .env');
      }
    } catch (e) {
      console.error('Erro ao enviar email (Nodemailer):', e.message);
    }
    
    res.status(201).json({ 
      message: 'Orçamento enviado com sucesso! Entraremos em contato em breve.',
      contact: result.rows[0]
    });
  } catch (err) {
    console.error('Erro Crítico ao processar contato:', err.stack);
    // Return actual error message so the user sees what's failing on screen
    res.status(500).json({ error: 'Erro interno no banco/servidor: ' + err.message });
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
