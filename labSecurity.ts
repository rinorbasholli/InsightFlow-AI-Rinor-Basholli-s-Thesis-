import crypto from 'crypto';
import type express from 'express';

/** Express JSON body cap. */
export const JSON_BODY_LIMIT = '32kb';

/** Hourly per-IP cap for POST /api/generate-phishing. */
export const GENERATE_PHISHING_HOURLY_LIMIT = 10;

/** Hourly per-IP cap for every other POST /api/* route. GET is not limited. */
export const OTHER_API_HOURLY_LIMIT = 40;

/** Success-path analysis labels. `unavailable` is error-only on adversarial-perturb. */
export const SUCCESS_SOURCE_LABELS = ['gemini', 'fallback', 'preset', 'computed'] as const;
export type SuccessSourceLabel = (typeof SUCCESS_SOURCE_LABELS)[number];

export function isSuccessSourceLabel(value: unknown): value is SuccessSourceLabel {
  return typeof value === 'string' && (SUCCESS_SOURCE_LABELS as readonly string[]).includes(value);
}

export function timingSafeEqualString(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length === 0 || b.length === 0) {
    return false;
  }
  if (a.length !== b.length) {
    if (a.length > 0) {
      crypto.timingSafeEqual(a, Buffer.alloc(a.length));
    }
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export const SESSION_COOKIE = 'lab_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

type LabSession = { user: string; expiresAt: number };
const sessions = new Map<string, LabSession>();

export function labCredentials(): { user: string; pass: string } | null {
  const user = (process.env.LAB_BASIC_USER || '').trim();
  const pass = (process.env.LAB_BASIC_PASS || '').trim();
  if (!user || !pass) return null;
  return { user, pass };
}

export function isPublicPath(method: string, path: string): boolean {
  if (path === '/api/login' && method === 'POST') return true;
  if (path === '/api/logout' && method === 'POST') return true;
  // Login screen and static assets load without a session. /api/* stays locked except login/logout.
  if (!path.startsWith('/api/')) return true;
  return false;
}

export function createLabSession(user: string): string {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { user, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function destroyLabSession(token: string | null): void {
  if (token) sessions.delete(token);
}

export function sessionCookieHeader(token: string, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookieHeader(secure: boolean): string {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function sessionTokenFromRequest(req: express.Request): string | null {
  const raw = req.headers.cookie;
  if (!raw || typeof raw !== 'string') return null;
  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === SESSION_COOKIE) {
      const value = trimmed.slice(eq + 1).trim();
      return value || null;
    }
  }
  return null;
}

export function sessionUser(token: string | null): string | null {
  if (!token) return null;
  const row = sessions.get(token);
  if (!row) return null;
  if (row.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return row.user;
}

export function credentialsMatch(user: string, pass: string): boolean {
  const creds = labCredentials();
  if (!creds) return false;
  return (
    timingSafeEqualString((user || '').trim(), creds.user) &&
    timingSafeEqualString((pass || '').trim(), creds.pass)
  );
}

export function requireLabAccess(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const creds = labCredentials();
  if (!creds) {
    if (process.env.NODE_ENV === 'production') {
      res.status(503).type('text/plain').send(
        'This laboratory is closed until LAB_BASIC_USER and LAB_BASIC_PASS are set on the server.'
      );
      return;
    }
    next();
    return;
  }

  if (isPublicPath(req.method, req.path)) {
    next();
    return;
  }

  const cookieUser = sessionUser(sessionTokenFromRequest(req));
  if (cookieUser) {
    next();
    return;
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="InsightFlow AI academic laboratory", charset="UTF-8"');
    res.status(401).type('text/plain').send('Authentication required.');
    return;
  }

  let decoded = '';
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  } catch {
    res.status(401).type('text/plain').send('Authentication required.');
    return;
  }

  const ip = clientIp(req);
  if (authLockedOut(ip)) {
    res.status(429).type('text/plain').send('Too many failed sign-in attempts. Try again later.');
    return;
  }
  const sep = decoded.indexOf(':');
  const user = sep === -1 ? decoded : decoded.slice(0, sep);
  const pass = sep === -1 ? '' : decoded.slice(sep + 1);
  if (!timingSafeEqualString(user, creds.user) || !timingSafeEqualString(pass, creds.pass)) {
    recordAuthFailure(ip);
    res.setHeader('WWW-Authenticate', 'Basic realm="InsightFlow AI academic laboratory", charset="UTF-8"');
    res.status(401).type('text/plain').send('Authentication required.');
    return;
  }

  next();
}

const apiHits = new Map<string, number[]>();

/**
 * Client address for rate limiting. Uses req.ip, which Express derives from
 * X-Forwarded-For only up to the number of trusted proxy hops configured with
 * `app.set('trust proxy', 1)` in server.ts. The raw header is not read here,
 * because its first value is chosen by the client and could be rotated to
 * bypass the hourly limit.
 */
export function clientIp(req: express.Request): string {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function rateLimitApi(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.method !== 'POST' || !req.path.startsWith('/api/')) {
    next();
    return;
  }
  const limit =
    req.path === '/api/generate-phishing' ? GENERATE_PHISHING_HOURLY_LIMIT : OTHER_API_HOURLY_LIMIT;
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const ip = clientIp(req);
  const key = `${ip}:${req.path}`;
  const recent = (apiHits.get(key) || []).filter((t) => t > hourAgo);
  if (recent.length >= limit) {
    res.status(429).json({
      success: false,
      error: 'Hourly API limit exceeded for this address.',
    });
    return;
  }
  recent.push(now);
  apiHits.set(key, recent);
  next();
}

const INJECTION_PATTERNS = [
  /ignore (all |any )?(previous|prior|above) (instructions|prompts)/i,
  /you are now /i,
  /disregard (the )?(system|developer)/i,
];

export function promptLooksInjected(text: string): boolean {
  const t = (text || '').trim();
  if (!t) return false;
  return INJECTION_PATTERNS.some((re) => re.test(t));
}

/** Failed sign-in attempts allowed per client address within AUTH_FAILURE_WINDOW_MS. */
export const AUTH_FAILURE_LIMIT = 10;
export const AUTH_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const authFailures = new Map<string, number[]>();

function recentAuthFailures(ip: string): number[] {
  const since = Date.now() - AUTH_FAILURE_WINDOW_MS;
  const recent = (authFailures.get(ip) || []).filter((t) => t > since);
  authFailures.set(ip, recent);
  return recent;
}

export function authLockedOut(ip: string): boolean {
  return recentAuthFailures(ip).length >= AUTH_FAILURE_LIMIT;
}

export function recordAuthFailure(ip: string): void {
  const recent = recentAuthFailures(ip);
  recent.push(Date.now());
  authFailures.set(ip, recent);
}

/** Test helper: clears all recorded failures. */
export function resetAuthFailures(): void {
  authFailures.clear();
}
