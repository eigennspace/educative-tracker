import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { AuthProvider } from '../auth/AuthContext.jsx';
import { clearAuthSession } from '../api/client.js';

function jsonResponse(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name) => (name.toLowerCase() === 'content-type' ? 'application/json' : null)
    },
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  };
}

function installFetchMock(routes) {
  global.fetch = vi.fn(async (url, options = {}) => {
    const parsed = new URL(url, 'http://localhost');
    const method = (options.method || 'GET').toUpperCase();
    const withQuery = `${method} ${parsed.pathname}${parsed.search}`;
    const withoutQuery = `${method} ${parsed.pathname}`;
    const handler = routes[withQuery] || routes[withoutQuery];

    if (!handler) {
      return jsonResponse(500, { error: `Missing mock for ${withQuery}` });
    }

    if (typeof handler === 'function') {
      return handler({ url: parsed, options });
    }

    return handler;
  });
}

function renderApp(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  clearAuthSession();
  localStorage.clear();
});

describe('Frontend auth integration', () => {
  it('redirects unauthenticated users from protected routes to login', async () => {
    renderApp('/dashboard');
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('logs in and redirects back to the originally requested protected route', async () => {
    installFetchMock({
      'POST /api/auth/login': jsonResponse(200, {
        data: {
          user: { id: 101, name: 'User One', email: 'user1@example.com' },
          tokens: { accessToken: 'token-a', refreshToken: 'refresh-a' }
        }
      }),
      'GET /api/courses': jsonResponse(200, { data: [] })
    });

    renderApp('/courses');
    const user = userEvent.setup();

    await user.type(await screen.findByPlaceholderText(/email/i), 'user1@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('button', { name: /add course/i })).toBeInTheDocument();
    expect(screen.getByText(/user1@example.com/i)).toBeInTheDocument();

    const coursesCall = global.fetch.mock.calls.find(([url]) => String(url).includes('/api/courses'));
    expect(coursesCall).toBeTruthy();
    const headers = coursesCall[1]?.headers || {};
    expect(headers.authorization).toBe('Bearer token-a');
  });

  it('shows login error on invalid credentials', async () => {
    installFetchMock({
      'POST /api/auth/login': jsonResponse(401, { error: 'Invalid credentials' })
    });

    renderApp('/login');
    const user = userEvent.setup();

    await user.type(await screen.findByPlaceholderText(/email/i), 'bad@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('sends applyToPrevious for complete 1..N action in courses', async () => {
    let progressPayload = null;
    installFetchMock({
      'POST /api/auth/login': jsonResponse(200, {
        data: {
          user: { id: 301, name: 'Range User', email: 'range@example.com' },
          tokens: { accessToken: 'token-range', refreshToken: 'refresh-range' }
        }
      }),
      'GET /api/courses': jsonResponse(200, {
        data: [{
          id: 7,
          title: 'React Foundations',
          category: 'Frontend',
          difficulty: 'intermediate',
          totalLessons: 20,
          estimatedHours: 10,
          completedLessons: 0,
          progressPercentage: 0,
          lastStudiedAt: null
        }]
      }),
      'POST /api/courses/7/progress/toggle': ({ options }) => {
        progressPayload = JSON.parse(options.body);
        return jsonResponse(200, { data: {} });
      }
    });

    renderApp('/courses');
    const user = userEvent.setup();

    await user.type(await screen.findByPlaceholderText(/email/i), 'range@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findAllByText(/react foundations/i);
    await user.type(screen.getAllByLabelText(/lesson number for react foundations/i)[0], '11');
    await user.selectOptions(screen.getAllByLabelText(/complete mode for react foundations/i)[0], 'range');
    await user.click(screen.getAllByLabelText(/apply lesson update for react foundations/i)[0]);

    await waitFor(() => {
      expect(progressPayload).toEqual({
        lessonNumber: 11,
        completed: true,
        applyToPrevious: true
      });
    });
  });

  it('keeps undo action as single-lesson update payload', async () => {
    let progressPayload = null;
    installFetchMock({
      'POST /api/auth/login': jsonResponse(200, {
        data: {
          user: { id: 302, name: 'Undo User', email: 'undo@example.com' },
          tokens: { accessToken: 'token-undo', refreshToken: 'refresh-undo' }
        }
      }),
      'GET /api/courses': jsonResponse(200, {
        data: [{
          id: 8,
          title: 'Node Essentials',
          category: 'Backend',
          difficulty: 'beginner',
          totalLessons: 12,
          estimatedHours: 7,
          completedLessons: 5,
          progressPercentage: 41.67,
          lastStudiedAt: null
        }]
      }),
      'POST /api/courses/8/progress/toggle': ({ options }) => {
        progressPayload = JSON.parse(options.body);
        return jsonResponse(200, { data: {} });
      }
    });

    renderApp('/courses');
    const user = userEvent.setup();

    await user.type(await screen.findByPlaceholderText(/email/i), 'undo@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findAllByText(/node essentials/i);
    await user.type(screen.getAllByLabelText(/lesson number for node essentials/i)[0], '3');
    await user.selectOptions(screen.getAllByLabelText(/lesson action for node essentials/i)[0], 'false');
    await user.click(screen.getAllByLabelText(/apply lesson update for node essentials/i)[0]);

    await waitFor(() => {
      expect(progressPayload).toEqual({
        lessonNumber: 3,
        completed: false
      });
    });
  });

  it('registers successfully and loads dashboard', async () => {
    installFetchMock({
      'POST /api/auth/register': jsonResponse(201, {
        data: {
          user: { id: 202, name: 'New User', email: 'new@example.com' },
          tokens: { accessToken: 'token-b', refreshToken: 'refresh-b' }
        }
      }),
      'GET /api/dashboard/summary': jsonResponse(200, {
        data: { activeCourses: 0, totalStudyHours: 0, learningStreakDays: 0, completion: [] }
      }),
      'GET /api/dashboard/weekly': jsonResponse(200, { data: [] }),
      'GET /api/analytics/heatmap': jsonResponse(200, { data: { year: 2026, days: [] } }),
      'GET /api/analytics/insights': jsonResponse(200, {
        data: { bestStudyDay: null, bestStudyDayMinutes: 0, consistencyScore: 0, trendPercent: 0, trendDirection: 'up' }
      })
    });

    renderApp('/register');
    const user = userEvent.setup();

    await user.type(await screen.findByPlaceholderText(/full name/i), 'New User');
    await user.type(screen.getByPlaceholderText(/email/i), 'new@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/productivity insights/i)).toBeInTheDocument();
    expect(screen.getByText(/new@example.com/i)).toBeInTheDocument();
  });

  it('shows register error when email is already used', async () => {
    installFetchMock({
      'POST /api/auth/register': jsonResponse(409, { error: 'Email already in use' })
    });

    renderApp('/register');
    const user = userEvent.setup();

    await user.type(await screen.findByPlaceholderText(/full name/i), 'Existing User');
    await user.type(screen.getByPlaceholderText(/email/i), 'existing@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/email already in use/i)).toBeInTheDocument();
  });

  it('submits forgot-password and shows reset link when provided by API', async () => {
    installFetchMock({
      'POST /api/auth/forgot-password': jsonResponse(200, {
        data: {
          message: 'If that email exists, a reset link has been generated.',
          resetUrl: 'http://localhost:5173/reset-password?token=devtoken123'
        }
      })
    });

    renderApp('/forgot-password');
    const user = userEvent.setup();

    await user.type(await screen.findByPlaceholderText(/you@example.com/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/reset link has been generated/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open reset page/i })).toBeInTheDocument();
  });

  it('resets password successfully from reset page', async () => {
    installFetchMock({
      'POST /api/auth/reset-password': jsonResponse(200, {
        data: { message: 'Password reset successful. You can now sign in.' }
      })
    });

    renderApp('/reset-password?token=abc123reset');
    const user = userEvent.setup();

    await user.type(await screen.findByPlaceholderText(/at least 8 characters/i), 'NewStrongPass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/password reset successful/i)).toBeInTheDocument();
  });
});
