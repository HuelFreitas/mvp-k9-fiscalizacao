import { describe, expect, it } from 'vitest';
import { addClientNoteToRequest, removeRequestFromState, updateRequestDetails } from '../src/services/clientService.js';

describe('clientService extra', () => {
  it('addClientNoteToRequest adiciona timeline e updatedAt', () => {
    const request = { timeline: [] };
    const client = { id: 'c1', role: 'client', name: 'Cli' };
    const entry = addClientNoteToRequest(request, client, 'observação');
    expect(entry.title).toContain('Cliente adicionou');
    expect(request.updatedAt).toBeTypeOf('string');
    expect(request.timeline).toHaveLength(1);
  });

  it('updateRequestDetails atualiza campos e cria timeline', () => {
    const request = { timeline: [] };
    const updates = { title: 't', port: 'p', vessel: 'v', cargo: '', description: 'd', scheduledFor: '2026-06-10', tags: ['a'], client: { id: 'c1', role: 'client', name: 'Cli' } };
    const entry = updateRequestDetails(request, updates);
    expect(request.cargo).toBe('Não informado');
    expect(request.tags).toEqual(['a']);
    expect(entry.category).toBe('client');
  });

  it('removeRequestFromState remove item existente', () => {
    const request = { id: 'r2' };
    const state = { requests: [{ id: 'r1' }, request] };
    expect(removeRequestFromState(state, request)).toBe(true);
    expect(state.requests).toHaveLength(1);
    expect(removeRequestFromState(state, request)).toBe(false);
  });
});
