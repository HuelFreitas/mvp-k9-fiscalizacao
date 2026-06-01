import { safeTrim } from '../utils/string.js';
import { announce } from '../utils/dom.js';
import { showSuccessNotification } from '../ui/notifications.js';
import { submitRequestReport } from '../services/requestsApi.js';

export async function handleReportSubmission(event, request, operator, dialog, helpers) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const summary = safeTrim(data.get('summary'));
  const findings = safeTrim(data.get('findings'));
  const recommendations = safeTrim(data.get('recommendations'));

  if (!summary || !findings || !recommendations) {
    announce('Preencha todos os campos do relatório.');
    return;
  }

  if (!helpers.session?.token) return;
  const { request: updated } = await submitRequestReport(helpers.session.token, request.id, { summary, findings, recommendations });
  Object.assign(request, updated);

  helpers.saveState();
  dialog.close();
  announce('Relatório final salvo e missão concluída.');
  showSuccessNotification(
    'Missão concluída!',
    `Relatório final da solicitação ${request.id.toUpperCase()} foi enviado com sucesso`,
    6000
  );
}
