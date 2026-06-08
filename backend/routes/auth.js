// Auth routes — login (PAT exchange), session check, logout.
import { Router } from 'express';
import { loginWithGitHubToken, requireAuth } from '../services/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * body: { token: "<github_pat>" }
 * Returns: { token: "<jwt>", user: { login, name, avatar, id } }
 */
router.post('/login', async (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing GitHub token in request body' });
  }
  try {
    const result = await loginWithGitHubToken(token.trim());
    res.json(result);
  } catch (e) {
    const code = e.statusCode || 401;
    res.status(code).json({ error: e.message });
  }
});

/**
 * GET /api/auth/me
 * Returns the currently-authenticated user (decoded from JWT).
 * Useful for the frontend to check whether the saved token is still valid.
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/**
 * POST /api/auth/logout
 * Stateless logout — frontend just deletes the JWT from localStorage.
 * This endpoint exists so the UI can call something on logout.
 */
router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

export default router;
