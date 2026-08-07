'use strict';

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message, '\n', err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

try {
  require('./dist/infrastructure/server/index.js');
  console.log('[start.js] App cargada correctamente');
} catch (err) {
  const startupError = err.message || String(err);
  console.error('[start.js] ERROR al cargar app:', startupError, err.stack);

  const PORT = Number(process.env.PORT) || 8080;
  const http = require('http');
  http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/ping') {
      res.end(JSON.stringify({ ok: false, startupError }));
    } else {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: 'Service unavailable', startupError }));
    }
  }).listen(PORT, '0.0.0.0', () => {
    console.log(`[start.js] Fallback server en puerto ${PORT}`);
  });
}
