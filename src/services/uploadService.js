import { MAX_EVIDENCE_COUNT } from '../data/constants.js';
import { confirmEvidenceUpload, requestEvidenceUpload, uploadEvidenceToStorage } from './requestsApi.js';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function getEvidenceCount(request) {
  return Array.isArray(request.evidence) ? request.evidence.length : 0;
}

export function canAddEvidence(request) {
  return getEvidenceCount(request) < MAX_EVIDENCE_COUNT;
}

export function isAllowedEvidenceType(type) {
  return ALLOWED_TYPES.includes(type);
}

export function createEvidenceEntry(file, uid) {
  return {
    id: uid('evidence'),
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    data: null,
  };
}

export async function addEvidenceFile(request, file, uid) {
  if (!request.evidence) request.evidence = [];

  if (!canAddEvidence(request)) {
    return {
      success: false,
      reason: 'limit',
      message: `Cada solicitação suporta no máximo ${MAX_EVIDENCE_COUNT} evidências.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      reason: 'size',
      message: `O arquivo "${file.name}" excede o limite de 10MB`,
    };
  }

  if (!isAllowedEvidenceType(file.type)) {
    return {
      success: false,
      reason: 'type',
      message: `O arquivo "${file.name}" não é um tipo suportado`,
    };
  }

  const evidence = createEvidenceEntry(file, uid);
  request.evidence.push(evidence);
  return { success: true, evidence };
}

export async function uploadEvidenceFile(request, file, token) {
  if (!canAddEvidence(request)) return { success: false, reason: 'limit', message: `Cada solicitação suporta no máximo ${MAX_EVIDENCE_COUNT} evidências.` };
  if (file.size > MAX_FILE_SIZE) return { success: false, reason: 'size', message: `O arquivo "${file.name}" excede o limite de 10MB` };
  if (!isAllowedEvidenceType(file.type)) return { success: false, reason: 'type', message: `O arquivo "${file.name}" não é um tipo suportado` };
  const { upload } = await requestEvidenceUpload(token, request.id, file);
  await uploadEvidenceToStorage(upload.uploadUrl, file);
  return { success: true, ...(await confirmEvidenceUpload(token, request.id, upload)) };
}

export function removeEvidenceFromRequest(request, evidenceId) {
  if (!request || !request.evidence) return null;
  const index = request.evidence.findIndex((item) => item.id === evidenceId);
  if (index < 0) return null;
  const [removed] = request.evidence.splice(index, 1);
  return removed;
}
