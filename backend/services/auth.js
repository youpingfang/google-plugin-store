// Lightweight auth helper. Supports two flows:
//   1. GitHub OAuth (browser redirect) — for future use, registered via env
//      GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET. See routes/auth.js.
//   2. Admin Personal Access Token (PAT) login — for the store owner.
//      Set ADMIN_GITHUB_USERS=zad (your GitHub login) plus
//      ADMIN_GITHUB_TOKEN=<github_pat_here>. The user exchanges the PAT
//      for a short-lived JWT that the rest of the API accepts.
//
// We do NOT store passwords. The PAT lives in the user's localStorage on
// the frontend; we only ever see it in the login request and forget it
// immediately after exchanging for a JWT.
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-please';
const JWT_TTL = process.env.JWT_TTL || '7d';

// GitHub usernames allowed to perform admin actions.
// Comma-separated, e.g. "zad,alice".
function getAdminUsers() {
  return (process.env.ADMIN_GITHUB_USERS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verify a GitHub PAT by calling /user.
 * Returns the GitHub user object on success, throws on failure.
 */
export async function verifyGitHubToken(pat) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'plugin-store',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub token rejected (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Exchange a GitHub PAT for a JWT, if the user is in the admin allowlist.
 */
export async function loginWithGitHubToken(pat) {
  const user = await verifyGitHubToken(pat);
  const login = (user.login || '').toLowerCase();
  const admins = getAdminUsers();
  if (!admins.includes(login)) {
    // Don't leak the allowlist contents, but tell the user they're not admin.
    const err = new Error(
      `GitHub user "${user.login}" is not authorized to administer this store. ` +
      `Ask the owner to add you to ADMIN_GITHUB_USERS.`
    );
    err.statusCode = 403;
    throw err;
  }
  const token = jwt.sign(
    { sub: String(user.id), login: user.login, name: user.name, avatar: user.avatar_url },
    JWT_SECRET,
    { expiresIn: JWT_TTL }
  );
  return { token, user: { login: user.login, name: user.name, avatar: user.avatar_url, id: user.id } };
}

/**
 * Express middleware: require a valid JWT in Authorization: Bearer <token>.
 * Attaches `req.user` on success.
 */
export function requireAuth(req, res, next) {
  const auth = req.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
  }
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Same as requireAuth but additionally requires the user to be in
 * ADMIN_GITHUB_USERS. Use this for write operations.
 */
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const admins = getAdminUsers();
    if (!req.user || !admins.includes(String(req.user.login || '').toLowerCase())) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
  });
}
