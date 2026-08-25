import fs from 'node:fs/promises';
import path from 'node:path';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac']);

const EFFECT_RULES = [
  ['nature', 'Природа', 'nature.jpg', [
    ['Слабый дождь', 'light-rain.webp', ['heavy-rainy']],
    ['Сильный дождь', 'heavy-rain.webp', ['heavy rain', 'strong rain']],
    ['Лёгкий ветер', 'light-wind.webp', ['light wind']],
    ['Сильный ветер', 'strong-wind.webp', ['strong wind']],
    ['Гром', 'thunder.webp', ['thunder', 'гром']],
    ['Река', 'river.webp', ['the-river-flows', 'the-river']],
    ['Сильная река', 'strong-river.webp', ['strong river']],
    ['Капли воды', 'water-drops.webp', ['water drops', 'drips', 'dripping', 'капл']],
    ['Водопад', 'waterfall.webp', ['waterfall']],
    ['Огонь', 'fire.webp', ['bonfire']],
    ['Лава', 'lava.webp', ['lava']],
    ['Сверчки', 'crickets.webp', ['cricket']],
    ['Бульканье болота', 'swamp-bubbles.webp', ['swamp', 'bubble', 'bolota']],
    ['Шаги по снегу', 'snow-footsteps.webp', ['steps-on-an-icy-surface-crunching-snow']]
  ]],
  ['battle', 'Бой', 'battle.webp', [
    ['Битва', 'battle.webp', ['battlefield', 'battle in', 'battle ', 'combat']],
    ['Барабаны', 'drums.webp', ['drum', 'battledrums']],
    ['Цепи', 'chains.webp', ['chain']],
    ['Сердцебиение', 'heartbeat.webp', ['heartbeat']],
    ['Кости', 'skeletons.webp', ['bones', 'skeleton']]
  ]],
  ['town', 'Город', 'city.webp', [
    ['Городской шум', 'city-hum.webp', ['bar-pub-crowd-environmental-sounds']],
    ['Городской шум', 'city-hum.webp', ['city hum']],
    ['Таверна: голоса', 'tavern-hum.webp', ['tavern hum', 'pub crowd', 'bar pub']],
    ['Кузница', 'blacksmith.webp', ['blacksmith', 'anvil', 'forge']],
    ['Колокола', 'bells.webp', ['bell', 'kolokol']],
    ['Посуда', 'dishes.webp', ['dishes']],
    ['Жарка еды', 'frying-food.webp', ['frying']]
  ]],
  ['dungeon', 'Подземелье', 'dungeon.webp', [
    ['Пещерная вода', 'cave-water.webp', ['cave water']],
    ['Цепи', 'chains.webp', ['chain']],
    ['Призрачный шёпот', 'ghost-whispers.webp', ['ghost', 'whisper']]
  ]],
  ['creatures', 'Существа', 'monsters.jpg', [
    ['Рёв дракона', 'dragon-roar.webp', ['dragon roar']],
    ['Полёт дракона', 'dragon-flight.webp', ['dragon flight']],
    ['Мяуканье кота', 'cat-meow.webp', ['cat', 'meow']],
    ['Вой волков', 'wolves-howl.webp', ['wolves', 'howl']],
    ['Рычание волка', 'wolf-growl.webp', ['wolf growl']],
    ['Зомби', 'zombie.webp', ['zombie']],
    ['Змея', 'snake.webp', ['snake']],
    ['Вороны', 'crows.webp', ['crow']],
    ['Совы', 'owl.webp', ['owl']],
    ['Лягушки', 'frogs.webp', ['frog']],
    ['Мужской крик', 'male-scream.webp', ['male scream']],
    ['Женский крик', 'female-scream.webp', ['female scream']],
    ['Мужской смех', 'male-laugh.webp', ['male laugh']],
    ['Женский смех', 'female-laugh.webp', ['female laugh']],
    ['Плач ребёнка', 'baby-cry.webp', ['baby cry']]
  ]],
  ['effects', 'Эффекты', 'situations.jpg', [
    ['Разбитое стекло', 'breaking-glass.webp', ['breaking glass', 'glass']],
    ['Падающее дерево', 'falling-tree.webp', ['falling tree', 'tree fall']],
    ['Свист поезда', 'train-whistle.webp', ['train whistle']],
    ['Поезд', 'train.webp', ['train']],
    ['Кипящая вода', 'boiling-water.webp', ['boiling']],
    ['Цокот копыт', 'hooves.webp', ['hooves']],
    ['Горящие дома', 'burning-houses.webp', ['burning houses']]
  ]]
];

const EXACT_EFFECTS = [
  ['breaking-bones-skeleton', { sectionId: 'battle', sectionName: 'Бой', title: 'Кости', image: 'skeletons.webp' }],
  ['medieval-battle-knights-in-armor-clash-of-swords', { sectionId: 'battle', sectionName: 'Бой', title: 'Звуки мечей', image: 'battle.webp' }],
  ['bar-pub-crowd-environmental-sounds', { sectionId: 'town', sectionName: 'Город', title: 'Городской шум', image: 'city-hum.webp' }],
  ['zvon-cerkovnyx-srednevekovyx-kolokolov', { sectionId: 'town', sectionName: 'Город', title: 'Колокола', image: 'bells.webp' }],
  ['dungeon crawler', { sectionId: 'dungeon', sectionName: 'Подземелье', title: 'Подземелье', image: 'dungeon.webp' }],
  ['animal-cat-or-cat-meows', { sectionId: 'creatures', sectionName: 'Существа', title: 'Мяуканье кота', image: 'cat-meow.webp' }],
  ['the-dragon-growls-hisses-releases-flames', { sectionId: 'creatures', sectionName: 'Существа', title: 'Медведь', image: 'monsters.jpg' }],
  ['wolf-growl', { sectionId: 'creatures', sectionName: 'Существа', title: 'Злая собака', image: 'wolf-growl.webp' }]
];

const FORCED_MUSIC = [
  'a lonely strain',
  'quiet-rain',
  'rain of arrows',
  'slow-moving-train-noise',
  'it begins to snow',
  'leafwind',
  'celtic fire',
  'fireflies',
  'icefire',
  'i see fire',
  'echoes from a restless sea',
  'enchanted oceans',
  'ice pretty lights in the ocean',
  'in search of the divine',
  'pride of the seas',
  'sea of sand',
  'sea shanty',
  'queen s high seas',
  'venerable forest',
  'a tavern on the riverbank',
  'down by the river',
  'rivermoor',
  'river of dreams',
  'river s dance',
  'all drums go to valhalla',
  'battledrums',
  'dragon drums',
  'battlefield',
  'battle in the warrens',
  'battle is on',
  'battle of the gods',
  'combat drums',
  'combat in the ruins',
  'get ready for battle',
  'pen paper battle',
  'tabletop combat',
  'trespasser qunari battle',
  'wasteland war combat',
  'crew of skeletons',
  'airship battle',
  'battlefront',
  'battlejack',
  'boss battle',
  'medieval battle',
  'old time battles',
  'lincoln and liberty the liberty bell',
  'magnum bellum',
  'the belly of the beast',
  'dragonforge',
  'the-sound-of-frying-food',
  'the sound of frying food',
  'anvil-blacksmith-forge',
  'anvil blacksmith forge',
  'a tale of dungeons and dragons',
  'ghost-voices',
  'ghost voices',
  'ghostly corridors',
  'ghost forest',
  'the whispered one',
  'whisperwood',
  'ballad of the cats',
  'catalysts for her awakening',
  'shadowlight'
];

const THEME_RULES = [
  ['battle', ['battle', 'combat', 'war', 'charge', 'horde', 'counterstrike', 'rage', 'glory', 'valhalla']],
  ['boss', ['boss', 'epic', 'apocalypse', 'colossus', 'zargothrax', 'gods']],
  ['tavern', ['tavern', 'inn', 'ale', 'beer', 'bard', 'lute', 'folk', 'faire', 'hornpipes', 'boar inn']],
  ['dungeon', ['dungeon', 'crypt', 'cave', 'mine', 'underdark', 'ruins', 'cellar', 'abyss']],
  ['mystery', ['dark', 'ghost', 'unholy', 'dream', 'nocturne', 'celestial', 'arcane', 'mystic', 'apotheosis']],
  ['town', ['city', 'town', 'village', 'market', 'gate', 'harbor', 'brackenbury']],
  ['journey', ['journey', 'road', 'forest', 'wild', 'winds', 'traveller', 'quest', 'mountain', 'lakeside']],
  ['ocean', ['ocean', 'sea', 'ship', 'harbor', 'sail', 'river', 'tortuga']],
  ['festival', ['festival', 'faire', 'dance', 'folk', 'ale', 'lute', 'hornpipe']]
];

const TITLE_WORDS = {
  rain: 'дождь',
  thunder: 'гром',
  wind: 'ветер',
  river: 'река',
  waterfall: 'водопад',
  ocean: 'океан',
  fire: 'огонь',
  lava: 'лава',
  swamp: 'болото',
  battle: 'битва',
  combat: 'бой',
  drums: 'барабаны',
  heartbeat: 'сердцебиение',
  chains: 'цепи',
  tavern: 'таверна',
  inn: 'трактир',
  city: 'город',
  village: 'деревня',
  dungeon: 'подземелье',
  crypt: 'склеп',
  cave: 'пещера',
  dragon: 'дракон',
  zombie: 'зомби',
  wolf: 'волк',
  cat: 'кот',
  ghost: 'призрак',
  whispers: 'шёпот',
  train: 'поезд',
  bells: 'колокола'
};

function cleanBase(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/spotdown_org/gi, '')
    .replace(/www_lightaudio_ru/gi, '')
    .replace(/mp3cut_net/gi, '')
    .replace(/optimized/gi, '')
    .replace(/\bfrom\b/gi, 'из')
    .replace(/__+/g, ' ')
    .replace(/_+/g, ' ')
    .replace(/\s+\(\d+\)$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.length <= 2 ? lower : `${lower[0].toUpperCase()}${lower.slice(1)}`;
    })
    .join(' ');
}

function humanizeMusicTitle(fileName) {
  const base = cleanBase(fileName)
    .replace(/\s+-\s+/g, ': ')
    .replace(/\s+\(1\)$/g, '')
    .trim();
  return base ? titleCase(base) : 'Без названия';
}

function humanizeEffectTitle(fileName, fallback) {
  if (fallback) return fallback;
  const base = cleanBase(fileName);
  const translated = base
    .split(/\s+/)
    .map((word) => TITLE_WORDS[word.toLowerCase()] || word)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return translated ? titleCase(translated) : 'Без названия';
}

function stableId(relativePath) {
  return Buffer.from(relativePath, 'utf8').toString('base64url');
}

function textFor(fileName) {
  return cleanBase(fileName).toLowerCase();
}

function textIncludes(text, key) {
  if (/^[a-z]+$/i.test(key)) {
    return new RegExp(`\\b${key}\\b`, 'i').test(text);
  }
  return text.includes(key);
}

function effectMatch(fileName) {
  const text = textFor(fileName);
  const exact = EXACT_EFFECTS.find(([key]) => text.includes(key));
  if (exact) return exact[1];
  if (fileName.toLowerCase().includes('spotdown_org')) return null;
  if (FORCED_MUSIC.some((key) => text.includes(key))) return null;

  for (const [sectionId, sectionName, sectionImage, rules] of EFFECT_RULES) {
    for (const [title, image, keys] of rules) {
      if (keys.some((key) => textIncludes(text, key))) {
        return { sectionId, sectionName, title, image };
      }
    }
    if (sectionId !== 'effects' && text.includes(sectionId)) {
      return { sectionId, sectionName, title: '', image: sectionImage };
    }
  }
  return null;
}

function themeFor(fileName) {
  const text = textFor(fileName);
  const found = THEME_RULES.find(([, keys]) => keys.some((key) => text.includes(key)));
  return found ? found[0] : 'journey';
}

async function walkAudio(dir, root = dir, source = 'archive') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkAudio(fullPath, root, source));
      continue;
    }

    if (!AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

    const relativePath = path.relative(root, fullPath);
    const stat = await fs.stat(fullPath);
    const effect = effectMatch(entry.name);
    const type = effect ? 'sound' : 'music';

    files.push({
      id: stableId(`${source}:${relativePath}`),
      file: relativePath,
      title: type === 'sound' ? humanizeEffectTitle(entry.name, effect.title) : humanizeMusicTitle(entry.name),
      originalTitle: cleanBase(entry.name),
      type,
      source,
      sectionId: effect?.sectionId || 'music',
      sectionName: effect?.sectionName || 'Музыка',
      themeId: type === 'music' ? themeFor(entry.name) : null,
      image: effect?.image || null,
      bytes: stat.size
    });
  }

  return files;
}

export async function readArchive(audioDir) {
  try {
    const media = await walkAudio(audioDir, audioDir, 'archive');
    return media.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export function mergeUploadedMedia(archive, uploadedMedia) {
  return [...archive, ...uploadedMedia].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}

export function splitMedia(media) {
  return {
    sounds: media.filter((item) => item.type === 'sound'),
    music: media.filter((item) => item.type === 'music')
  };
}

export function sectionDefinitions() {
  return EFFECT_RULES.map(([id, name, image]) => ({ id, name, image }));
}

export function resolveMediaPath(roots, media, requestedId) {
  const item = media.find((entry) => entry.id === requestedId);
  if (!item) return null;

  const root = item.source === 'upload' ? roots.uploads : roots.archive;
  const resolved = path.resolve(root, item.file);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(`${rootResolved}${path.sep}`)) return null;

  return { item, path: resolved };
}
