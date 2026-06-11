import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import { getPackagesDir } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GITHUB_API = 'https://api.github.com';
const MANIFEST_FILES = ['manifest.json', 'manifest.v2.json', 'manifest.v3.json'];

/**
 * Parse GitHub repo URL or shorthand
 */
export function parseGitHubRepo(input) {
  const match = input.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) {
    return { owner: match[1], repo: match[2].split('/')[0] };
  }
  
  const parts = input.split('/');
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  
  throw new Error('Invalid GitHub repository URL');
}

/**
 * Get GitHub repo info and detect manifest
 */
export async function detectGitHubRepo(repoUrl, token = null) {
  const { owner, repo } = parseGitHubRepo(repoUrl);
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'PluginStore'
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  // Get repo info
  const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    throw new Error(`GitHub API error: ${repoRes.status}`);
  }
  const repoData = await repoRes.json();
  
  // Get default branch
  const defaultBranch = repoData.default_branch || 'main';

  // Try to get manifest from default branch
  let manifest = null;

  // 1. Check common known locations first (fast path).
  // Note: GitHub Contents API uses ?ref=<branch> for the branch, NOT a URL segment.
  const knownPaths = [
    'manifest.json',
    'src/manifest.json',
    'extension/manifest.json',
    'public/manifest.json',
  ];
  for (const relPath of knownPaths) {
    try {
      const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${relPath}?ref=${encodeURIComponent(defaultBranch)}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          manifest = JSON.parse(Buffer.from(data.content, 'base64').toString());
          break;
        }
      }
    } catch (e) {
      // Continue to next path
    }
  }

  // 2. Fallback: list the repo root and search one level deep for any manifest.json
  if (!manifest) {
    try {
      const rootRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/?ref=${defaultBranch}`, { headers });
      if (rootRes.ok) {
        const items = await rootRes.json();
        if (Array.isArray(items)) {
          const subdirs = items.filter((i) => i.type === 'dir').map((i) => i.name);
          // Try each subdirectory for manifest.json (one level deep)
          for (const sub of subdirs) {
            try {
              const r = await fetch(
                `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(sub)}/manifest.json?ref=${defaultBranch}`,
                { headers }
              );
              if (r.ok) {
                const d = await r.json();
                if (d.content) {
                  manifest = JSON.parse(Buffer.from(d.content, 'base64').toString());
                  break;
                }
              }
            } catch {}
          }

          if (!manifest) {
            // Build a friendly error listing what we actually found
            const names = items.map((i) => i.name).slice(0, 20);
            const list = names.length ? names.join(', ') : '(empty)';
            const subList = subdirs.length ? subdirs.join(', ') : '(none)';
            throw new Error(
              `No manifest.json found in this repository. ` +
              `Root contents: ${list}. ` +
              `Checked subdirectories: ${subList}. ` +
              `Make sure the repo is a Chrome/Edge/Firefox extension (needs a manifest.json).`
            );
          }
        }
      }
    } catch (e) {
      if (e.message && e.message.startsWith('No manifest.json found in this repository')) throw e;
      // Listing failed (private repo, rate-limit, etc.) — fall through to generic error below
    }
  }

  if (!manifest) {
    throw new Error('No manifest.json found in repository');
  }
  
  // Get download URL (zipball)
  const downloadUrl = repoData.html_url + '/archive/refs/heads/' + defaultBranch + '.zip';

  // Try to fetch README.md (best-effort, do not fail the whole detect)
  let readme = null;
  try {
    readme = await fetchGitHubReadme(owner, repo, defaultBranch, headers);
  } catch (e) {
    // silent: readme is optional
  }

  return {
    name: manifest.name || repoData.name,
    description: manifest.description || repoData.description || '',
    author: manifest.author || owner,
    version: manifest.version || '1.0.0',
    manifest,
    githubRepo: repoData.html_url,
    owner,
    repo,
    defaultBranch,
    downloadUrl,
    latestTag: null,
    readme
  };
}

/**
 * Fetch README.md from a GitHub repo. Tries common filenames in the
 * default branch, then falls back to the GitHub Contents API. Returns
 * plain text or null.
 */
export async function fetchGitHubReadme(owner, repo, branch = 'main', baseHeaders = null) {
  const headers = baseHeaders || { 'User-Agent': 'PluginStore' };
  const names = ['README.md', 'readme.md', 'Readme.md', 'README.MD', 'README', 'README.txt'];
  for (const name of names) {
    try {
      const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(name)}?ref=${encodeURIComponent(branch)}`;
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.content) {
        const text = Buffer.from(data.content, 'base64').toString('utf8');
        if (text && text.trim()) return text;
      }
    } catch (e) {
      // try next name
    }
  }
  return null;
}

/**
 * Download and extract GitHub repo as ZIP
 */
export async function downloadGitHubRepo(repoUrl, token = null) {
  const { owner, repo } = parseGitHubRepo(repoUrl);
  
  const headers = { 'User-Agent': 'PluginStore' };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  // Get default branch
  const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
  const repoData = await repoRes.json();
  const branch = repoData.default_branch || 'main';
  
  // Download as ZIP
  const zipUrl = repoData.html_url + '/archive/refs/heads/' + branch + '.zip';
  const zipRes = await fetch(zipUrl, { headers });
  
  if (!zipRes.ok) {
    throw new Error(`Failed to download repository: ${zipRes.status}`);
  }
  
  // Save to temp file
  const tempDir = path.join(getPackagesDir(), '_temp');
  await fs.ensureDir(tempDir);
  const tempZip = path.join(tempDir, `${owner}-${repo}-${Date.now()}.zip`);
  
  const buffer = await zipRes.arrayBuffer();
  await fs.writeFile(tempZip, Buffer.from(buffer));
  
  return { tempZip, owner, repo, branch };
}

/**
 * Find and extract manifest from downloaded GitHub ZIP
 */
function tolerantJsonParse(text) {
  const cleaned = text
    // Strip line comments: // not inside a string
    .replace(/(^|[^:"'])\/\/.*$/gm, '$1')
    // Strip block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Strip trailing commas before } or ]
    .replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(cleaned);
}

export async function extractManifestFromGitHubZip(zipPath) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  const stripPrefix = (name) => {
    const parts = name.split('/');
    return parts.length > 1 ? parts.slice(1).join('/') : name;
  };

  // 1. Look for a top-level manifest.json (or variant) under the
  //    zip's root dir or directly at the top.
  for (const manifestName of MANIFEST_FILES) {
    for (const e of entries) {
      const p = stripPrefix(e.entryName);
      if (p === manifestName) {
        try {
          return tolerantJsonParse(zip.readAsText(e));
        } catch { /* try next */ }
      }
    }
  }

  // 2. Fall back: search up to 3 levels deep in any subdirectory
  //    (some repos put manifest under platform/chromium/ etc).
  for (const depth of [2, 3, 4]) {
    for (const manifestName of MANIFEST_FILES) {
      for (const e of entries) {
        const p = stripPrefix(e.entryName);
        if (p.endsWith('/' + manifestName) && p.split('/').length === depth) {
          try {
            return tolerantJsonParse(zip.readAsText(e));
          } catch { /* try next */ }
        }
      }
    }
  }

  return null;
}
