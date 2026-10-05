const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.error?.code || 'Falha na requisição';
    throw new Error(message);
  }
  return data;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchRequests(token) {
  const response = await fetch(`${API_BASE_URL}/requests`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  return parseJson(response);
}

export async function createRequest(token, payload) {
  const response = await fetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function updateRequest(token, id, payload) {
  const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function deleteRequest(token, id) {
  const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Falha na requisição');
}

export async function updateRequestStatus(token, id, payload) {
  const response = await fetch(`${API_BASE_URL}/requests/${id}/status`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function addRequestProgress(token, id, payload) {
  const response = await fetch(`${API_BASE_URL}/requests/${id}/progress`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function submitRequestReport(token, id, payload) {
  const response = await fetch(`${API_BASE_URL}/requests/${id}/report`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}
