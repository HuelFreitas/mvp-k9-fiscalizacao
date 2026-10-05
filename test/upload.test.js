/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/services/requestsApi.js', () => ({
  requestEvidenceUpload: vi.fn(),
  uploadEvidenceToStorage: vi.fn(),
  confirmEvidenceUpload: vi.fn(),
  deleteEvidence: vi.fn(),
  getEvidenceDownloadUrl: vi.fn(),
}));

import {
  requestEvidenceUpload,
  uploadEvidenceToStorage,
  confirmEvidenceUpload,
  deleteEvidence,
  getEvidenceDownloadUrl,
} from '../src/services/requestsApi.js';
import {
  createUploadArea,
  handleFileUpload,
  renderEvidenceGallery,
  removeEvidence,
  viewEvidence,
} from '../src/components/upload.js';

describe('upload component', () => {
  let helpers;

  beforeEach(() => {
    // minimal helpers mock
    helpers = {
      findRequestById: (id) => ({ id, evidence: [] }),
      findRequestByEvidenceId: () => null,
      findUserById: (id) => ({ id, name: 'User' }),
      showErrorNotification: vi.fn(),
      showSuccessNotification: vi.fn(),
      showWarningNotification: vi.fn(),
      uid: (prefix) => `${prefix}-1`,
      saveState: vi.fn(),
      escapeHtml: (s) => s,
      formatDate: (d) => String(d),
      confirm: () => true,
      session: { token: 'jwt' },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('createUploadArea returns expected markup', () => {
    const html = createUploadArea('req-1');
    expect(html).toContain('fileInput-req-1');
    expect(html).toContain('evidenceGallery-req-1');
    expect(html).toContain('upload-area');
  });

  it('handleFileUpload rejects unsupported file types', async () => {
    const req = { id: 'req-1', evidence: [] };
    helpers.findRequestById = () => req;

    const file = new File(['hello'], 'hello.exe', { type: 'application/x-msdownload', size: 100 });

    await handleFileUpload([file], 'req-1', helpers);

    expect(helpers.showErrorNotification).toHaveBeenCalled();
    expect(req.evidence.length).toBe(0);
  });

  it('handleFileUpload adds image evidence and saves state', async () => {
    const req = { id: 'req-2', evidence: [] };
    helpers.findRequestById = () => req;

    const file = new File(['data'], 'pic.png', { type: 'image/png', size: 1024 });
    const evidence = { id: 'e-1', name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString() };
    requestEvidenceUpload.mockResolvedValue({ upload: { ...evidence, key: 'requests/req-2/e-1.png', uploadUrl: 'https://upload.example' } });
    uploadEvidenceToStorage.mockResolvedValue();
    confirmEvidenceUpload.mockResolvedValue({ request: { ...req, evidence: [evidence] }, evidence });

    // ensure gallery element exists for the call inside the reader
    const gallery = document.createElement('div');
    gallery.id = 'evidenceGallery-req-2';
    document.body.appendChild(gallery);

    await handleFileUpload([file], 'req-2', helpers);

    expect(req.evidence.length).toBe(1);
    expect(req.evidence[0].name).toBe('pic.png');
    expect(helpers.saveState).toHaveBeenCalled();
    expect(helpers.showSuccessNotification).toHaveBeenCalled();
  });

  it('renderEvidenceGallery creates DOM items and view/remove actions', () => {
    const gallery = document.createElement('div');
    const evidenceList = [
      { id: 'e-1', name: 'a.png', size: 512, type: 'image/png', uploadedAt: new Date().toISOString(), data: 'data:' },
      { id: 'e-2', name: 'b.pdf', size: 1024, type: 'application/pdf', uploadedAt: new Date().toISOString(), data: null },
    ];

    renderEvidenceGallery(evidenceList, gallery, 'req-1', helpers);
    expect(gallery.innerHTML).toContain('evidence-item');
    expect(gallery.querySelectorAll('.evidence-item').length).toBe(2);
    // image should include view button
    expect(gallery.querySelector('.evidence-item [data-action="view"]')).toBeTruthy();
    // remove buttons present
    expect(gallery.querySelectorAll('[data-action="remove"]').length).toBe(2);
  });

  it('removeEvidence removes item after confirm', async () => {
    const req = { id: 'req-3', evidence: [{ id: 'e-10', name: 'f.txt' }] };
    helpers.findRequestById = () => req;
    // create gallery element
    const gallery = document.createElement('div');
    gallery.id = 'evidenceGallery-req-3';
    document.body.appendChild(gallery);

    deleteEvidence.mockResolvedValue();
    await removeEvidence('e-10', 'req-3', helpers);
    expect(req.evidence.length).toBe(0);
    expect(helpers.saveState).toHaveBeenCalled();
  });

  it('viewEvidence opens a private download URL', async () => {
    const evidence = { id: 'e-20', name: 'img.png', type: 'image/png', size: 100, uploadedAt: new Date().toISOString(), data: 'data:image/png;base64,AAA' };
    const req = { id: 'req-4', evidence: [evidence] };
    helpers.findRequestByEvidenceId = () => req;

    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    getEvidenceDownloadUrl.mockResolvedValue({ downloadUrl: 'https://download.example' });
    await viewEvidence('e-20', helpers);
    expect(open).toHaveBeenCalledWith('https://download.example', '_blank', 'noopener,noreferrer');
  });
});
