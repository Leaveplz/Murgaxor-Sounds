const defaultThemes = [
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

let themes = [...defaultThemes];

const fallbackSections = [
  { id: 'nature', name: 'Природа', image: 'nature.jpg' },
  { id: 'battle', name: 'Бой', image: 'battle.webp' },
  { id: 'town', name: 'Город', image: 'city.webp' },
  { id: 'dungeon', name: 'Подземелье', image: 'dungeon.webp' },
  { id: 'ambience', name: 'Эмбиенс', image: 'journey.webp' },
  { id: 'creatures', name: 'Существа', image: 'monsters.jpg' },
  { id: 'effects', name: 'Эффекты', image: 'situations.jpg' }
];

const state = {
  sounds: [],
  music: [],
  sections: fallbackSections,
  activeSounds: new Map(),
  musicAudio: new Audio(),
  currentMusic: null,
  currentExternalMusic: null,
  discordMusicStartedAt: 0,
  discordMusicOffset: 0,
  selectedTheme: localStorage.getItem('leaveplz-theme') || 'tavern',
  search: '',
  masterVolume: Number(localStorage.getItem('leaveplz-master-volume') || 0.8),
  musicVolume: Number(localStorage.getItem('leaveplz-music-volume') || 0.7),
  outputMode: localStorage.getItem('leaveplz-output-mode') || 'local',
  favoriteIds: new Set(JSON.parse(localStorage.getItem('leaveplz-favorites') || '[]')),
  collapsedSections: new Set(JSON.parse(localStorage.getItem('leaveplz-collapsed-sections') || '[]')),
  loopOverrides: JSON.parse(localStorage.getItem('leaveplz-loop-overrides') || '{}'),
  loopByDefault: true,
  playlistIndex: 0,
  previewImages: [],
  adminPassword: localStorage.getItem('leaveplz-admin-password') || ''
};

const $ = (selector) => document.querySelector(selector);

const elements = {
  themeGrid: $('#theme-grid'),
  backgroundList: $('#background-list'),
  selectedThemeLabel: $('#selected-theme-label'),
  soundsContainer: $('#sounds-container'),
  searchInput: $('#search-input'),
  activeCount: $('#active-count'),
  pauseAll: $('#pause-all'),
  stopAll: $('#stop-all'),
  saveSettings: $('#save-settings'),
  resetBackground: $('#reset-background'),
  masterVolume: $('#master-volume'),
  masterVolumeLabel: $('#master-volume-label'),
  musicVolume: $('#music-volume'),
  musicVolumeLabel: $('#music-volume-label'),
  nowPlayingTitle: $('#now-playing-title'),
  nowPlayingMeta: $('#now-playing-meta'),
  mainPlayToggle: $('#main-play-toggle'),
  playPlaylist: $('#play-playlist'),
  prevTrack: $('#prev-track'),
  nextTrack: $('#next-track'),
  shufflePlaylist: $('#shuffle-playlist'),
  repeatPlaylist: $('#repeat-playlist'),
  playlistCount: $('#playlist-count'),
  playlistTracks: $('#playlist-tracks'),
  externalPlayer: $('#external-player'),
  externalUrl: $('#external-url'),
  playExternal: $('#play-external'),
  discordLed: $('#discord-led'),
  discordStatus: $('#discord-status'),
  guildId: $('#guild-id'),
  voiceChannelId: $('#voice-channel-id'),
  discordConnect: $('#discord-connect'),
  discordMix: $('#discord-mix'),
  discordStop: $('#discord-stop'),
  discordDisconnect: $('#discord-disconnect'),
  audioOutputMode: $('#audio-output-mode'),
  outputModeLabel: $('#output-mode-label'),
  adminOpen: $('#admin-open'),
  adminDialog: $('#admin-dialog'),
  adminClose: $('#admin-close'),
  adminPassword: $('#admin-password'),
  adminLogin: $('#admin-login'),
  adminPasswordRow: $('#admin-password-row'),
  adminFields: $('#admin-upload-fields'),
  uploadFile: $('#upload-file'),
  uploadTitle: $('#upload-title'),
  uploadType: $('#upload-type'),
  uploadSection: $('#upload-section'),
  uploadSectionRow: $('#upload-section-row'),
  uploadTheme: $('#upload-theme'),
  uploadThemeRow: $('#upload-theme-row'),
  uploadImage: $('#upload-image'),
  uploadImagePreview: $('#upload-image-preview'),
  uploadCoverFile: $('#upload-cover-file'),
  uploadCoverButton: $('#upload-cover-button'),
  newThemeTitle: $('#new-theme-title'),
  newThemeImage: $('#new-theme-image'),
  newThemeImagePreview: $('#new-theme-image-preview'),
  newThemeCoverFile: $('#new-theme-cover-file'),
  newThemeCoverUpload: $('#new-theme-cover-upload'),
  adminCreateTheme: $('#admin-create-theme'),
  adminUpload: $('#admin-upload'),
  adminTabs: document.querySelectorAll('[data-admin-tab]'),
  adminUploadTab: $('#admin-upload-tab'),
  adminEditTab: $('#admin-edit-tab'),
  adminMediaSearch: $('#admin-media-search'),
  adminMediaSelect: $('#admin-media-select'),
  editTitle: $('#edit-title'),
  editType: $('#edit-type'),
  editSection: $('#edit-section'),
  editSectionRow: $('#edit-section-row'),
  editTheme: $('#edit-theme'),
  editThemeRow: $('#edit-theme-row'),
  editImage: $('#edit-image'),
  editImagePreview: $('#edit-image-preview'),
  editCoverFile: $('#edit-cover-file'),
  editCoverButton: $('#edit-cover-button'),
  editFile: $('#edit-file'),
  editCurrentFile: $('#edit-current-file'),
  adminSaveMedia: $('#admin-save-media'),
  adminDeleteMedia: $('#admin-delete-media'),
  adminThemesTab: $('#admin-themes-tab'),
  themeEditSelect: $('#theme-edit-select'),
  themeEditTitle: $('#theme-edit-title'),
  themeEditImage: $('#theme-edit-image'),
  themeEditImagePreview: $('#theme-edit-image-preview'),
  themeEditCoverFile: $('#theme-edit-cover-file'),
  themeEditCoverButton: $('#theme-edit-cover-button'),
  themeMusicSearch: $('#theme-music-search'),
  themeMusicSource: $('#theme-music-source'),
  themePlaylistTracks: $('#theme-playlist-tracks'),
  themeTrackAdd: $('#theme-track-add'),
  themeTrackRemove: $('#theme-track-remove'),
  themeTrackUp: $('#theme-track-up'),
  themeTrackDown: $('#theme-track-down'),
  adminSaveTheme: $('#admin-save-theme'),
  adminStatus: $('#admin-status'),
  toast: $('#toast')
};

state.musicAudio.addEventListener('ended', () => playMusicFrom(state.playlistIndex + 1).catch((error) => showToast(error.message)));

let discordMixTimer = null;
const durationCache = new Map();

async function api(path, options = {}) {
  const headers = options.body instanceof FormData ? { ...(options.headers || {}) } : { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response.json();
}

function asset(name) {
  if (!name) return '/reference-assets/situations.jpg';
  if (name.startsWith('/')) return name;
  if (name.startsWith('uploads/')) return `/${name}`;
  return `/reference-assets/${name}`;
}

function cssImage(name) {
  return `url('${asset(name).replaceAll("'", "%27")}')`;
}

function theme() {
  return themes.find((item) => item.id === state.selectedTheme) || themes.find((item) => item.id === 'tavern') || themes[0] || defaultThemes[2];
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/_/g, ' ');
}

function textFor(item) {
  return normalize(`${item.title} ${item.originalTitle || ''} ${item.sectionName || ''} ${item.file || ''}`);
}

function visibleSounds() {
  const query = normalize(state.search);
  return state.sounds.filter((sound) => !query || textFor(sound).includes(query));
}

function themeMusic() {
  const currentTheme = theme();
  if (Array.isArray(currentTheme.tracks) && currentTheme.tracks.length) {
    const byId = new Map(state.music.map((track) => [track.id, track]));
    return currentTheme.tracks.map((id) => byId.get(id)).filter(Boolean);
  }
  const exact = state.music.filter((track) => track.themeId === state.selectedTheme);
  if (exact.length) return exact;
  return state.music.filter((track) => track.themeId === 'journey').slice(0, 99);
}

function currentTracks() {
  return themeMusic().slice(0, 99).map((track) => ({ type: 'local', id: track.id, title: track.title, themeId: track.themeId, candidate: true }));
}

function renderThemes() {
  elements.themeGrid.innerHTML = themes.map((item) => `
    <button class="theme-card ${item.id === state.selectedTheme ? 'active' : ''}" type="button" data-theme="${item.id}" style="--image: ${cssImage(item.image)}">
      <span>${escapeHtml(item.name)}</span>
    </button>
  `).join('');

  elements.backgroundList.innerHTML = themes.map((item) => `
    <button class="bg-option ${item.id === state.selectedTheme ? 'active' : ''}" type="button" data-theme="${item.id}" style="--image: ${cssImage(item.image)}" title="${escapeHtml(item.name)}" aria-label="${escapeHtml(item.name)}"></button>
  `).join('');
}

function applyTheme() {
  const current = theme();
  document.body.style.setProperty('--active-bg', cssImage(current.image));
  elements.selectedThemeLabel.textContent = current.name;
  localStorage.setItem('leaveplz-theme', current.id);
  renderThemes();
  renderPlaylist();
  updateNowPlaying();
}

function renderSounds() {
  const grouped = new Map();
  for (const section of state.sections) grouped.set(section.id, { section, sounds: [] });

  for (const sound of visibleSounds()) {
    const id = sound.sectionId || 'effects';
    if (!grouped.has(id)) grouped.set(id, { section: { id, name: sound.sectionName || 'Эффекты', image: sound.image || 'situations.jpg' }, sounds: [] });
    grouped.get(id).sounds.push(sound);
  }

  elements.soundsContainer.innerHTML = [...grouped.values()]
    .filter((group) => group.sounds.length)
    .map(({ section, sounds }) => renderSection(section, sounds))
    .join('') || '<div class="empty">Ничего не найдено</div>';

  renderActiveState();
}

function renderSection(section, sounds) {
  const collapsed = state.collapsedSections.has(section.id);
  return `
    <article class="sound-section" data-section="${section.id}">
      <button class="section-title" type="button" data-section-toggle="${section.id}">
        <span class="title-left">
          <img src="${asset(section.image)}" alt="">
          <strong>${escapeHtml(section.name)}</strong>
          <small>(${sounds.length})</small>
          <span class="loop-badge">Автоповтор включён</span>
        </span>
        <span>${collapsed ? '▶' : '▼'}</span>
      </button>
      ${collapsed ? '' : `<div class="sound-grid">${sounds.map(renderSoundCard).join('')}</div>`}
    </article>
  `;
}

function renderSoundCard(sound) {
  const active = state.activeSounds.get(sound.id);
  const volume = active?.volume ?? Number(localStorage.getItem(`leaveplz-volume-${sound.id}`) || 0.5);
  const loop = active?.loop ?? state.loopOverrides[sound.id] ?? state.loopByDefault;
  const favorite = state.favoriteIds.has(sound.id);
  const image = sound.image || state.sections.find((section) => section.id === sound.sectionId)?.image || 'situations.jpg';

  return `
    <article class="sound-card ${active ? 'playing' : ''}" data-id="${sound.id}" style="--image: ${cssImage(image)}">
      <div class="card-content">
        <div class="card-top">
          <button class="loop-toggle ${loop ? 'active' : ''}" type="button" data-action="loop" data-id="${sound.id}" title="Автоповтор" aria-label="Автоповтор">↻</button>
          <button class="fav-toggle ${favorite ? 'active' : ''}" type="button" data-action="favorite" data-id="${sound.id}" title="В избранное" aria-label="В избранное">${favorite ? '★' : '☆'}</button>
        </div>
        <div class="sound-name">${escapeHtml(sound.title)}</div>
        <button class="play-button" type="button" data-action="toggle" data-id="${sound.id}" aria-label="Запустить ${escapeHtml(sound.title)}">${active ? '■' : '▶'}</button>
        <label class="card-volume">
          <span>🔈</span>
          <input type="range" min="0" max="1" step="0.01" value="${volume}" data-action="volume" data-id="${sound.id}" aria-label="Громкость ${escapeHtml(sound.title)}">
          <span>${Math.round(volume * 100)}%</span>
        </label>
      </div>
    </article>
  `;
}

function renderPlaylist() {
  const tracks = currentTracks();
  elements.playlistCount.textContent = `${tracks.length} треков`;
  elements.playlistTracks.innerHTML = tracks.map((track, index) => `
    <li>
      <div class="track-row">
        <span title="${escapeHtml(track.title || track.url || '')}">${escapeHtml(track.title || track.url || 'Без названия')}</span>
        <button type="button" data-play-track="${index}" title="Запустить" aria-label="Запустить">▶</button>
      </div>
    </li>
  `).join('') || '<li>Пусто</li>';
}

function updateNowPlaying() {
  const current = state.currentExternalMusic || state.currentMusic;
  if (!current) {
    elements.nowPlayingTitle.textContent = 'Ничего не играет';
    elements.nowPlayingMeta.textContent = `${theme().name}: ${themeMusic().length} треков`;
    elements.mainPlayToggle.textContent = '▶';
    return;
  }
  elements.nowPlayingTitle.textContent = current.title;
  elements.nowPlayingMeta.textContent = state.currentExternalMusic ? 'YouTube URL' : theme().name;
  elements.mainPlayToggle.textContent = isDiscordOutput() ? '■' : (state.musicAudio.paused ? '▶' : 'Ⅱ');
}

function renderActiveState() {
  elements.activeCount.textContent = String(state.activeSounds.size);
}

function isDiscordOutput() {
  return state.outputMode === 'discord';
}

function updateOutputModeUi() {
  elements.audioOutputMode.checked = isDiscordOutput();
  elements.outputModeLabel.textContent = isDiscordOutput()
    ? 'Звук только через Discord'
    : 'Звук на этом ПК';
}

function currentDiscordMusicOffset() {
  if ((!state.currentMusic && !state.currentExternalMusic) || !isDiscordOutput()) return 0;
  const elapsed = state.discordMusicStartedAt
    ? (Date.now() - state.discordMusicStartedAt) / 1000
    : 0;
  return Math.max(0, state.discordMusicOffset + elapsed);
}

function startDiscordMusicClock(offset = 0) {
  state.discordMusicOffset = Math.max(0, Number(offset) || 0);
  state.discordMusicStartedAt = Date.now();
}

function resetDiscordMusicClock() {
  state.discordMusicOffset = 0;
  state.discordMusicStartedAt = 0;
}

function currentDiscordSoundOffset(item) {
  if (!item || item.audio || !isDiscordOutput()) return 0;
  const elapsed = item.startedAt
    ? (Date.now() - item.startedAt) / 1000
    : 0;
  const rawOffset = Math.max(0, Number(item.offset || 0) + elapsed);
  const duration = Number(item.duration || 0);
  if (item.loop && duration > 0) return rawOffset % duration;
  return rawOffset;
}

function startDiscordSoundClock(item, offset = 0) {
  if (!item) return;
  item.offset = Math.max(0, Number(offset) || 0);
  item.startedAt = Date.now();
}

function clearSoundEndTimer(item) {
  if (item?.endTimer) clearTimeout(item.endTimer);
  if (item) item.endTimer = null;
}

async function mediaDuration(id) {
  if (durationCache.has(id)) return durationCache.get(id);
  const audio = new Audio(`/audio/${encodeURIComponent(id)}`);
  audio.preload = 'metadata';
  const duration = await new Promise((resolve) => {
    const done = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.addEventListener('loadedmetadata', done, { once: true });
    audio.addEventListener('error', () => resolve(0), { once: true });
    audio.load();
  });
  durationCache.set(id, duration);
  return duration;
}

async function scheduleDiscordSoundStop(id) {
  const item = state.activeSounds.get(id);
  if (!item || item.loop || item.audio) return;
  clearSoundEndTimer(item);
  const duration = await mediaDuration(id);
  const current = state.activeSounds.get(id);
  if (!current || current.loop || current.audio || duration <= 0) return;
  current.duration = duration;
  const remaining = Math.max(0, duration - currentDiscordSoundOffset(current));
  current.endTimer = setTimeout(() => {
    const latest = state.activeSounds.get(id);
    if (latest && !latest.loop && !latest.audio) stopSound(id);
  }, Math.ceil(remaining * 1000) + 300);
}

async function setOutputMode(mode) {
  const nextMode = mode === 'discord' ? 'discord' : 'local';
  if (state.outputMode === nextMode) return;

  const localMusicOffset = state.currentMusic ? state.musicAudio.currentTime || 0 : 0;
  state.musicAudio.pause();
  state.activeSounds.forEach((item) => {
    if (item.audio) {
      item.offset = item.audio.currentTime || 0;
      item.startedAt = Date.now();
    }
    item.audio?.pause();
    if (item.audio) item.audio.currentTime = 0;
    clearSoundEndTimer(item);
    item.audio = null;
  });

  state.outputMode = nextMode;
  localStorage.setItem('leaveplz-output-mode', state.outputMode);
  updateOutputModeUi();
  updateNowPlaying();
  renderSounds();

  if (isDiscordOutput()) {
    if (state.currentExternalMusic) {
      startDiscordMusicClock(0);
      await syncDiscordMix();
    } else {
      if (state.currentMusic) startDiscordMusicClock(localMusicOffset);
      await syncDiscordMix();
    }
    showToast('Вывод переключён на Discord');
  } else {
    state.currentExternalMusic = null;
    resetDiscordMusicClock();
    await api('/api/discord/stop', { method: 'POST' });
    await refreshDiscordStatus();
    showToast('Вывод переключён на этот ПК');
  }
}

async function syncDiscordMix({ announce = false } = {}) {
  if (!isDiscordOutput()) return;
  const musicOffset = currentDiscordMusicOffset();
  const tracks = discordMixTracks();
  const soundOffsets = new Map(
    tracks
      .filter((track) => track.role === 'sound' && track.id)
      .map((track) => [track.id, track.seek || 0])
  );

  if (!tracks.length) {
    resetDiscordMusicClock();
    await api('/api/discord/stop', { method: 'POST' });
    await refreshDiscordStatus();
    return;
  }

  await api('/api/discord/mix', {
    method: 'POST',
    body: JSON.stringify({ tracks })
  });
  if (state.currentMusic || state.currentExternalMusic) startDiscordMusicClock(musicOffset);
  soundOffsets.forEach((offset, id) => {
    startDiscordSoundClock(state.activeSounds.get(id), offset);
  });
  soundOffsets.forEach((_, id) => {
    const item = state.activeSounds.get(id);
    if (item && !item.loop) scheduleDiscordSoundStop(id).catch(() => {});
  });
  await refreshDiscordStatus();
  if (announce) showToast('Микс отправлен в Discord');
}

function queueDiscordMixSync() {
  if (!isDiscordOutput()) return;
  clearTimeout(discordMixTimer);
  discordMixTimer = setTimeout(() => {
    syncDiscordMix().catch((error) => showToast(error.message));
  }, 180);
}

function discordMixTracks() {
  let musicTrack = [];
  if (state.currentExternalMusic) {
    musicTrack = [{
      type: 'youtube',
      url: state.currentExternalMusic.url,
      title: state.currentExternalMusic.title,
      volume: state.masterVolume * state.musicVolume,
      loop: false,
      seek: currentDiscordMusicOffset()
    }];
  } else if (state.currentMusic) {
    musicTrack = [{
      type: 'local',
      id: state.currentMusic.id,
      volume: state.masterVolume * state.musicVolume,
      loop: false,
      seek: currentDiscordMusicOffset()
    }];
  }
  const soundTracks = [...state.activeSounds.values()].map((item) => ({
    type: 'local',
    role: 'sound',
    id: item.sound.id,
    volume: item.volume * state.masterVolume,
    loop: item.loop,
    seek: currentDiscordSoundOffset(item)
  }));
  return [...musicTrack, ...soundTracks];
}

async function startSound(id, options = {}) {
  const sound = state.sounds.find((item) => item.id === id);
  if (!sound) return;

  const existing = state.activeSounds.get(id);
  if (existing && !options.restart) {
    stopSound(id);
    return;
  }
  if (existing) stopSound(id);

  const volume = Number(localStorage.getItem(`leaveplz-volume-${id}`) || options.volume || 0.5);
  const loop = options.loop ?? state.loopOverrides[id] ?? state.loopByDefault;
  if (isDiscordOutput()) {
    state.activeSounds.set(id, { sound, audio: null, volume, loop, endTimer: null, offset: 0, startedAt: 0, duration: 0 });
    renderSounds();
    await syncDiscordMix();
    if (!loop) scheduleDiscordSoundStop(id).catch(() => {});
    return;
  }

  const audio = new Audio(`/audio/${encodeURIComponent(id)}`);
  audio.loop = loop;
  audio.volume = volume * state.masterVolume;

  state.activeSounds.set(id, { sound, audio, volume, loop, endTimer: null, offset: 0, startedAt: 0, duration: 0 });
  audio.addEventListener('ended', () => stopSound(id));
  await audio.play();
  renderSounds();
}

function stopSound(id) {
  const item = state.activeSounds.get(id);
  if (!item) return;
  clearSoundEndTimer(item);
  item.audio?.pause();
  if (item.audio) item.audio.currentTime = 0;
  state.activeSounds.delete(id);
  renderSounds();
  queueDiscordMixSync();
}

function setVolume(id, volume) {
  localStorage.setItem(`leaveplz-volume-${id}`, String(volume));
  const item = state.activeSounds.get(id);
  if (item) {
    item.volume = volume;
    if (item.audio) item.audio.volume = volume * state.masterVolume;
    else queueDiscordMixSync();
  }
}

function toggleLoop(id) {
  const item = state.activeSounds.get(id);
  if (item) {
    item.loop = !item.loop;
    if (item.audio) item.audio.loop = item.loop;
    else {
      if (item.loop) clearSoundEndTimer(item);
      else scheduleDiscordSoundStop(id).catch(() => {});
      queueDiscordMixSync();
    }
  } else {
    state.loopOverrides[id] = !(state.loopOverrides[id] ?? state.loopByDefault);
    localStorage.setItem('leaveplz-loop-overrides', JSON.stringify(state.loopOverrides));
  }
  renderSounds();
}

function pauseAllSounds() {
  if (isDiscordOutput()) {
    state.activeSounds.forEach(clearSoundEndTimer);
    state.activeSounds.clear();
    renderSounds();
    syncDiscordMix()
      .catch((error) => showToast(error.message));
    return;
  }

  let pausedAny = false;
  state.activeSounds.forEach((item) => {
    if (!item.audio.paused) {
      item.audio.pause();
      pausedAny = true;
    }
  });
  if (!pausedAny) state.activeSounds.forEach((item) => item.audio.play().catch((error) => showToast(error.message)));
}

function stopAllSounds() {
  [...state.activeSounds.keys()].forEach(stopSound);
  if (isDiscordOutput()) {
    queueDiscordMixSync();
  }
}

async function playMusicFrom(index = state.playlistIndex) {
  const tracks = currentTracks();
  if (!tracks.length) return;
  state.playlistIndex = (index + tracks.length) % tracks.length;
  const track = tracks[state.playlistIndex];

  const media = state.music.find((item) => item.id === track.id) || state.sounds.find((item) => item.id === track.id);
  if (!media) return;
  state.currentMusic = media;
  state.currentExternalMusic = null;

  if (isDiscordOutput()) {
    state.musicAudio.pause();
    state.musicAudio.removeAttribute('src');
    startDiscordMusicClock(0);
    await syncDiscordMix();
    updateNowPlaying();
    showToast('Музыка добавлена в Discord-микс');
    return;
  }

  state.musicAudio.src = `/audio/${encodeURIComponent(media.id)}`;
  state.musicAudio.volume = state.masterVolume * state.musicVolume;
  await state.musicAudio.play();
  updateNowPlaying();
}

async function playExternalUrl(url, { title = 'YouTube URL', silent = false } = {}) {
  const cleanUrl = String(url || '').trim();
  if (!cleanUrl) {
    showToast('Вставь ссылку YouTube');
    return;
  }

  if (!isDiscordOutput()) {
    showToast('YouTube URL воспроизводится через Discord. Включи режим Discord ниже.');
    return;
  }

  state.currentMusic = null;
  resetDiscordMusicClock();
  state.musicAudio.pause();
  state.musicAudio.removeAttribute('src');
  state.currentExternalMusic = { type: 'youtube', title, url: cleanUrl };
  startDiscordMusicClock(0);
  await syncDiscordMix();
  await refreshDiscordStatus();
  updateNowPlaying();
  if (!silent) showToast('YouTube запущен через Discord');
}

function toggleMusic() {
  if (!state.currentMusic && !state.currentExternalMusic) {
    playMusicFrom(0).catch((error) => showToast(error.message));
    return;
  }
  if (isDiscordOutput()) {
    state.currentMusic = null;
    state.currentExternalMusic = null;
    resetDiscordMusicClock();
    syncDiscordMix()
      .then(() => updateNowPlaying())
      .catch((error) => showToast(error.message));
    return;
  }
  if (state.musicAudio.paused) state.musicAudio.play().catch((error) => showToast(error.message));
  else state.musicAudio.pause();
  updateNowPlaying();
}

async function loadLibrary() {
  const data = await api('/api/library');
  state.sounds = data.sounds;
  state.music = data.music;
  state.sections = data.sections?.length ? data.sections : fallbackSections;
  renderSounds();
  renderPlaylist();
  updateNowPlaying();
}

async function refreshDiscordStatus() {
  const status = await api('/api/discord/status');
  elements.discordLed.classList.toggle('ready', status.ready && status.connected);
  elements.guildId.value = elements.guildId.value || status.guildId || '';
  elements.voiceChannelId.value = elements.voiceChannelId.value || status.voiceChannelId || '';
  elements.discordStatus.textContent = !status.configured
    ? 'Токен не задан в .env'
    : status.connected
      ? `Подключен${status.nowPlaying?.title ? ` · ${status.nowPlaying.title}` : ''}`
      : status.ready ? 'Бот авторизован' : (status.lastError || 'Бот не авторизован');
}

async function connectDiscord() {
  await api('/api/discord/connect', {
    method: 'POST',
    body: JSON.stringify({
      guildId: elements.guildId.value.trim(),
      voiceChannelId: elements.voiceChannelId.value.trim()
    })
  });
  await refreshDiscordStatus();
  showToast('Discord подключен');
}

async function sendMixToDiscord() {
  const tracks = discordMixTracks();
  if (!tracks.length) {
    showToast('Активный микс пуст');
    return;
  }
  await api('/api/discord/mix', {
    method: 'POST',
    body: JSON.stringify({ tracks })
  });
  await refreshDiscordStatus();
  showToast('Микс отправлен в Discord');
}

function saveSettings() {
  localStorage.setItem('leaveplz-master-volume', String(state.masterVolume));
  localStorage.setItem('leaveplz-music-volume', String(state.musicVolume));
  localStorage.setItem('leaveplz-output-mode', state.outputMode);
  localStorage.setItem('leaveplz-theme', state.selectedTheme);
  localStorage.setItem('leaveplz-favorites', JSON.stringify([...state.favoriteIds]));
  localStorage.setItem('leaveplz-collapsed-sections', JSON.stringify([...state.collapsedSections]));
  localStorage.setItem('leaveplz-loop-overrides', JSON.stringify(state.loopOverrides));
  showToast('Настройки сохранены');
}

function populateAdminThemeSelect() {
  const options = themes.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
  elements.uploadTheme.innerHTML = options;
  elements.editTheme.innerHTML = elements.uploadTheme.innerHTML;
  elements.themeEditSelect.innerHTML = options;
  restoreSelectValue(elements.themeEditSelect, elements.themeEditSelect.value || state.selectedTheme);
  populateThemeEditor();
}

async function loadThemes() {
  const data = await api('/api/themes');
  if (Array.isArray(data.themes) && data.themes.length) themes = data.themes;
  if (!themes.some((item) => item.id === state.selectedTheme)) state.selectedTheme = 'tavern';
  populateAdminThemeSelect();
  renderThemes();
}

async function loadPreviewImages() {
  const data = await api('/api/assets/images');
  state.previewImages = Array.isArray(data.images) ? data.images : [];
  populateAdminImageSelects();
}

function populateAdminImageSelects() {
  const uploadValue = elements.uploadImage.value;
  const editValue = elements.editImage.value;
  const newThemeValue = elements.newThemeImage.value;
  const themeEditValue = elements.themeEditImage.value;
  const options = [
    '<option value="">Автоматически</option>',
    ...state.previewImages.map((image) => `<option value="${escapeHtml(image.name)}">${escapeHtml(image.label)}</option>`)
  ].join('');

  elements.uploadImage.innerHTML = options;
  elements.editImage.innerHTML = options;
  elements.newThemeImage.innerHTML = options;
  elements.themeEditImage.innerHTML = options;
  restoreSelectValue(elements.uploadImage, uploadValue);
  restoreSelectValue(elements.editImage, editValue);
  restoreSelectValue(elements.newThemeImage, newThemeValue);
  restoreSelectValue(elements.themeEditImage, themeEditValue);
  updateAdminImagePreviews();
}

function restoreSelectValue(select, value) {
  if (!value) {
    select.value = '';
    return;
  }
  if (![...select.options].some((option) => option.value === value)) {
    const option = new Option(`Текущее: ${value}`, value);
    select.add(option);
  }
  select.value = value;
}

function selectedThemeImage(select) {
  return themes.find((themeItem) => themeItem.id === select.value)?.image || 'tavern.webp';
}

function selectedSectionImage(select) {
  return select.selectedOptions[0]?.dataset.image || 'situations.jpg';
}

function automaticUploadImage() {
  return elements.uploadType.value === 'music'
    ? selectedThemeImage(elements.uploadTheme)
    : selectedSectionImage(elements.uploadSection);
}

function automaticEditImage() {
  return elements.editType.value === 'music'
    ? selectedThemeImage(elements.editTheme)
    : selectedSectionImage(elements.editSection);
}

function updateImagePreview(node, imageName) {
  node.style.backgroundImage = cssImage(imageName || 'situations.jpg');
}

function updateAdminImagePreviews() {
  updateImagePreview(elements.uploadImagePreview, elements.uploadImage.value || automaticUploadImage());
  updateImagePreview(elements.editImagePreview, elements.editImage.value || automaticEditImage());
  updateImagePreview(elements.newThemeImagePreview, elements.newThemeImage.value || 'journey.webp');
  updateImagePreview(elements.themeEditImagePreview, elements.themeEditImage.value || selectedThemeForEdit()?.image || 'journey.webp');
}

function setAdminUnlocked(unlocked) {
  elements.adminFields.hidden = !unlocked;
  elements.adminPasswordRow.hidden = unlocked;
  elements.adminLogin.hidden = unlocked;
  if (unlocked) renderAdminMediaList();
}

async function loginAdmin() {
  const password = elements.adminPassword.value || state.adminPassword || 'admin';
  const result = await api('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
  if (!result.ok) {
    showToast('Неверный пароль');
    return;
  }
  state.adminPassword = password;
  localStorage.setItem('leaveplz-admin-password', password);
  setAdminUnlocked(true);
}

async function uploadAdminFile() {
  const file = elements.uploadFile.files[0];
  if (!file) {
    showToast('Выбери аудиофайл');
    return;
  }

  const type = elements.uploadType.value;
  const selectedSection = elements.uploadSection.selectedOptions[0];
  const form = new FormData();
  form.set('file', file);
  form.set('title', elements.uploadTitle.value.trim() || file.name.replace(/\.[^.]+$/, ''));
  form.set('type', type);
  form.set('themeId', type === 'music' ? elements.uploadTheme.value : '');
  form.set('sectionId', type === 'sound' ? elements.uploadSection.value : '');
  form.set('sectionName', type === 'sound' ? (selectedSection.dataset.name || selectedSection.textContent) : '');
  form.set('image', elements.uploadImage.value || automaticUploadImage());

  elements.adminStatus.textContent = 'Загрузка...';
  await api('/api/admin/upload', {
    method: 'POST',
    headers: { 'x-admin-password': state.adminPassword },
    body: form
  });
  elements.adminStatus.textContent = 'Готово';
  elements.uploadFile.value = '';
  elements.uploadTitle.value = '';
  await loadLibrary();
  showToast('Файл добавлен');
}

async function uploadCoverImage(fileInput, targetSelect) {
  const file = fileInput.files[0];
  if (!file) {
    showToast('Выбери картинку');
    return null;
  }

  const form = new FormData();
  form.set('file', file);
  elements.adminStatus.textContent = 'Загрузка картинки...';
  const image = await api('/api/admin/assets/images', {
    method: 'POST',
    headers: { 'x-admin-password': state.adminPassword },
    body: form
  });
  fileInput.value = '';
  await loadPreviewImages();
  restoreSelectValue(targetSelect, image.name);
  targetSelect.value = image.name;
  updateAdminImagePreviews();
  elements.adminStatus.textContent = 'Картинка загружена';
  showToast('Обложка добавлена');
  return image;
}

async function createMusicTheme() {
  const name = elements.newThemeTitle.value.trim();
  if (!name) {
    showToast('Укажи название новой темы');
    return;
  }

  elements.adminStatus.textContent = 'Создание темы...';
  const created = await api('/api/admin/themes', {
    method: 'POST',
    headers: { 'x-admin-password': state.adminPassword },
    body: JSON.stringify({
      name,
      image: elements.newThemeImage.value || 'journey.webp'
    })
  });
  await loadThemes();
  elements.uploadTheme.value = created.id;
  elements.editTheme.value = created.id;
  elements.themeEditSelect.value = created.id;
  state.selectedTheme = created.id;
  applyTheme();
  populateThemeEditor();
  elements.newThemeTitle.value = '';
  elements.adminStatus.textContent = 'Тема создана';
  showToast('Тема добавлена');
}

function selectedThemeForEdit() {
  return themes.find((item) => item.id === elements.themeEditSelect.value) || themes[0];
}

function themeTrackIds() {
  return [...elements.themePlaylistTracks.options].map((option) => option.value);
}

function renderThemePlaylistEditor() {
  const selectedIds = new Set(themeTrackIds());
  const query = normalize(elements.themeMusicSearch.value);
  const tracks = state.music.filter((track) => {
    if (!query) return true;
    const themeName = themes.find((item) => item.id === track.themeId)?.name || 'Без темы';
    return normalize(`${track.title} ${track.originalTitle || ''} ${track.file || ''} ${themeName}`).includes(query);
  });
  elements.themeMusicSource.innerHTML = tracks.map((track) => {
    const themeName = themes.find((item) => item.id === track.themeId)?.name || 'Без темы';
    const selectedMark = selectedIds.has(track.id) ? '✓ ' : '';
    return `<option value="${track.id}">${selectedMark}${escapeHtml(track.title)} · ${escapeHtml(themeName)}</option>`;
  }).join('') || '<option value="">Ничего не найдено</option>';
}

function populateThemeEditor() {
  const current = selectedThemeForEdit();
  if (!current) return;

  elements.themeEditTitle.value = current.name || '';
  elements.themeEditImage.value = current.image || '';
  const byId = new Map(state.music.map((track) => [track.id, track]));
  const playlistIds = Array.isArray(current.tracks) ? current.tracks.filter((id) => byId.has(id)) : [];
  elements.themePlaylistTracks.innerHTML = playlistIds.map((id) => {
    const track = byId.get(id);
    return `<option value="${track.id}">${escapeHtml(track.title)}</option>`;
  }).join('');
  renderThemePlaylistEditor();
  updateAdminImagePreviews();
}

function addTrackToThemePlaylist() {
  const id = elements.themeMusicSource.value;
  if (!id || themeTrackIds().includes(id)) return;
  const track = state.music.find((item) => item.id === id);
  if (!track) return;
  elements.themePlaylistTracks.add(new Option(track.title, track.id));
  elements.themePlaylistTracks.value = track.id;
  renderThemePlaylistEditor();
}

function removeTrackFromThemePlaylist() {
  [...elements.themePlaylistTracks.selectedOptions].forEach((option) => option.remove());
  renderThemePlaylistEditor();
}

function moveThemeTrack(direction) {
  const selected = elements.themePlaylistTracks.selectedOptions[0];
  if (!selected) return;
  if (direction < 0 && selected.previousElementSibling) {
    elements.themePlaylistTracks.insertBefore(selected, selected.previousElementSibling);
  }
  if (direction > 0 && selected.nextElementSibling) {
    elements.themePlaylistTracks.insertBefore(selected.nextElementSibling, selected);
  }
}

async function saveEditedTheme() {
  const current = selectedThemeForEdit();
  if (!current) {
    showToast('Выбери тему');
    return;
  }

  elements.adminStatus.textContent = 'Сохранение темы...';
  const saved = await api(`/api/admin/themes/${encodeURIComponent(current.id)}`, {
    method: 'PUT',
    headers: { 'x-admin-password': state.adminPassword },
    body: JSON.stringify({
      name: elements.themeEditTitle.value.trim() || current.name,
      image: elements.themeEditImage.value || current.image,
      tracks: themeTrackIds()
    })
  });
  await loadThemes();
  state.selectedTheme = saved.id;
  applyTheme();
  elements.themeEditSelect.value = saved.id;
  populateThemeEditor();
  elements.adminStatus.textContent = 'Тема сохранена';
  showToast('Тема обновлена');
}

function allMedia() {
  return [...state.sounds, ...state.music].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}

function renderAdminMediaList() {
  const query = normalize(elements.adminMediaSearch.value);
  const items = allMedia().filter((item) => !query || textFor(item).includes(query) || item.type.includes(query));
  const currentValue = elements.adminMediaSelect.value;

  elements.adminMediaSelect.innerHTML = items.map((item) => {
    const typeLabel = item.type === 'music' ? 'Музыка' : 'Звук';
    const group = item.type === 'music'
      ? (themes.find((themeItem) => themeItem.id === item.themeId)?.name || 'Без темы')
      : (item.sectionName || 'Эффекты');
    return `<option value="${item.id}">${escapeHtml(typeLabel)} · ${escapeHtml(group)} · ${escapeHtml(item.title)}</option>`;
  }).join('');

  if (items.some((item) => item.id === currentValue)) elements.adminMediaSelect.value = currentValue;
  if (!elements.adminMediaSelect.value && items[0]) elements.adminMediaSelect.value = items[0].id;
  populateEditForm();
}

function selectedAdminMedia() {
  return allMedia().find((item) => item.id === elements.adminMediaSelect.value);
}

function setEditTypeVisibility() {
  const isMusic = elements.editType.value === 'music';
  elements.editThemeRow.hidden = !isMusic;
  elements.editSectionRow.hidden = isMusic;
  updateAdminImagePreviews();
}

function populateEditForm() {
  const item = selectedAdminMedia();
  if (!item) {
    elements.editTitle.value = '';
    elements.editCurrentFile.textContent = 'Ничего не выбрано';
    return;
  }

  elements.editTitle.value = item.title || '';
  elements.editType.value = item.type || 'sound';
  elements.editSection.value = item.sectionId || 'effects';
  elements.editTheme.value = item.themeId || state.selectedTheme;
  elements.editImage.value = item.image || '';
  elements.editFile.value = '';
  elements.editCurrentFile.textContent = `Файл: ${item.file}`;
  setEditTypeVisibility();
  updateAdminImagePreviews();
}

async function saveEditedMedia() {
  const item = selectedAdminMedia();
  if (!item) {
    showToast('Выбери элемент медиатеки');
    return;
  }

  const type = elements.editType.value;
  const selectedSection = elements.editSection.selectedOptions[0];
  const form = new FormData();
  form.set('title', elements.editTitle.value.trim() || item.title);
  form.set('type', type);
  form.set('themeId', type === 'music' ? elements.editTheme.value : '');
  form.set('sectionId', type === 'sound' ? elements.editSection.value : '');
  form.set('sectionName', type === 'sound' ? (selectedSection.dataset.name || selectedSection.textContent) : '');
  form.set('image', elements.editImage.value || automaticEditImage());

  const replacement = elements.editFile.files[0];
  if (replacement) form.set('file', replacement);

  elements.adminStatus.textContent = 'Сохранение...';
  await api(`/api/admin/media/${encodeURIComponent(item.id)}`, {
    method: 'PUT',
    headers: { 'x-admin-password': state.adminPassword },
    body: form
  });
  elements.adminStatus.textContent = 'Изменения сохранены';
  await loadLibrary();
  renderAdminMediaList();
  showToast('Медиатека обновлена');
}

async function deleteEditedMedia() {
  const item = selectedAdminMedia();
  if (!item) {
    showToast('Выбери элемент медиатеки');
    return;
  }

  if (!confirm(`Удалить "${item.title}" из сайта?`)) return;

  elements.adminStatus.textContent = 'Удаление...';
  await api(`/api/admin/media/${encodeURIComponent(item.id)}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': state.adminPassword }
  });
  elements.adminStatus.textContent = 'Удалено';
  await loadLibrary();
  renderAdminMediaList();
  showToast('Элемент удалён из медиатеки');
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove('visible'), 3200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

elements.themeGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-theme]');
  if (!button) return;
  state.selectedTheme = button.dataset.theme;
  state.musicAudio.pause();
  state.currentMusic = null;
  state.currentExternalMusic = null;
  resetDiscordMusicClock();
  applyTheme();
});

elements.backgroundList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-theme]');
  if (!button) return;
  state.selectedTheme = button.dataset.theme;
  applyTheme();
});

elements.resetBackground.addEventListener('click', () => {
  state.selectedTheme = 'tavern';
  applyTheme();
});

elements.searchInput.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderSounds();
});

elements.soundsContainer.addEventListener('click', async (event) => {
  const sectionToggle = event.target.closest('[data-section-toggle]');
  if (sectionToggle) {
    const id = sectionToggle.dataset.sectionToggle;
    if (state.collapsedSections.has(id)) state.collapsedSections.delete(id);
    else state.collapsedSections.add(id);
    localStorage.setItem('leaveplz-collapsed-sections', JSON.stringify([...state.collapsedSections]));
    renderSounds();
    return;
  }

  const button = event.target.closest('[data-action]');
  if (!button) return;
  const id = button.dataset.id;

  try {
    if (button.dataset.action === 'toggle') await startSound(id);
    if (button.dataset.action === 'loop') toggleLoop(id);
    if (button.dataset.action === 'favorite') {
      if (state.favoriteIds.has(id)) state.favoriteIds.delete(id);
      else state.favoriteIds.add(id);
      saveSettings();
      renderSounds();
    }
  } catch (error) {
    showToast(error.message);
  }
});

elements.soundsContainer.addEventListener('input', (event) => {
  const slider = event.target.closest('[data-action="volume"]');
  if (!slider) return;
  setVolume(slider.dataset.id, Number(slider.value));
  slider.nextElementSibling.textContent = `${Math.round(Number(slider.value) * 100)}%`;
});

elements.masterVolume.value = state.masterVolume;
elements.masterVolumeLabel.textContent = `${Math.round(state.masterVolume * 100)}%`;
elements.masterVolume.addEventListener('input', (event) => {
  state.masterVolume = Number(event.target.value);
  elements.masterVolumeLabel.textContent = `${Math.round(state.masterVolume * 100)}%`;
  state.activeSounds.forEach((item) => {
    if (item.audio) item.audio.volume = item.volume * state.masterVolume;
  });
  state.musicAudio.volume = state.masterVolume * state.musicVolume;
  queueDiscordMixSync();
});

elements.musicVolume.value = state.musicVolume;
elements.musicVolumeLabel.textContent = `${Math.round(state.musicVolume * 100)}%`;
elements.musicVolume.addEventListener('input', (event) => {
  state.musicVolume = Number(event.target.value);
  elements.musicVolumeLabel.textContent = `${Math.round(state.musicVolume * 100)}%`;
  state.musicAudio.volume = state.masterVolume * state.musicVolume;
  queueDiscordMixSync();
});

elements.pauseAll.addEventListener('click', pauseAllSounds);
elements.stopAll.addEventListener('click', stopAllSounds);
elements.saveSettings.addEventListener('click', saveSettings);
elements.mainPlayToggle.addEventListener('click', toggleMusic);
elements.playPlaylist.addEventListener('click', () => playMusicFrom(0).catch((error) => showToast(error.message)));
elements.prevTrack.addEventListener('click', () => playMusicFrom(state.playlistIndex - 1).catch((error) => showToast(error.message)));
elements.nextTrack.addEventListener('click', () => playMusicFrom(state.playlistIndex + 1).catch((error) => showToast(error.message)));
elements.shufflePlaylist.addEventListener('click', () => {
  const tracks = currentTracks();
  state.playlistIndex = Math.floor(Math.random() * Math.max(1, tracks.length));
  playMusicFrom(state.playlistIndex).catch((error) => showToast(error.message));
});
elements.repeatPlaylist.addEventListener('click', () => showToast('Повтор включён автоматически: следующий трек пойдёт по кругу'));

document.querySelector('.source-tabs').addEventListener('click', (event) => {
  const button = event.target.closest('[data-source-tab]');
  if (!button) return;
  document.querySelectorAll('[data-source-tab]').forEach((item) => item.classList.toggle('active', item === button));
  elements.externalPlayer.hidden = button.dataset.sourceTab !== 'youtube';
});

elements.playExternal.addEventListener('click', () => playExternalUrl(elements.externalUrl.value).catch((error) => showToast(error.message)));
elements.externalUrl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    playExternalUrl(elements.externalUrl.value).catch((error) => showToast(error.message));
  }
});

elements.playlistTracks.addEventListener('click', async (event) => {
  const playButton = event.target.closest('[data-play-track]');

  try {
    if (playButton) {
      state.playlistIndex = Number(playButton.dataset.playTrack);
      await playMusicFrom(state.playlistIndex);
    }
  } catch (error) {
    showToast(error.message);
  }
});

elements.discordConnect.addEventListener('click', () => connectDiscord().catch((error) => showToast(error.message)));
elements.discordMix.addEventListener('click', () => sendMixToDiscord().catch((error) => showToast(error.message)));
elements.discordStop.addEventListener('click', async () => {
  await api('/api/discord/stop', { method: 'POST' });
  await refreshDiscordStatus();
});
elements.discordDisconnect.addEventListener('click', async () => {
  await api('/api/discord/disconnect', { method: 'POST' });
  await refreshDiscordStatus();
  showToast('Бот отключился от голосового канала');
});
elements.audioOutputMode.addEventListener('change', () => {
  setOutputMode(elements.audioOutputMode.checked ? 'discord' : 'local')
    .catch((error) => {
      state.outputMode = 'local';
      updateOutputModeUi();
      showToast(error.message);
    });
});

elements.adminOpen.addEventListener('click', () => {
  populateAdminThemeSelect();
  populateAdminImageSelects();
  populateThemeEditor();
  elements.adminPassword.value = state.adminPassword;
  setAdminUnlocked(Boolean(state.adminPassword));
  renderAdminMediaList();
  updateAdminImagePreviews();
  elements.adminDialog.showModal();
});
elements.adminClose.addEventListener('click', () => elements.adminDialog.close());
elements.adminLogin.addEventListener('click', () => loginAdmin().catch((error) => showToast(error.message)));
elements.uploadType.addEventListener('change', () => {
  const music = elements.uploadType.value === 'music';
  elements.uploadThemeRow.hidden = !music;
  elements.uploadSectionRow.hidden = music;
  updateAdminImagePreviews();
});
elements.uploadSection.addEventListener('change', updateAdminImagePreviews);
elements.uploadTheme.addEventListener('change', updateAdminImagePreviews);
elements.uploadImage.addEventListener('change', updateAdminImagePreviews);
elements.newThemeImage.addEventListener('change', updateAdminImagePreviews);
elements.uploadCoverButton.addEventListener('click', () => uploadCoverImage(elements.uploadCoverFile, elements.uploadImage).catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.newThemeCoverUpload.addEventListener('click', () => uploadCoverImage(elements.newThemeCoverFile, elements.newThemeImage).catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminCreateTheme.addEventListener('click', () => createMusicTheme().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminUpload.addEventListener('click', () => uploadAdminFile().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminTabs.forEach((button) => {
  button.addEventListener('click', () => {
    elements.adminTabs.forEach((tab) => tab.classList.toggle('active', tab === button));
    elements.adminUploadTab.hidden = button.dataset.adminTab !== 'upload';
    elements.adminEditTab.hidden = button.dataset.adminTab !== 'edit';
    elements.adminThemesTab.hidden = button.dataset.adminTab !== 'themes';
    if (button.dataset.adminTab === 'edit') renderAdminMediaList();
    if (button.dataset.adminTab === 'themes') populateThemeEditor();
  });
});
elements.adminMediaSearch.addEventListener('input', renderAdminMediaList);
elements.adminMediaSelect.addEventListener('change', populateEditForm);
elements.editType.addEventListener('change', setEditTypeVisibility);
elements.editSection.addEventListener('change', () => {
  const selectedSection = elements.editSection.selectedOptions[0];
  if (!elements.editImage.value) elements.editImage.value = selectedSection.dataset.image || '';
  updateAdminImagePreviews();
});
elements.editTheme.addEventListener('change', () => {
  if (!elements.editImage.value) {
    elements.editImage.value = themes.find((themeItem) => themeItem.id === elements.editTheme.value)?.image || '';
  }
  updateAdminImagePreviews();
});
elements.editImage.addEventListener('change', updateAdminImagePreviews);
elements.editCoverButton.addEventListener('click', () => uploadCoverImage(elements.editCoverFile, elements.editImage).catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.themeEditSelect.addEventListener('change', populateThemeEditor);
elements.themeEditImage.addEventListener('change', updateAdminImagePreviews);
elements.themeEditCoverButton.addEventListener('click', () => uploadCoverImage(elements.themeEditCoverFile, elements.themeEditImage).catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.themeMusicSearch.addEventListener('input', renderThemePlaylistEditor);
elements.themeTrackAdd.addEventListener('click', addTrackToThemePlaylist);
elements.themeTrackRemove.addEventListener('click', removeTrackFromThemePlaylist);
elements.themeTrackUp.addEventListener('click', () => moveThemeTrack(-1));
elements.themeTrackDown.addEventListener('click', () => moveThemeTrack(1));
elements.adminSaveTheme.addEventListener('click', () => saveEditedTheme().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminSaveMedia.addEventListener('click', () => saveEditedMedia().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminDeleteMedia.addEventListener('click', () => deleteEditedMedia().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));

updateOutputModeUi();
await loadThemes().catch((error) => showToast(error.message));
applyTheme();
await Promise.all([
  loadLibrary(),
  loadPreviewImages(),
  refreshDiscordStatus()
]).catch((error) => showToast(error.message));

setInterval(() => refreshDiscordStatus().catch(() => {}), 10000);
