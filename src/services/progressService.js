import { createTimelineEntry } from '../components/timeline.js';

export function addProgressCheckpoint(request, operator, title, details, next) {
  if (!request || !operator || !title || !details) return null;

  const now = new Date().toISOString();
  request.updatedAt = now;
  request.assignedOperatorId = operator.id;

  const description = `${details}${next ? ` Próximos passos: ${next}.` : ''}`;
  const entry = createTimelineEntry({
    actor: operator,
    title,
    description,
    category: 'operation',
  });

  request.timeline.push(entry);
  return entry;
}
