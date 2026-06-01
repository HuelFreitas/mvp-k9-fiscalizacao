import { createTimelineEntry } from '../components/timeline.js';

export function addClientNoteToRequest(request, client, note) {
  if (!request || !client || !note) return null;

  const entry = createTimelineEntry({
    actor: client,
    title: 'Cliente adicionou observação',
    description: note,
    category: 'client',
  });

  request.timeline.push(entry);
  request.updatedAt = new Date().toISOString();
  return entry;
}

export function updateRequestDetails(request, updates) {
  if (!request || !updates) return null;

  request.title = updates.title;
  request.port = updates.port;
  request.vessel = updates.vessel;
  request.cargo = updates.cargo || 'Não informado';
  request.description = updates.description;
  request.scheduledFor = updates.scheduledFor;
  request.tags = updates.tags;
  request.updatedAt = new Date().toISOString();

  const entry = createTimelineEntry({
    actor: updates.client,
    title: 'Cliente atualizou a solicitação',
    description: 'Detalhes do serviço revisados pelo solicitante.',
    category: 'client',
  });

  request.timeline.push(entry);
  return entry;
}

export function removeRequestFromState(state, request) {
  if (!state || !request) return false;
  const index = state.requests.findIndex((item) => item.id === request.id);
  if (index < 0) return false;

  state.requests.splice(index, 1);
  return true;
}
