import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../data');
const PACKAGES_DIR = join(DATA_DIR, 'packages');
const PLUGINS_FILE = join(DATA_DIR, 'plugins.json');

const PLUGINS = [
  {
    id: 'vimium',
    name: 'Vimium',
    author: 'philc',
    authorUrl: 'https://github.com/philc',
    version: '1.99',
    category: 'developer',
    shortDescription: '键盘导航扩展，用键盘完全掌控你的浏览器',
    description: 'Vimium 为浏览器提供了Vim风格的键盘快捷键，让你可以完全脱离鼠标浏览网页。支持链接提示、页面导航、历史记录等功能。',
    githubRepo: 'https://github.com/philc/vimium',
    zipFile: 'vimium.zip',
    prefix: 'vimium-master'
  },
  {
    id: 'dark-reader',
    name: 'Dark Reader',
    author: 'darkreader',
    authorUrl: 'https://github.com/darkreader',
    version: '4.9.170',
    category: 'theme',
    shortDescription: '为每个网站启用暗色模式，护眼必备',
    description: 'Dark Reader 为网站动态生成暗色主题，保护你的眼睛。支持自定义亮度、对比度、饱和度等多种设置，适用于绝大多数网站。',
    githubRepo: 'https://github.com/darkreader/darkreader',
    zipFile: 'dark-reader.zip',
    prefix: 'darkreader-main'
  },
  {
    id: 'ublock-origin',
    name: 'uBlock Origin',
    author: 'gorhill',
    authorUrl: 'https://github.com/gorhill',
    version: '1.54.0',
    category: 'tools',
    shortDescription: '高效的广告拦截器，占用极低的内存和CPU',
    description: 'uBlock Origin 是一款高效的广告拦截工具，可以有效屏蔽网页中的广告、跟踪器和其他恶意内容。',
    githubRepo: 'https://github.com/gorhill/uBlock',
    zipFile: 'ublock.zip',
    prefix: 'uBlock-master'
  },
  {
    id: 'tampermonkey',
    name: 'Tampermonkey',
    author: 'tampermonkey',
    authorUrl: 'https://github.com/Tampermonkey',
    version: '4.23.0',
    category: 'developer',
    shortDescription: '用户脚本管理器，在任意网站上运行自定义脚本',
    description: 'Tampermonkey 是最流行的用户脚本管理器，允许你在网页上运行用户脚本来自定义网页功能。',
    githubRepo: 'https://github.com/Tampermonkey/tampermonkey',
    zipFile: 'tampermonkey.zip',
    prefix: 'tampermonkey-master'
  }
];

async function getManifest(zipPath, prefix) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  
  // Try different manifest locations
  const paths = [
    `${prefix}/manifest.json`,
    `manifest.json`
  ];
  
  for (const p of paths) {
    const entry = entries.find(e => e.entryName === p);
    if (entry) {
      const content = zip.readAsText(entry);
      // Tolerant parse: strip // / /* */ comments and trailing commas
      // Some repos (e.g. Vimium) ship non-strict JSON in manifest.json.
      const cleaned = content
        // Strip line comments: // not inside a string
        .replace(/(^|[^:"'])\/\/.*$/gm, '$1')
        // Strip block comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Strip trailing commas before } or ]
        .replace(/,(\s*[}\]])/g, '$1');
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        console.warn(`manifest parse failed for ${p}: ${e.message}`);
        return null;
      }
    }
  }
  return null;
}

/**
 * Extract the plugin icon from the downloaded zip.
 * - First, try the manifest's `icons` field (128 > 48 > 32 > 16).
 * - Fall back to any png/svg in the `icons/` folder, picking the largest.
 * Returns the relative path inside the zip, or null if nothing found.
 */
function findIconEntry(zip, manifest, prefix) {
  const entries = zip.getEntries();
  const stripPrefix = (name) => name.startsWith(`${prefix}/`) ? name.slice(prefix.length + 1) : name;

  // 1. Manifest-defined icons (Chrome Web Store extension convention)
  if (manifest && manifest.icons && typeof manifest.icons === 'object') {
    const sizes = Object.keys(manifest.icons)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => b - a);
    for (const size of sizes) {
      const target = manifest.icons[String(size)];
      const entry = entries.find((e) => stripPrefix(e.entryName) === target);
      if (entry && !entry.isDirectory) return entry;
    }
  }

  // 2. Fall back: any png in a likely-icon folder (icons/, src/icons/, img/, images/),
  // pick the largest file as a best-effort.
  const iconEntries = entries.filter((e) => {
    const p = stripPrefix(e.entryName);
    if (e.isDirectory) return false;
    if (!/\.(png|svg)$/i.test(p)) return false;
    return /(^|\/)(src\/)?(icons?|img|images)\//i.test(p);
  });
  if (iconEntries.length === 0) return null;
  iconEntries.sort((a, b) => b.header.size - a.header.size);
  return iconEntries[0];
}

async function extractIcon(zipPath, pluginId, manifest, prefix) {
  const zip = new AdmZip(zipPath);
  const entry = findIconEntry(zip, manifest, prefix);
  if (!entry) return false;

  const ext = entry.entryName.toLowerCase().endsWith('.svg') ? 'svg' : 'png';
  const data = zip.readFile(entry);
  const outPath = join(PACKAGES_DIR, pluginId, `icon.${ext}`);
  await fs.outputFile(outPath, data);
  return ext;
}

async function processPlugins() {
  await fs.ensureDir(PACKAGES_DIR);
  
  const plugins = [];
  
  for (const plugin of PLUGINS) {
    const zipPath = join(PACKAGES_DIR, plugin.zipFile);
    
    if (!await fs.pathExists(zipPath)) {
      console.log(`Zip not found: ${plugin.zipFile}, skipping...`);
      continue;
    }
    
    // Get manifest
    const manifest = await getManifest(zipPath, plugin.prefix);
    
    // Create plugin directory
    const pluginDir = join(PACKAGES_DIR, plugin.id);
    await fs.ensureDir(pluginDir);
    
    // Copy zip to plugin directory
    await fs.copy(zipPath, join(pluginDir, 'extension.zip'));
    
    // Extract plugin icon (best-effort)
    const iconExt = await extractIcon(zipPath, plugin.id, manifest, plugin.prefix);
    const iconPath = iconExt
      ? `/packages/${plugin.id}/icon.${iconExt}`
      : `/packages/${plugin.id}/icon.png`; // last-resort placeholder path
    
    // Extract version from manifest if available
    const version = manifest?.version || plugin.version;
    const name = manifest?.name || plugin.name;
    const description = manifest?.description || plugin.description;
    
    plugins.push({
      id: plugin.id,
      name,
      author: plugin.author,
      authorUrl: plugin.authorUrl,
      version,
      category: plugin.category,
      shortDescription: plugin.shortDescription,
      description,
      icon: iconPath,
      screenshots: [],
      crxUrl: `/packages/${plugin.id}/extension.zip`, // Use zip - Chrome accepts it in dev mode
      xpiUrl: `/packages/${plugin.id}/extension.zip`,
      zipUrl: `/packages/${plugin.id}/extension.zip`,
      size: (await fs.stat(zipPath)).size,
      rating: 4.5 + Math.random() * 0.5, // 4.5-5.0
      ratingCount: Math.floor(Math.random() * 10000) + 1000,
      installCount: Math.floor(Math.random() * 5000000) + 100000,
      languages: ['zh-CN', 'en'],
      manifest: manifest || {},
      githubRepo: plugin.githubRepo,
      tags: [plugin.category === 'developer' ? '开发者工具' : plugin.category === 'theme' ? '主题' : '工具'],
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [{
        version,
        date: new Date().toISOString().split('T')[0],
        note: 'Initial import from GitHub'
      }]
    });
    
    console.log(`Processed: ${name} v${version}`);
  }
  
  // Save to plugins.json
  await fs.writeJson(PLUGINS_FILE, { plugins, version: '1.0.0' });
  console.log(`\nTotal plugins imported: ${plugins.length}`);
}

processPlugins().catch(console.error);
