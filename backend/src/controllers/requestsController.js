import { buildRequestPayload, validateRequestPayload } from '../services/requestService.js';
import {
  validateCreateRequestPayload,
  validateUpdateRequestPayload,
  validateStatusPayload,
  validateProgressPayload,
  validateReportPayload,
} from '../validation/schemas.js';

function isClient(user) {
  return user?.role === 'client';
}

function canAccessRequest(user, requestItem) {
  if (!requestItem) return false;
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'operator') return true;
  if (isClient(user)) return requestItem.clientId === user.id;
  return false;
}

export function listRequestsHandler(req, res) {
  const allItems = global.appState.requests || [];
  const items = isClient(req.user)
    ? allItems.filter((item) => item.clientId === req.user.id)
    : allItems;
  return res.json({ items, total: items.length });
}

export function createRequestHandler(req, res) {
  const parsed = validateCreateRequestPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  const user = req.user || { id: 'client-local', role: 'client' };
  const reqPayload = buildRequestPayload(new Map(Object.entries(parsed.data)), user);
  const valid = validateRequestPayload(reqPayload);
  if (!valid.valid) return res.status(422).json({ error: { code: 'INVALID_REQUEST', message: valid.message } });
  global.appState.requests.push(reqPayload);
  return res.status(201).json({ request: reqPayload });
}

export function getRequestHandler(req, res) {
  const item = (global.appState.requests || []).find((r) => r.id === req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  return res.json({ request: item });
}

export function updateRequestHandler(req, res) {
  const parsed = validateUpdateRequestPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  const item = (global.appState.requests || []).find((r) => r.id === req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  Object.assign(item, parsed.data);
  item.updatedAt = new Date().toISOString();
  return res.json({ request: item });
}

export function deleteRequestHandler(req, res) {
  const items = global.appState.requests || [];
  const index = items.findIndex((r) => r.id === req.params.id);
  if (index < 0 || !canAccessRequest(req.user, items[index])) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  items.splice(index, 1);
  return res.status(204).send();
}

export function updateRequestStatusHandler(req, res) {
  const item = (global.appState.requests || []).find((r) => r.id === req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  const parsed = validateStatusPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  const { status, notes } = parsed.data;
  item.status = status;
  item.updatedAt = new Date().toISOString();
  const entry = {
    id: `event-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    actor: { id: req.user.id, name: req.user.id, role: req.user.role },
    title: 'Status atualizado',
    description: notes || `Status alterado para ${status}`,
    category: 'operation',
  };
  item.timeline = Array.isArray(item.timeline) ? item.timeline : [];
  item.timeline.push(entry);
  return res.json({ request: item, entry });
}

export function addRequestProgressHandler(req, res) {
  const item = (global.appState.requests || []).find((r) => r.id === req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  const parsed = validateProgressPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  const { title, details, next } = parsed.data;
  const entry = {
    id: `event-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    actor: { id: req.user.id, name: req.user.id, role: req.user.role },
    title,
    description: next ? `${details} | Próximo: ${next}` : details,
    category: 'operation',
  };
  item.timeline = Array.isArray(item.timeline) ? item.timeline : [];
  item.timeline.push(entry);
  item.updatedAt = new Date().toISOString();
  return res.status(201).json({ request: item, entry });
}

export function submitRequestReportHandler(req, res) {
  const item = (global.appState.requests || []).find((r) => r.id === req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  const parsed = validateReportPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  const { summary, findings, recommendations } = parsed.data;
  item.report = { summary, findings, recommendations, generatedAt: new Date().toISOString(), operatorId: req.user.id };
  item.status = 'completed';
  item.updatedAt = new Date().toISOString();
  const entry = {
    id: `event-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    actor: { id: req.user.id, name: req.user.id, role: req.user.role },
    title: 'Relatório final enviado',
    description: 'Missão concluída com relatório final.',
    category: 'report',
  };
  item.timeline = Array.isArray(item.timeline) ? item.timeline : [];
  item.timeline.push(entry);
  return res.json({ request: item, entry });
}
