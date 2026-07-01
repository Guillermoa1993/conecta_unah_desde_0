import pool from '../src/infrastructure/database/db';
import http from 'http';
import { URL } from 'url';

const PORT = 8080;

async function query(sql: string, params: unknown[] = []) {
  const { rows, fields } = await pool.query(sql, params);
  return { rows, columns: fields?.map((f) => f.name) ?? [] };
}

function html(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — DB Viewer</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#f0f2f5;color:#1a1a2e}
  nav{background:#004B87;color:#fff;padding:12px 24px;display:flex;align-items:center;gap:16px}
  nav a{color:#FFD100;text-decoration:none;font-weight:600}
  nav span{font-size:18px;font-weight:700}
  .container{max-width:1200px;margin:24px auto;padding:0 16px}
  .card{background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:20px;margin-bottom:20px}
  h1{font-size:20px;margin-bottom:16px;color:#004B87}
  h2{font-size:16px;margin-bottom:12px;color:#003366}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#004B87;color:#fff;padding:8px 12px;text-align:left}
  td{padding:7px 12px;border-bottom:1px solid #e8eaf0}
  tr:hover td{background:#f0f5ff}
  a.btn{display:inline-block;padding:6px 14px;background:#004B87;color:#fff;border-radius:6px;
        text-decoration:none;font-size:13px;margin:4px}
  a.btn:hover{background:#003366}
  .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;
         background:#e8f0fe;color:#004B87;font-weight:600}
  form{display:flex;flex-direction:column;gap:10px}
  textarea{width:100%;height:100px;padding:8px;border:1px solid #ccc;border-radius:6px;
           font-family:monospace;font-size:13px;resize:vertical}
  button{padding:8px 20px;background:#004B87;color:#fff;border:none;border-radius:6px;
         cursor:pointer;font-size:14px;width:fit-content}
  button:hover{background:#003366}
  .error{background:#fff3f3;color:#c0392b;padding:10px;border-radius:6px;font-size:13px}
  .count{color:#666;font-size:12px;margin-bottom:8px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
  .table-card{background:#f8faff;border:1px solid #d0daf5;border-radius:8px;padding:12px}
  .table-card a{color:#004B87;font-weight:600;text-decoration:none;font-size:14px}
  .table-card a:hover{text-decoration:underline}
  .table-card .rows{color:#888;font-size:12px;margin-top:4px}
</style>
</head>
<body>
<nav>
  <span>🐘 DB Viewer</span>
  <a href="/">Tablas</a>
  <a href="/sql">SQL</a>
  <small style="margin-left:auto;opacity:.8">puma_conecta @ Render.com</small>
</nav>
<div class="container">${body}</div>
</body></html>`;
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const path = url.pathname;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  try {
    // ── Página principal: lista de tablas ──────────────────────────────────
    if (path === '/') {
      const { rows } = await pool.query(`
        SELECT t.table_name,
               (SELECT COUNT(*) FROM information_schema.columns c
                WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS col_count
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        ORDER BY t.table_name
      `);

      const cards = await Promise.all(rows.map(async (r) => {
        const cnt = await pool.query(`SELECT COUNT(*) AS n FROM "${r.table_name}"`).catch(() => ({ rows: [{ n: '?' }] }));
        return `<div class="table-card">
          <a href="/table?name=${r.table_name}">${r.table_name}</a>
          <div class="rows">${cnt.rows[0].n} filas · ${r.col_count} cols</div>
        </div>`;
      }));

      res.end(html('Tablas', `
        <div class="card">
          <h1>Base de datos: puma_conecta</h1>
          <p class="count">${rows.length} tablas encontradas</p>
          <div class="grid">${cards.join('')}</div>
        </div>
      `));
      return;
    }

    // ── Ver tabla ──────────────────────────────────────────────────────────
    if (path === '/table') {
      const table = url.searchParams.get('name') ?? '';
      const page = parseInt(url.searchParams.get('page') ?? '1');
      const limit = 30;
      const offset = (page - 1) * limit;

      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) { res.end(html('Error', '<p>Tabla inválida</p>')); return; }

      const [data, countRes, cols] = await Promise.all([
        pool.query(`SELECT * FROM "${table}" LIMIT $1 OFFSET $2`, [limit, offset]),
        pool.query(`SELECT COUNT(*) AS n FROM "${table}"`),
        pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [table]),
      ]);

      const total = parseInt(countRes.rows[0].n);
      const pages = Math.ceil(total / limit);

      const headers = data.fields.map((f) => `<th>${f.name}</th>`).join('');
      const bodyRows = data.rows.map((r) =>
        `<tr>${Object.values(r).map((v) =>
          `<td>${v === null ? '<span style="color:#aaa">NULL</span>' : String(v).slice(0, 100)}</td>`
        ).join('')}</tr>`
      ).join('');

      const colList = cols.rows.map((c) =>
        `<tr><td>${c.column_name}</td><td><span class="badge">${c.data_type}</span></td></tr>`
      ).join('');

      const pagination = pages > 1
        ? Array.from({ length: pages }, (_, i) => i + 1)
            .map((p) => `<a class="btn" href="/table?name=${table}&page=${p}" style="${p===page?'background:#FFD100;color:#003366':''}">${p}</a>`)
            .join('')
        : '';

      res.end(html(table, `
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:280px">
            <div class="card">
              <h2>Estructura</h2>
              <table><thead><tr><th>Columna</th><th>Tipo</th></tr></thead>
              <tbody>${colList}</tbody></table>
            </div>
          </div>
          <div style="flex:3;min-width:400px">
            <div class="card">
              <h1>📄 ${table} <small style="font-size:13px;color:#666">${total} filas</small></h1>
              <div style="overflow-x:auto">
                <table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>
              </div>
              <div style="margin-top:12px">${pagination}</div>
            </div>
          </div>
        </div>
        <div style="margin-top:8px"><a class="btn" href="/">← Volver</a></div>
      `));
      return;
    }

    // ── Consola SQL ────────────────────────────────────────────────────────
    if (path === '/sql') {
      let result = '';
      let sqlVal = '';

      if (req.method === 'POST') {
        const body = await new Promise<string>((resolve) => {
          let data = '';
          req.on('data', (c) => { data += c; });
          req.on('end', () => resolve(data));
        });
        sqlVal = decodeURIComponent(body.replace('sql=', '').replace(/\+/g, ' '));

        try {
          const r = await query(sqlVal);
          if (r.rows.length === 0) {
            result = '<p style="color:green">✔ Consulta ejecutada sin resultados.</p>';
          } else {
            const heads = r.columns.map((c) => `<th>${c}</th>`).join('');
            const trows = r.rows.map((row) =>
              `<tr>${Object.values(row).map((v) =>
                `<td>${v === null ? '<span style="color:#aaa">NULL</span>' : String(v).slice(0, 200)}</td>`
              ).join('')}</tr>`
            ).join('');
            result = `<p class="count">${r.rows.length} filas</p>
              <div style="overflow-x:auto"><table><thead><tr>${heads}</tr></thead><tbody>${trows}</tbody></table></div>`;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          result = `<div class="error">❌ ${msg}</div>`;
        }
      }

      res.end(html('SQL', `
        <div class="card">
          <h1>Consola SQL</h1>
          <form method="POST" action="/sql">
            <textarea name="sql" placeholder="SELECT * FROM usuarios LIMIT 10;">${sqlVal}</textarea>
            <button type="submit">▶ Ejecutar</button>
          </form>
        </div>
        ${result ? `<div class="card">${result}</div>` : ''}
      `));
      return;
    }

    res.statusCode = 404;
    res.end(html('404', '<p>Página no encontrada</p>'));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.statusCode = 500;
    res.end(html('Error', `<div class="error">❌ ${msg}</div>`));
  }
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`\n🐘 DB Viewer corriendo en http://localhost:${PORT}`);
  console.log(`   BD: puma_conecta @ Render.com\n`);
});
