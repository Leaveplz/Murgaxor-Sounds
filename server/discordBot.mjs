import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';
import play from 'play-dl';
import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus
} from '@discordjs/voice';

const BRAND_NAME = 'Murgaxor Sounds';
const ytDlpPath = fileURLToPath(new URL('../tools/yt-dlp.exe', import.meta.url));
let playDlConfigured = false;

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeMediaUrl(value) {
  let text = String(value || '').trim();
  if (!text) return '';
  if (!/^https?:\/\//i.test(text)) text = `https://${text}`;

  const url = new URL(text);
  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  if (host === 'youtu.be') {
    const videoId = url.pathname.split('/').filter(Boolean)[0];
    if (!videoId) throw new Error('Нужна ссылка на конкретное YouTube-видео.');
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'm.youtube.com') {
    if (url.pathname.startsWith('/shorts/')) {
      const videoId = url.pathname.split('/').filter(Boolean)[1];
      if (!videoId) throw new Error('Нужна ссылка на конкретное YouTube-видео.');
      return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    }

    const videoId = url.searchParams.get('v');
    if (videoId) return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    if (url.searchParams.get('list')) throw new Error('Вставь ссылку на одно YouTube-видео, не на плейлист.');
  }

  return url.toString();
}

async function configurePlayDl() {
  if (playDlConfigured) return;
  playDlConfigured = true;
}

function friendlyYoutubeError(error, url) {
  const message = error?.message || String(error);
  console.error('[youtube]', { url, message });
  if (/sign in to confirm|not a bot|captcha|unusual traffic/i.test(message)) {
    return new Error('YouTube просит подтвердить, что запрос не от бота. Обнови cookies-файл из браузера и проверь YTDLP_COOKIES_FILE в .env.');
  }
  if (/page needs to be reloaded/i.test(message)) {
    return new Error('YouTube отклонил текущие cookies: страница требует обновления. Обнови cookies-файл из браузера или временно включи YTDLP_COOKIES_FROM_BROWSER=chrome.');
  }
  if (/Requested format is not available/i.test(message)) {
    return new Error('YouTube не отдал отдельный аудио-поток для этого видео. Попробуй другое обычное видео или обнови yt-dlp.');
  }
  if (/Could not copy Chrome cookie database|database is locked|cookie database/i.test(message)) {
    return new Error('Chrome держит cookies заблокированными. Закрой все окна Chrome и попробуй снова, либо экспортируй cookies в файл и укажи YTDLP_COOKIES_FILE.');
  }
  if (/This is not a YouTube Watch URL|invalid url|not a YouTube url/i.test(message)) {
    return new Error('Не удалось прочитать YouTube URL. Вставь ссылку на одно обычное видео, например https://www.youtube.com/watch?v=...');
  }
  return error;
}

function youtubeAudioStream(url) {
  const env = { ...process.env };
  const cookie = env.YOUTUBE_COOKIE || env.YOUTUBE_COOKIES || '';
  const cookiesFile = env.YTDLP_COOKIES_FILE || '';
  const cookiesFromBrowser = env.YTDLP_COOKIES_FROM_BROWSER || '';
  const args = [
    '--no-playlist',
    '--force-ipv4',
    '--js-runtimes',
    `node:${process.execPath}`,
    '--extractor-args',
    'youtube:player_client=tv,web_safari',
    '--format',
    'best/bestaudio/b',
    '--output',
    '-'
  ];
  if (cookiesFile) args.push('--cookies', cookiesFile);
  else if (cookiesFromBrowser) args.push('--cookies-from-browser', cookiesFromBrowser);
  else if (cookie) args.push('--add-header', `Cookie:${cookie}`);
  args.push(url);

  const helper = spawn(ytDlpPath, args, {
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let errorText = '';
  helper.stderr.on('data', (chunk) => {
    errorText += chunk.toString();
    if (errorText.length > 1000) errorText = errorText.slice(-1000);
  });
  return {
    stream: helper.stdout,
    helper,
    getError: () => errorText.trim()
  };
}

function youtubeMediaUrl(url) {
  const env = { ...process.env };
  const cookie = env.YOUTUBE_COOKIE || env.YOUTUBE_COOKIES || '';
  const cookiesFile = env.YTDLP_COOKIES_FILE || '';
  const cookiesFromBrowser = env.YTDLP_COOKIES_FROM_BROWSER || '';
  const args = [
    '--no-playlist',
    '--force-ipv4',
    '--js-runtimes',
    `node:${process.execPath}`,
    '--extractor-args',
    'youtube:player_client=tv,web_safari',
    '--format',
    'best/bestaudio/b',
    '--get-url'
  ];
  if (cookiesFile) args.push('--cookies', cookiesFile);
  else if (cookiesFromBrowser) args.push('--cookies-from-browser', cookiesFromBrowser);
  else if (cookie) args.push('--add-header', `Cookie:${cookie}`);
  args.push(url);

  return new Promise((resolve, reject) => {
    const helper = spawn(ytDlpPath, args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    let errorText = '';
    helper.stdout.on('data', (chunk) => {
      output += chunk.toString();
      if (output.length > 8000) output = output.slice(-8000);
    });
    helper.stderr.on('data', (chunk) => {
      errorText += chunk.toString();
      if (errorText.length > 2000) errorText = errorText.slice(-2000);
    });
    helper.once('error', reject);
    helper.once('exit', (code) => {
      if (code) {
        reject(new Error(errorText.trim() || `youtube helper exited with code ${code}`));
        return;
      }
      const directUrl = output.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
      if (!directUrl) {
        reject(new Error(errorText.trim() || 'yt-dlp did not return a media URL'));
        return;
      }
      resolve(directUrl);
    });
  });
}

function rejectOnHelperExit(helper, getError) {
  return new Promise((_, reject) => {
    helper.once('exit', (code) => {
      if (helper._expectedStop || !code) return;
      reject(new Error(getError() || `youtube helper exited with code ${code}`));
    });
  });
}

async function waitForAudioPlayer(player, timeout = 8_000) {
  if (player.state.status === AudioPlayerStatus.Playing) return;
  try {
    await entersState(player, AudioPlayerStatus.Playing, timeout);
  } catch (error) {
    if (player.state.status !== AudioPlayerStatus.Playing) throw error;
  }
}

export class DiscordSoundBot {
  constructor({ token, guildId, voiceChannelId, logger = console } = {}) {
    this.token = token;
    this.guildId = guildId;
    this.voiceChannelId = voiceChannelId;
    this.logger = logger;
    this.client = null;
    this.connection = null;
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });
    this.activeProcess = null;
    this.nowPlaying = null;
    this.ready = false;
    this.lastError = null;
    this.playerStatus = this.player.state.status;
    this.connectionStatus = null;
    this.voiceDebug = process.env.DISCORD_VOICE_DEBUG === '1';
    this.activeHelperProcess = null;

    this.player.on('error', (error) => {
      this.lastError = error.message;
      this.nowPlaying = null;
      this.logger.error('[discord-player]', error);
    });

    this.player.on('stateChange', (oldState, newState) => {
      this.playerStatus = newState.status;
      this.logger.log(`[discord-player] ${oldState.status} -> ${newState.status}`);
    });
    if (this.voiceDebug) {
      this.player.on('debug', (message) => this.logger.log(`[discord-player-debug] ${message}`));
    }

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.nowPlaying = null;
      this.killActiveProcess();
    });
  }

  status() {
    return {
      configured: Boolean(this.token),
      ready: this.ready,
      connected: this.connection?.state.status === VoiceConnectionStatus.Ready,
      guildId: this.guildId || '',
      voiceChannelId: this.voiceChannelId || '',
      nowPlaying: this.nowPlaying,
      playerStatus: this.playerStatus,
      connectionStatus: this.connectionStatus,
      lastError: this.lastError
    };
  }

  async start() {
    if (!this.token) return this.status();
    if (this.client) return this.status();
    await configurePlayDl();

    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
    });

    this.client.once('ready', () => {
      this.ready = true;
      this.logger.log(`[discord] Logged in as ${this.client.user.tag}`);
    });

    try {
      await this.client.login(this.token);
      if (!this.ready) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Discord bot did not become ready in time.')), 15_000);
          this.client.once('ready', () => {
            clearTimeout(timer);
            resolve();
          });
        });
      }
      return this.status();
    } catch (error) {
      this.lastError = error.message;
      this.ready = false;
      this.client?.destroy();
      this.client = null;
      throw error;
    }
  }

  async connect({ guildId, voiceChannelId } = {}) {
    await this.start();
    if (!this.client || !this.ready) throw new Error(this.lastError || 'Discord bot is not authorized.');

    const targetGuildId = guildId || this.guildId;
    const targetChannelId = voiceChannelId || this.voiceChannelId;

    if (!targetGuildId || !targetChannelId) {
      throw new Error('DISCORD_GUILD_ID and DISCORD_VOICE_CHANNEL_ID are required.');
    }

    const guild = await this.client.guilds.fetch(targetGuildId);
    const channel = await guild.channels.fetch(targetChannelId);
    if (!channel?.isVoiceBased?.()) {
      throw new Error('Указанный Voice Channel ID не является голосовым каналом Discord.');
    }

    const me = await guild.members.fetchMe();
    await me.setNickname(BRAND_NAME).catch((error) => {
      this.logger.warn(`[discord] Не удалось сменить ник бота на ${BRAND_NAME}: ${error.message}`);
    });
    const permissions = channel.permissionsFor(me);
    if (!permissions?.has(PermissionFlagsBits.Connect)) {
      throw new Error('У бота нет права Connect для этого голосового канала.');
    }
    if (!permissions?.has(PermissionFlagsBits.Speak)) {
      throw new Error('У бота нет права Speak для этого голосового канала.');
    }

    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
      this.connectionStatus = null;
    }

    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      debug: this.voiceDebug
    });
    if (this.voiceDebug) {
      this.connection.on('debug', (message) => this.logger.log(`[discord-voice-debug] ${message}`));
    }
    this.connection.on('error', (error) => {
      this.lastError = error.message || String(error);
      this.logger.error('[discord-voice-error]', error);
    });

    this.connection.on('stateChange', (oldState, newState) => {
      this.connectionStatus = newState.status;
      this.logger.log(`[discord-voice] ${oldState.status} -> ${newState.status}`);
    });

    this.connection.subscribe(this.player);
    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
      this.connectionStatus = this.connection.state.status;
    } catch (error) {
      this.connectionStatus = this.connection.state.status;
      this.connection.destroy();
      this.connection = null;
      throw new Error(`Discord voice не перешёл в ready (${this.connectionStatus}). Проверь ID голосового канала и права бота.`);
    }
    this.guildId = targetGuildId;
    this.voiceChannelId = targetChannelId;

    return this.status();
  }

  async playLocal(filePath, title = 'Локальный звук', volume = 1) {
    await this.ensureConnected();
    this.stop();
    this.lastError = null;

    const ffmpegProcess = this.spawnOpusStream(['-i', filePath], volume);
    const resource = createAudioResource(ffmpegProcess.stdout, {
      inputType: StreamType.OggOpus,
      metadata: { title }
    });
    this.nowPlaying = { type: 'local', title };
    this.player.play(resource);
    await waitForAudioPlayer(this.player);
    return this.status();
  }

  async playUrl(url, title = 'Внешняя ссылка', volume = 1) {
    const normalizedUrl = normalizeMediaUrl(url);
    if (!isHttpUrl(normalizedUrl)) throw new Error('Only http/https audio URLs are supported.');

    const ytKind = play.yt_validate(normalizedUrl);
    if (ytKind === 'video') {
      let stream;
      try {
        stream = youtubeAudioStream(normalizedUrl);
      } catch (error) {
        throw friendlyYoutubeError(error, normalizedUrl);
      }

      await this.ensureConnected();
      this.stop();
      this.lastError = null;
      this.activeHelperProcess = stream.helper;
      const ffmpegProcess = this.spawnOpusStreamFromReadable(stream.stream, volume);
      stream.helper.once('exit', (code) => {
        if (!stream.helper._expectedStop && code) {
          this.lastError = stream.getError() || `youtube helper exited with code ${code}`;
        }
      });
      const resource = createAudioResource(ffmpegProcess.stdout, {
        inputType: StreamType.OggOpus,
        metadata: { title }
      });
      this.nowPlaying = { type: 'youtube', title, url: normalizedUrl };
      this.player.play(resource);
      await Promise.race([
        waitForAudioPlayer(this.player),
        rejectOnHelperExit(stream.helper, stream.getError)
      ]).catch((error) => {
        throw friendlyYoutubeError(error, normalizedUrl);
      });
      return this.status();
    }
    if (ytKind === 'playlist') throw new Error('Вставь ссылку на одно YouTube-видео, не на плейлист.');

    await this.ensureConnected();
    this.stop();
    this.lastError = null;
    const ffmpegProcess = this.spawnOpusStream(['-i', normalizedUrl], volume);
    const resource = createAudioResource(ffmpegProcess.stdout, {
      inputType: StreamType.OggOpus,
      metadata: { title }
    });
    this.nowPlaying = { type: 'url', title, url: normalizedUrl };
    this.player.play(resource);
    await waitForAudioPlayer(this.player);
    return this.status();
  }

  async playMix(tracks) {
    await this.ensureConnected();
    this.stop();
    this.lastError = null;

    const usable = [];
    for (const track of tracks.slice(0, 12)) {
      if ((track.type === 'youtube' || track.type === 'url') && track.url) {
        const normalizedUrl = normalizeMediaUrl(track.url);
        const ytKind = play.yt_validate(normalizedUrl);
        if (ytKind === 'playlist') throw new Error('Вставь ссылку на одно YouTube-видео, не на плейлист.');
        if (ytKind === 'video') {
          try {
            usable.push({
              ...track,
              type: 'remote',
              input: await youtubeMediaUrl(normalizedUrl),
              title: track.title || 'YouTube URL'
            });
          } catch (error) {
            throw friendlyYoutubeError(error, normalizedUrl);
          }
        } else {
          usable.push({
            ...track,
            type: 'remote',
            input: normalizedUrl,
            title: track.title || 'Внешняя ссылка'
          });
        }
        continue;
      }

      if (track.filePath && fs.existsSync(track.filePath)) {
        usable.push({
          ...track,
          type: 'local',
          input: track.filePath
        });
      }
    }

    if (usable.length === 0) throw new Error('No playable tracks were provided for the mix.');

    const args = ['-hide_banner', '-loglevel', 'error'];
    usable.forEach((track) => {
      if (track.type === 'local' && track.loop) args.push('-stream_loop', '-1');
      const seek = Math.max(0, Number(track.seek || 0));
      if (seek > 0.25) args.push('-ss', seek.toFixed(2));
      args.push('-i', track.input);
    });

    const chains = usable.map((track, index) => {
      const volume = Math.max(0, Math.min(1.5, Number(track.volume ?? 1)));
      return `[${index}:a]volume=${volume.toFixed(3)},aresample=48000[a${index}]`;
    });
    const inputs = usable.map((_, index) => `[a${index}]`).join('');
    const filter = `${chains.join(';')};${inputs}amix=inputs=${usable.length}:duration=longest:dropout_transition=2,volume=1.0[out]`;

    args.push(
      '-filter_complex',
      filter,
      '-map',
      '[out]',
      '-vn',
      '-c:a',
      'libopus',
      '-b:a',
      '128k',
      '-f',
      'ogg',
      'pipe:1'
    );

    const ffmpegProcess = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    this.activeProcess = ffmpegProcess;
    this.pipeProcessErrors(ffmpegProcess);

    const resource = createAudioResource(ffmpegProcess.stdout, {
      inputType: StreamType.OggOpus,
      metadata: { title: 'Локальный микс' }
    });
    this.nowPlaying = {
      type: 'mix',
      title: usable.length === 1 ? (usable[0].title || 'Локальный трек') : 'Музыка и звуки',
      count: usable.length
    };
    this.player.play(resource);
    await waitForAudioPlayer(this.player);
    return this.status();
  }

  stop() {
    this.player.stop(true);
    this.killActiveProcess();
    this.nowPlaying = null;
    this.lastError = null;
    return this.status();
  }

  disconnect() {
    this.stop();
    this.connection?.destroy();
    this.connection = null;
    this.connectionStatus = null;
    return this.status();
  }

  async ensureConnected() {
    if (!this.connection) {
      await this.connect();
    }
  }

  killActiveProcess() {
    if (this.activeProcess && !this.activeProcess.killed) {
      this.activeProcess._expectedStop = true;
      this.activeProcess.kill('SIGKILL');
    }
    this.activeProcess = null;
    if (this.activeHelperProcess && !this.activeHelperProcess.killed) {
      this.activeHelperProcess._expectedStop = true;
      this.activeHelperProcess.kill('SIGKILL');
    }
    this.activeHelperProcess = null;
  }

  spawnOpusStream(inputArgs, volume = 1) {
    const normalizedVolume = Math.max(0, Math.min(1.5, Number(volume ?? 1)));
    const ffmpegProcess = spawn(ffmpeg, [
      '-hide_banner',
      '-loglevel',
      'error',
      ...inputArgs,
      '-vn',
      '-filter:a',
      `volume=${normalizedVolume.toFixed(3)}`,
      '-c:a',
      'libopus',
      '-b:a',
      '128k',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-f',
      'ogg',
      'pipe:1'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    this.activeProcess = ffmpegProcess;
    this.pipeProcessErrors(ffmpegProcess);
    return ffmpegProcess;
  }

  spawnOpusStreamFromReadable(readable, volume = 1) {
    const normalizedVolume = Math.max(0, Math.min(1.5, Number(volume ?? 1)));
    const ffmpegProcess = spawn(ffmpeg, [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-vn',
      '-filter:a',
      `volume=${normalizedVolume.toFixed(3)}`,
      '-c:a',
      'libopus',
      '-b:a',
      '128k',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-f',
      'ogg',
      'pipe:1'
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    this.activeProcess = ffmpegProcess;
    this.pipeProcessErrors(ffmpegProcess);
    readable.once('error', (error) => {
      this.lastError = error.message;
      this.logger.error('[youtube-stream]', error);
      ffmpegProcess.stdin.destroy();
    });
    ffmpegProcess.stdin.on('error', (error) => {
      this.lastError = error.message;
      this.logger.warn(`[ffmpeg-stdin] ${error.message}`);
    });
    readable.pipe(ffmpegProcess.stdin);
    return ffmpegProcess;
  }

  pipeProcessErrors(process) {
    let errorText = '';
    process.stderr.on('data', (chunk) => {
      errorText += chunk.toString();
      if (errorText.length > 1000) errorText = errorText.slice(-1000);
    });
    process.once('exit', (code) => {
      if (process._expectedStop) return;
      if (code && code !== 255) {
        this.lastError = errorText.trim() || `ffmpeg exited with code ${code}`;
      }
    });
  }
}
