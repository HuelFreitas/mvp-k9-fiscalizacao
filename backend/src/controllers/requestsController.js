import { buildRequestPayload, validateRequestPayload } from '../services/requestService.js';
import {
  validateCreateRequestPayload,
  validateUpdateRequestPayload,
  validateStatusPayload,
  validateProgressPayload,
  validateReportPayload,
} from '../validation/schemas.js';
import {
  deleteRequestById,
  findRequestById,
  insertRequest,
  listRequestRecords,
  saveRequest,
} from '../db/repository.js';
import {
  MAX_EVIDENCE_COUNT,
  createEvidenceDownloadUrl,
  createEvidenceUpload,
  deleteEvidenceObject,
  validateEvidenceFile,
  verifyEvidenceObject,
} from '../services/objectStorage.js';

function isClient(user) {
  return user?.role === 'client';
}

export function canAccessRequest(user, requestItem) {
  if (!requestItem) return false;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'operator') {
    return requestItem.assignedOperatorId === null || requestItem.assignedOperatorId === user.id;
  }
  if (isClient(user)) return requestItem.clientId === user.id;
  return false;
}

async function accessibleRequest(req, res) {
  const item = await findRequestById(req.params.id);
  if (!item || !canAccessRequest(req.user, item)) {
    res.status(404).json({ error: { code: 'NOT_FOUND' } });
    return null;
  }
  return item;
}

export async function createEvidenceUploadHandler(req, res) {
  const item = await accessibleRequest(req, res);
  if (!item) return;
  if ((item.evidence?.length || 0) >= MAX_EVIDENCE_COUNT) {
    return res.status(409).json({ error: { code: 'EVIDENCE_LIMIT', message: 'Limite de 10 evidências atingido' } });
  }
  const error = validateEvidenceFile(req.body || {});
  if (error) return res.status(422).json({ error: { code: 'INVALID_FILE', message: error } });
  const upload = await createEvidenceUpload({ requestId: item.id, ...req.body });
  return res.json({ upload });
}

export async function confirmEvidenceUploadHandler(req, res) {
  const item = await accessibleRequest(req, res);
  if (!item) return;
  const { id, key, name, size, type } = req.body || {};
  const error = validateEvidenceFile({ name, size, type });
  const expectedPrefix = `requests/${item.id}/${id}`;
  if (error || !id || !key?.startsWith(expectedPrefix)) {
    return res.status(422).json({ error: { code: 'INVALID_FILE', message: error || 'Identificador de arquivo inválido' } });
  }
  if ((item.evidence?.length || 0) >= MAX_EVIDENCE_COUNT) {
    return res.status(409).json({ error: { code: 'EVIDENCE_LIMIT', message: 'Limite de 10 evidências atingido' } });
  }
  if (!(await verifyEvidenceObject({ key, size, type }))) {
    return res.status(422).json({ error: { code: 'UPLOAD_MISMATCH', message: 'O arquivo enviado não corresponde aos metadados informados' } });
  }
  const evidence = { id, key, name, size, type, uploadedAt: new Date().toISOString(), uploadedBy: req.user.id };
  item.evidence = Array.isArray(item.evidence) ? item.evidence : [];
  item.evidence.push(evidence);
  item.updatedAt = new Date().toISOString();
  return res.status(201).json({ evidence, request: await saveRequest(item) });
}

export async function downloadEvidenceHandler(req, res) {
  const item = await accessibleRequest(req, res);
  if (!item) return;
  const evidence = item.evidence?.find((entry) => entry.id === req.params.evidenceId);
  if (!evidence) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  const downloadUrl = await createEvidenceDownloadUrl(evidence.key);
  return res.json({ downloadUrl, expiresIn: 300 });
}

export async function deleteEvidenceHandler(req, res) {
  const item = await accessibleRequest(req, res);
  if (!item) return;
  const index = item.evidence?.findIndex((entry) => entry.id === req.params.evidenceId) ?? -1;
  if (index < 0) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  const [evidence] = item.evidence.splice(index, 1);
  await deleteEvidenceObject(evidence.key);
  item.updatedAt = new Date().toISOString();
  await saveRequest(item);
  return res.status(204).send();
}

export async function listRequestsHandler(req, res) {
  const allItems = await listRequestRecords();
  const items = isClient(req.user)
    ? allItems.filter((item) => item.clientId === req.user.id)
    : req.user.role === 'operator'
      ? allItems.filter((item) => item.assignedOperatorId === null || item.assignedOperatorId === req.user.id)
      : allItems;
  return res.json({ items, total: items.length });
}

export async function createRequestHandler(req, res) {
  const parsed = validateCreateRequestPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  const user = req.user || { id: 'client-local', role: 'client' };
  const reqPayload = buildRequestPayload(new Map(Object.entries(parsed.data)), user);
  const valid = validateRequestPayload(reqPayload);
  if (!valid.valid) return res.status(422).json({ error: { code: 'INVALID_REQUEST', message: valid.message } });
  const created = await insertRequest(reqPayload);
  return res.status(201).json({ request: created });
}

export async function getRequestHandler(req, res) {
  const item = await findRequestById(req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  return res.json({ request: item });
}

export async function updateRequestHandler(req, res) {
  const parsed = validateUpdateRequestPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  const item = await findRequestById(req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (req.user.role === 'operator') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Operadores não podem editar os dados da solicitação' } });
  }
  if (isClient(req.user) && item.status !== 'pending') {
    return res.status(409).json({ error: { code: 'REQUEST_LOCKED', message: 'Apenas solicitações pendentes podem ser editadas' } });
  }
  Object.assign(item, parsed.data);
  item.updatedAt = new Date().toISOString();
  return res.json({ request: await saveRequest(item) });
}

export async function deleteRequestHandler(req, res) {
  const item = await findRequestById(req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (isClient(req.user) && item.status !== 'pending') {
    return res.status(409).json({ error: { code: 'REQUEST_LOCKED', message: 'Apenas solicitações pendentes podem ser excluídas' } });
  }
  await deleteRequestById(item.id);
  return res.status(204).send();
}

export async function updateRequestStatusHandler(req, res) {
  const item = await findRequestById(req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  const parsed = validateStatusPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  if (req.user.role === 'operator' && item.assignedOperatorId === null) item.assignedOperatorId = req.user.id;
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
  return res.json({ request: await saveRequest(item), entry });
}

export async function addRequestProgressHandler(req, res) {
  const item = await findRequestById(req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  const parsed = validateProgressPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  if (req.user.role === 'operator' && item.assignedOperatorId === null) item.assignedOperatorId = req.user.id;
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
  return res.status(201).json({ request: await saveRequest(item), entry });
}

export async function submitRequestReportHandler(req, res) {
  const item = await findRequestById(req.params.id);
  if (!item || !canAccessRequest(req.user, item)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  const parsed = validateReportPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  if (req.user.role === 'operator' && item.assignedOperatorId === null) item.assignedOperatorId = req.user.id;
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
  return res.json({ request: await saveRequest(item), entry });
}
