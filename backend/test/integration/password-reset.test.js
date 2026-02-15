import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { after, before, describe, it } from 'node:test';
import Database from 'better-sqlite3';
import { inject } from 'light-my-request';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../..');

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'educative-password-reset-test-'));
const dbPath = path.join(tempDir, 'integration.db');

process.env.DB_PATH = dbPath;
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ISSUER = 'educative-tracker-test';
process.env.JWT_AUDIENCE = 'educative-tracker-api-test';
process.env.EXPOSE_RESET_TOKEN = 'true';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

let app;
let email;

before(async () => {
  const migrationsDir = path.join(backendRoot, 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const db = new Database(dbPath);
  for (const file of migrationFiles) {
    if (file === '002_seed.sql') {
      continue;
    }

    const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
  }

  const seedSql = readFileSync(path.join(migrationsDir, '002_seed.sql'), 'utf8');
  db.exec(seedSql);
  db.close();

  const appModule = await import(pathToFileURL(path.join(backendRoot, 'src/app.js')).href);
  app = appModule.default;

  email = `reset_${Date.now()}@example.com`;
  const register = await inject(app, {
    method: 'POST',
    url: '/api/auth/register',
    headers: { 'content-type': 'application/json' },
    payload: {
      name: 'Password Reset User',
      email,
      password: 'StrongPass123'
    }
  });
  assert.equal(register.statusCode, 201);
});

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('Password reset flow', () => {
  it('returns generic message for unknown emails', async () => {
    const response = await inject(app, {
      method: 'POST',
      url: '/api/auth/forgot-password',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'missing-user@example.com' }
    });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.equal(typeof body.data.message, 'string');
    assert.equal(body.data.resetToken, undefined);
  });

  it('issues reset token for existing account (dev exposure)', async () => {
    const response = await inject(app, {
      method: 'POST',
      url: '/api/auth/forgot-password',
      headers: { 'content-type': 'application/json' },
      payload: { email }
    });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.equal(typeof body.data.resetToken, 'string');
    assert.equal(body.data.resetToken.length > 20, true);
  });

  it('rejects invalid reset token', async () => {
    const response = await inject(app, {
      method: 'POST',
      url: '/api/auth/reset-password',
      headers: { 'content-type': 'application/json' },
      payload: {
        token: 'invalid-reset-token-value',
        newPassword: 'NewStrongPass123'
      }
    });

    assert.equal(response.statusCode, 400);
  });

  it('resets password and invalidates old password', async () => {
    const forgot = await inject(app, {
      method: 'POST',
      url: '/api/auth/forgot-password',
      headers: { 'content-type': 'application/json' },
      payload: { email }
    });
    const forgotBody = JSON.parse(forgot.payload);
    const token = forgotBody.data.resetToken;

    const reset = await inject(app, {
      method: 'POST',
      url: '/api/auth/reset-password',
      headers: { 'content-type': 'application/json' },
      payload: {
        token,
        newPassword: 'NewStrongPass123'
      }
    });
    assert.equal(reset.statusCode, 200);

    const oldLogin = await inject(app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email,
        password: 'StrongPass123'
      }
    });
    assert.equal(oldLogin.statusCode, 401);

    const newLogin = await inject(app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email,
        password: 'NewStrongPass123'
      }
    });
    assert.equal(newLogin.statusCode, 200);
  });
});
