import bcrypt from 'bcryptjs';
import { defaultState } from '../src/data/defaultState.js';
import { closePool, getPool } from '../src/db/pool.js';

async function seed() {
  const password = process.env.DEMO_DEFAULT_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('DEMO_DEFAULT_PASSWORD deve ter pelo menos 8 caracteres');
  }

  const pool = getPool();
  const existingDemoUsers = await pool.query(
    'SELECT COUNT(*)::int AS count FROM users WHERE email = ANY($1::text[])',
    [defaultState.users.map((user) => user.email)]
  );
  const allDemoUsersExist = existingDemoUsers.rows[0].count === defaultState.users.length;
  const passwordHash = allDemoUsersExist ? null : await bcrypt.hash(password, 10);

  if (!allDemoUsersExist) {
    for (const user of defaultState.users) {
      await pool.query(
        `INSERT INTO users (id, role, name, email, company, certification, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.role, user.name, user.email, user.company || null, user.certification || null, passwordHash]
      );
    }
  }

  for (const request of defaultState.requests) {
    await pool.query(
      `INSERT INTO requests
         (id, client_id, assigned_operator_id, status, payload, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        request.id,
        request.clientId,
        request.assignedOperatorId,
        request.status,
        JSON.stringify(request),
        request.createdAt,
        request.updatedAt,
      ]
    );
  }

  console.log('Dados demonstrativos verificados.');
}

seed()
  .then(closePool)
  .catch(async (error) => {
    console.error('Falha ao criar dados demonstrativos:', error.message);
    await closePool();
    process.exitCode = 1;
  });
