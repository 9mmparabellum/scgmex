// Helper: execute SQL via Supabase Management API
// Usage: node run-sql.js "SELECT 1"  OR  echo "SQL" | node run-sql.js --stdin
const TOKEN = 'sbp_70a80fd26d34ce96ab4e1b23b4104c37f7884469';
const REF = 'pfmiwusneqjplwwwlvyh';

async function runSQL(sql) {
  const resp = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await resp.text();
  if (!resp.ok) {
    console.error(`HTTP ${resp.status}: ${text}`);
    process.exit(1);
  }
  console.log(text);
}

if (process.argv.includes('--stdin')) {
  let data = '';
  process.stdin.on('data', c => data += c);
  process.stdin.on('end', () => runSQL(data));
} else {
  runSQL(process.argv[2]);
}
