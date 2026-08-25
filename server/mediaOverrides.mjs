import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadOverrides(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.writeFile(filePath, '{}', 'utf8');
    return {};
  }
}

export async function saveOverrides(filePath, overrides) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(overrides, null, 2), 'utf8');
}

export function applyOverrides(media, overrides) {
  return media
    .filter((item) => !overrides[item.id]?.deleted)
    .map((item) => {
      const override = overrides[item.id];
      if (!override) return item;
      return {
        ...item,
        ...override,
        id: item.id,
        originalSource: item.source,
        originalFile: item.file
      };
    });
}
