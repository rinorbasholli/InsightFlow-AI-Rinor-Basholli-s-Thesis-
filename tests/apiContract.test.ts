import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Success-path analysis labels used by Express and the Python eval service. */
const DOCUMENTED_SUCCESS_SOURCES = ['gemini', 'fallback', 'preset', 'computed'] as const;

test('JSON body size is documented as 32kb on the Express app', () => {
  const serverSrc = readFileSync(join(root, 'server.ts'), 'utf8');
  const securitySrc = readFileSync(join(root, 'labSecurity.ts'), 'utf8');
  assert.match(securitySrc, /export const JSON_BODY_LIMIT = '32kb'/);
  assert.match(serverSrc, /express\.json\(\{\s*limit:\s*JSON_BODY_LIMIT\s*\}\)/);
});

test('documented success source labels remain gemini|fallback|preset|computed', () => {
  assert.deepEqual([...DOCUMENTED_SUCCESS_SOURCES], ['gemini', 'fallback', 'preset', 'computed']);

  const serverSrc = readFileSync(join(root, 'server.ts'), 'utf8');
  assert.match(serverSrc, /source:\s*'gemini'/);
  assert.match(serverSrc, /source:\s*'fallback'/);
  assert.match(serverSrc, /source:\s*'preset'/);

  const evalService = readFileSync(join(root, 'eval/adversarial/service.py'), 'utf8');
  assert.match(evalService, /"source": "computed"/);

  const phishingMetrics = JSON.parse(
    readFileSync(join(root, 'eval/phishing/results/phishing_metrics.json'), 'utf8')
  );
  assert.equal(phishingMetrics.source, 'computed');

  const successAssignments = [
    ...serverSrc.matchAll(/source:\s*'([a-z]+)'/g),
  ].map((m) => m[1]);
  for (const label of successAssignments) {
    if (label === 'unavailable') {
      // Error path only: POST /api/adversarial-perturb when the eval service is down.
      continue;
    }
    assert.ok(
      (DOCUMENTED_SUCCESS_SOURCES as readonly string[]).includes(label),
      `unexpected source label in server.ts: ${label}`
    );
  }
});

test('Express advertises login, the four POST teaching routes and the three eval GET routes', () => {
  const serverSrc = readFileSync(join(root, 'server.ts'), 'utf8');
  assert.match(serverSrc, /app\.post\('\/api\/login'/);
  assert.match(serverSrc, /app\.post\('\/api\/logout'/);
  assert.match(serverSrc, /app\.get\('\/api\/whoami'/);
  assert.match(serverSrc, /app\.post\('\/api\/generate-phishing'/);
  assert.match(serverSrc, /app\.post\('\/api\/analyze-email'/);
  assert.match(serverSrc, /app\.post\('\/api\/analyze-media-deepfake'/);
  assert.match(serverSrc, /app\.post\('\/api\/adversarial-perturb'/);
  assert.match(serverSrc, /app\.get\('\/api\/eval\/health'/);
  assert.match(serverSrc, /app\.get\('\/api\/eval\/adversarial'/);
  assert.match(serverSrc, /app\.get\('\/api\/eval\/phishing'/);
});
