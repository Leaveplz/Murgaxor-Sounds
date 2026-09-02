import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeUploadedMedia, readArchive, resolveMediaPath, sectionDefinitions, splitMedia } from './library.mjs';
import { applyOverrides, loadOverrides, saveOverrides } from './mediaOverrides.mjs';
import { loadPlaylists, makePlaylist, savePlaylists } from './playlists.mjs';
import { createSoundCategory, deleteSoundCategory, loadSoundCategories, updateSoundCategory } from './soundCategories.mjs';
import { createTheme, deleteTheme, loadThemes, updateTheme } from './themes.mjs';
import { loadUploads, parseMultipart, partsToForm, safeAudioFileName, safeImageFileName, saveUploads, uploadToMedia } from './uploads.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

loadEnv(path.join(rootDir, '.env'));

const publicDir = path.join(rootDir, 'public');
const referenceDir = path.join(rootDir, 'DragonSound - Музыка и звуки для настольных игр _ Атмосфера для D&D_files');
const audioDir = path.resolve(rootDir, process.env.AUDIO_DIR || 'dnd music archive');
const uploadsDir = path.join(rootDir, 'uploads');
const playlistsFile = path.join(rootDir, 'data', 'playlists.json');
const uploadsFile = path.join(rootDir, 'data', 'uploads.json');
const overridesFile = path.join(rootDir, 'data', 'media-overrides.json');
const themesFile = path.join(rootDir, 'data', 'themes.json');
const soundCategoriesFile = path.join(rootDir, 'data', 'sound-categories.json');
const port = Number(process.env.PORT || 3040);
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

let libraryCache = [];
let libraryReadAt = 0;
let bot = null;
let botError = null;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);
    const pathname = decodeURIComponent(url.pathname);

    if (req.method === 'GET' && pathname === '/api/health') {
      return json(res, { ok: true, audioDir, uploadsDir, discord: botStatus() });
    }

    if (req.method === 'GET' && pathname === '/api/library') {
      const media = await getLibrary();
      const split = splitMedia(media);
      const sections = await soundCategories();
      return json(res, {
        ...split,
        sections,
        totals: {
          sounds: split.sounds.length,
          music: split.music.length
        }
      });
    }

    if (req.method === 'GET' && pathname === '/api/assets/images') {
      return json(res, { images: await listReferenceImages() });
    }

    if (req.method === 'GET' && pathname === '/api/themes') {
      return json(res, { themes: await loadThemes(themesFile) });
    }

    if (req.method === 'GET' && pathname === '/api/sound-categories') {
      return json(res, { categories: await soundCategories() });
    }

    if (req.method === 'GET' && pathname === '/api/sounds') {
      const split = splitMedia(await getLibrary());
      const categories = [...new Set(split.sounds.map((sound) => sound.sectionName))].sort((a, b) => a.localeCompare(b, 'ru'));
      return json(res, { sounds: split.sounds, music: split.music, categories });
    }

    if (req.method === 'GET' && pathname.startsWith('/audio/')) {
      return streamAudio(req, res, pathname.slice('/audio/'.length));
    }

    if (req.method === 'GET' && pathname === '/api/playlists') {
      return json(res, await loadPlaylists(playlistsFile));
    }

    if (req.method === 'POST' && pathname === '/api/admin/login') {
      const body = await readJson(req);
      return json(res, { ok: String(body?.password || '') === adminPassword });
    }

    if (req.method === 'GET' && pathname === '/api/admin/uploads') {
      assertAdmin(req);
      return json(res, await loadUploads(uploadsFile));
    }

    if (req.method === 'POST' && pathname === '/api/admin/themes') {
      assertAdmin(req);
      const body = await readJson(req);
      const theme = await createTheme(themesFile, body);
      return json(res, theme, 201);
    }

    if (req.method === 'POST' && pathname === '/api/admin/sound-categories') {
      assertAdmin(req);
      const body = await readJson(req);
      const category = await createSoundCategory(soundCategoriesFile, sectionDefinitions(), body);
      return json(res, category, 201);
    }

    const adminSoundCategoryMatch = pathname.match(/^\/api\/admin\/sound-categories\/([^/]+)$/);
    if (adminSoundCategoryMatch && req.method === 'PUT') {
      assertAdmin(req);
      const body = await readJson(req);
      const category = await updateSoundCategory(soundCategoriesFile, sectionDefinitions(), adminSoundCategoryMatch[1], body);
      invalidateLibrary();
      return json(res, category);
    }

    if (adminSoundCategoryMatch && req.method === 'DELETE') {
      assertAdmin(req);
      const result = await deleteSoundCategory(soundCategoriesFile, sectionDefinitions(), adminSoundCategoryMatch[1]);
      invalidateLibrary();
      return json(res, result);
    }

    const adminThemeMatch = pathname.match(/^\/api\/admin\/themes\/([^/]+)$/);
    if (adminThemeMatch && req.method === 'PUT') {
      assertAdmin(req);
      const body = await readJson(req);
      const theme = await updateTheme(themesFile, adminThemeMatch[1], body);
      return json(res, theme);
    }

    if (adminThemeMatch && req.method === 'DELETE') {
      assertAdmin(req);
      const result = await deleteTheme(themesFile, adminThemeMatch[1]);
      return json(res, result);
    }

    if (req.method === 'POST' && pathname === '/api/admin/assets/images') {
      assertAdmin(req);
      const body = await readBuffer(req, 30 * 1024 * 1024);
      const { file } = partsToForm(parseMultipart(body, req.headers['content-type'] || ''));
      if (!file) return json(res, { error: 'Картинка не была передана.' }, 400);

      const fileName = safeImageFileName(file.filename);
      const targetDir = path.join(uploadsDir, 'images');
      await fsp.mkdir(targetDir, { recursive: true });
      await fsp.writeFile(path.join(targetDir, fileName), file.content);
      const name = `uploads/images/${fileName}`;
      return json(res, {
        name,
        label: path.basename(fileName, path.extname(fileName)).replace(/^\d+-[a-f0-9]+-/i, '').replace(/[-_]+/g, ' '),
        url: `/uploads/images/${encodeURIComponent(fileName)}`
      }, 201);
    }

    if (req.method === 'POST' && pathname === '/api/admin/upload') {
      assertAdmin(req);
      const body = await readBuffer(req, 250 * 1024 * 1024);
      const { fields, file } = partsToForm(parseMultipart(body, req.headers['content-type'] || ''));
      if (!file) return json(res, { error: 'Файл не был передан.' }, 400);

      const type = fields.type === 'music' ? 'music' : 'sound';
      const fileName = safeAudioFileName(file.filename);
      const subdir = type === 'music' ? 'music' : 'sounds';
      const targetDir = path.join(uploadsDir, subdir);
      await fsp.mkdir(targetDir, { recursive: true });
      await fsp.writeFile(path.join(targetDir, fileName), file.content);

      const uploads = await loadUploads(uploadsFile);
      const selectedSectionIds = parseSectionIds(fields.sectionIds, fields.sectionId || 'effects');
      const primarySection = await sectionForId(selectedSectionIds[0] || 'effects');
      const entry = {
        id: Buffer.from(`upload:${subdir}/${fileName}`, 'utf8').toString('base64url'),
        file: `${subdir}/${fileName}`,
        originalFileName: file.filename,
        title: String(fields.title || path.basename(file.filename, path.extname(file.filename))).slice(0, 120),
        type,
        sectionId: type === 'sound' ? primarySection.id : 'music',
        sectionName: type === 'sound' ? primarySection.name : 'Музыка',
        sectionIds: type === 'sound' ? selectedSectionIds : [],
        themeId: type === 'music' ? (fields.themeId || 'journey') : null,
        image: fields.image || null,
        bytes: file.content.length,
        uploadedAt: new Date().toISOString()
      };
      uploads.push(entry);
      await saveUploads(uploadsFile, uploads);
      invalidateLibrary();
      return json(res, uploadToMedia(entry), 201);
    }

    const adminMediaMatch = pathname.match(/^\/api\/admin\/media\/([^/]+)$/);
    if (adminMediaMatch && req.method === 'PUT') {
      assertAdmin(req);
      const body = await readBuffer(req, 250 * 1024 * 1024);
      const { fields, file } = partsToForm(parseMultipart(body, req.headers['content-type'] || ''));
      const mediaId = adminMediaMatch[1];
      const current = (await getLibrary()).find((item) => item.id === mediaId);
      if (!current) return json(res, { error: 'Элемент медиатеки не найден.' }, 404);

      const type = fields.type === 'music' ? 'music' : 'sound';
      const selectedSectionIds = parseSectionIds(fields.sectionIds, fields.sectionId || current.sectionId || 'effects');
      const primarySection = await sectionForId(selectedSectionIds[0] || 'effects');
      const selected = {
        title: String(fields.title || current.title).slice(0, 120),
        type,
        sectionId: type === 'sound' ? primarySection.id : 'music',
        sectionName: type === 'sound' ? primarySection.name : 'Музыка',
        sectionIds: type === 'sound' ? selectedSectionIds : [],
        themeId: type === 'music' ? (fields.themeId || current.themeId || 'journey') : null,
        image: fields.image || current.image || null,
        editedAt: new Date().toISOString()
      };

      if (file) {
        const fileName = safeAudioFileName(file.filename);
        const targetDir = path.join(uploadsDir, 'replacements');
        await fsp.mkdir(targetDir, { recursive: true });
        await fsp.writeFile(path.join(targetDir, fileName), file.content);
        selected.source = 'upload';
        selected.file = `replacements/${fileName}`;
        selected.originalTitle = file.filename;
        selected.bytes = file.content.length;
      }

      const overrides = await loadOverrides(overridesFile);
      overrides[mediaId] = {
        ...(overrides[mediaId] || {}),
        ...selected
      };
      await saveOverrides(overridesFile, overrides);
      invalidateLibrary();

      const updated = (await getLibrary()).find((item) => item.id === mediaId);
      return json(res, updated);
    }

    if (adminMediaMatch && req.method === 'DELETE') {
      assertAdmin(req);
      const mediaId = adminMediaMatch[1];
      const current = (await getLibrary()).find((item) => item.id === mediaId);
      if (!current) return json(res, { error: 'Элемент медиатеки не найден.' }, 404);

      const overrides = await loadOverrides(overridesFile);
      overrides[mediaId] = {
        ...(overrides[mediaId] || {}),
        deleted: true,
        deletedAt: new Date().toISOString()
      };
      await saveOverrides(overridesFile, overrides);

      const playlists = await loadPlaylists(playlistsFile);
      const nextPlaylists = playlists.map((playlist) => ({
        ...playlist,
        tracks: playlist.tracks.filter((track) => track.id !== mediaId)
      }));
      await savePlaylists(playlistsFile, nextPlaylists);

      invalidateLibrary();
      return json(res, { ok: true });
    }

    if (req.method === 'POST' && pathname === '/api/playlists') {
      const body = await readJson(req);
      const playlists = await loadPlaylists(playlistsFile);
      const playlist = makePlaylist(body?.name);
      playlists.push(playlist);
      await savePlaylists(playlistsFile, playlists);
      return json(res, playlist, 201);
    }

    const playlistMatch = pathname.match(/^\/api\/playlists\/([^/]+)$/);
    if (playlistMatch && req.method === 'PUT') {
      const body = await readJson(req);
      const playlists = await loadPlaylists(playlistsFile);
      const index = playlists.findIndex((playlist) => playlist.id === playlistMatch[1]);
      if (index === -1) return empty(res, 404);

      playlists[index] = {
        ...playlists[index],
        name: String(body?.name || playlists[index].name).slice(0, 80),
        tracks: Array.isArray(body?.tracks) ? body.tracks.slice(0, 200) : playlists[index].tracks,
        updatedAt: new Date().toISOString()
      };

      await savePlaylists(playlistsFile, playlists);
      return json(res, playlists[index]);
    }

    if (playlistMatch && req.method === 'DELETE') {
      const playlists = await loadPlaylists(playlistsFile);
      await savePlaylists(playlistsFile, playlists.filter((playlist) => playlist.id !== playlistMatch[1]));
      return json(res, { ok: true });
    }

    if (req.method === 'GET' && pathname === '/api/discord/status') {
      return json(res, botStatus());
    }

    if (req.method === 'POST' && pathname === '/api/discord/connect') {
      const body = await readJson(req);
      const activeBot = await ensureBot();
      return json(res, await activeBot.connect({
        guildId: body?.guildId,
        voiceChannelId: body?.voiceChannelId
      }));
    }

    if (req.method === 'POST' && pathname === '/api/discord/play-local') {
      const body = await readJson(req);
      const resolved = resolveMediaPath({ archive: audioDir, uploads: uploadsDir }, await getLibrary(), body?.id);
      if (!resolved) return json(res, { error: 'Sound was not found.' }, 404);
      const activeBot = await ensureBot();
      return json(res, await activeBot.playLocal(resolved.path, resolved.item.title, body?.volume));
    }

    if (req.method === 'POST' && pathname === '/api/discord/play-url') {
      const body = await readJson(req);
      const activeBot = await ensureBot();
      return json(res, await activeBot.playUrl(String(body?.url || ''), String(body?.title || 'Внешняя ссылка'), body?.volume));
    }

    if (req.method === 'POST' && pathname === '/api/discord/mix') {
      const body = await readJson(req);
      const media = await getLibrary();
      const tracks = Array.isArray(body?.tracks) ? body.tracks : [];
      const resolvedTracks = tracks.map((track) => {
        if ((track.type === 'youtube' || track.type === 'url') && track.url) {
          return {
            type: track.type,
            url: String(track.url),
            title: String(track.title || 'YouTube URL'),
            volume: track.volume,
            loop: false,
            seek: track.seek,
            fadeIn: track.fadeIn,
            fadeOut: track.fadeOut
          };
        }
        const resolved = resolveMediaPath({ archive: audioDir, uploads: uploadsDir }, media, track.id);
        if (!resolved) return null;
        return {
          type: 'local',
          filePath: resolved.path,
          title: resolved.item.title,
          volume: track.volume,
          loop: track.loop,
          seek: track.seek,
          fadeIn: track.fadeIn,
          fadeOut: track.fadeOut
        };
      }).filter(Boolean);

      const activeBot = await ensureBot();
      return json(res, await activeBot.playMix(resolvedTracks));
    }

    if (req.method === 'POST' && pathname === '/api/discord/stop') {
      if (!bot) return json(res, botStatus());
      return json(res, bot.stop());
    }

    if (req.method === 'POST' && pathname === '/api/discord/disconnect') {
      if (!bot) return json(res, botStatus());
      return json(res, bot.disconnect());
    }

    if (req.method === 'GET' && pathname.startsWith('/reference-assets/')) {
      return serveFile(res, referenceDir, pathname.slice('/reference-assets/'.length));
    }

    if (req.method === 'GET' && pathname.startsWith('/uploads/')) {
      return serveFile(res, uploadsDir, pathname.slice('/uploads/'.length));
    }

    if (req.method === 'GET') {
      return serveFile(res, publicDir, pathname === '/' ? 'index.html' : pathname.slice(1));
    }

    empty(res, 405);
  } catch (error) {
    console.error(error);
    json(res, { error: error.message || String(error) }, error.status || 500);
  }
});

server.listen(port, async () => {
  await getLibrary();
  if (process.env.DISCORD_TOKEN) {
    ensureBot().catch((error) => {
      botError = error.message;
      console.error('[discord]', error.message);
    });
  }
  console.log(`Murgaxor Sounds is running on http://localhost:${port}`);
  const split = splitMedia(libraryCache);
  console.log(`Loaded ${split.sounds.length} sounds and ${split.music.length} music tracks`);
});

async function getLibrary() {
  if (Date.now() - libraryReadAt > 15_000 || libraryCache.length === 0) {
    const archive = await readArchive(audioDir);
    const uploads = (await loadUploads(uploadsFile)).map(uploadToMedia);
    const overrides = await loadOverrides(overridesFile);
    libraryCache = applyOverrides(mergeUploadedMedia(archive, uploads), overrides);
    libraryReadAt = Date.now();
  }
  return libraryCache;
}

async function soundCategories() {
  return loadSoundCategories(soundCategoriesFile, sectionDefinitions());
}

async function sectionForId(sectionId) {
  const sections = await soundCategories();
  return sections.find((section) => section.id === sectionId) || sections.find((section) => section.id === 'effects') || { id: 'effects', name: 'Эффекты', image: 'situations.jpg' };
}

function parseSectionIds(rawValue, fallback = 'effects') {
  const raw = String(rawValue || '').trim();
  let values = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) values = parsed;
    } catch {
      values = raw.split(',');
    }
  }
  if (!values.length && fallback) values = [fallback];
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))].slice(0, 20);
}

async function listReferenceImages() {
  const supported = new Set(['.jpg', '.jpeg', '.png', '.webp']);
  const entries = await fsp.readdir(referenceDir, { withFileTypes: true }).catch(() => []);
  const referenceImages = entries
    .filter((entry) => entry.isFile() && supported.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => {
      const ext = path.extname(entry.name);
      const label = path.basename(entry.name, ext).replace(/[-_]+/g, ' ');
      return {
        name: entry.name,
        label,
        url: `/reference-assets/${encodeURIComponent(entry.name)}`
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'));

  const uploadedEntries = await fsp.readdir(path.join(uploadsDir, 'images'), { withFileTypes: true }).catch(() => []);
  const uploadedImages = uploadedEntries
    .filter((entry) => entry.isFile() && supported.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => {
      const ext = path.extname(entry.name);
      const label = path.basename(entry.name, ext).replace(/^\d+-[a-f0-9]+-/i, '').replace(/[-_]+/g, ' ');
      return {
        name: `uploads/images/${entry.name}`,
        label: `Загружено: ${label}`,
        url: `/uploads/images/${encodeURIComponent(entry.name)}`
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'));

  return [...uploadedImages, ...referenceImages];
}

function invalidateLibrary() {
  libraryCache = [];
  libraryReadAt = 0;
}

function assertAdmin(req) {
  if (req.headers['x-admin-password'] !== adminPassword) {
    const error = new Error('Неверный пароль админа.');
    error.status = 401;
    throw error;
  }
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

async function ensureBot() {
  if (bot) return bot;
  if (!process.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is not configured in .env.');
  }
  if (/^[a-f0-9]{64}$/i.test(process.env.DISCORD_TOKEN.trim())) {
    throw new Error('В DISCORD_TOKEN сейчас похож Application Public Key. Нужен Bot Token из раздела Bot.');
  }

  try {
    const { DiscordSoundBot } = await import('./discordBot.mjs');
    bot = new DiscordSoundBot({
      token: process.env.DISCORD_TOKEN,
      guildId: process.env.DISCORD_GUILD_ID,
      voiceChannelId: process.env.DISCORD_VOICE_CHANNEL_ID
    });
    await bot.start();
    botError = null;
    return bot;
  } catch (error) {
    bot = null;
    const message = error.message || error.code || 'Discord отклонил токен бота';
    botError = `${message}. Проверь DISCORD_TOKEN в .env и перезапусти сервер.`;
    throw new Error(botError);
  }
}

function botStatus() {
  if (bot) return bot.status();
  return {
    configured: Boolean(process.env.DISCORD_TOKEN),
    ready: false,
    connected: false,
    guildId: process.env.DISCORD_GUILD_ID || '',
    voiceChannelId: process.env.DISCORD_VOICE_CHANNEL_ID || '',
    nowPlaying: null,
    lastError: botError
  };
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function readBuffer(req, limit = 10 * 1024 * 1024) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) throw new Error('Файл слишком большой.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function json(res, payload, status = 200) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function empty(res, status = 204) {
  res.writeHead(status);
  res.end();
}

async function streamAudio(req, res, id) {
  const resolved = resolveMediaPath({ archive: audioDir, uploads: uploadsDir }, await getLibrary(), id);
  if (!resolved) return empty(res, 404);

  const stat = await fsp.stat(resolved.path);
  const range = req.headers.range;
  const contentType = mimeType(resolved.path);

  if (!range) {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(resolved.path).pipe(res);
    return;
  }

  const [startText, endText] = range.replace(/bytes=/, '').split('-');
  const start = Number.parseInt(startText, 10);
  const end = endText ? Number.parseInt(endText, 10) : stat.size - 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': end - start + 1,
    'Content-Type': contentType
  });
  fs.createReadStream(resolved.path, { start, end }).pipe(res);
}

async function serveFile(res, baseDir, requestPath) {
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.resolve(baseDir, safePath);
  const root = path.resolve(baseDir);

  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) return empty(res, 403);

  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) return empty(res, 404);
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': mimeType(filePath)
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    empty(res, 404);
  }
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac'
  };
  return types[ext] || 'application/octet-stream';
}
