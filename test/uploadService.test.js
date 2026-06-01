/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MAX_EVIDENCE_COUNT } from '../src/data/constants.js';
import {
  getEvidenceCount,
  canAddEvidence,
  isAllowedEvidenceType,
  createEvidenceEntry,
  addEvidenceFile,
  removeEvidenceFromRequest,
} from '../src/services/uploadService.js';

describe('uploadService', () => {
  const uid = (prefix) => `${prefix}-123`;
  let originalFileReader;

  beforeEach(() => {
    originalFileReader = global.FileReader;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.FileReader = originalFileReader;
  });

  it('should count evidence correctly', () => {
    expect(getEvidenceCount({ evidence: [{}, {}] })).toBe(2);
    expect(getEvidenceCount({})).toBe(0);
  });

  it('should allow adding evidence when under limit and reject when full', () => {
    const request = { evidence: new Array(MAX_EVIDENCE_COUNT - 1).fill({}) };
    expect(canAddEvidence(request)).toBe(true);

    request.evidence = new Array(MAX_EVIDENCE_COUNT).fill({});
    expect(canAddEvidence(request)).toBe(false);
  });

  it('should validate allowed evidence types', () => {
    expect(isAllowedEvidenceType('image/png')).toBe(true);
    expect(isAllowedEvidenceType('application/x-msdownload')).toBe(false);
  });

  it('should create evidence entry with provided uid', () => {
    const file = { name: 'evidence.pdf', size: 2048, type: 'application/pdf' };
    const evidence = createEvidenceEntry(file, uid);

    expect(evidence.id).toBe('evidence-123');
    expect(evidence.name).toBe('evidence.pdf');
    expect(evidence.type).toBe('application/pdf');
    expect(evidence.size).toBe(2048);
    expect(evidence.uploadedAt).toBeDefined();
    expect(evidence.data).toBeNull();
  });

  it('should reject unsupported file types', async () => {
    const req = { evidence: [] };
    const file = new File(['content'], 'virus.exe', { type: 'application/x-msdownload', size: 1024 });

    const result = await addEvidenceFile(req, file, uid);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('type');
    expect(req.evidence.length).toBe(0);
  });

  it('should reject files that exceed the size limit', async () => {
    const req = { evidence: [] };
    const file = new File(['a'.repeat(11 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf', size: 11 * 1024 * 1024 });

    const result = await addEvidenceFile(req, file, uid);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('size');
    expect(req.evidence.length).toBe(0);
  });

  it('should reject when evidence limit is reached', async () => {
    const req = { evidence: new Array(MAX_EVIDENCE_COUNT).fill({}) };
    const file = new File(['content'], 'note.txt', { type: 'text/plain', size: 1024 });

    const result = await addEvidenceFile(req, file, uid);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('limit');
  });

  it('should add evidence file and populate data URI', async () => {
    class MockFileReader {
      constructor() {
        this.onload = null;
      }
      readAsDataURL() {
        setTimeout(() => {
          this.result = 'data:text/plain;base64,SGVsbG8=';
          this.onload?.({ target: this });
        }, 0);
      }
    }

    global.FileReader = MockFileReader;

    const req = { evidence: [] };
    const file = new File(['hello'], 'report.txt', { type: 'text/plain', size: 100 });

    const result = await addEvidenceFile(req, file, uid);

    expect(result.success).toBe(true);
    expect(result.evidence).toBeDefined();
    expect(result.evidence.name).toBe('report.txt');
    expect(result.evidence.data).toBe('data:text/plain;base64,SGVsbG8=');
    expect(req.evidence.length).toBe(1);
  });

  it('should remove evidence by id and return the removed item', () => {
    const item = { id: 'e-1', name: 'file.pdf' };
    const req = { evidence: [item] };

    const removed = removeEvidenceFromRequest(req, 'e-1');

    expect(removed).toBe(item);
    expect(req.evidence.length).toBe(0);
  });

  it('should return null when trying to remove a non-existent evidence item', () => {
    const req = { evidence: [{ id: 'e-1', name: 'x.txt' }] };
    expect(removeEvidenceFromRequest(req, 'missing')).toBeNull();
  });
});
