// Admin-facing endpoints for the GitHub sync.
import { Router } from 'express';
import { runSync, getSyncStatus, startScheduler, stopScheduler } from '../services/sync.js';
import { requireAdmin } from '../services/auth.js';

const router = Router();

/**
 * GET /api/sync/status
 * Anyone can read status — it only exposes when syncs happened
 * and how many plugins were updated. No secrets.
 */
router.get('/status', (req, res) => {
  res.json(getSyncStatus());
});

/**
 * POST /api/sync/run
 * Admin only. Kicks off a full sync right now. If a sync is
 * already running, returns 409.
 * body (optional): { onlyIds: ['plugin-id-1', ...] } to target
 * a subset.
 */
router.post('/run', requireAdmin, async (req, res) => {
  const onlyIds = Array.isArray(req.body?.onlyIds) ? req.body.onlyIds : null;
  const result = await runSync({ onlyIds });
  res.status(result.ok ? 200 : 409).json(result);
});

/**
 * POST /api/sync/run/:id
 * Convenience: sync a single plugin by id.
 */
router.post('/run/:id', requireAdmin, async (req, res) => {
  const result = await runSync({ onlyIds: [req.params.id] });
  res.status(result.ok ? 200 : 409).json(result);
});

/**
 * POST /api/sync/scheduler/start  (admin)
 * POST /api/sync/scheduler/stop   (admin)
 * Optional manual control — usually the scheduler self-starts on boot.
 */
router.post('/scheduler/start', requireAdmin, (req, res) => {
  startScheduler();
  res.json({ ok: true });
});
router.post('/scheduler/stop', requireAdmin, (req, res) => {
  stopScheduler();
  res.json({ ok: true });
});

export default router;
