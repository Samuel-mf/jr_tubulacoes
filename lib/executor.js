const https = require('https');
const http = require('http');

/**
 * Envia uma action ao executor-service via POST /execute.
 * @param {string} action - Nome da action registrada no Command Bus
 * @param {object} input  - Payload da action
 * @returns {Promise<{ statusCode: number, body: object }>}
 */
function callExecutor(action, input) {
  const apiUrl = process.env.API_URL;
  const apiKey = process.env.EXECUTOR_API_KEY;

  if (!apiUrl || !apiKey) {
    return Promise.reject(new Error('API_URL ou EXECUTOR_API_KEY não configurados no .env'));
  }

  const body = JSON.stringify({ action, input });
  let url;
  try {
    url = new URL('/execute', apiUrl);
  } catch {
    return Promise.reject(new Error('API_URL inválida: ' + apiUrl));
  }

  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': apiKey,
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          reject(new Error('Resposta inválida do executor-service: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { callExecutor };
