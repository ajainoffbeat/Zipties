import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const MIGRATIONS_DIR = path.join(process.cwd(), 'src/sql');

async function run() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS sql_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await client.query(
      'SELECT 1 FROM sql_migrations WHERE filename = $1',
      [file]
    );

    if (rows.length) {
      console.log(`⏭ Skipping ${file}`);
      continue;
    }

    console.log(`▶ Running ${file}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO sql_migrations (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`✅ Completed ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  await client.end();
}

run().catch(err => {
  console.error('❌ Migration failed', err);
  process.exit(1);
});
