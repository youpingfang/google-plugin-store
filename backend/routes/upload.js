import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { getPackagesDir, getPluginById, savePlugin } from '../services/storage.js';
import { processPluginZip } from '../services/converter.js';
import { requireAuth, canModifyPlugin } from '../services/auth.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const tempDir = path.join(getPackagesDir(), '_temp');
    await fs.ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Upload icon (authenticated). requireAuth before multer so
// unauthorized requests don't waste disk space on _temp/.
router.post('/icon', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { pluginId } = req.body;
    const ext = path.extname(req.file.originalname);
    
    if (pluginId) {
      const pluginDir = path.join(getPackagesDir(), pluginId);
      await fs.ensureDir(pluginDir);
      const dest = path.join(pluginDir, 'icon' + ext);
      await fs.move(req.file.path, dest);
      res.json({ url: `/packages/${pluginId}/icon${ext}` });
    } else {
      res.json({ url: `/packages/_temp/${req.file.filename}` });
    }
  } catch (err) {
    console.error('Error uploading icon:', err);
    res.status(500).json({ error: 'Failed to upload icon' });
  }
});

// Upload screenshot (authenticated)
router.post('/screenshot', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { pluginId } = req.body;
    const ext = path.extname(req.file.originalname);
    const index = Date.now();
    
    if (pluginId) {
      const screenshotsDir = path.join(getPackagesDir(), pluginId, 'screenshots');
      await fs.ensureDir(screenshotsDir);
      const dest = path.join(screenshotsDir, `${index}${ext}`);
      await fs.move(req.file.path, dest);
      res.json({ url: `/packages/${pluginId}/screenshots/${index}${ext}` });
    } else {
      res.json({ url: `/packages/_temp/${req.file.filename}` });
    }
  } catch (err) {
    console.error('Error uploading screenshot:', err);
    res.status(500).json({ error: 'Failed to upload screenshot' });
  }
});

// Upload plugin package (ZIP) (authenticated)
router.post('/package', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { pluginId, name, author, version, category, shortDescription, description, githubRepo } = req.body;
    
    if (!name || !author) {
      await fs.remove(req.file.path);
      return res.status(400).json({ error: 'Name and author are required' });
    }
    
    // Generate ID if not provided
    const id = pluginId || name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    
    // Process ZIP to convert to crx/xpi
    try {
      await processPluginZip(req.file.path, id);
    } catch (e) {
      console.error('Conversion error:', e);
      // Continue anyway
    }
    
    // Create plugin record
    const plugin = {
      id,
      name,
      author,
      authorUrl: `https://github.com/${author}`,
      version: version || '1.0.0',
      category: category || 'tools',
      shortDescription: shortDescription || '',
      description: description || '',
      icon: `/packages/${id}/icon.png`,
      screenshots: [],
      crxUrl: `/packages/${id}/extension.crx`,
      xpiUrl: `/packages/${id}/extension.xpi`,
      zipUrl: `/packages/${id}/extension.zip`,
      size: req.file.size,
      rating: 0,
      ratingCount: 0,
      installCount: 0,
      languages: ['en'],
      manifest: {},
      githubRepo: githubRepo || '',
      tags: [],
      status: 'published',
      versions: [{
        version: version || '1.0.0',
        date: new Date().toISOString().split('T')[0],
        note: 'Initial upload'
      }],
      uploadedBy: req.user.email,
      uploadedAt: new Date().toISOString(),
    };
    
    await savePlugin(plugin);
    
    // Clean up temp file
    await fs.remove(req.file.path);
    
    res.status(201).json(plugin);
  } catch (err) {
    console.error('Error uploading package:', err);
    res.status(500).json({ error: 'Failed to upload package' });
  }
});

export default router;
