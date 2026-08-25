import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
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

const clientId = process.env.DISCORD_CLIENT_ID;

if (!clientId) {
  console.error('Set DISCORD_CLIENT_ID in .env first.');
  process.exit(1);
}

const permissions = '3148800';
const scopes = encodeURIComponent('bot applications.commands');
const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes}`;

console.log(url);
