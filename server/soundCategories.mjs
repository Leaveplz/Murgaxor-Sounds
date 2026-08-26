import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export async function loadCustomSoundCategories(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    const categories = JSON.parse((await fs.readFile(filePath, 'utf8')).replace(/^\uFEFF/, ''));
    return Array.isArray(categories) ? categories.filter((item) => item?.id) : [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.writeFile(filePath, '[]', 'utf8');
    return [];
  }
}

export async function saveCustomSoundCategories(filePath, categories) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(categories, null, 2), 'utf8');
}

export async function loadSoundCategories(filePath, builtInCategories) {
  const custom = await loadCustomSoundCategories(filePath);
  const builtInIds = new Set(builtInCategories.map((item) => item.id));
  const customById = new Map(custom.map((item) => [item.id, item]));
  return [
    ...builtInCategories
      .map((item) => ({ ...item, ...(customById.get(item.id) || {}), builtIn: true }))
      .filter((item) => !item.deleted),
    ...custom
      .filter((item) => !builtInIds.has(item.id) && !item.deleted && item.name)
      .map((item) => ({ ...item, builtIn: false }))
  ];
}

export async function createSoundCategory(filePath, builtInCategories, { name, image } = {}) {
  const cleanName = String(name || '').trim().slice(0, 50);
  if (!cleanName) throw new Error('Укажи название категории.');

  const custom = await loadCustomSoundCategories(filePath);
  const usedIds = new Set([...builtInCategories, ...custom].map((item) => item.id));
  let id = slugify(cleanName);
  if (!id || usedIds.has(id)) id = `sound-${crypto.randomUUID().slice(0, 8)}`;
  while (usedIds.has(id)) id = `${id}-${crypto.randomUUID().slice(0, 4)}`;

  const category = {
    id,
    name: cleanName,
    image: String(image || 'situations.jpg').trim() || 'situations.jpg',
    createdAt: new Date().toISOString()
  };
  custom.push(category);
  await saveCustomSoundCategories(filePath, custom);
  return { ...category, builtIn: false };
}

export async function updateSoundCategory(filePath, builtInCategories, categoryId, { name, image } = {}) {
  const custom = await loadCustomSoundCategories(filePath);
  const builtIn = builtInCategories.find((item) => item.id === categoryId);
  const index = custom.findIndex((item) => item.id === categoryId);
  const current = index >= 0 ? custom[index] : builtIn;
  if (!current || current.deleted) {
    const error = new Error('Категория не найдена.');
    error.status = 404;
    throw error;
  }

  const cleanName = String(name || current.name).trim().slice(0, 50);
  if (!cleanName) throw new Error('Укажи название категории.');

  const next = {
    ...current,
    id: categoryId,
    name: cleanName,
    image: String(image || current.image || 'situations.jpg').trim() || 'situations.jpg',
    updatedAt: new Date().toISOString()
  };

  if (index >= 0) custom[index] = next;
  else custom.push(next);
  await saveCustomSoundCategories(filePath, custom);
  return { ...next, builtIn: Boolean(builtIn) };
}

export async function deleteSoundCategory(filePath, builtInCategories, categoryId) {
  const custom = await loadCustomSoundCategories(filePath);
  const builtIn = builtInCategories.find((item) => item.id === categoryId);
  const index = custom.findIndex((item) => item.id === categoryId);
  if (!builtIn && index === -1) {
    const error = new Error('Категория не найдена.');
    error.status = 404;
    throw error;
  }

  let next;
  if (builtIn) {
    const deleted = {
      ...(index >= 0 ? custom[index] : builtIn),
      id: categoryId,
      deleted: true,
      deletedAt: new Date().toISOString()
    };
    next = [...custom];
    if (index >= 0) next[index] = deleted;
    else next.push(deleted);
  } else {
    next = custom.filter((item) => item.id !== categoryId);
  }

  await saveCustomSoundCategories(filePath, next);
  return { ok: true, id: categoryId };
}

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 42);
}
