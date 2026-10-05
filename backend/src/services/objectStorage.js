import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const MAX_EVIDENCE_COUNT = 10;
export const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_EVIDENCE_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

let client;

function storageConfig() {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID,
    bucket: process.env.R2_BUCKET_NAME,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  };
  if (Object.values(config).some((value) => !value)) {
    throw new Error('Armazenamento de evidências não configurado');
  }
  return config;
}

function storageClient() {
  const config = storageConfig();
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }
  return { client, bucket: config.bucket };
}

export function validateEvidenceFile({ name, size, type }) {
  if (!name || typeof name !== 'string' || name.length > 180) return 'Nome de arquivo inválido';
  if (!Number.isInteger(size) || size < 1 || size > MAX_EVIDENCE_SIZE) return 'O arquivo deve ter no máximo 10 MB';
  if (!ALLOWED_EVIDENCE_TYPES.has(type)) return 'Formato não permitido. Envie JPG, PNG ou PDF';
  return null;
}

export function evidenceKey(requestId, evidenceId, name) {
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase().replace(/[^.a-z0-9]/g, '') : '';
  return `requests/${requestId}/${evidenceId}${extension}`;
}

export async function createEvidenceUpload({ requestId, name, size, type }) {
  const id = `evidence-${randomUUID()}`;
  const key = evidenceKey(requestId, id, name);
  const { client: s3, bucket } = storageClient();
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: type }), { expiresIn: 600 });
  return { id, key, name, size, type, uploadUrl, expiresIn: 600 };
}

export async function verifyEvidenceObject({ key, size, type }) {
  const { client: s3, bucket } = storageClient();
  const result = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return Number(result.ContentLength) === size && result.ContentType === type;
}

export async function createEvidenceDownloadUrl(key) {
  const { client: s3, bucket } = storageClient();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 300 });
}

export async function deleteEvidenceObject(key) {
  const { client: s3, bucket } = storageClient();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
