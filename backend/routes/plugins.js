import { Router } from 'express';
import { getPlugins, getPluginById, savePlugin, deletePlugin, recordInstall } from '../services/storage.js';
import { processPluginZip } from '../services/converter.js';
import { requireAdmin, requireAuth, canModifyPlugin, optionalAuth } from '../services/auth.js';
import fs from 'fs-extra';
import path from 'path';
import { getPackagesDir } from '../services/storage.js';

const router = Router();

// List plugins. Anonymous and 'user' callers only see plugins they
// uploaded; 'admin' sees everything.
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 20 } = req.query;
    let plugins = await getPlugins();

    // Role-based visibility: regular users only see their own uploads.
    if (!req.user || req.user.role !== 'admin') {
      const me = req.user?.email || null;
      if (me) {
        plugins = plugins.filter((p) => p.uploadedBy === me);
      } else {
        // Unauthenticated: empty list (browsing is gated).
        // Admin can still hit the public catalog from outside if
        // they want to — but here we keep it scoped to the caller.
        plugins = [];
      }
    }

    // Filter by category
    if (category && category !== 'all') {
      plugins = plugins.filter(p => p.category === category);
    }
    
    // Search
    if (search) {
      const q = search.toLowerCase();
      plugins = plugins.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
      );
    }
    
    // Sort
    if (sort === 'rating') {
      plugins.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'installs') {
      plugins.sort((a, b) => (b.installCount || 0) - (a.installCount || 0));
    } else if (sort === 'updated') {
      plugins.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else {
      // default: created desc
      plugins.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // Paginate
    const total = plugins.length;
    const start = (page - 1) * limit;
    const paginatedPlugins = plugins.slice(start, start + parseInt(limit));
    
    res.json({
      plugins: paginatedPlugins,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error listing plugins:', err);
    res.status(500).json({ error: 'Failed to list plugins' });
  }
});

// Get single plugin
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const plugin = await getPluginById(req.params.id);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    // Visibility: admin sees everything, user only their own,
    // anonymous only their own (i.e. nothing).
    const me = req.user?.email || null;
    if (req.user?.role !== 'admin' && plugin.uploadedBy !== me) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    res.json(plugin);
  } catch (err) {
    console.error('Error getting plugin:', err);
    res.status(500).json({ error: 'Failed to get plugin' });
  }
});

// Create plugin (any authenticated user). The uploader is recorded so
// later updates/deletes can be authorized.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, author, version, category, shortDescription, description, githubRepo } = req.body;
    
    if (!name || !author) {
      return res.status(400).json({ error: 'Name and author are required' });
    }
    
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    
    const plugin = {
      id,
      name,
      author,
      authorUrl: `https://github.com/${author}`,
      version: version || '1.0.0',
      category: category || 'tools',
      shortDescription: shortDescription || '',
      description: description || '',
      icon: '',
      screenshots: [],
      crxUrl: `/packages/${id}/extension.crx`,
      xpiUrl: `/packages/${id}/extension.xpi`,
      zipUrl: `/packages/${id}/extension.zip`,
      size: 0,
      rating: 0,
      ratingCount: 0,
      installCount: 0,
      languages: ['en'],
      manifest: {},
      githubRepo: githubRepo || '',
      tags: [],
      status: 'published',
      versions: [],
      uploadedBy: req.user.email,
      uploadedAt: new Date().toISOString(),
    };
    
    await savePlugin(plugin);
    res.status(201).json(plugin);
  } catch (err) {
    console.error('Error creating plugin:', err);
    res.status(500).json({ error: 'Failed to create plugin' });
  }
});

// Update plugin (admin or uploader)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await getPluginById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    if (!canModifyPlugin(req, existing)) {
      return res.status(403).json({ error: 'You can only edit plugins you uploaded' });
    }
    // Don't let users change ownership via update
    const { uploadedBy: _u, uploadedAt: _ua, ...body } = req.body || {};
    const updated = { ...existing, ...body, id: req.params.id };
    await savePlugin(updated);
    res.json(updated);
  } catch (err) {
    console.error('Error updating plugin:', err);
    res.status(500).json({ error: 'Failed to update plugin' });
  }
});

// Delete plugin (admin or uploader)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await getPluginById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    if (!canModifyPlugin(req, existing)) {
      return res.status(403).json({ error: 'You can only delete plugins you uploaded' });
    }
    const success = await deletePlugin(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting plugin:', err);
    res.status(500).json({ error: 'Failed to delete plugin' });
  }
});

// Record install
router.post('/:id/install', async (req, res) => {
  try {
    await recordInstall(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error recording install:', err);
    res.status(500).json({ error: 'Failed to record install' });
  }
});

export default router;
