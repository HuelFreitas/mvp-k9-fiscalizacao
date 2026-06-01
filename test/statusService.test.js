import { describe, expect, it } from 'vitest';
import { updateRequestStatus } from '../src/services/statusService.js';

describe('statusService', () => {
  it('retorna null para payload inválido', () => {
    expect(updateRequestStatus(null, { id: 'op' }, 'pending')).toBeNull();
    expect(updateRequestStatus({}, null, 'pending')).toBeNull();
    expect(updateRequestStatus({}, { id: 'op' }, '')).toBeNull();
  });

  it('atualiza status, operador e timeline', () => {
    const request = { status: 'pending', timeline: [] };
    const operator = { id: 'op-1', role: 'operator', name: 'Op' };

    const entry = updateRequestStatus(request, operator, 'in-progress', 'Em deslocamento');

    expect(request.status).toBe('in-progress');
    expect(request.assignedOperatorId).toBe('op-1');
    expect(request.updatedAt).toBeTypeOf('string');
    expect(request.timeline).toHaveLength(1);
    expect(entry.title).toContain('Em andamento');
    expect(entry.description).toBe('Em deslocamento');
  });
});
