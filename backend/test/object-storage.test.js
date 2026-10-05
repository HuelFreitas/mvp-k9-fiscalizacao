import { describe, expect, it } from 'vitest';
import { evidenceKey, validateEvidenceFile } from '../src/services/objectStorage.js';

describe('object storage validation', () => {
  it('accepts JPG, PNG and PDF up to 10 MB', () => {
    expect(validateEvidenceFile({ name: 'laudo.pdf', size: 1024, type: 'application/pdf' })).toBeNull();
    expect(validateEvidenceFile({ name: 'foto.png', size: 10 * 1024 * 1024, type: 'image/png' })).toBeNull();
  });

  it('rejects unsupported or oversized files', () => {
    expect(validateEvidenceFile({ name: 'script.exe', size: 10, type: 'application/x-msdownload' })).toMatch(/Formato/);
    expect(validateEvidenceFile({ name: 'grande.pdf', size: 10 * 1024 * 1024 + 1, type: 'application/pdf' })).toMatch(/10 MB/);
  });

  it('creates a request-scoped object key with a sanitized extension', () => {
    expect(evidenceKey('req-1', 'evidence-1', 'Laudo.PDF')).toBe('requests/req-1/evidence-1.pdf');
  });
});
