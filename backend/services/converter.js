import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import { getPackagesDir } from './storage.js';

const MANIFEST_FILES = ['manifest.json', 'manifest.v2.json', 'manifest.v3.json'];

/**
 * Extract manifest.json from a ZIP file
 */
export async function extractManifest(zipPath) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  
  for (const manifestName of MANIFEST_FILES) {
    const entry = entries.find(e => e.entryName === manifestName);
    if (entry) {
      const content = zip.readAsText(entry);
      return JSON.parse(content);
    }
  }
  
  return null;
}

/**
 * Process uploaded plugin ZIP
 * Just validates and stores the zip
 */
export async function processPluginZip(zipPath, pluginId) {
  const packagesDir = getPackagesDir();
  const pluginDir = path.join(packagesDir, pluginId);
  await fs.ensureDir(pluginDir);
  
  // Extract and validate manifest
  const manifest = await extractManifest(zipPath);
  if (!manifest) {
    throw new Error('No manifest.json found in ZIP');
  }
  
  // Copy ZIP to packages directory
  const zipDest = path.join(pluginDir, 'extension.zip');
  await fs.copy(zipPath, zipDest);
  
  return {
    manifest,
    paths: {
      zip: zipDest,
      crx: zipDest,  // Use zip for both - Chrome accepts zip in developer mode
      xpi: zipDest   // Use zip for xpi too
    }
  };
}

/**
 * Download and process plugin from GitHub
 */
export async function processGitHubPlugin(sourceZipPath, pluginId) {
  return processPluginZip(sourceZipPath, pluginId);
}
