const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { callExecutor } = require('../lib/executor');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// ── POST /api/auth/login ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    const response = await callExecutor('admin_login', { username, password });

    if (!response.body.success) {
      const msg = response.body?.error || 'Credenciais inválidas.';
      return res.status(401).json({ error: msg });
    }

    const { token, username: user } = response.body.result;
    res.json({ token, username: user });

  } catch (err) {
    console.error('[auth] Erro no login:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ── Middleware local de verificação de token ──────────────────────────────
// O token é assinado pelo executor-service com o mesmo JWT_SECRET.
// A verificação ocorre localmente sem round-trip adicional ao executor.
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
}

module.exports = router;
module.exports.verifyToken = verifyToken;
