import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export async function loadUploads(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    return JSON.parse((await fs.readFile(filePath, 'utf8')).replace(/^\uFEFF/, ''));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.writeFile(filePath, '[]', 'utf8');
    return [];
  }
}

export async function saveUploads(filePath, uploads) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(uploads, null, 2), 'utf8');
}

export function uploadToMedia(entry) {
  const sectionIds = normalizeSectionIds(entry.sectionIds, entry.sectionId || 'effects');
  return {
    id: entry.id,
    file: entry.file,
    title: entry.title,
    originalTitle: entry.originalFileName,
    type: entry.type,
    source: 'upload',
    sectionId: sectionIds[0] || 'effects',
    sectionName: entry.sectionName || 'Эффекты',
    sectionIds,
    themeId: entry.themeId || null,
    image: entry.image || null,
    bytes: entry.bytes || 0,
    uploadedAt: entry.uploadedAt
  };
}

function normalizeSectionIds(value, fallback) {
  if (Array.isArray(value)) {
    const ids = value.map((item) => String(item).trim()).filter(Boolean);
    return [...new Set(ids)].slice(0, 20);
  }
  const text = String(value || '').trim();
  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return normalizeSectionIds(parsed, fallback);
    } catch {}
  }
  return fallback ? [fallback] : [];
}

export function parseMultipart(body, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) throw new Error('Multipart boundary was not found.');

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const parts = [];
  let cursor = body.indexOf(boundary);

  while (cursor !== -1) {
    cursor += boundary.length;
    if (body[cursor] === 45 && body[cursor + 1] === 45) break;
    if (body[cursor] === 13 && body[cursor + 1] === 10) cursor += 2;

    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), cursor);
    if (headerEnd === -1) break;

    const headerText = body.slice(cursor, headerEnd).toString('utf8');
    let next = body.indexOf(boundary, headerEnd + 4);
    if (next === -1) break;

    let content = body.slice(headerEnd + 4, next);
    if (content.length >= 2 && content.at(-2) === 13 && content.at(-1) === 10) {
      content = content.slice(0, -2);
    }

    const disposition = headerText.match(/content-disposition:\s*form-data;([^\r\n]+)/i)?.[1] || '';
    const name = disposition.match(/name="([^"]+)"/i)?.[1];
    const filename = disposition.match(/filename="([^"]*)"/i)?.[1];
    const type = headerText.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || '';
    if (name) parts.push({ name, filename, type, content });

    cursor = next;
  }

  return parts;
}

export function partsToForm(parts) {
  const fields = {};
  let file = null;

  for (const part of parts) {
    if (part.filename !== undefined) {
      if (part.filename) file = part;
      continue;
    }
    fields[part.name] = part.content.toString('utf8');
  }

  return { fields, file };
}

export function safeAudioFileName(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (!AUDIO_EXTENSIONS.has(ext)) throw new Error('Можно загружать только аудиофайлы mp3, wav, ogg, flac, m4a или aac.');

  const base = path
    .basename(originalName, ext)
    .normalize('NFKD')
    .replace(/[^\w\s.-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 80) || 'audio';

  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${base}${ext}`;
}

export function safeImageFileName(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) throw new Error('Можно загружать только картинки jpg, png или webp.');

  const base = path
    .basename(originalName, ext)
    .normalize('NFKD')
    .replace(/[^\w\s.-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 80) || 'cover';

  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${base}${ext}`;
}
