const API_BASE_URL = '/api';

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.error?.code || 'Senha inválida';
    throw new Error(message);
  }
  return data;
}

export async function loginWithPassword({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseJson(response);
}

export async function registerWithPassword({ email, name, role, company, certification, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, role, company, certification, password }),
  });
  return parseJson(response);
}
