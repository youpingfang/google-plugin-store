// Auth routes: setup-status, register, login (email+password), me, logout.
// The legacy GitHub-PAT login is mounted at /api/auth/github for admin recovery.
import { Router } from 'express';
import { registerUser, loginUser, hasAnyAdmin, requireAuth } from '../services/users.js';
import { loginWithGitHubToken } from '../services/auth.js';

const router = Router();

/**
 * GET /api/auth/setup-status
 * Returns { needsSetup: true } when no admin account exists yet, so
 * the frontend can show the "create first admin" form.
 */
router.get('/setup-status', async (req, res) => {
  try {
    const hasAdmin = await hasAnyAdmin();
    res.json({ needsSetup: !hasAdmin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/register
 * First call ever creates the admin; subsequent calls create 'user' accounts.
 * body: { email, password, name? }
 */
router.post('/register', async (req, res) => {
  try {
    const result = await registerUser(req.body || {});
    res.status(201).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const result = await loginUser(req.body || {});
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/**
 * POST /api/auth/logout (stateless)
 */
router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

/**
 * POST /api/auth/github  (admin recovery via GitHub PAT)
 * body: { token: "<github_pat>" }
 */
router.post('/github', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Missing GitHub token' });
    const result = await loginWithGitHubToken(token);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

export default router;
