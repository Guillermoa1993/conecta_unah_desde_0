// Wrapper de arranque para Railway: captura errores de startup
// Si el app principal falla, arranca un servidor minimal que muestra el error
// y responde a /ping para que Railway no lo mate por healthcheck.

'use strict';

const PORT = Number(process.env.PORT) || 8080;

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message, '\n', err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

let startupError = null;
try {
  require('./dist/infrastructure/server/index.js');
  console.log('[start.js] App principal cargada correctamente');
} catch (err) {
  startupError = err.message || String(err);
  console.error('[start.js] ERROR al cargar app principal:', startupError);
  console.error(err.stack);

  // Fallback minimal para que Railway no mate el proceso
  const http = require('http');
  http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/ping') {
      res.end(JSON.stringify({ ok: false, startupError }));
    } else {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: 'Service unavailable - startup failed', startupError }));
    }
  }).listen(PORT, '0.0.0.0', () => {
    console.log(`[start.js] Fallback server en puerto ${PORT}`);
  });
}
