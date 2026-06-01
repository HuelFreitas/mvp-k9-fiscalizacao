import { describe, expect, it } from 'vitest';
import { addProgressCheckpoint } from '../src/services/progressService.js';

describe('progressService', () => {
  it('retorna null com dados inválidos', () => {
    expect(addProgressCheckpoint(null, {}, 't', 'd')).toBeNull();
  });

  it('adiciona checkpoint e próximos passos quando informado', () => {
    const request = { timeline: [] };
    const operator = { id: 'op-1', role: 'operator', name: 'Op' };
    const entry = addProgressCheckpoint(request, operator, 'Coleta', 'Amostras coletadas', 'Enviar laudo');
    expect(request.assignedOperatorId).toBe('op-1');
    expect(entry.description).toContain('Próximos passos');
    expect(request.timeline).toHaveLength(1);
  });
});
