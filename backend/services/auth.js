// Legacy GitHub-PAT auth. Kept as an admin recovery path — if
// `ADMIN_GITHUB_USERS` is set, a GitHub PAT can still be exchanged for
// a JWT, useful when the local user database is unavailable.
//
// For the normal user-facing flow, see services/users.js.
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-please';
const JWT_TTL = process.env.JWT_TTL || '7d';

function getAdminUsers() {
  return (process.env.ADMIN_GITHUB_USERS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyGitHubToken(pat) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'google-plugin-store',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub token rejected (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function loginWithGitHubToken(pat) {
  const user = await verifyGitHubToken(pat);
  const login = (user.login || '').toLowerCase();
  const admins = getAdminUsers();
  if (!admins.includes(login)) {
    const err = new Error(
      `GitHub user "${user.login}" is not authorized to administer this store. ` +
      `Ask the owner to add you to ADMIN_GITHUB_USERS.`
    );
    err.statusCode = 403;
    throw err;
  }
  const token = jwt.sign(
    { sub: String(user.id), login: user.login, name: user.name, avatar: user.avatar_url, role: 'admin' },
    JWT_SECRET,
    { expiresIn: JWT_TTL }
  );
  return { token, user: { login: user.login, name: user.name, avatar: user.avatar_url, id: user.id, role: 'admin' } };
}

// Re-export the user-system middleware for convenience.
export { requireAuth, requireAdmin, canModifyPlugin, optionalAuth } from './users.js';
