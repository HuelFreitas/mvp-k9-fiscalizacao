import { describe, it, expect } from 'vitest';
import { buildRequestPayload, validateRequestPayload } from '../src/services/requestService.js';

describe('requestService', () => {
  it('buildRequestPayload cria payload completo', () => {
    const data = new Map([
      ['title', 'Inspeção'],
      ['port', 'Porto de Santos'],
      ['vessel', 'Navio X'],
      ['cargo', 'Contêiner'],
      ['scheduledFor', '2026-10-01'],
      ['scheduledTime', '08:00'],
      ['description', 'Descrição'],
      ['tags', 'k9, auditoria'],
    ]);

    const payload = buildRequestPayload(data, { id: 'client-1', name: 'Cliente', role: 'client' });
    expect(payload.id).toContain('req-');
    expect(payload.clientId).toBe('client-1');
    expect(payload.status).toBe('pending');
    expect(payload.tags).toEqual(['k9', 'auditoria']);
    expect(payload.timeline.length).toBe(1);
    expect(payload.report).toBeNull();
  });

  it('validateRequestPayload rejeita payload incompleto', () => {
    const invalid = validateRequestPayload({ title: 'x' });
    expect(invalid.valid).toBe(false);

    const valid = validateRequestPayload({
      title: 'x',
      port: 'p',
      vessel: 'v',
      description: 'd',
      scheduledFor: '2026-01-01T10:00:00',
    });
    expect(valid.valid).toBe(true);
  });
});
