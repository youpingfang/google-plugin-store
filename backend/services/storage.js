import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../data');
const PLUGINS_FILE = join(DATA_DIR, 'plugins.json');
const PACKAGES_DIR = join(DATA_DIR, 'packages');

export async function initStorage() {
  await fs.ensureDir(DATA_DIR);
  await fs.ensureDir(PACKAGES_DIR);
  
  if (!await fs.pathExists(PLUGINS_FILE)) {
    await fs.writeJson(PLUGINS_FILE, { plugins: [], version: '1.0.0' });
  }
}

export async function getPlugins() {
  const data = await fs.readJson(PLUGINS_FILE);
  return data.plugins || [];
}

export async function getPluginById(id) {
  const plugins = await getPlugins();
  return plugins.find(p => p.id === id) || null;
}

export async function savePlugin(plugin) {
  const plugins = await getPlugins();
  const index = plugins.findIndex(p => p.id === plugin.id);
  
  if (index >= 0) {
    plugins[index] = { ...plugins[index], ...plugin, updatedAt: new Date().toISOString() };
  } else {
    plugin.createdAt = new Date().toISOString();
    plugin.updatedAt = plugin.createdAt;
    plugins.push(plugin);
  }
  
  await fs.writeJson(PLUGINS_FILE, { plugins, version: '1.0.0' });
  return plugin;
}

export async function deletePlugin(id) {
  const plugins = await getPlugins();
  const plugin = plugins.find(p => p.id === id);
  
  if (!plugin) return false;
  
  // Remove package files
  const pluginDir = join(PACKAGES_DIR, id);
  await fs.remove(pluginDir);
  
  // Remove from list
  const filtered = plugins.filter(p => p.id !== id);
  await fs.writeJson(PLUGINS_FILE, { plugins: filtered, version: '1.0.0' });
  
  return true;
}

export async function getPackagePath(pluginId, filename) {
  const pluginDir = join(PACKAGES_DIR, pluginId);
  await fs.ensureDir(pluginDir);
  return join(pluginDir, filename);
}

export async function recordInstall(id) {
  const plugins = await getPlugins();
  const plugin = plugins.find(p => p.id === id);
  
  if (plugin) {
    plugin.installCount = (plugin.installCount || 0) + 1;
    await fs.writeJson(PLUGINS_FILE, { plugins, version: '1.0.0' });
  }
  
  return plugin;
}

export function getPackagesDir() {
  return PACKAGES_DIR;
}
