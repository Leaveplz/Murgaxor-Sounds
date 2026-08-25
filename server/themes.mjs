import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const defaultThemes = [
  { id: 'battle', name: 'Битва', image: 'battle.webp' },
  { id: 'boss', name: 'Эпическая битва', image: 'epic-battle.webp' },
  { id: 'tavern', name: 'Таверна', image: 'tavern.webp' },
  { id: 'dungeon', name: 'Подземелье', image: 'dungeon.webp' },
  { id: 'mystery', name: 'Мрачная', image: 'dark.webp' },
  { id: 'town', name: 'Город', image: 'city.webp' },
  { id: 'journey', name: 'Путешествие', image: 'journey.webp' },
  { id: 'ocean', name: 'Океан', image: 'ocean.webp' },
  { id: 'festival', name: 'Фестиваль', image: 'festival.webp' }
];

const defaultThemeIds = new Set(defaultThemes.map((theme) => theme.id));

export async function loadCustomThemes(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    const themes = JSON.parse(await fs.readFile(filePath, 'utf8'));
    return Array.isArray(themes) ? themes.filter((theme) => theme?.id && theme?.name) : [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.writeFile(filePath, '[]', 'utf8');
    return [];
  }
}

export async function saveCustomThemes(filePath, themes) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(themes, null, 2), 'utf8');
}

export async function loadThemes(filePath) {
  const custom = await loadCustomThemes(filePath);
  const customById = new Map(custom.map((theme) => [theme.id, theme]));
  const mergedDefaults = defaultThemes.map((theme) => ({
    ...theme,
    ...(customById.get(theme.id) || {})
  }));
  return [...mergedDefaults, ...custom.filter((theme) => !defaultThemeIds.has(theme.id))];
}

export async function createTheme(filePath, { name, image } = {}) {
  const cleanName = String(name || '').trim().slice(0, 60);
  if (!cleanName) throw new Error('Укажи название темы.');

  const custom = await loadCustomThemes(filePath);
  const usedIds = new Set([...defaultThemes, ...custom].map((theme) => theme.id));
  let id = slugify(cleanName);
  if (!id || defaultThemeIds.has(id)) id = `theme-${crypto.randomUUID().slice(0, 8)}`;
  while (usedIds.has(id)) id = `${id}-${crypto.randomUUID().slice(0, 4)}`;

  const theme = {
    id,
    name: cleanName,
    image: String(image || 'journey.webp').trim() || 'journey.webp',
    tracks: [],
    createdAt: new Date().toISOString()
  };
  custom.push(theme);
  await saveCustomThemes(filePath, custom);
  return theme;
}

export async function updateTheme(filePath, themeId, { name, image, tracks } = {}) {
  const allThemes = await loadThemes(filePath);
  const existing = allThemes.find((theme) => theme.id === themeId);
  if (!existing) throw new Error('Тема не найдена.');

  const cleanName = String(name || existing.name).trim().slice(0, 60);
  if (!cleanName) throw new Error('Укажи название темы.');

  const custom = await loadCustomThemes(filePath);
  const index = custom.findIndex((theme) => theme.id === themeId);
  const current = index >= 0 ? custom[index] : existing;
  const next = {
    ...current,
    id: themeId,
    name: cleanName,
    image: String(image || existing.image || 'journey.webp').trim() || 'journey.webp',
    tracks: Array.isArray(tracks)
      ? tracks.map((track) => String(track)).filter(Boolean).slice(0, 200)
      : (Array.isArray(current.tracks) ? current.tracks : []),
    updatedAt: new Date().toISOString()
  };

  if (index >= 0) custom[index] = next;
  else custom.push(next);
  await saveCustomThemes(filePath, custom);
  return next;
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
