// Background sync for GitHub-backed plugins.
//
// - Periodically (default every 24h, configurable) we walk all
//   plugins that have a `githubRepo` field and try to detect a
//   newer release on GitHub. If we find one, we re-run the same
//   import flow that the manual `/api/github/import` endpoint
//   uses, so the plugin record and the on-disk zip get refreshed
//   in place (same id, no UI churn).
// - We never touch a plugin if GitHub says nothing has changed.
// - Runs are logged to data/sync_logs.json (last 100 entries).
// - Admins can also trigger an immediate run via
//   POST /api/sync/run.

import fs from 'fs-extra';
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import { savePlugin, getPlugins, getPluginById } from './storage.js';
import { downloadGitHubRepo, extractManifestFromGitHubZip } from './github.js';
import { processGitHubPlugin } from './converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../../data');
const LOG_FILE = join(DATA_DIR, 'sync_logs.json');

const SYNC_ENABLED = (process.env.SYNC_ENABLED ?? 'true').toLowerCase() !== 'false';
const SYNC_INTERVAL_HOURS = parseFloat(process.env.SYNC_INTERVAL_HOURS || '24');
const SYNC_AT_HOUR = parseInt(process.env.SYNC_AT_HOUR || '3', 10); // 3am local

// State (in-memory). Persisted to LOG_FILE.
let state = {
  lastRunAt: null,
  lastRunDurationMs: null,
  lastError: null,
  isRunning: false,
  scheduleNextAt: null,
};

const logs = [];
let timer = null;

function normalizeVersion(v) {
  if (!v) return '';
  return String(v).replace(/^v/i, '').trim();
}

function cmpVersion(a, b) {
  const pa = normalizeVersion(a).split(/[.\-]/).map((s) => /^\d+$/.test(s) ? parseInt(s, 10) : s);
  const pb = normalizeVersion(b).split(/[.\-]/).map((s) => /^\d+$/.test(s) ? parseInt(s, 10) : s);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i], y = pb[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (typeof x === 'number' && typeof y === 'number') {
      if (x !== y) return x - y;
    } else {
      const sx = String(x), sy = String(y);
      if (sx !== sy) return sx < sy ? -1 : 1;
    }
  }
  return 0;
}

async function readLogs() {
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.logs)) logs.push(...data.logs.slice(-100));
  } catch (e) {
    if (e.code !== 'ENOENT') console.warn('[sync] could not read log file:', e.message);
  }
}

async function writeLogs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LOG_FILE, JSON.stringify({ logs: logs.slice(-100) }, null, 2));
}

function log(entry) {
  const e = { ...entry, at: new Date().toISOString() };
  logs.push(e);
  if (logs.length > 100) logs.shift();
  console.log(`[sync] ${e.action} ${e.plugin || ''} ${e.detail || ''}`);
  writeLogs().catch(() => {});
}

function parseRepo(url) {
  const m = url.match(/github\.com\/([^\/]+)\/([^\/?#]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

/**
 * Look up the latest version available for a GitHub repo.
 * Tries the most-recently-published release tag first, then
 * falls back to the default branch's HEAD if no releases exist
 * or the call fails.
 *
 * Returns { version, zipUrl } or null if GitHub has nothing we
 * can use.
 */
async function fetchLatestVersion(repoUrl) {
  const parsed = parseRepo(repoUrl);
  if (!parsed) return null;
  const { owner, repo } = parsed;
  const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'plugin-store-sync' };

  // 1. Try latest release
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers });
    if (r.ok) {
      const data = await r.json();
      if (data && data.tag_name) {
        // Use the published zipball as the canonical source
        const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/tags/${data.tag_name}.zip`;
        return { version: data.tag_name, zipUrl, source: 'release' };
      }
    }
  } catch (e) { /* fall through */ }

  // 2. Fall back to default branch HEAD
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) return null;
    const info = await repoRes.json();
    const branch = info.default_branch || 'main';
    return {
      version: branch,  // no real version; downstream will skip update if same
      zipUrl: `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`,
      source: 'branch',
    };
  } catch { return null; }
}

/**
 * Re-import a plugin from a specific zip URL (the one we just
 * fetched) and write the updated record in place, preserving
 * the plugin id, uploadedBy, etc.
 */
async function reimportFromZipUrl(plugin, zipUrl, newVersion) {
  const tmpDir = join(DATA_DIR, 'packages/_temp');
  await fs.mkdir(tmpDir, { recursive: true });
  const tmpZip = join(tmpDir, `sync-${plugin.id}-${Date.now()}.zip`);

  const res = await fetch(zipUrl, { headers: { 'User-Agent': 'plugin-store-sync' } });
  if (!res.ok) throw new Error(`zip download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(tmpZip, buf);

  // Reuse the existing import helpers
  const manifest = await extractManifestFromGitHubZip(tmpZip);
  if (!manifest) {
    await fs.remove(tmpZip).catch(() => {});
    throw new Error('manifest not found in zip');
  }

  // Re-run conversion (CRX/XPI/zip generation)
  try {
    await processGitHubPlugin(tmpZip, plugin.id);
  } catch (e) {
    console.warn(`[sync] conversion for ${plugin.id} failed: ${e.message}`);
  }

  // Build the updated plugin record. Preserve id, uploadedBy,
  // uploadedAt, rating/ratingCount/installCount (we don't reset
  // social metrics on a sync).
  const freshSize = (await fs.stat(tmpZip)).size;
  const updated = {
    ...plugin,
    name: manifest.name || plugin.name,
    version: newVersion,
    description: manifest.description || plugin.description,
    shortDescription: (manifest.description || plugin.description || '').slice(0, 120),
    size: freshSize,
    manifest,
    updatedAt: new Date().toISOString(),
    versions: [
      { version: newVersion, date: new Date().toISOString().split('T')[0], note: 'Auto-synced from GitHub' },
      ...(plugin.versions || []).filter((v) => v.version !== newVersion),
    ].slice(0, 10),
  };

  await savePlugin(updated);
  await fs.remove(tmpZip).catch(() => {});
  return updated;
}

/**
 * Sync a single plugin. Returns one of:
 *   { action: 'updated',  from, to, plugin }
 *   { action: 'skipped',  reason }
 *   { action: 'failed',   error }
 */
async function syncPlugin(plugin) {
  if (!plugin.githubRepo) return { action: 'skipped', reason: 'no githubRepo' };

  let latest;
  try {
    latest = await fetchLatestVersion(plugin.githubRepo);
  } catch (e) {
    return { action: 'failed', error: `version lookup: ${e.message}` };
  }
  if (!latest) return { action: 'failed', error: 'GitHub returned no usable version' };

  const fromVer = normalizeVersion(plugin.version);
  const toVer = normalizeVersion(latest.version);
  const cmp = cmpVersion(fromVer, toVer);

  if (cmp >= 0) {
    return { action: 'skipped', reason: `already at ${fromVer} (latest ${toVer})` };
  }

  try {
    const updated = await reimportFromZipUrl(plugin, latest.zipUrl, latest.version);
    return { action: 'updated', from: fromVer, to: toVer, plugin: updated.id, source: latest.source };
  } catch (e) {
    return { action: 'failed', error: e.message, attempted: toVer };
  }
}

export async function runSync({ onlyIds = null } = {}) {
  if (state.isRunning) {
    return { ok: false, error: 'Sync already in progress' };
  }
  state.isRunning = true;
  state.lastError = null;
  const t0 = Date.now();
  log({ action: 'started', detail: onlyIds ? `targeted: ${onlyIds.join(',')}` : 'all' });

  const summary = { updated: 0, skipped: 0, failed: 0, items: [] };
  try {
    const all = await getPlugins();
    const targets = onlyIds ? all.filter((p) => onlyIds.includes(p.id)) : all.filter((p) => p.githubRepo);

    for (const p of targets) {
      const r = await syncPlugin(p);
      summary.items.push({ id: p.id, ...r });
      if (r.action === 'updated') summary.updated++;
      else if (r.action === 'skipped') summary.skipped++;
      else summary.failed++;
      // small pause so we don't hammer the GitHub API
      await new Promise((res) => setTimeout(res, 250));
    }
  } catch (e) {
    state.lastError = e.message;
    log({ action: 'error', detail: e.message });
  }

  state.isRunning = false;
  state.lastRunAt = new Date().toISOString();
  state.lastRunDurationMs = Date.now() - t0;
  state.scheduleNextAt = nextRunAtISO();
  log({ action: 'finished', detail: `updated=${summary.updated} skipped=${summary.skipped} failed=${summary.failed}` });
  return { ok: true, summary };
}

function nextRunAtISO() {
  // Daily at SYNC_AT_HOUR local time. Compute the next occurrence.
  const now = new Date();
  const next = new Date(now);
  next.setHours(SYNC_AT_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.toISOString();
}

export function startScheduler() {
  if (!SYNC_ENABLED) {
    console.log('[sync] disabled (SYNC_ENABLED=false)');
    return;
  }
  // Don't run immediately on startup — wait until the next scheduled
  // time so we don't fight with manual imports that just happened.
  state.scheduleNextAt = nextRunAtISO();
  const ms = Math.max(60_000, new Date(state.scheduleNextAt) - new Date());
  console.log(`[sync] next run at ${state.scheduleNextAt} (in ${(ms / 3_600_000).toFixed(1)}h)`);
  timer = setTimeout(async () => {
    try { await runSync(); } catch (e) { console.error('[sync] error:', e); }
    timer = setTimeout(() => startScheduler(), 60_000); // re-arm
  }, ms);
}

export function stopScheduler() {
  if (timer) { clearTimeout(timer); timer = null; }
}

export function getSyncStatus() {
  return {
    enabled: SYNC_ENABLED,
    intervalHours: SYNC_INTERVAL_HOURS,
    atHour: SYNC_AT_HOUR,
    ...state,
    recentLogs: logs.slice(-20),
  };
}

// Boot-time log load
readLogs().catch(() => {});
