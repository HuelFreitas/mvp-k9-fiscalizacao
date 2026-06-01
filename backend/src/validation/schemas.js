const ROLES = ['client', 'operator', 'admin'];
const STATUSES = ['pending', 'in-progress', 'completed'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function buildError(message, details = {}) {
  return { success: false, error: { message, details } };
}

export function validateLoginPayload(payload) {
  if (!payload || typeof payload !== 'object') return buildError('Payload inválido');
  if (!isNonEmptyString(payload.email) || !payload.email.includes('@')) return buildError('E-mail inválido');
  if (payload.password !== undefined && !isNonEmptyString(payload.password)) return buildError('Senha inválida');
  return { success: true, data: { email: payload.email.trim().toLowerCase(), password: payload.password } };
}

export function validateRegisterPayload(payload) {
  if (!payload || typeof payload !== 'object') return buildError('Payload inválido');
  if (!isNonEmptyString(payload.email) || !payload.email.includes('@')) return buildError('E-mail inválido');
  if (!isNonEmptyString(payload.name)) return buildError('Nome obrigatório');
  if (!ROLES.includes(payload.role)) return buildError('Perfil inválido');
  if (!isNonEmptyString(payload.password) || payload.password.length < 6) return buildError('Senha deve ter ao menos 6 caracteres');
  return {
    success: true,
    data: {
      email: payload.email.trim().toLowerCase(),
      name: payload.name.trim(),
      role: payload.role,
      company: payload.company,
      certification: payload.certification,
      password: payload.password,
    },
  };
}

export function validateCreateRequestPayload(payload) {
  const required = ['title', 'port', 'vessel', 'scheduledFor', 'scheduledTime', 'description'];
  if (!payload || typeof payload !== 'object') return buildError('Payload inválido');
  for (const field of required) {
    if (!isNonEmptyString(payload[field])) return buildError(`Campo obrigatório: ${field}`);
  }
  return { success: true, data: payload };
}

export function validateUpdateRequestPayload(payload) {
  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    return buildError('Payload inválido');
  }
  return { success: true, data: payload };
}

export function validateStatusPayload(payload) {
  if (!payload || typeof payload !== 'object') return buildError('Payload inválido');
  if (!STATUSES.includes(payload.status)) return buildError('Status inválido');
  if (payload.notes !== undefined && typeof payload.notes !== 'string') return buildError('Notas inválidas');
  return { success: true, data: payload };
}

export function validateProgressPayload(payload) {
  if (!payload || typeof payload !== 'object') return buildError('Payload inválido');
  if (!isNonEmptyString(payload.title) || !isNonEmptyString(payload.details)) return buildError('Título e detalhes são obrigatórios');
  return { success: true, data: payload };
}

export function validateReportPayload(payload) {
  if (!payload || typeof payload !== 'object') return buildError('Payload inválido');
  if (!isNonEmptyString(payload.summary) || !isNonEmptyString(payload.findings) || !isNonEmptyString(payload.recommendations)) {
    return buildError('Resumo, achados e recomendações são obrigatórios');
  }
  return { success: true, data: payload };
}
