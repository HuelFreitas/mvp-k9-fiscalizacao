import { describe, expect, it, vi } from 'vitest';
import { buildMetrics, buildOperatorMetrics } from '../src/handlers/metrics.js';

describe('metrics handler', () => {
  it('buildMetrics calcula totais e próxima inspeção', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-28T12:00:00.000Z'));

    const requests = [
      { status: 'pending', scheduledFor: '2026-06-10T08:00:00.000Z' },
      { status: 'in-progress', scheduledFor: '2026-05-30T09:00:00.000Z' },
      { status: 'completed', scheduledFor: '2026-05-20T09:00:00.000Z' },
    ];

    const result = buildMetrics(requests);

    expect(result.total).toBe(3);
    expect(result.pending).toBe(1);
    expect(result.inProgress).toBe(1);
    expect(result.completed).toBe(1);
    expect(result.nextInspectionLabel).toContain('30');

    vi.useRealTimers();
  });

  it('buildOperatorMetrics filtra agenda do operador e fallback sem agenda', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-28T12:00:00.000Z'));

    const requests = [
      { assignedOperatorId: 'op-1', status: 'pending', scheduledFor: '2026-05-29T10:00:00.000Z' },
      { assignedOperatorId: 'op-2', status: 'in-progress', scheduledFor: '2026-05-28T18:00:00.000Z' },
      { assignedOperatorId: 'op-1', status: 'completed', scheduledFor: null },
    ];

    const result = buildOperatorMetrics(requests, 'op-1');
    expect(result.assignedToOperator).toBe(2);
    expect(result.pending).toBe(1);
    expect(result.inProgress).toBe(1);
    expect(result.completed).toBe(1);
    expect(result.nextInspectionLabel).toContain('29');

    const noSchedule = buildOperatorMetrics([], 'op-1');
    expect(noSchedule.nextInspectionLabel).toBe('Sem agenda');

    vi.useRealTimers();
  });
});
