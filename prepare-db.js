'use strict';

// Carrega o estado persistido antes de iniciar o servidor. Em desenvolvimento
// local, sem DATABASE_URL, o servidor continua usando data/db.json.
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

  const dataDir = path.join(__dirname, 'data');
  const dbFile = path.join(dataDir, 'db.json');
  fs.mkdirSync(dataDir, { recursive: true });
  const pool = new Pool({ connectionString, ssl: true, max: 1 });

  try {
    const result = await pool.query(
      `select state from public.agentehub_state where workspace_id = 'default'`
    );

    if (result.rows.length) {
      const state = result.rows[0].state;
      const serialized = JSON.stringify(state);
      fs.writeFileSync(dbFile + '.tmp', serialized);
      fs.renameSync(dbFile + '.tmp', dbFile);
      console.log('[Supabase] Estado do AgenteHub carregado.');
      return;
    }

    let state = {};
    try { state = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch { /* primeiro deploy */ }
    await pool.query(
      `insert into public.agentehub_state (workspace_id, revision, state, updated_at)
       values ('default', 1, $1::jsonb, now())`,
      [JSON.stringify(state)]
    );
    console.log('[Supabase] Estado inicial do AgenteHub salvo.');
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('[Supabase] Não foi possível preparar o estado do AgenteHub:', error.message);
  process.exitCode = 1;
});
