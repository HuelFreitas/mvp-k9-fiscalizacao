import { showSuccessNotification, showErrorNotification, showWarningNotification } from '../ui/notifications.js';
import { announce } from '../utils/dom.js';
import { buildRequestPayload, validateRequestPayload } from '../services/requestService.js';
import { createRequest } from '../services/requestsApi.js';

export async function handleCreateRequest(event, user, { state, saveState, rerender, session }) {
  event.preventDefault();
  const form = event.currentTarget;

  if (!form.checkValidity()) {
    form.reportValidity();
    form.querySelector(':invalid')?.focus();
    const message = 'Preencha os campos obrigatórios destacados antes de enviar.';
    announce(message);
    showErrorNotification('Formulário incompleto', message, 5000);
    return;
  }

  const data = new FormData(form);
  const request = buildRequestPayload(data, user);
  const validation = validateRequestPayload(request);

  if (!validation.valid) {
    announce(validation.message);
    showErrorNotification('Formulário incompleto', validation.message, 5000);
    return;
  }

  if (request.scheduledFor) {
    const scheduledDate = request.scheduledFor;
    const now = new Date().toISOString();
    if (scheduledDate < now) {
      showErrorNotification(
        'Data inválida',
        'Não é possível agendar inspeções no passado. Selecione uma data futura.',
        6000
      );
      return;
    }
    const isToday = new Date(request.scheduledFor).toDateString() === new Date().toDateString();
    if (isToday) {
      showWarningNotification(
        'Atenção',
        'Você está agendando para hoje. Certifique-se de que há tempo suficiente para preparação.',
        5000
      );
    }
  }

  try {
    if (!session?.token) {
      showErrorNotification('Sessão inválida', 'Faça login novamente para enviar solicitações.', 5000);
      return;
    }

    const payload = {
      title: request.title,
      port: request.port,
      vessel: request.vessel,
      cargo: request.cargo,
      description: request.description,
      tags: request.tags,
      scheduledFor: request.scheduledFor.split('T')[0],
      scheduledTime: request.scheduledFor.split('T')[1]?.slice(0, 5) || '',
    };

    const { request: created } = await createRequest(session.token, payload);
    state.requests.unshift(created);
    saveState();
    form.reset();
    form.querySelector('input, select, textarea')?.focus();
    rerender(user);
    announce('Solicitação registrada com sucesso.');
    showSuccessNotification(
      'Solicitação criada!',
      `Inspeção "${created.title}" foi registrada com sucesso. ID: ${created.id.toUpperCase()}`,
      6000
    );
  } catch (error) {
    showErrorNotification('Erro ao criar solicitação', error?.message || 'Falha ao salvar solicitação.', 5000);
  }
}
