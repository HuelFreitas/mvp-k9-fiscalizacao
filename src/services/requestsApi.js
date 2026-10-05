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

export async function requestEvidenceUpload(token, requestId, file) {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/evidence/upload-url`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name: file.name, size: file.size, type: file.type }),
  });
  return parseJson(response);
}

export async function uploadEvidenceToStorage(uploadUrl, file) {
  const response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!response.ok) throw new Error('Falha ao enviar o arquivo para o armazenamento');
}

export async function confirmEvidenceUpload(token, requestId, upload) {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/evidence`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ id: upload.id, key: upload.key, name: upload.name, size: upload.size, type: upload.type }),
  });
  return parseJson(response);
}

export async function getEvidenceDownloadUrl(token, requestId, evidenceId) {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/evidence/${evidenceId}/download-url`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson(response);
}

export async function deleteEvidence(token, requestId, evidenceId) {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/evidence/${evidenceId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return parseJson(response);
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
