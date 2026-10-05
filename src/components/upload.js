import { formatFileSize } from '../utils/misc.js';
import { uploadEvidenceFile } from '../services/uploadService.js';
import { deleteEvidence, getEvidenceDownloadUrl } from '../services/requestsApi.js';

export function createUploadArea(requestId) {
  return `
    <div class="card" style="box-shadow:none; border:1px solid var(--border); background: var(--surface-alt);" aria-label="Evidências da operação">
      <h4>Evidências da operação</h4>
      <p>Adicione fotos, documentos ou outros arquivos relevantes para esta inspeção.</p>
      
      <div class="upload-area" id="uploadArea-${requestId}">
        <input type="file" id="fileInput-${requestId}" multiple accept="image/jpeg,image/png,.pdf" />
        <div class="upload-icon">📁</div>
        <p class="upload-text">Clique aqui ou arraste arquivos para adicionar evidências</p>
        <p class="upload-hint">Formatos aceitos: JPG, PNG e PDF (máx. 10MB por arquivo)</p>
      </div>
      <p class="feedback" id="uploadStatus-${requestId}" role="status" aria-live="polite"></p>
      
      <div class="evidence-gallery" id="evidenceGallery-${requestId}">
        <!-- Evidências serão inseridas aqui -->
      </div>
    </div>
  `;
}

export function initializeUploadArea(requestId, request, helpers) {
  const uploadArea = document.getElementById(`uploadArea-${requestId}`);
  const fileInput = document.getElementById(`fileInput-${requestId}`);
  const gallery = document.getElementById(`evidenceGallery-${requestId}`);
  if (!uploadArea || !fileInput || !gallery) return;

  if (request.evidence && request.evidence.length > 0) {
    renderEvidenceGallery(request.evidence, gallery, requestId, helpers);
  }

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));

  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) await handleFileUpload(files, requestId, helpers);
  });

  uploadArea.addEventListener('click', (event) => {
    if (event.target === fileInput) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;
    try {
      await handleFileUpload(files, requestId, helpers);
    } finally {
      fileInput.value = '';
    }
  });

  // delegate gallery actions
  gallery.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const evidenceId = btn.closest('.evidence-item')?.dataset.evidenceId;
    if (action === 'remove' && evidenceId) removeEvidence(evidenceId, requestId, helpers);
    if (action === 'view' && evidenceId) viewEvidence(evidenceId, helpers);
  });
}

export async function handleFileUpload(files, requestId, helpers) {
  const request = helpers.findRequestById(requestId);
  if (!request) return;
  const status = document.getElementById(`uploadStatus-${requestId}`);

  for (const file of Array.from(files)) {
    if (status) {
      status.dataset.type = 'info';
      status.textContent = `Enviando "${file.name}"...`;
    }
    let result;
    try {
      result = await uploadEvidenceFile(request, file, helpers.session?.token);
    } catch (error) {
      const message = error?.message || 'Não foi possível enviar o arquivo.';
      if (status) {
        status.dataset.type = 'error';
        status.textContent = message;
      }
      helpers.showErrorNotification('Erro no upload', message, 5000);
      continue;
    }
    if (!result.success) {
      if (status) {
        status.dataset.type = 'error';
        status.textContent = result.message;
      }
      helpers.showErrorNotification('Erro no upload', result.message, 5000);
      if (result.reason === 'limit') {
        helpers.showWarningNotification('Limite de evidências atingido', result.message, 5000);
      }
      continue;
    }

    request.evidence = result.request.evidence || [];
    helpers.saveState();
    const gallery = document.getElementById(`evidenceGallery-${requestId}`);
    renderEvidenceGallery(request.evidence, gallery, requestId, helpers);
    if (status) {
      status.dataset.type = 'success';
      status.textContent = `Arquivo "${file.name}" adicionado com sucesso.`;
    }
    helpers.showSuccessNotification('Evidência adicionada', `Arquivo "${file.name}" foi adicionado com sucesso`, 3000);
  }
}

export function renderEvidenceGallery(evidenceList, gallery, requestId, helpers) {
  if (!gallery || !evidenceList) return;
  gallery.innerHTML = evidenceList
    .map((evidence) => {
      const fileSize = formatFileSize(evidence.size);
      return `
        <div class="evidence-item" data-evidence-id="${evidence.id}">
          <div class="file-icon">${evidence.type.startsWith('image/') ? '🖼️' : '📄'}</div>
          <div class="evidence-info">
            <div class="evidence-name">${helpers.escapeHtml(evidence.name)}</div>
            <div>${fileSize} • ${helpers.formatDate(evidence.uploadedAt)}</div>
          </div>
          <div class="evidence-actions">
            <button class="evidence-action" type="button" data-action="view" title="Abrir arquivo" aria-label="Abrir ${helpers.escapeHtml(evidence.name)}">👁️</button>
            <button class="evidence-action danger" type="button" data-action="remove" title="Remover" aria-label="Remover ${helpers.escapeHtml(evidence.name)}">🗑️</button>
          </div>
        </div>
      `;
    })
    .join('');
}

export async function removeEvidence(evidenceId, requestId, helpers) {
  const request = helpers.findRequestById(requestId);
  if (!request || !request.evidence) return;
  const evidence = request.evidence.find((e) => e.id === evidenceId);
  if (!evidence) return;
  if (!helpers.confirm(`Tem certeza que deseja remover a evidência "${evidence.name}"?`)) return;

  try {
    await deleteEvidence(helpers.session?.token, requestId, evidenceId);
  } catch (error) {
    helpers.showErrorNotification('Erro ao remover', error?.message || 'Não foi possível remover a evidência.', 5000);
    return;
  }
  request.evidence = request.evidence.filter((item) => item.id !== evidenceId);

  helpers.saveState();
  const gallery = document.getElementById(`evidenceGallery-${requestId}`);
  renderEvidenceGallery(request.evidence, gallery, requestId, helpers);
  helpers.showWarningNotification('Evidência removida', `O arquivo "${evidence.name}" foi removido`, 3000);
}

export async function viewEvidence(evidenceId, helpers) {
  const request = helpers.findRequestByEvidenceId(evidenceId);
  if (!request) return;
  const evidence = request.evidence.find((e) => e.id === evidenceId);
  if (!evidence) return;
  try {
    const { downloadUrl } = await getEvidenceDownloadUrl(helpers.session?.token, request.id, evidenceId);
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    helpers.showErrorNotification('Erro ao abrir arquivo', error?.message || 'Não foi possível gerar o link de acesso.', 5000);
  }
}
