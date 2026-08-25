import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_PLAYLISTS = [
  {
    id: 'default-tavern',
    name: 'Таверна перед дорогой',
    tracks: [],
    createdAt: new Date().toISOString()
  }
];

export async function ensurePlaylistFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(DEFAULT_PLAYLISTS, null, 2), 'utf8');
  }
}

export async function loadPlaylists(filePath) {
  await ensurePlaylistFile(filePath);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function savePlaylists(filePath, playlists) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(playlists, null, 2), 'utf8');
}

export function makePlaylist(name) {
  return {
    id: crypto.randomUUID(),
    name: String(name || 'Новый плейлист').slice(0, 80),
    tracks: [],
    createdAt: new Date().toISOString()
  };
}
