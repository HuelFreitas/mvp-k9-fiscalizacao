import { safeTrim } from '../utils/string.js';
import { announce } from '../utils/dom.js';
import { timelineItem } from '../components/timeline.js';
import { buildStatusChip } from '../components/ui.js';
import { showSuccessNotification } from '../ui/notifications.js';
import { updateRequestStatus as updateRequestStatusApi } from '../services/requestsApi.js';

export async function handleStatusUpdate(event, request, operator, dialog, helpers) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const status = data.get('status');
  const notes = safeTrim(data.get('notes'));

  if (!status) return;

  if (!helpers.session?.token) return;
  const { request: updated, entry } = await updateRequestStatusApi(helpers.session.token, request.id, { status, notes });
  Object.assign(request, updated);

  helpers.saveState();
  const select = form.querySelector('#statusSelect');
  if (select) select.value = status;
  const notesField = form.querySelector('#statusNotes');
  if (notesField) notesField.value = '';
  const statusChip = dialog.querySelector('.modal__header .status-chip');
  if (statusChip) statusChip.outerHTML = buildStatusChip(status);
  const timeline = dialog.querySelector('.timeline');
  if (timeline) timeline.insertAdjacentHTML('afterbegin', timelineItem(entry));
  helpers.renderApp();
  announce('Status atualizado com sucesso.');
  showSuccessNotification(
    'Status atualizado!',
    `Solicitação ${request.id.toUpperCase()} agora está: ${status.replace('-', ' ')}`,
    4000
  );
}
