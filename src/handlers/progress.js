import { safeTrim } from '../utils/string.js';
import { announce } from '../utils/dom.js';
import { timelineItem } from '../components/timeline.js';
import { showInfoNotification } from '../ui/notifications.js';
import { addRequestProgress } from '../services/requestsApi.js';

export async function handleProgressUpdate(event, request, operator, dialog, helpers) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const title = safeTrim(data.get('title'));
  const details = safeTrim(data.get('details'));
  const next = safeTrim(data.get('next'));

  if (!title || !details) return;

  if (!helpers.session?.token) return;
  const { request: updated, entry } = await addRequestProgress(helpers.session.token, request.id, { title, details, next });
  Object.assign(request, updated);

  helpers.saveState();
  form.reset();
  const timeline = dialog.querySelector('.timeline');
  if (timeline) timeline.insertAdjacentHTML('afterbegin', timelineItem(entry));
  announce('Checkpoint registrado.');
  showInfoNotification(
    'Checkpoint registrado!',
    `Nova atualização adicionada à solicitação ${request.id.toUpperCase()}`,
    4000
  );
  helpers.renderApp();
}
