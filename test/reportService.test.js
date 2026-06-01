import { describe, expect, it } from 'vitest';
import { completeRequestReport } from '../src/services/reportService.js';

describe('reportService', () => {
  it('retorna null quando faltam dados obrigatórios', () => {
    expect(completeRequestReport(null, {}, 's', 'f', 'r')).toBeNull();
    expect(completeRequestReport({}, null, 's', 'f', 'r')).toBeNull();
    expect(completeRequestReport({}, {}, '', 'f', 'r')).toBeNull();
  });

  it('conclui solicitação e adiciona timeline de relatório', () => {
    const request = { status: 'in-progress', timeline: [] };
    const operator = { id: 'op-2', role: 'operator', name: 'Maria' };

    const entry = completeRequestReport(request, operator, 'Resumo', 'Achados', 'Recomendações');

    expect(request.status).toBe('completed');
    expect(request.assignedOperatorId).toBe('op-2');
    expect(request.updatedAt).toBeTypeOf('string');
    expect(request.report).toMatchObject({
      summary: 'Resumo',
      findings: 'Achados',
      recommendations: 'Recomendações',
      operatorId: 'op-2',
    });
    expect(entry.title).toContain('Relatório final');
    expect(request.timeline).toHaveLength(1);
  });
});
