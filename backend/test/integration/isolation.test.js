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

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'educative-tracker-test-'));
const dbPath = path.join(tempDir, 'integration.db');

process.env.DB_PATH = dbPath;
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ISSUER = 'educative-tracker-test';
process.env.JWT_AUDIENCE = 'educative-tracker-api-test';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

let app;
let userAToken;
let userBToken;
let courseAId;
let sessionAId;

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function registerUser(name) {
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = `${safeName}_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
  const response = await inject(app, {
    method: 'POST',
    url: '/api/auth/register',
    headers: { 'content-type': 'application/json' },
    payload: {
      name,
      email,
      password: 'StrongPass123'
    }
  });

  assert.equal(response.statusCode, 201);
  const body = JSON.parse(response.payload);

  return body.data;
}

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

  const userA = await registerUser('Isolation User A');
  const userB = await registerUser('Isolation User B');

  userAToken = userA.tokens.accessToken;
  userBToken = userB.tokens.accessToken;

  const courseResponse = await inject(app, {
    method: 'POST',
    url: '/api/courses',
    headers: {
      ...authHeader(userAToken),
      'content-type': 'application/json'
    },
    payload: {
      title: 'Private Course A',
      url: '',
      category: 'Security',
      totalLessons: 12,
      difficulty: 'intermediate',
      estimatedHours: 8
    }
  });
  assert.equal(courseResponse.statusCode, 201);
  courseAId = JSON.parse(courseResponse.payload).data.id;

  const progressResponse = await inject(app, {
    method: 'POST',
    url: `/api/courses/${courseAId}/progress/toggle`,
    headers: {
      ...authHeader(userAToken),
      'content-type': 'application/json'
    },
    payload: { lessonNumber: 1, completed: true }
  });
  assert.equal(progressResponse.statusCode, 200);

  const sessionResponse = await inject(app, {
    method: 'POST',
    url: '/api/sessions',
    headers: {
      ...authHeader(userAToken),
      'content-type': 'application/json'
    },
    payload: {
      courseId: courseAId,
      sessionDate: '2026-02-15',
      durationMinutes: 45,
      notes: 'User A private study session'
    }
  });
  assert.equal(sessionResponse.statusCode, 201);
  sessionAId = JSON.parse(sessionResponse.payload).data.id;
});

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('Auth guard', () => {
  it('rejects protected endpoints without Bearer token', async () => {
    const response = await inject(app, { method: 'GET', url: '/api/courses' });
    assert.equal(response.statusCode, 401);
  });
});

describe('Tenant isolation', () => {
  it('supports completing lessons 1..N in a single progress update', async () => {
    const rangeComplete = await inject(app, {
      method: 'POST',
      url: `/api/courses/${courseAId}/progress/toggle`,
      headers: {
        ...authHeader(userAToken),
        'content-type': 'application/json'
      },
      payload: { lessonNumber: 11, completed: true, applyToPrevious: true }
    });
    assert.equal(rangeComplete.statusCode, 200);
    const rangeBody = JSON.parse(rangeComplete.payload);

    assert.equal(rangeBody.data.completedLessons, 11);
    assert.equal(rangeBody.data.progressPercentage, 91.67);
    assert.equal(rangeBody.data.lessons.length, 11);
    assert.equal(rangeBody.data.lessons.every((lesson) => lesson.completed), true);
    assert.equal(rangeBody.data.lessons[0].lessonNumber, 1);
    assert.equal(rangeBody.data.lessons[10].lessonNumber, 11);
  });

  it('isolates courses across users', async () => {
    const userBList = await inject(app, {
      method: 'GET',
      url: '/api/courses',
      headers: authHeader(userBToken)
    });
    assert.equal(userBList.statusCode, 200);
    const listBody = JSON.parse(userBList.payload);

    assert.equal(listBody.data.some((course) => course.id === courseAId), false);

    const getForbidden = await inject(app, {
      method: 'GET',
      url: `/api/courses/${courseAId}`,
      headers: authHeader(userBToken)
    });
    assert.equal(getForbidden.statusCode, 404);

    const patchForbidden = await inject(app, {
      method: 'PATCH',
      url: `/api/courses/${courseAId}`,
      headers: {
        ...authHeader(userBToken),
        'content-type': 'application/json'
      },
      payload: { title: 'No Access' }
    });
    assert.equal(patchForbidden.statusCode, 404);

    const deleteForbidden = await inject(app, {
      method: 'DELETE',
      url: `/api/courses/${courseAId}`,
      headers: authHeader(userBToken)
    });
    assert.equal(deleteForbidden.statusCode, 404);
  });

  it('isolates progress endpoints across users', async () => {
    const getForbidden = await inject(app, {
      method: 'GET',
      url: `/api/courses/${courseAId}/progress`,
      headers: authHeader(userBToken)
    });
    assert.equal(getForbidden.statusCode, 404);

    const postForbidden = await inject(app, {
      method: 'POST',
      url: `/api/courses/${courseAId}/progress/toggle`,
      headers: {
        ...authHeader(userBToken),
        'content-type': 'application/json'
      },
      payload: { lessonNumber: 2, completed: true }
    });
    assert.equal(postForbidden.statusCode, 404);
  });

  it('isolates sessions across users', async () => {
    const userBList = await inject(app, {
      method: 'GET',
      url: '/api/sessions',
      headers: authHeader(userBToken)
    });
    assert.equal(userBList.statusCode, 200);
    const listBody = JSON.parse(userBList.payload);

    assert.equal(listBody.data.some((session) => session.id === sessionAId), false);

    const patchForbidden = await inject(app, {
      method: 'PATCH',
      url: `/api/sessions/${sessionAId}`,
      headers: {
        ...authHeader(userBToken),
        'content-type': 'application/json'
      },
      payload: { durationMinutes: 60 }
    });
    assert.equal(patchForbidden.statusCode, 404);

    const deleteForbidden = await inject(app, {
      method: 'DELETE',
      url: `/api/sessions/${sessionAId}`,
      headers: authHeader(userBToken)
    });
    assert.equal(deleteForbidden.statusCode, 404);
  });

  it('isolates dashboard and analytics data across users', async () => {
    const summaryA = await inject(app, {
      method: 'GET',
      url: '/api/dashboard/summary',
      headers: authHeader(userAToken)
    });
    assert.equal(summaryA.statusCode, 200);
    const summaryABody = JSON.parse(summaryA.payload);
    assert.equal(summaryABody.data.activeCourses > 0, true);

    const summaryB = await inject(app, {
      method: 'GET',
      url: '/api/dashboard/summary',
      headers: authHeader(userBToken)
    });
    assert.equal(summaryB.statusCode, 200);
    const summaryBBody = JSON.parse(summaryB.payload);
    assert.equal(summaryBBody.data.activeCourses, 0);
    assert.equal(summaryBBody.data.completion.length, 0);

    const weeklyB = await inject(app, {
      method: 'GET',
      url: '/api/dashboard/weekly',
      headers: authHeader(userBToken)
    });
    assert.equal(weeklyB.statusCode, 200);
    const weeklyBBody = JSON.parse(weeklyB.payload);
    assert.equal(weeklyBBody.data.length, 0);

    const heatmapB = await inject(app, {
      method: 'GET',
      url: '/api/analytics/heatmap?year=2026',
      headers: authHeader(userBToken)
    });
    assert.equal(heatmapB.statusCode, 200);
    const heatmapBBody = JSON.parse(heatmapB.payload);
    assert.equal(heatmapBBody.data.days.length, 0);

    const insightsB = await inject(app, {
      method: 'GET',
      url: '/api/analytics/insights',
      headers: authHeader(userBToken)
    });
    assert.equal(insightsB.statusCode, 200);
    const insightsBBody = JSON.parse(insightsB.payload);
    assert.equal(insightsBBody.data.bestStudyDay, null);
    assert.equal(insightsBBody.data.bestStudyDayMinutes, 0);
  });
});
