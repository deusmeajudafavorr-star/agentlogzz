'use strict';

// Porta de entrada com senha para o túnel público. O AgenteHub continua
// limitado ao localhost e não fica exposto diretamente na rede.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = Number(process.env.AGENTEHUB_PORT || 3000);
const PROXY_PORT = Number(process.env.PUBLIC_PROXY_PORT || 3001);
const PASSWORD_FILE = path.join(__dirname, '.local-secrets', 'public-access.txt');
const password = fs.readFileSync(PASSWORD_FILE, 'utf8').trim();
if (password.length < 24) throw new Error('A senha local precisa ter ao menos 24 caracteres.');

const publicPath = pathname => pathname.startsWith('/c/') ||
  pathname.startsWith('/api/public/') || pathname.startsWith('/uploads/');
const constantTimeEqual = (a, b) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && require('node:crypto').timingSafeEqual(left, right);
};

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/__agentehub_health') {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end('{"ok":true}');
    return;
  }

  if (!publicPath(pathname)) {
    const auth = request.headers.authorization || '';
    const encoded = auth.startsWith('Basic ') ? auth.slice(6) : '';
    let supplied = '';
    try {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      if (separator >= 0) supplied = decoded.slice(separator + 1);
    } catch { /* challenge below */ }
    if (!constantTimeEqual(supplied, password)) {
      response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="AgenteHub", charset="UTF-8"', 'content-type': 'text/plain; charset=utf-8' });
      response.end('Entre com a senha de acesso do AgenteHub.');
      return;
    }
  }

  const headers = { ...request.headers, host: `${TARGET_HOST}:${TARGET_PORT}` };
  headers['x-forwarded-for'] = [request.headers['x-forwarded-for'], request.socket.remoteAddress].filter(Boolean).join(', ');
  headers['x-forwarded-host'] = request.headers['x-forwarded-host'] || request.headers.host || '';
  headers['x-forwarded-proto'] = request.headers['x-forwarded-proto'] || 'https';
  const upstream = http.request({ hostname: TARGET_HOST, port: TARGET_PORT, method: request.method, path: request.url, headers }, result => {
    response.writeHead(result.statusCode || 502, result.headers);
    result.pipe(response);
  });
  upstream.on('error', error => {
    if (!response.headersSent) response.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('O AgenteHub local está indisponível. Abra o servidor no computador.');
    console.error('[proxy]', error.message);
  });
  request.pipe(upstream);
});

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`AgenteHub protegido disponível para o túnel na porta ${PROXY_PORT}.`);
});
