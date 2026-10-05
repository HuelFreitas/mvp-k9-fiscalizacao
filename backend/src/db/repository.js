import { getPool, hasDatabase } from './pool.js';

function userFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    company: row.company || undefined,
    certification: row.certification || undefined,
    passwordHash: row.password_hash,
  };
}

function requestFromRow(row) {
  if (!row) return null;
  return {
    ...row.payload,
    id: row.id,
    clientId: row.client_id,
    assignedOperatorId: row.assigned_operator_id,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findUserByEmailRecord(email) {
  const normalizedEmail = String(email).trim().toLowerCase();
  if (!hasDatabase()) {
    return global.appState?.users?.find((user) => user.email === normalizedEmail) || null;
  }
  const { rows } = await getPool().query('SELECT * FROM users WHERE email = $1 LIMIT 1', [normalizedEmail]);
  return userFromRow(rows[0]);
}

export async function insertUser(user) {
  if (!hasDatabase()) {
    global.appState.users.push(user);
    return user;
  }
  const { rows } = await getPool().query(
    `INSERT INTO users (id, role, name, email, company, certification, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [user.id, user.role, user.name, user.email, user.company || null, user.certification || null, user.passwordHash]
  );
  return userFromRow(rows[0]);
}

export async function listRequestRecords() {
  if (!hasDatabase()) return global.appState?.requests || [];
  const { rows } = await getPool().query('SELECT * FROM requests ORDER BY created_at DESC');
  return rows.map(requestFromRow);
}

export async function findRequestById(id) {
  if (!hasDatabase()) return global.appState?.requests?.find((request) => request.id === id) || null;
  const { rows } = await getPool().query('SELECT * FROM requests WHERE id = $1 LIMIT 1', [id]);
  return requestFromRow(rows[0]);
}

export async function insertRequest(request) {
  if (!hasDatabase()) {
    global.appState.requests.push(request);
    return request;
  }
  const { rows } = await getPool().query(
    `INSERT INTO requests
       (id, client_id, assigned_operator_id, status, payload, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
     RETURNING *`,
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
  return requestFromRow(rows[0]);
}

export async function saveRequest(request) {
  if (!hasDatabase()) return request;
  const { rows } = await getPool().query(
    `UPDATE requests
       SET client_id = $2, assigned_operator_id = $3, status = $4,
           payload = $5::jsonb, updated_at = $6
     WHERE id = $1
     RETURNING *`,
    [
      request.id,
      request.clientId,
      request.assignedOperatorId,
      request.status,
      JSON.stringify(request),
      request.updatedAt,
    ]
  );
  return requestFromRow(rows[0]);
}

export async function deleteRequestById(id) {
  if (!hasDatabase()) {
    const index = global.appState.requests.findIndex((request) => request.id === id);
    if (index >= 0) global.appState.requests.splice(index, 1);
    return index >= 0;
  }
  const result = await getPool().query('DELETE FROM requests WHERE id = $1', [id]);
  return result.rowCount > 0;
}
