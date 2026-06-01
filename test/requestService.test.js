import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/misc.js', async () => {
  const actual = await vi.importActual('../src/utils/misc.js');
  return { ...actual, uid: vi.fn(() => 'req-123abc') };
});

import { buildRequestPayload, validateRequestPayload } from '../src/services/requestService.js';

describe('requestService', () => {
  it('buildRequestPayload monta payload completo com defaults', () => {
    const formData = new FormData();
    formData.set('title', ' Inspeção ');
    formData.set('port', ' Santos ');
    formData.set('vessel', ' Navio A ');
    formData.set('cargo', '');
    formData.set('scheduledFor', '2026-06-10');
    formData.set('scheduledTime', '08:30');
    formData.set('description', '  Verificar porão ');
    formData.set('tags', 'urgente, marítimo');

    const payload = buildRequestPayload(formData, { id: 'c1', role: 'client', name: 'Cliente' });

    expect(payload.id).toBe('req-123abc');
    expect(payload.clientId).toBe('c1');
    expect(payload.cargo).toBe('Não informado');
    expect(payload.scheduledFor).toBe('2026-06-10T08:30:00');
    expect(payload.status).toBe('pending');
    expect(payload.tags).toEqual(['urgente', 'marítimo']);
    expect(payload.timeline).toHaveLength(1);
    expect(payload.report).toBeNull();
  });

  it('validateRequestPayload retorna inválido quando falta campo obrigatório', () => {
    const result = validateRequestPayload({ title: 'x' });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('campos obrigatórios');
  });

  it('validateRequestPayload retorna válido com campos obrigatórios', () => {
    const result = validateRequestPayload({
      title: 'x',
      port: 'p',
      vessel: 'v',
      description: 'd',
      scheduledFor: '2026-06-10T08:00:00',
    });
    expect(result).toEqual({ valid: true });
  });
});
