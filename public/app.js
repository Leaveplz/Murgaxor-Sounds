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
  favoritesOnly: localStorage.getItem('leaveplz-favorites-only') === 'true',
  masterVolume: Number(localStorage.getItem('leaveplz-master-volume') || 0.8),
  musicVolume: Number(localStorage.getItem('leaveplz-music-volume') || 0.7),
  outputMode: localStorage.getItem('leaveplz-output-mode') || 'local',
  favoriteIds: new Set(JSON.parse(localStorage.getItem('leaveplz-favorites') || '[]')),
  collapsedSections: new Set(JSON.parse(localStorage.getItem('leaveplz-collapsed-sections') || '[]')),
  loopOverrides: JSON.parse(localStorage.getItem('leaveplz-loop-overrides') || '{}'),
  sectionLoopDefaults: JSON.parse(localStorage.getItem('leaveplz-section-loop-defaults') || '{}'),
  loopByDefault: true,
  playlistIndex: 0,
  repeatTrack: localStorage.getItem('leaveplz-repeat-track') === 'true',
  shuffleEnabled: false,
  shuffleQueue: [],
  fadeEnabled: localStorage.getItem('leaveplz-fade-enabled') === 'true',
  discordFadeOutTracks: [],
  segmentLoop: localStorage.getItem('leaveplz-segment-loop') === 'true',
  segmentStart: Number(localStorage.getItem('leaveplz-segment-start') || 0),
  segmentEnd: Number(localStorage.getItem('leaveplz-segment-end') || 0),
  isSeeking: false,
  previewImages: [],
  adminPassword: localStorage.getItem('leaveplz-admin-password') || ''
};

const $ = (selector) => document.querySelector(selector);

const elements = {
  themeGrid: $('#theme-grid'),
  selectedThemeLabel: $('#selected-theme-label'),
  soundsContainer: $('#sounds-container'),
  searchInput: $('#search-input'),
  favoritesOnly: $('#favorites-only'),
  activeCount: $('#active-count'),
  pauseAll: $('#pause-all'),
  stopAll: $('#stop-all'),
  saveSettings: $('#save-settings'),
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
  musicProgress: $('#music-progress'),
  musicCurrentTime: $('#music-current-time'),
  musicTimeLeft: $('#music-time-left'),
  segmentLoop: $('#segment-loop'),
  segmentStart: $('#segment-start'),
  segmentEnd: $('#segment-end'),
  segmentStartLabel: $('#segment-start-label'),
  segmentEndLabel: $('#segment-end-label'),
  fadeEnabled: $('#fade-enabled'),
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
  newSoundCategoryTitle: $('#new-sound-category-title'),
  newSoundCategoryImage: $('#new-sound-category-image'),
  newSoundCategoryImagePreview: $('#new-sound-category-image-preview'),
  newSoundCategoryCoverFile: $('#new-sound-category-cover-file'),
  newSoundCategoryCoverUpload: $('#new-sound-category-cover-upload'),
  adminCreateSoundCategory: $('#admin-create-sound-category'),
  soundCategoryEditSelect: $('#sound-category-edit-select'),
  soundCategoryEditTitle: $('#sound-category-edit-title'),
  soundCategoryEditImage: $('#sound-category-edit-image'),
  soundCategoryEditImagePreview: $('#sound-category-edit-image-preview'),
  soundCategoryEditCoverFile: $('#sound-category-edit-cover-file'),
  soundCategoryEditCoverUpload: $('#sound-category-edit-cover-upload'),
  adminSaveSoundCategory: $('#admin-save-sound-category'),
  deleteSoundCategorySelect: $('#delete-sound-category-select'),
  adminDeleteSoundCategory: $('#admin-delete-sound-category'),
  assignSoundCategory: $('#assign-sound-category'),
  assignSoundSearch: $('#assign-sound-search'),
  assignSoundSelect: $('#assign-sound-select'),
  adminAssignSoundCategory: $('#admin-assign-sound-category'),
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
  themePreviewSource: $('#theme-preview-source'),
  themePreviewPlaylist: $('#theme-preview-playlist'),
  themePreviewStop: $('#theme-preview-stop'),
  themePreviewStatus: $('#theme-preview-status'),
  adminSaveTheme: $('#admin-save-theme'),
  adminClearThemePlaylist: $('#admin-clear-theme-playlist'),
  adminDeleteTheme: $('#admin-delete-theme'),
  adminStatus: $('#admin-status'),
  toast: $('#toast')
};

state.musicAudio.addEventListener('ended', handleMusicEnded);
state.musicAudio.addEventListener('loadedmetadata', () => {
  if (!state.segmentEnd || state.segmentEnd > musicDuration()) state.segmentEnd = musicDuration();
  updateTimelineUi();
});
state.musicAudio.addEventListener('timeupdate', () => {
  if (state.segmentLoop && state.segmentEnd > state.segmentStart && state.musicAudio.currentTime >= state.segmentEnd) {
    state.musicAudio.currentTime = state.segmentStart;
    return;
  }
  updateTimelineUi();
});
state.musicAudio.addEventListener('play', updateNowPlaying);
state.musicAudio.addEventListener('pause', updateNowPlaying);

let discordMixTimer = null;
const durationCache = new Map();
const adminPreviewAudio = new Audio();

adminPreviewAudio.addEventListener('ended', () => {
  elements.themePreviewStatus.textContent = 'Предпрослушивание остановлено';
});

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
  const names = categoryIdsForSound(item)
    .map((id) => state.sections.find((section) => section.id === id)?.name)
    .filter(Boolean)
    .join(' ');
  return normalize(`${item.title} ${item.originalTitle || ''} ${item.sectionName || ''} ${names} ${item.file || ''}`);
}

function visibleSounds() {
  const query = normalize(state.search);
  return state.sounds.filter((sound) => {
    if (state.favoritesOnly && !state.favoriteIds.has(sound.id)) return false;
    return !query || textFor(sound).includes(query);
  });
}

function themeMusic() {
  const currentTheme = theme();
  if (Array.isArray(currentTheme.tracks)) {
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

function baseLoopForSound(sound) {
  const sectionId = categoryIdsForSound(sound)[0] || 'effects';
  return state.sectionLoopDefaults[sectionId] ?? state.loopByDefault;
}

function defaultLoopForSound(sound) {
  return state.loopOverrides[sound.id] ?? baseLoopForSound(sound);
}

function sectionLoopDefault(sectionId) {
  return state.sectionLoopDefaults[sectionId] ?? state.loopByDefault;
}

function categoryIdsForSound(sound) {
  const ids = Array.isArray(sound?.sectionIds) && sound.sectionIds.length
    ? sound.sectionIds
    : [sound?.sectionId || 'effects'];
  const knownIds = new Set(state.sections.map((section) => section.id));
  const filtered = ids.map((id) => String(id).trim()).filter((id) => id && knownIds.has(id));
  return filtered.length ? [...new Set(filtered)] : ['effects'];
}

function selectedValues(select) {
  return [...select.selectedOptions].map((option) => option.value).filter(Boolean);
}

function setSelectedValues(select, values) {
  const selected = new Set(values);
  [...select.options].forEach((option) => {
    option.selected = selected.has(option.value);
  });
}

function renderThemes() {
  elements.themeGrid.innerHTML = themes.map((item) => `
    <button class="theme-card ${item.id === state.selectedTheme ? 'active' : ''}" type="button" data-theme="${item.id}" style="--image: ${cssImage(item.image)}">
      <span>${escapeHtml(item.name)}</span>
    </button>
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
    for (const id of categoryIdsForSound(sound)) {
      const section = state.sections.find((item) => item.id === id) || { id, name: sound.sectionName || 'Эффекты', image: sound.image || 'situations.jpg' };
      if (!grouped.has(id)) grouped.set(id, { section, sounds: [] });
      grouped.get(id).sounds.push(sound);
    }
  }

  elements.soundsContainer.innerHTML = [...grouped.values()]
    .filter((group) => group.sounds.length)
    .map(({ section, sounds }) => renderSection(section, sounds))
    .join('') || '<div class="empty">Ничего не найдено</div>';

  renderActiveState();
}

function renderSection(section, sounds) {
  const collapsed = state.collapsedSections.has(section.id);
  const loopDefault = sectionLoopDefault(section.id);
  return `
    <article class="sound-section" data-section="${section.id}">
      <div class="section-title">
        <button class="section-title-main" type="button" data-section-toggle="${section.id}">
          <span class="title-left">
            <img src="${asset(section.image)}" alt="">
            <strong>${escapeHtml(section.name)}</strong>
            <small>(${sounds.length})</small>
          </span>
          <span>${collapsed ? '▶' : '▼'}</span>
        </button>
        <button class="loop-badge ${loopDefault ? 'active' : ''}" type="button" data-section-loop="${section.id}" aria-pressed="${loopDefault}">
          ${loopDefault ? 'Автоповтор включён' : 'Автоповтор выключен'}
        </button>
      </div>
      ${collapsed ? '' : `<div class="sound-grid">${sounds.map((sound) => renderSoundCard(sound, section.id)).join('')}</div>`}
    </article>
  `;
}

function renderSoundCard(sound, contextSectionId = categoryIdsForSound(sound)[0] || 'effects') {
  const active = state.activeSounds.get(sound.id);
  const volume = active?.volume ?? Number(localStorage.getItem(`leaveplz-volume-${sound.id}`) || 0.5);
  const loop = active?.loop ?? state.loopOverrides[sound.id] ?? sectionLoopDefault(contextSectionId);
  const favorite = state.favoriteIds.has(sound.id);
  const image = sound.image || state.sections.find((section) => section.id === categoryIdsForSound(sound)[0])?.image || 'situations.jpg';

  return `
    <article class="sound-card ${active ? 'playing' : ''}" data-id="${sound.id}" style="--image: ${cssImage(image)}">
      <div class="card-content">
        <div class="card-top">
          <button class="loop-toggle ${loop ? 'active' : ''}" type="button" data-action="loop" data-id="${sound.id}" title="Автоповтор" aria-label="Автоповтор">↻</button>
          <button class="fav-toggle ${favorite ? 'active' : ''}" type="button" data-action="favorite" data-id="${sound.id}" title="В избранное" aria-label="В избранное">${favorite ? '★' : '☆'}</button>
        </div>
        <div class="sound-name">${escapeHtml(sound.title)}</div>
        <button class="play-button" type="button" data-action="toggle" data-id="${sound.id}" data-section-id="${contextSectionId}" aria-label="Запустить ${escapeHtml(sound.title)}">${active ? '■' : '▶'}</button>
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
    updateMusicModeButtons();
    updateTimelineUi();
    return;
  }
  elements.nowPlayingTitle.textContent = current.title;
  elements.nowPlayingMeta.textContent = state.currentExternalMusic ? 'YouTube URL' : theme().name;
  elements.mainPlayToggle.textContent = isDiscordOutput() ? '■' : (state.musicAudio.paused ? '▶' : 'Ⅱ');
  updateMusicModeButtons();
  updateTimelineUi();
}

function musicDuration() {
  if (isDiscordOutput() && state.currentMusic?.duration) return state.currentMusic.duration;
  const duration = state.musicAudio.duration;
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
}

function musicPosition() {
  if (isDiscordOutput()) return currentDiscordMusicOffset();
  return state.musicAudio.currentTime || 0;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const rest = String(safe % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}

function updateTimelineUi() {
  const duration = musicDuration();
  const position = Math.min(duration || Infinity, musicPosition());
  if (elements.musicCurrentTime) elements.musicCurrentTime.textContent = formatTime(position);
  if (elements.musicTimeLeft) elements.musicTimeLeft.textContent = duration ? `-${formatTime(duration - position)}` : '-0:00';
  if (elements.musicProgress && !state.isSeeking) {
    elements.musicProgress.max = String(duration || 0);
    elements.musicProgress.value = String(duration ? position : 0);
    elements.musicProgress.disabled = !duration || (isDiscordOutput() && !state.currentMusic);
  }
  updateSegmentUi(duration);
}

function updateSegmentUi(duration = musicDuration()) {
  if (!elements.segmentLoop) return;
  const end = state.segmentEnd || duration || 0;
  const safeStart = Math.min(Math.max(0, state.segmentStart), Math.max(0, end - 1));
  const safeEnd = Math.max(safeStart + 1, Math.min(end, duration || end));
  if (duration) {
    state.segmentStart = safeStart;
    state.segmentEnd = safeEnd;
  }

  elements.segmentLoop.checked = state.segmentLoop;
  elements.segmentStart.max = String(duration || 0);
  elements.segmentEnd.max = String(duration || 0);
  elements.segmentStart.value = String(duration ? state.segmentStart : 0);
  elements.segmentEnd.value = String(duration ? state.segmentEnd : 0);
  elements.segmentStart.disabled = !duration || !state.segmentLoop || isDiscordOutput();
  elements.segmentEnd.disabled = !duration || !state.segmentLoop || isDiscordOutput();
  elements.segmentStartLabel.textContent = formatTime(duration ? state.segmentStart : 0);
  elements.segmentEndLabel.textContent = formatTime(duration ? state.segmentEnd : 0);
}

function saveSegmentBounds() {
  localStorage.setItem('leaveplz-segment-start', String(state.segmentStart));
  localStorage.setItem('leaveplz-segment-end', String(state.segmentEnd));
}

function updateMusicModeButtons() {
  elements.repeatPlaylist.classList.toggle('active', state.repeatTrack);
  elements.repeatPlaylist.setAttribute('aria-pressed', String(state.repeatTrack));
  elements.shufflePlaylist.classList.toggle('active', state.shuffleEnabled);
  elements.shufflePlaylist.setAttribute('aria-pressed', String(state.shuffleEnabled));
  elements.fadeEnabled.checked = state.fadeEnabled;
}

function resetShuffle() {
  state.shuffleEnabled = false;
  state.shuffleQueue = [];
  updateMusicModeButtons();
}

function buildShuffleQueue(excludeIndex = state.playlistIndex) {
  const tracks = currentTracks();
  state.shuffleQueue = tracks
    .map((_, index) => index)
    .filter((index) => index !== excludeIndex)
    .sort(() => Math.random() - 0.5);
}

function nextShuffleIndex() {
  const tracks = currentTracks();
  if (!tracks.length) return 0;
  if (!state.shuffleQueue.length) buildShuffleQueue(state.playlistIndex);
  return state.shuffleQueue.shift() ?? ((state.playlistIndex + 1) % tracks.length);
}

function previousShuffleIndex() {
  return Math.max(0, state.playlistIndex - 1);
}

function handleMusicEnded() {
  const nextIndex = state.repeatTrack
    ? state.playlistIndex
    : state.shuffleEnabled
      ? nextShuffleIndex()
      : state.playlistIndex + 1;
  playMusicFrom(nextIndex, { preserveShuffle: true }).catch((error) => showToast(error.message));
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
      volume: targetMusicVolume(),
      loop: false,
      seek: currentDiscordMusicOffset(),
      fadeIn: state.fadeEnabled ? discordFadeSeconds() : 0
    }];
  } else if (state.currentMusic) {
    musicTrack = [{
      type: 'local',
      id: state.currentMusic.id,
      volume: targetMusicVolume(),
      loop: false,
      seek: currentDiscordMusicOffset(),
      fadeIn: state.fadeEnabled ? discordFadeSeconds() : 0
    }];
  }
  const soundTracks = [...state.activeSounds.values()].map((item) => ({
    ...makeDiscordSoundTrack(item),
    fadeIn: state.fadeEnabled ? discordFadeSeconds() : 0
  }));
  return [...musicTrack, ...soundTracks, ...state.discordFadeOutTracks];
}

function targetMusicVolume() {
  return state.masterVolume * state.musicVolume;
}

function targetSoundVolume(itemOrVolume) {
  const volume = typeof itemOrVolume === 'number' ? itemOrVolume : itemOrVolume?.volume;
  return Number(volume || 0) * state.masterVolume;
}

function fadeDuration() {
  return state.fadeEnabled ? 650 : 0;
}

function discordFadeSeconds() {
  return 0.7;
}

function fadeAudio(audio, toVolume, duration = fadeDuration()) {
  if (!audio) return Promise.resolve();
  const target = Math.max(0, Math.min(1, Number(toVolume) || 0));
  if (!duration) {
    audio.volume = target;
    return Promise.resolve();
  }
  const from = Number(audio.volume) || 0;
  const startedAt = performance.now();
  return new Promise((resolve) => {
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      audio.volume = from + (target - from) * progress;
      if (progress < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function makeCurrentDiscordMusicTrack() {
  if (state.currentExternalMusic) {
    return {
      type: 'youtube',
      url: state.currentExternalMusic.url,
      title: state.currentExternalMusic.title,
      volume: targetMusicVolume(),
      loop: false,
      seek: currentDiscordMusicOffset()
    };
  }
  if (state.currentMusic) {
    return {
      type: 'local',
      id: state.currentMusic.id,
      title: state.currentMusic.title,
      volume: targetMusicVolume(),
      loop: false,
      seek: currentDiscordMusicOffset()
    };
  }
  return null;
}

function makeDiscordSoundTrack(item) {
  return {
    type: 'local',
    role: 'sound',
    id: item.sound.id,
    title: item.sound.title,
    volume: targetSoundVolume(item),
    loop: item.loop,
    seek: currentDiscordSoundOffset(item)
  };
}

function addDiscordFadeOutTrack(track) {
  if (!state.fadeEnabled || !track) return false;
  const fadeId = `${track.role || 'music'}:${track.id || track.url || track.title}:${Date.now()}`;
  state.discordFadeOutTracks.push({
    ...track,
    fadeId,
    fadeOut: discordFadeSeconds(),
    fadeIn: 0,
    seek: Math.max(0, Number(track.seek || 0)),
    loop: false
  });
  setTimeout(() => {
    state.discordFadeOutTracks = state.discordFadeOutTracks.filter((item) => item.fadeId !== fadeId);
    queueDiscordMixSync();
  }, Math.ceil(discordFadeSeconds() * 1000) + 100);
  return true;
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
  const loop = options.loop ?? state.loopOverrides[id] ?? sectionLoopDefault(options.sectionId || categoryIdsForSound(sound)[0] || 'effects');
  if (isDiscordOutput()) {
    state.activeSounds.set(id, { sound, audio: null, volume, loop, endTimer: null, offset: 0, startedAt: 0, duration: 0 });
    renderSounds();
    await syncDiscordMix();
    if (!loop) scheduleDiscordSoundStop(id).catch(() => {});
    return;
  }

  const audio = new Audio(`/audio/${encodeURIComponent(id)}`);
  audio.loop = loop;
  audio.volume = state.fadeEnabled ? 0 : volume * state.masterVolume;

  state.activeSounds.set(id, { sound, audio, volume, loop, endTimer: null, offset: 0, startedAt: 0, duration: 0 });
  audio.addEventListener('ended', () => stopSound(id));
  await audio.play();
  fadeAudio(audio, targetSoundVolume(volume)).catch(() => {});
  renderSounds();
}

function stopSound(id) {
  const item = state.activeSounds.get(id);
  if (!item) return;
  clearSoundEndTimer(item);
  if (isDiscordOutput() && state.fadeEnabled) {
    addDiscordFadeOutTrack(makeDiscordSoundTrack(item));
    state.activeSounds.delete(id);
    renderSounds();
    syncDiscordMix().catch((error) => showToast(error.message));
    return;
  }
  const audio = item.audio;
  if (audio && state.fadeEnabled) {
    state.activeSounds.delete(id);
    renderSounds();
    fadeAudio(audio, 0)
      .finally(() => {
        audio.pause();
        audio.currentTime = 0;
      });
  } else {
    audio?.pause();
    if (audio) audio.currentTime = 0;
    state.activeSounds.delete(id);
    renderSounds();
  }
  queueDiscordMixSync();
}

function setVolume(id, volume) {
  localStorage.setItem(`leaveplz-volume-${id}`, String(volume));
  const item = state.activeSounds.get(id);
  if (item) {
    item.volume = volume;
    if (item.audio) item.audio.volume = targetSoundVolume(item);
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
    const sound = state.sounds.find((soundItem) => soundItem.id === id);
    state.loopOverrides[id] = !(state.loopOverrides[id] ?? baseLoopForSound(sound));
    localStorage.setItem('leaveplz-loop-overrides', JSON.stringify(state.loopOverrides));
  }
  renderSounds();
}

function toggleSectionLoopDefault(sectionId) {
  const nextValue = !sectionLoopDefault(sectionId);
  state.sectionLoopDefaults[sectionId] = nextValue;
  localStorage.setItem('leaveplz-section-loop-defaults', JSON.stringify(state.sectionLoopDefaults));
  renderSounds();
  showToast(nextValue ? 'Автоповтор категории включён' : 'Автоповтор категории выключен');
}

function pauseAllSounds() {
  if (isDiscordOutput()) {
    if (state.fadeEnabled) {
      state.activeSounds.forEach((item) => addDiscordFadeOutTrack(makeDiscordSoundTrack(item)));
    }
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
  if (isDiscordOutput() && state.fadeEnabled) {
    state.activeSounds.forEach((item) => addDiscordFadeOutTrack(makeDiscordSoundTrack(item)));
    state.activeSounds.forEach(clearSoundEndTimer);
    state.activeSounds.clear();
    renderSounds();
    syncDiscordMix().catch((error) => showToast(error.message));
    return;
  }
  [...state.activeSounds.keys()].forEach(stopSound);
  if (isDiscordOutput()) {
    queueDiscordMixSync();
  }
}

async function playMusicFrom(index = state.playlistIndex, options = {}) {
  const tracks = currentTracks();
  if (!tracks.length) return;
  const outgoingDiscordMusic = isDiscordOutput() && state.fadeEnabled ? makeCurrentDiscordMusicTrack() : null;
  state.playlistIndex = (index + tracks.length) % tracks.length;
  const track = tracks[state.playlistIndex];

  const media = state.music.find((item) => item.id === track.id) || state.sounds.find((item) => item.id === track.id);
  if (!media) return;
  state.currentMusic = media;
  state.currentExternalMusic = null;

  if (isDiscordOutput()) {
    addDiscordFadeOutTrack(outgoingDiscordMusic);
    state.musicAudio.pause();
    state.musicAudio.removeAttribute('src');
    state.musicAudio.load();
    media.duration = await mediaDuration(media.id);
    startDiscordMusicClock(0);
    await syncDiscordMix();
    updateNowPlaying();
    showToast('Музыка добавлена в Discord-микс');
    return;
  }

  const shouldFadeOut = state.fadeEnabled && !state.musicAudio.paused && state.musicAudio.src;
  if (shouldFadeOut) await fadeAudio(state.musicAudio, 0);
  state.musicAudio.src = `/audio/${encodeURIComponent(media.id)}`;
  state.musicAudio.volume = state.fadeEnabled ? 0 : targetMusicVolume();
  if (state.segmentLoop && state.segmentEnd > state.segmentStart) {
    state.musicAudio.currentTime = state.segmentStart;
  }
  await state.musicAudio.play();
  fadeAudio(state.musicAudio, targetMusicVolume()).catch(() => {});
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

async function toggleMusic() {
  if (!state.currentMusic && !state.currentExternalMusic) {
    playMusicFrom(0).catch((error) => showToast(error.message));
    return;
  }
  if (isDiscordOutput()) {
    addDiscordFadeOutTrack(makeCurrentDiscordMusicTrack());
    state.currentMusic = null;
    state.currentExternalMusic = null;
    resetDiscordMusicClock();
    syncDiscordMix()
      .then(() => updateNowPlaying())
      .catch((error) => showToast(error.message));
    return;
  }
  if (state.musicAudio.paused) {
    if (state.fadeEnabled) state.musicAudio.volume = 0;
    await state.musicAudio.play();
    fadeAudio(state.musicAudio, targetMusicVolume()).catch(() => {});
  } else if (state.fadeEnabled) {
    await fadeAudio(state.musicAudio, 0);
    state.musicAudio.pause();
    state.musicAudio.volume = targetMusicVolume();
  } else {
    state.musicAudio.pause();
  }
  updateNowPlaying();
}

async function loadLibrary() {
  const data = await api('/api/library');
  state.sounds = data.sounds;
  state.music = data.music;
  state.sections = data.sections?.length ? data.sections : fallbackSections;
  populateSoundCategorySelects();
  renderSounds();
  renderPlaylist();
  renderAssignSoundList();
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
  localStorage.setItem('leaveplz-favorites-only', String(state.favoritesOnly));
  localStorage.setItem('leaveplz-favorites', JSON.stringify([...state.favoriteIds]));
  localStorage.setItem('leaveplz-collapsed-sections', JSON.stringify([...state.collapsedSections]));
  localStorage.setItem('leaveplz-loop-overrides', JSON.stringify(state.loopOverrides));
  localStorage.setItem('leaveplz-section-loop-defaults', JSON.stringify(state.sectionLoopDefaults));
  localStorage.setItem('leaveplz-repeat-track', String(state.repeatTrack));
  localStorage.setItem('leaveplz-fade-enabled', String(state.fadeEnabled));
  localStorage.setItem('leaveplz-segment-loop', String(state.segmentLoop));
  saveSegmentBounds();
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

function populateSoundCategorySelects() {
  const sectionOptions = state.sections.map((item) => `<option value="${item.id}" data-name="${escapeHtml(item.name)}" data-image="${escapeHtml(item.image || 'situations.jpg')}">${escapeHtml(item.name)}</option>`).join('');
  const allOptions = state.sections.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}${item.builtIn === false ? '' : ' · стандартная'}</option>`).join('');
  const uploadValues = selectedValues(elements.uploadSection);
  const editValues = selectedValues(elements.editSection);
  const editCategory = elements.soundCategoryEditSelect.value;
  const assignCategory = elements.assignSoundCategory.value;
  const deleteCategory = elements.deleteSoundCategorySelect.value;

  elements.uploadSection.innerHTML = sectionOptions;
  elements.editSection.innerHTML = sectionOptions;
  elements.soundCategoryEditSelect.innerHTML = allOptions;
  elements.assignSoundCategory.innerHTML = allOptions;
  elements.deleteSoundCategorySelect.innerHTML = allOptions;

  setSelectedValues(elements.uploadSection, uploadValues.length ? uploadValues : ['effects']);
  setSelectedValues(elements.editSection, editValues.length ? editValues : ['effects']);
  restoreSelectValue(elements.soundCategoryEditSelect, editCategory || state.sections[0]?.id || 'effects');
  restoreSelectValue(elements.assignSoundCategory, assignCategory || state.sections[0]?.id || 'effects');
  restoreSelectValue(elements.deleteSoundCategorySelect, deleteCategory || state.sections[0]?.id || 'effects');
  populateSoundCategoryEditor();
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
  const newSoundCategoryValue = elements.newSoundCategoryImage.value;
  const soundCategoryEditValue = elements.soundCategoryEditImage.value;
  const options = [
    '<option value="">Автоматически</option>',
    ...state.previewImages.map((image) => `<option value="${escapeHtml(image.name)}">${escapeHtml(image.label)}</option>`)
  ].join('');

  elements.uploadImage.innerHTML = options;
  elements.editImage.innerHTML = options;
  elements.newThemeImage.innerHTML = options;
  elements.themeEditImage.innerHTML = options;
  elements.newSoundCategoryImage.innerHTML = options;
  elements.soundCategoryEditImage.innerHTML = options;
  restoreSelectValue(elements.uploadImage, uploadValue);
  restoreSelectValue(elements.editImage, editValue);
  restoreSelectValue(elements.newThemeImage, newThemeValue);
  restoreSelectValue(elements.themeEditImage, themeEditValue);
  restoreSelectValue(elements.newSoundCategoryImage, newSoundCategoryValue);
  restoreSelectValue(elements.soundCategoryEditImage, soundCategoryEditValue);
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
  updateImagePreview(elements.newSoundCategoryImagePreview, elements.newSoundCategoryImage.value || 'situations.jpg');
  updateImagePreview(elements.soundCategoryEditImagePreview, elements.soundCategoryEditImage.value || selectedSoundCategoryForEdit()?.image || 'situations.jpg');
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
  const sectionIds = selectedValues(elements.uploadSection);
  const form = new FormData();
  form.set('file', file);
  form.set('title', elements.uploadTitle.value.trim() || file.name.replace(/\.[^.]+$/, ''));
  form.set('type', type);
  form.set('themeId', type === 'music' ? elements.uploadTheme.value : '');
  form.set('sectionIds', type === 'sound' ? JSON.stringify(sectionIds.length ? sectionIds : ['effects']) : '[]');
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

async function createSoundCategory() {
  const name = elements.newSoundCategoryTitle.value.trim();
  if (!name) {
    showToast('Укажи название категории');
    return;
  }

  elements.adminStatus.textContent = 'Создание категории...';
  const created = await api('/api/admin/sound-categories', {
    method: 'POST',
    headers: { 'x-admin-password': state.adminPassword },
    body: JSON.stringify({
      name,
      image: elements.newSoundCategoryImage.value || 'situations.jpg'
    })
  });
  elements.newSoundCategoryTitle.value = '';
  await loadLibrary();
  setSelectedValues(elements.uploadSection, [created.id]);
  elements.assignSoundCategory.value = created.id;
  elements.adminStatus.textContent = 'Категория создана';
  showToast('Категория добавлена');
}

function selectedSoundCategoryForEdit() {
  return state.sections.find((section) => section.id === elements.soundCategoryEditSelect.value) || state.sections[0];
}

function populateSoundCategoryEditor() {
  const category = selectedSoundCategoryForEdit();
  if (!category) return;
  elements.soundCategoryEditTitle.value = category.name || '';
  elements.soundCategoryEditImage.value = category.image || '';
  updateAdminImagePreviews();
}

async function saveSoundCategory() {
  const category = selectedSoundCategoryForEdit();
  if (!category) {
    showToast('Выбери категорию');
    return;
  }

  elements.adminStatus.textContent = 'Сохранение категории...';
  const saved = await api(`/api/admin/sound-categories/${encodeURIComponent(category.id)}`, {
    method: 'PUT',
    headers: { 'x-admin-password': state.adminPassword },
    body: JSON.stringify({
      name: elements.soundCategoryEditTitle.value.trim() || category.name,
      image: elements.soundCategoryEditImage.value || category.image || 'situations.jpg'
    })
  });
  await loadLibrary();
  elements.soundCategoryEditSelect.value = saved.id;
  populateSoundCategoryEditor();
  elements.adminStatus.textContent = 'Категория сохранена';
  showToast('Категория обновлена');
}

async function deleteSoundCategory() {
  const id = elements.deleteSoundCategorySelect.value;
  const category = state.sections.find((item) => item.id === id);
  if (!id || !category) {
    showToast('Выбери категорию');
    return;
  }
  if (!confirm(`Удалить категорию "${category.name}"? Звуки останутся на сервере и не будут удалены.`)) return;

  elements.adminStatus.textContent = 'Удаление категории...';
  await api(`/api/admin/sound-categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': state.adminPassword }
  });
  delete state.sectionLoopDefaults[id];
  localStorage.setItem('leaveplz-section-loop-defaults', JSON.stringify(state.sectionLoopDefaults));
  await loadLibrary();
  elements.adminStatus.textContent = 'Категория удалена';
  showToast('Категория удалена, звуки остались');
}

function renderAssignSoundList() {
  const query = normalize(elements.assignSoundSearch.value);
  const items = state.sounds.filter((sound) => !query || textFor(sound).includes(query));
  elements.assignSoundSelect.innerHTML = items.map((sound) => {
    const categories = categoryIdsForSound(sound)
      .map((id) => state.sections.find((section) => section.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    return `<option value="${sound.id}">${escapeHtml(sound.title)} · ${escapeHtml(categories)}</option>`;
  }).join('') || '<option value="">Ничего не найдено</option>';
}

async function assignExistingSoundToCategory() {
  const sound = state.sounds.find((item) => item.id === elements.assignSoundSelect.value);
  const categoryId = elements.assignSoundCategory.value;
  if (!sound || !categoryId) {
    showToast('Выбери звук и категорию');
    return;
  }

  const sectionIds = [...new Set([...categoryIdsForSound(sound), categoryId])];
  await saveSoundCategoryAssignment(sound, sectionIds);
  showToast('Звук добавлен в категорию');
}

async function saveSoundCategoryAssignment(sound, sectionIds) {
  const form = new FormData();
  form.set('title', sound.title);
  form.set('type', 'sound');
  form.set('sectionIds', JSON.stringify(sectionIds));
  form.set('image', sound.image || '');

  elements.adminStatus.textContent = 'Сохранение категорий...';
  await api(`/api/admin/media/${encodeURIComponent(sound.id)}`, {
    method: 'PUT',
    headers: { 'x-admin-password': state.adminPassword },
    body: form
  });
  await loadLibrary();
  renderAdminMediaList();
  elements.adminStatus.textContent = 'Категории обновлены';
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
  elements.adminDeleteTheme.disabled = Boolean(current.builtIn);
  elements.adminDeleteTheme.title = current.builtIn ? 'Стандартную тему нельзя удалить, но её плейлист можно очистить.' : '';
  const byId = new Map(state.music.map((track) => [track.id, track]));
  const playlistIds = Array.isArray(current.tracks)
    ? current.tracks.filter((id) => byId.has(id))
    : state.music.filter((track) => track.themeId === current.id).map((track) => track.id);
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

async function previewThemeTrack(source) {
  const select = source === 'playlist' ? elements.themePlaylistTracks : elements.themeMusicSource;
  const id = select.value;
  const track = state.music.find((item) => item.id === id);
  if (!track) {
    showToast('Выбери трек для предпрослушивания');
    return;
  }

  adminPreviewAudio.pause();
  adminPreviewAudio.src = `/audio/${encodeURIComponent(track.id)}`;
  adminPreviewAudio.volume = state.masterVolume * state.musicVolume;
  await adminPreviewAudio.play();
  elements.themePreviewStatus.textContent = `Сейчас играет: ${track.title}`;
}

function stopThemePreview() {
  adminPreviewAudio.pause();
  adminPreviewAudio.removeAttribute('src');
  adminPreviewAudio.load();
  elements.themePreviewStatus.textContent = 'Предпрослушивание остановлено';
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

async function deleteEditedTheme() {
  const current = selectedThemeForEdit();
  if (!current) {
    showToast('Выбери тему');
    return;
  }

  if (!confirm(`Удалить тему "${current.name}"? Плейлист темы будет удалён, но сами треки останутся.`)) return;

  elements.adminStatus.textContent = 'Удаление темы...';
  await api(`/api/admin/themes/${encodeURIComponent(current.id)}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': state.adminPassword }
  });
  await loadThemes();
  if (state.selectedTheme === current.id) state.selectedTheme = themes.find((item) => item.id === 'tavern')?.id || themes[0]?.id || 'tavern';
  applyTheme();
  restoreSelectValue(elements.themeEditSelect, state.selectedTheme);
  populateThemeEditor();
  elements.adminStatus.textContent = 'Тема удалена';
  showToast('Тема удалена, треки остались в медиатеке');
}

async function clearEditedThemePlaylist() {
  const current = selectedThemeForEdit();
  if (!current) {
    showToast('Выбери тему');
    return;
  }

  if (!confirm(`Очистить плейлист темы "${current.name}"? Сами треки останутся в медиатеке.`)) return;

  elements.adminStatus.textContent = 'Очистка плейлиста...';
  const saved = await api(`/api/admin/themes/${encodeURIComponent(current.id)}`, {
    method: 'PUT',
    headers: { 'x-admin-password': state.adminPassword },
    body: JSON.stringify({
      name: elements.themeEditTitle.value.trim() || current.name,
      image: elements.themeEditImage.value || current.image,
      tracks: []
    })
  });
  await loadThemes();
  state.selectedTheme = saved.id;
  applyTheme();
  elements.themeEditSelect.value = saved.id;
  populateThemeEditor();
  elements.adminStatus.textContent = 'Плейлист очищен';
  showToast('Плейлист темы очищен, треки остались');
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
      : categoryIdsForSound(item)
        .map((id) => state.sections.find((section) => section.id === id)?.name)
        .filter(Boolean)
        .join(', ');
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
  setSelectedValues(elements.editSection, categoryIdsForSound(item));
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
  const sectionIds = selectedValues(elements.editSection);
  const form = new FormData();
  form.set('title', elements.editTitle.value.trim() || item.title);
  form.set('type', type);
  form.set('themeId', type === 'music' ? elements.editTheme.value : '');
  form.set('sectionIds', type === 'sound' ? JSON.stringify(sectionIds.length ? sectionIds : ['effects']) : '[]');
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
  resetShuffle();
  state.playlistIndex = 0;
  state.musicAudio.pause();
  state.currentMusic = null;
  state.currentExternalMusic = null;
  resetDiscordMusicClock();
  applyTheme();
});

elements.searchInput.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderSounds();
});

elements.favoritesOnly.checked = state.favoritesOnly;
elements.favoritesOnly.addEventListener('change', (event) => {
  state.favoritesOnly = event.target.checked;
  localStorage.setItem('leaveplz-favorites-only', String(state.favoritesOnly));
  renderSounds();
});

elements.soundsContainer.addEventListener('click', async (event) => {
  const sectionLoop = event.target.closest('[data-section-loop]');
  if (sectionLoop) {
    toggleSectionLoopDefault(sectionLoop.dataset.sectionLoop);
    return;
  }

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
    if (button.dataset.action === 'toggle') await startSound(id, { sectionId: button.dataset.sectionId });
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
    if (item.audio) item.audio.volume = targetSoundVolume(item);
  });
  state.musicAudio.volume = targetMusicVolume();
  queueDiscordMixSync();
});

elements.musicVolume.value = state.musicVolume;
elements.musicVolumeLabel.textContent = `${Math.round(state.musicVolume * 100)}%`;
elements.musicVolume.addEventListener('input', (event) => {
  state.musicVolume = Number(event.target.value);
  elements.musicVolumeLabel.textContent = `${Math.round(state.musicVolume * 100)}%`;
  state.musicAudio.volume = targetMusicVolume();
  queueDiscordMixSync();
});

elements.pauseAll.addEventListener('click', pauseAllSounds);
elements.stopAll.addEventListener('click', stopAllSounds);
elements.saveSettings.addEventListener('click', saveSettings);
elements.mainPlayToggle.addEventListener('click', () => toggleMusic().catch((error) => showToast(error.message)));
elements.playPlaylist.addEventListener('click', () => playMusicFrom(state.playlistIndex).catch((error) => showToast(error.message)));
elements.prevTrack.addEventListener('click', () => playMusicFrom(state.shuffleEnabled ? previousShuffleIndex() : state.playlistIndex - 1, { preserveShuffle: true }).catch((error) => showToast(error.message)));
elements.nextTrack.addEventListener('click', () => playMusicFrom(state.shuffleEnabled ? nextShuffleIndex() : state.playlistIndex + 1, { preserveShuffle: true }).catch((error) => showToast(error.message)));
elements.shufflePlaylist.addEventListener('click', () => {
  const tracks = currentTracks();
  if (!tracks.length) return showToast('В этой теме нет музыки');
  state.shuffleEnabled = !state.shuffleEnabled;
  if (state.shuffleEnabled) {
    buildShuffleQueue(-1);
    playMusicFrom(nextShuffleIndex(), { preserveShuffle: true }).catch((error) => showToast(error.message));
  } else {
    state.shuffleQueue = [];
    updateMusicModeButtons();
  }
});
elements.repeatPlaylist.addEventListener('click', () => {
  state.repeatTrack = !state.repeatTrack;
  localStorage.setItem('leaveplz-repeat-track', String(state.repeatTrack));
  updateMusicModeButtons();
  showToast(state.repeatTrack ? 'Повтор текущего трека включён' : 'Повтор текущего трека выключен');
});
elements.fadeEnabled.addEventListener('change', () => {
  state.fadeEnabled = elements.fadeEnabled.checked;
  localStorage.setItem('leaveplz-fade-enabled', String(state.fadeEnabled));
  updateMusicModeButtons();
});
elements.musicProgress.addEventListener('input', () => {
  state.isSeeking = true;
  elements.musicCurrentTime.textContent = formatTime(elements.musicProgress.value);
});
elements.musicProgress.addEventListener('change', () => {
  const position = Number(elements.musicProgress.value) || 0;
  if (isDiscordOutput() && state.currentMusic) {
    startDiscordMusicClock(position);
    syncDiscordMix().catch((error) => showToast(error.message));
  } else if (!isDiscordOutput()) {
    state.musicAudio.currentTime = position;
  }
  if (!isDiscordOutput() && state.segmentLoop && state.segmentEnd > state.segmentStart && position >= state.segmentEnd) {
    state.musicAudio.currentTime = state.segmentStart;
  }
  state.isSeeking = false;
  updateTimelineUi();
});
elements.segmentLoop.addEventListener('change', () => {
  state.segmentLoop = elements.segmentLoop.checked;
  const duration = musicDuration();
  if (state.segmentLoop && duration && (!state.segmentEnd || state.segmentEnd <= state.segmentStart)) {
    state.segmentStart = 0;
    state.segmentEnd = duration;
  }
  localStorage.setItem('leaveplz-segment-loop', String(state.segmentLoop));
  saveSegmentBounds();
  updateTimelineUi();
});
elements.segmentStart.addEventListener('input', () => {
  state.segmentStart = Math.min(Number(elements.segmentStart.value) || 0, Math.max(0, state.segmentEnd - 1));
  saveSegmentBounds();
  updateTimelineUi();
});
elements.segmentEnd.addEventListener('input', () => {
  state.segmentEnd = Math.max(Number(elements.segmentEnd.value) || 0, state.segmentStart + 1);
  saveSegmentBounds();
  updateTimelineUi();
});

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
      resetShuffle();
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
elements.adminClose.addEventListener('click', () => {
  stopThemePreview();
  elements.adminDialog.close();
});
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
elements.newSoundCategoryImage.addEventListener('change', updateAdminImagePreviews);
elements.soundCategoryEditSelect.addEventListener('change', populateSoundCategoryEditor);
elements.soundCategoryEditImage.addEventListener('change', updateAdminImagePreviews);
elements.uploadCoverButton.addEventListener('click', () => uploadCoverImage(elements.uploadCoverFile, elements.uploadImage).catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.newThemeCoverUpload.addEventListener('click', () => uploadCoverImage(elements.newThemeCoverFile, elements.newThemeImage).catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.newSoundCategoryCoverUpload.addEventListener('click', () => uploadCoverImage(elements.newSoundCategoryCoverFile, elements.newSoundCategoryImage).catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.soundCategoryEditCoverUpload.addEventListener('click', () => uploadCoverImage(elements.soundCategoryEditCoverFile, elements.soundCategoryEditImage).catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminCreateTheme.addEventListener('click', () => createMusicTheme().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminCreateSoundCategory.addEventListener('click', () => createSoundCategory().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminSaveSoundCategory.addEventListener('click', () => saveSoundCategory().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminDeleteSoundCategory.addEventListener('click', () => deleteSoundCategory().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.assignSoundSearch.addEventListener('input', renderAssignSoundList);
elements.adminAssignSoundCategory.addEventListener('click', () => assignExistingSoundToCategory().catch((error) => {
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
elements.themePreviewSource.addEventListener('click', () => previewThemeTrack('source').catch((error) => showToast(error.message)));
elements.themePreviewPlaylist.addEventListener('click', () => previewThemeTrack('playlist').catch((error) => showToast(error.message)));
elements.themePreviewStop.addEventListener('click', stopThemePreview);
elements.adminSaveTheme.addEventListener('click', () => saveEditedTheme().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminClearThemePlaylist.addEventListener('click', () => clearEditedThemePlaylist().catch((error) => {
  elements.adminStatus.textContent = error.message;
  showToast(error.message);
}));
elements.adminDeleteTheme.addEventListener('click', () => deleteEditedTheme().catch((error) => {
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
setInterval(updateTimelineUi, 500);
