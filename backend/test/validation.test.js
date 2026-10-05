import { describe, it, expect } from 'vitest';
import {
  validateLoginPayload,
  validateRegisterPayload,
  validateCreateRequestPayload,
  validateUpdateRequestPayload,
  validateStatusPayload,
  validateProgressPayload,
  validateReportPayload,
} from '../src/validation/schemas.js';

describe('validation schemas', () => {
  it('valida login com e-mail normalizado', () => {
    const result = validateLoginPayload({ email: '  USER@MAIL.COM  ', password: '123456' });
    expect(result.success).toBe(true);
    expect(result.data.email).toBe('user@mail.com');
  });

  it('rejeita login inválido', () => {
    const result = validateLoginPayload({ email: 'invalido' });
    expect(result.success).toBe(false);
  });

  it('valida register e rejeita role inválido', () => {
    const ok = validateRegisterPayload({ email: 'u@x.com', name: 'User', role: 'client', password: '123456' });
    expect(ok.success).toBe(true);

    const bad = validateRegisterPayload({ email: 'u@x.com', name: 'User', role: 'wrong', password: '123456' });
    expect(bad.success).toBe(false);

    const privileged = validateRegisterPayload({ email: 'admin@x.com', name: 'Admin', role: 'admin', password: '123456' });
    expect(privileged.success).toBe(false);
  });

  it('valida create/update request payload', () => {
    const createOk = validateCreateRequestPayload({
      title: 't',
      port: 'p',
      vessel: 'v',
      scheduledFor: '2026-01-01',
      scheduledTime: '10:00',
      description: 'd',
    });
    expect(createOk.success).toBe(true);

    const createBad = validateCreateRequestPayload({ title: 't' });
    expect(createBad.success).toBe(false);

    const updateBad = validateUpdateRequestPayload({});
    expect(updateBad.success).toBe(false);

    const sensitiveUpdate = validateUpdateRequestPayload({ status: 'completed', clientId: 'outro' });
    expect(sensitiveUpdate.success).toBe(false);
  });

  it('valida status/progress/report', () => {
    expect(validateStatusPayload({ status: 'in-progress' }).success).toBe(true);
    expect(validateStatusPayload({ status: 'x' }).success).toBe(false);
    expect(validateProgressPayload({ title: 't', details: 'd' }).success).toBe(true);
    expect(validateProgressPayload({ title: '', details: 'd' }).success).toBe(false);
    expect(validateReportPayload({ summary: 's', findings: 'f', recommendations: 'r' }).success).toBe(true);
    expect(validateReportPayload({ summary: 's' }).success).toBe(false);
  });
});
