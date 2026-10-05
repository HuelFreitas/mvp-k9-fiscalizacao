import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/ui/notifications.js', () => ({
  showSuccessNotification: vi.fn(),
  showErrorNotification: vi.fn(),
  showWarningNotification: vi.fn(),
}));
vi.mock('../src/utils/dom.js', () => ({ announce: vi.fn() }));
vi.mock('../src/services/requestService.js', () => ({
  buildRequestPayload: vi.fn(),
  validateRequestPayload: vi.fn(),
}));
vi.mock('../src/services/requestsApi.js', () => ({ createRequest: vi.fn() }));

import { handleCreateRequest } from '../src/handlers/requests.js';
import { showErrorNotification, showSuccessNotification } from '../src/ui/notifications.js';
import { announce } from '../src/utils/dom.js';
import { buildRequestPayload, validateRequestPayload } from '../src/services/requestService.js';
import { createRequest } from '../src/services/requestsApi.js';

function createEvent() {
  const focus = vi.fn();
  const form = document.createElement('form');
  const input = document.createElement('input');
  input.name = 'title';
  input.value = 'dummy';
  form.appendChild(input);
  form.reset = vi.fn();
  form.querySelector = vi.fn(() => ({ focus }));

  return {
    preventDefault: vi.fn(),
    currentTarget: form,
    _focus: focus,
    _reset: form.reset,
  };
}

describe('handlers/requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('interrompe quando validação falha', async () => {
    const event = createEvent();
    buildRequestPayload.mockReturnValue({});
    validateRequestPayload.mockReturnValue({ valid: false, message: 'inválido' });

    await handleCreateRequest(event, { id: 'c1' }, { state: { requests: [] }, saveState: vi.fn(), rerender: vi.fn(), session: { token: 't' } });

    expect(announce).toHaveBeenCalledWith('inválido');
    expect(showErrorNotification).toHaveBeenCalledWith('Formulário incompleto', 'inválido', 5000);
    expect(createRequest).not.toHaveBeenCalled();
  });

  it('mostra os campos obrigatórios ausentes antes de montar a solicitação', async () => {
    const event = createEvent();
    const invalidInput = document.createElement('input');
    invalidInput.required = true;
    event.currentTarget.appendChild(invalidInput);
    event.currentTarget.reportValidity = vi.fn();
    await handleCreateRequest(event, { id: 'c1' }, { state: { requests: [] }, saveState: vi.fn(), rerender: vi.fn(), session: { token: 't' } });

    expect(event.currentTarget.reportValidity).toHaveBeenCalled();
    expect(event._focus).toHaveBeenCalled();
    expect(showErrorNotification).toHaveBeenCalledWith(
      'Formulário incompleto',
      expect.stringContaining('campos obrigatórios'),
      5000,
    );
    expect(buildRequestPayload).not.toHaveBeenCalled();
    expect(createRequest).not.toHaveBeenCalled();
  });

  it('interrompe quando sessão não possui token', async () => {
    const event = createEvent();
    buildRequestPayload.mockReturnValue({ scheduledFor: '', title: 'x' });
    validateRequestPayload.mockReturnValue({ valid: true });

    await handleCreateRequest(event, { id: 'c1' }, { state: { requests: [] }, saveState: vi.fn(), rerender: vi.fn(), session: null });

    expect(showErrorNotification).toHaveBeenCalledWith('Sessão inválida', expect.any(String), 5000);
    expect(createRequest).not.toHaveBeenCalled();
  });

  it('cria solicitação com sucesso', async () => {
    const event = createEvent();
    const request = {
      title: 'Inspeção', port: 'Santos', vessel: 'A', cargo: 'Carga', description: 'Desc',
      tags: ['x'], scheduledFor: '2099-06-10T08:30:00',
    };
    buildRequestPayload.mockReturnValue(request);
    validateRequestPayload.mockReturnValue({ valid: true });
    createRequest.mockResolvedValue({ request: { id: 'req-1', title: 'Inspeção' } });

    const state = { requests: [] };
    const saveState = vi.fn();
    const rerender = vi.fn();

    await handleCreateRequest(event, { id: 'c1' }, { state, saveState, rerender, session: { token: 'jwt' } });

    expect(createRequest).toHaveBeenCalledWith('jwt', expect.objectContaining({
      title: 'Inspeção',
      scheduledFor: '2099-06-10',
      scheduledTime: '08:30',
    }));
    expect(state.requests).toHaveLength(1);
    expect(saveState).toHaveBeenCalled();
    expect(rerender).toHaveBeenCalled();
    expect(event._reset).toHaveBeenCalled();
    expect(event._focus).toHaveBeenCalled();
    expect(showSuccessNotification).toHaveBeenCalled();
  });

  it('bloqueia criação quando agendamento está no passado', async () => {
    const event = createEvent();
    const iso = '2000-01-01T10:00:00';

    buildRequestPayload.mockReturnValue({
      title: 'Inspeção', port: 'Santos', vessel: 'A', cargo: 'Carga', description: 'Desc',
      tags: [], scheduledFor: iso,
    });
    validateRequestPayload.mockReturnValue({ valid: true });
    createRequest.mockResolvedValue({ request: { id: 'req-1', title: 'Inspeção' } });

    await handleCreateRequest(event, { id: 'c1' }, { state: { requests: [] }, saveState: vi.fn(), rerender: vi.fn(), session: { token: 'jwt' } });

    expect(showErrorNotification).toHaveBeenCalledWith(
      'Data inválida',
      expect.stringContaining('agendar inspeções no passado'),
      6000,
    );
    expect(createRequest).not.toHaveBeenCalled();
  });
});
