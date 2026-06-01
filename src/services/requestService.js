import { safeTrim } from '../utils/string.js';
import { uid, combineDateTime } from '../utils/misc.js';
import { parseTags } from '../utils/helpers.js';
import { createTimelineEntry } from '../components/timeline.js';

export function buildRequestPayload(formData, user) {
  const scheduledDate = typeof formData.get('scheduledFor') === 'string' ? formData.get('scheduledFor') : '';
  const scheduledTime = typeof formData.get('scheduledTime') === 'string' ? formData.get('scheduledTime') : '';
  const scheduledFor = combineDateTime(scheduledDate, scheduledTime);

  return {
    id: uid('req'),
    clientId: user.id,
    assignedOperatorId: null,
    title: safeTrim(formData.get('title')),
    port: safeTrim(formData.get('port')),
    vessel: safeTrim(formData.get('vessel')),
    cargo: safeTrim(formData.get('cargo')) || 'Não informado',
    scheduledFor,
    description: safeTrim(formData.get('description')),
    status: 'pending',
    tags: parseTags(formData.get('tags')),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      createTimelineEntry({
        actor: user,
        title: 'Solicitação registrada',
        description: 'Cliente abriu uma nova inspeção via portal.',
        category: 'request',
      }),
    ],
    report: null,
  };
}

export function validateRequestPayload(request) {
  const requiredFields = ['title', 'port', 'vessel', 'description', 'scheduledFor'];
  const missingField = requiredFields.find((field) => !request[field]);
  if (missingField) {
    return {
      valid: false,
      message: 'Preencha todos os campos obrigatórios da solicitação.',
    };
  }

  return { valid: true };
}
