/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleReportSubmission } from '../src/handlers/report.js';
import { submitRequestReport } from '../src/services/requestsApi.js';

vi.mock('../src/services/requestsApi.js', () => ({
  submitRequestReport: vi.fn(),
}));

describe('report handler', () => {
  let helpers;
  beforeEach(() => {
    helpers = {
      saveState: vi.fn(),
    };
  });

  it('submits report, closes dialog and marks request as completed', async () => {
    const request = { id: 'r-3', timeline: [], status: 'in-progress', report: null };
    const operator = { id: 'op-3', name: 'Op3' };
    const dialog = { close: vi.fn() };

    const form = document.createElement('form');
    form.innerHTML = '<textarea name="summary">sum</textarea><textarea name="findings">find</textarea><textarea name="recommendations">rec</textarea>';
    const event = { preventDefault: () => {}, currentTarget: form };
    helpers.session = { token: 'jwt-token' };
    submitRequestReport.mockResolvedValue({
      request: {
        ...request,
        status: 'completed',
        report: { summary: 'sum', findings: 'find', recommendations: 'rec' },
        timeline: [{ id: 'rpt1' }],
      },
    });

    await handleReportSubmission(event, request, operator, dialog, helpers);

    expect(request.report).toBeTruthy();
    expect(request.report.summary).toBe('sum');
    expect(request.status).toBe('completed');
    expect(request.timeline.length).toBe(1);
    expect(helpers.saveState).toHaveBeenCalled();
    expect(dialog.close).toHaveBeenCalled();
  });
});
