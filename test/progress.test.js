/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleProgressUpdate } from '../src/handlers/progress.js';
import { addRequestProgress } from '../src/services/requestsApi.js';

vi.mock('../src/services/requestsApi.js', () => ({
  addRequestProgress: vi.fn(),
}));

describe('progress handler', () => {
  let helpers;
  beforeEach(() => {
    helpers = {
      saveState: vi.fn(),
      renderApp: vi.fn(),
    };
  });

  it('adds checkpoint entry to timeline and saves state', async () => {
    const request = { id: 'r-2', timeline: [] };
    const operator = { id: 'op-2', name: 'Op2' };
    const dialog = document.createElement('div');

    const form = document.createElement('form');
    form.innerHTML = '<input name="title" value="Checkpoint" /><textarea name="details">details</textarea><input name="next" value="next steps" />';
    const event = { preventDefault: () => {}, currentTarget: form };
    helpers.session = { token: 'jwt-token' };
    addRequestProgress.mockResolvedValue({
      request: { ...request, timeline: [{ id: 'p1' }], assignedOperatorId: 'op-2' },
      entry: { id: 'p1', title: 'Checkpoint' },
    });

    await handleProgressUpdate(event, request, operator, dialog, helpers);

    expect(request.timeline.length).toBe(1);
    expect(request.assignedOperatorId).toBe('op-2');
    expect(helpers.saveState).toHaveBeenCalled();
    expect(helpers.renderApp).toHaveBeenCalled();
  });
});
