import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addRequestProgress,
  createRequest,
  deleteRequest,
  fetchRequests,
  submitRequestReport,
  updateRequest,
  updateRequestStatus,
} from '../src/services/requestsApi.js';

describe('requestsApi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetchRequests usa GET com headers de auth', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ items: [] }) });
    await fetchRequests('tok');
    expect(fetch).toHaveBeenCalledWith('/api/requests', expect.objectContaining({ method: 'GET' }));
  });

  it('create/update/status/progress/report serializam payload', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ ok: true }) });
    const payload = { a: 1 };
    await createRequest('t', payload);
    await updateRequest('t', 'r1', payload);
    await updateRequestStatus('t', 'r1', payload);
    await addRequestProgress('t', 'r1', payload);
    await submitRequestReport('t', 'r1', payload);
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('retorna erro padrão quando API falha', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: vi.fn().mockRejectedValue(new Error('x')) });
    await expect(fetchRequests('tok')).rejects.toThrow('Falha na requisição');
  });

  it('deleteRequest lança erro quando não ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(deleteRequest('t', 'id')).rejects.toThrow('Falha na requisição');
  });
});
