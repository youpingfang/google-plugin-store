import { Router } from 'express';
import { detectGitHubRepo, downloadGitHubRepo, extractManifestFromGitHubZip } from '../services/github.js';
import { processGitHubPlugin } from '../services/converter.js';
import { savePlugin } from '../services/storage.js';
import { requireAuth } from '../services/auth.js';
import fs from 'fs-extra';
import path from 'path';

const router = Router();

// Detect is read-only metadata — keep open so the form can prefill before login.
// (The actual import below is gated.)
router.post('/detect', async (req, res) => {
  try {
    const { repoUrl, token } = req.body;
    
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    
    const info = await detectGitHubRepo(repoUrl, token || null);
    res.json(info);
  } catch (err) {
    console.error('Error detecting GitHub repo:', err);
    res.status(500).json({ error: err.message || 'Failed to detect repository' });
  }
});

// Import plugin from GitHub (authenticated). The current user becomes the uploader.
router.post('/import', requireAuth, async (req, res) => {
  try {
    const { repoUrl, token, category, shortDescription } = req.body;
    
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    
    // Download repo as ZIP
    const { tempZip, owner, repo } = await downloadGitHubRepo(repoUrl, token || null);
    
    // Extract manifest
    const manifest = await extractManifestFromGitHubZip(tempZip);
    if (!manifest) {
      await fs.remove(tempZip);
      throw new Error('No manifest.json found in repository');
    }
    
    // Generate plugin ID
    const id = `${owner}-${repo}-${Date.now().toString(36)}`;
    
    // Process the ZIP (convert to crx/xpi)
    try {
      await processGitHubPlugin(tempZip, id);
    } catch (e) {
      console.error('Conversion error:', e);
      // Continue anyway, we still have the ZIP
    }
    
    // Create plugin record
    const plugin = {
      id,
      name: manifest.name || `${owner}/${repo}`,
      author: owner,
      authorUrl: `https://github.com/${owner}`,
      version: manifest.version || '1.0.0',
      category: category || 'tools',
      shortDescription: shortDescription || manifest.description || '',
      description: manifest.description || '',
      readme: detectResult.readme || null,
      icon: `/packages/${id}/icon.png`,
      screenshots: [],
      crxUrl: `/packages/${id}/extension.crx`,
      xpiUrl: `/packages/${id}/extension.xpi`,
      zipUrl: `/packages/${id}/extension.zip`,
      size: (await fs.stat(tempZip)).size,
      rating: 0,
      ratingCount: 0,
      installCount: 0,
      languages: ['en'],
      manifest,
      githubRepo: repoUrl,
      tags: [],
      status: 'published',
      versions: [{
        version: manifest.version || '1.0.0',
        date: new Date().toISOString().split('T')[0],
        note: 'Initial import from GitHub'
      }],
      uploadedBy: req.user.email,
      uploadedAt: new Date().toISOString(),
    };
    
    await savePlugin(plugin);
    
    // Clean up temp file
    await fs.remove(tempZip);
    
    res.status(201).json(plugin);
  } catch (err) {
    console.error('Error importing from GitHub:', err);
    res.status(500).json({ error: err.message || 'Failed to import plugin' });
  }
});

export default router;
