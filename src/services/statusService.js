import { createTimelineEntry } from '../components/timeline.js';
import { translateStatus } from '../utils/helpers.js';

export function updateRequestStatus(request, operator, status, notes) {
  if (!request || !operator || !status) return null;

  const now = new Date().toISOString();
  request.status = status;
  request.updatedAt = now;
  request.assignedOperatorId = operator.id;

  const entry = createTimelineEntry({
    actor: operator,
    title: `Status atualizado para ${translateStatus(status)}`,
    description: notes || 'Status modificado sem observações adicionais.',
    category: 'status',
  });

  request.timeline.push(entry);
  return entry;
}
