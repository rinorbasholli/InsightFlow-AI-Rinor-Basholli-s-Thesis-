import crypto from 'crypto';
import type express from 'express';

/** Express JSON body cap (Pedrosa A7). Unit-tested; do not raise without a report change. */
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

export function labCredentials(): { user: string; pass: string } | null {
  const user = (process.env.LAB_BASIC_USER || '').trim();
  const pass = (process.env.LAB_BASIC_PASS || '').trim();
  if (!user || !pass) return null;
  return { user, pass };
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

  const sep = decoded.indexOf(':');
  const user = sep === -1 ? decoded : decoded.slice(0, sep);
  const pass = sep === -1 ? '' : decoded.slice(sep + 1);
  if (!timingSafeEqualString(user, creds.user) || !timingSafeEqualString(pass, creds.pass)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="InsightFlow AI academic laboratory", charset="UTF-8"');
    res.status(401).type('text/plain').send('Authentication required.');
    return;
  }

  next();
}

const apiHits = new Map<string, number[]>();

export function clientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
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
