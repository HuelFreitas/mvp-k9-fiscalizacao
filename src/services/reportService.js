import { createTimelineEntry } from '../components/timeline.js';

export function completeRequestReport(request, operator, summary, findings, recommendations) {
  if (!request || !operator || !summary || !findings || !recommendations) return null;

  const now = new Date().toISOString();

  request.report = {
    summary,
    findings,
    recommendations,
    generatedAt: now,
    operatorId: operator.id,
  };
  request.status = 'completed';
  request.updatedAt = now;
  request.assignedOperatorId = operator.id;

  const entry = createTimelineEntry({
    actor: operator,
    title: 'Relatório final registrado',
    description: 'Missão concluída e relatório disponibilizado ao cliente.',
    category: 'report',
  });

  request.timeline.push(entry);
  return entry;
}
