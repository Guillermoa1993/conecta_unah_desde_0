'use strict';

// DIAGNÓSTICO: servidor HTTP mínimo sin Express para aislar el problema de red vs Express
// Si este servidor tampoco responde externamente → problema de red/routing en Railway
// Si responde → problema específico de Express 5

const PORT = Number(process.env.PORT) || 8080;

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message, '\n', err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

const http = require('http');

const server = http.createServer((req, res) => {
  const ip = req.socket.remoteAddress;
  console.log(`[DIAG] ${req.method} ${req.url} desde ${ip}`);
  res.writeHead(200, { 'Content-Type': 'application/json', 'X-Diagnostic': 'start-js-raw' });
  res.end(JSON.stringify({ ok: true, diag: true, port: PORT, url: req.url }));
});

server.on('connection', (socket) => {
  console.log(`[DIAG] TCP desde ${socket.remoteAddress}:${socket.remotePort}`);
});

server.on('error', (err) => {
  console.error('[DIAG] Error servidor:', err.message);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[DIAG] Servidor diagnostico HTTP en http://0.0.0.0:${PORT}`);
  console.log(`[DIAG] Express NO cargado — modo diagnostico puro`);
});
