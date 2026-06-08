// User storage and authentication helpers.
// - Users live in data/users.json (bcrypt-hashed passwords).
// - Roles: 'admin' (1 of them, set on first signup) and 'user'.
// - First signup becomes the admin automatically (no admins exist yet).
// - After that, /register always creates a 'user' role.
//
// Note: ADMIN_GITHUB_USERS env still works as a hard override for the
// GitHub PAT login path. We use it only as a fallback / recovery; for
// the normal user flow, the role in users.json is authoritative.

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const USERS_FILE = join(__dirname, '../../data/users.json');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-please';
const JWT_TTL = process.env.JWT_TTL || '7d';
const SALT_ROUNDS = 10;

async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.users) ? data.users : [];
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeUsers(users) {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify({ users, version: '1.0.0' }, null, 2));
}

export async function hasAnyAdmin() {
  const users = await readUsers();
  return users.some((u) => u.role === 'admin');
}

export async function getUserByEmail(email) {
  const users = await readUsers();
  return users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase()) || null;
}

export async function getUserById(id) {
  const users = await readUsers();
  return users.find((u) => u.id === id) || null;
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_TTL }
  );
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
  };
}

/**
 * Register a new user. The very first registration automatically gets
 * the 'admin' role; subsequent registrations get 'user'.
 */
export async function registerUser({ email, password, name }) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    throw err;
  }
  if (String(password).length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.statusCode = 400;
    throw err;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error('Please enter a valid email address');
    err.statusCode = 400;
    throw err;
  }

  const users = await readUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const isFirstUser = users.length === 0;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = {
    id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    email: email.toLowerCase(),
    name: (name && String(name).trim()) || email.split('@')[0],
    role: isFirstUser ? 'admin' : 'user',
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeUsers(users);

  return { user: publicUser(user), token: signToken(user), isFirstUser };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    throw err;
  }
  const user = await getUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  return { user: publicUser(user), token: signToken(user) };
}

/**
 * Middleware: optional auth — populates req.user if a valid token is
 * present, otherwise continues anonymously. Use on read endpoints
 * that should adapt their response based on the caller's role.
 */
export function optionalAuth(req, res, next) {
  const auth = req.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return next();
  try {
    req.user = jwt.verify(m[1], JWT_SECRET);
  } catch {}
  next();
}

/**
 * Middleware: require any authenticated user.
 */
export function requireAuth(req, res, next) {
  const auth = req.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
  }
  try {
    req.user = jwt.verify(m[1], JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: require admin role (from JWT).
 */
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
  });
}

/**
 * Helper: check whether the current user can modify a plugin.
 * Admin: always. User: only if they uploaded it (plugin.uploadedBy === user.email).
 */
export function canModifyPlugin(req, plugin) {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  if (req.user.role === 'user' && plugin?.uploadedBy === req.user.email) return true;
  return false;
}
