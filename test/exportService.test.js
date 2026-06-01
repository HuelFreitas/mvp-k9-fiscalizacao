/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const saveMock = vi.fn();
const splitTextToSizeMock = vi.fn((text) => (Array.isArray(text) ? text : [text]));
const textMock = vi.fn();
const lineMock = vi.fn();
const setFontSizeMock = vi.fn();
const setFontMock = vi.fn();

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setFontSize: setFontSizeMock,
    setFont: setFontMock,
    splitTextToSize: splitTextToSizeMock,
    text: textMock,
    line: lineMock,
    save: saveMock,
  })),
}));

import { generateReportPdf } from '../src/services/exportService.js';

describe('exportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an error result when the request has no report', () => {
    const result = generateReportPdf({ id: 'req-1' }, { resolveUser: () => null });
    expect(result.success).toBe(false);
    expect(result.reason).toBe('missing_report');
  });

  it('generates a PDF and calls save when report data exists', () => {
    const resolveUser = vi.fn((id) => ({ id, name: `User ${id}` }));
    const request = {
      id: 'req-1',
      title: 'Teste PDF',
      clientId: 'client-1',
      assignedOperatorId: 'operator-1',
      port: 'Porto Azul',
      vessel: 'Navio Teste',
      scheduledFor: '2025-10-15T08:00:00',
      evidence: [{ name: 'a.png', size: 2048, type: 'image/png' }],
      timeline: [
        {
          id: 't1',
          timestamp: '2025-10-10T09:00:00',
          title: 'Evento 1',
          description: 'Descrição do evento',
          actor: { name: 'Operador 1' },
        },
      ],
      report: {
        generatedAt: '2025-10-10T08:00:00',
        summary: 'Resumo',
        findings: 'Achados',
        recommendations: 'Recomendações',
        operatorId: 'operator-1',
      },
    };

    const result = generateReportPdf(request, { resolveUser });

    expect(result.success).toBe(true);
    expect(resolveUser).toHaveBeenCalledWith('client-1');
    expect(resolveUser).toHaveBeenCalledWith('operator-1');
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock.mock.calls[0][0]).toContain('relatorio_req-1_');
    expect(textMock).toHaveBeenCalled();
    expect(splitTextToSizeMock).toHaveBeenCalled();
  });
});
