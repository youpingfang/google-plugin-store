import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import pluginsRouter from './routes/plugins.js';
import githubRouter from './routes/github.js';
import uploadRouter from './routes/upload.js';
import { initStorage } from './services/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve packages with correct headers for Chrome extension installation
app.use('/packages', async (req, res, next) => {
  const filePath = join(__dirname, '../data/packages', req.path);

  // For extension files, set download headers
  if (req.path.endsWith('.zip') || req.path.endsWith('.crx') || req.path.endsWith('.xpi')) {
    // Derive a friendly filename from the plugin's display name + version
    // path looks like: /<pluginId>/extension.zip  (e.g. /vimium/extension.zip)
    const segments = req.path.split('/').filter(Boolean);
    const pluginId = segments[0];
    const ext = req.path.endsWith('.crx') ? 'crx'
              : req.path.endsWith('.xpi') ? 'xpi'
              : 'zip';
    let filename = `${pluginId}.${ext}`;
    if (pluginId) {
      try {
        const raw = await readFile(join(__dirname, '../data/plugins.json'), 'utf8');
        const meta = JSON.parse(raw);
        const plugin = (meta.plugins || []).find((p) => p.id === pluginId);
        if (plugin) {
          const safe = (plugin.name || plugin.id).replace(/[\\/:*?"<>|\s]+/g, '-');
          const version = plugin.version || '1.0.0';
          filename = `${safe}-${version}.${ext}`;
        }
      } catch (e) {
        // Fall back to default filename if metadata lookup fails
        console.warn(`[packages] could not load plugin meta for ${pluginId}:`, e.message);
      }
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // Intentionally NOT setting COOP/COEP here — they cause Chrome to
    // re-validate the download and the file gets stuck on "剩余 获取中".
  }

  next();
}, express.static(join(__dirname, '../data/packages')));

// API Routes
app.use('/api/plugins', pluginsRouter);
app.use('/api/github', githubRouter);
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (IS_PROD) {
  const publicPath = join(__dirname, '../public');
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    res.sendFile(join(publicPath, 'index.html'));
  });
}

// Initialize storage and start server
await initStorage();

app.listen(PORT, () => {
  console.log(`Plugin Store API running on port ${PORT}`);
});
