import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '../../db/index.js';
import { env } from '../../config/env.js';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function toUserDto(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id },
    env.jwtAccessSecret,
    {
      algorithm: 'HS256',
      expiresIn: env.jwtAccessExpiresIn,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
      subject: String(user.id)
    }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, tokenType: 'refresh' },
    env.jwtRefreshSecret,
    {
      algorithm: 'HS256',
      expiresIn: env.jwtRefreshExpiresIn,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
      subject: String(user.id)
    }
  );
}

function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    tokenType: 'Bearer',
    accessTokenExpiresIn: env.jwtAccessExpiresIn,
    refreshTokenExpiresIn: env.jwtRefreshExpiresIn
  };
}

export async function registerUser(payload) {
  const email = normalizeEmail(payload.email);
  const passwordHash = await bcrypt.hash(payload.password, env.bcryptSaltRounds);

  try {
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, updated_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(payload.name.trim(), email, passwordHash);

    const user = db
      .prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?')
      .get(Number(result.lastInsertRowid));

    return {
      user: toUserDto(user),
      tokens: issueTokens(user)
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const err = new Error('Email already in use');
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }
}

export async function loginUser(payload) {
  const email = normalizeEmail(payload.email);
  const user = db
    .prepare('SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE email = ?')
    .get(email);

  if (!user?.password_hash) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const validPassword = await bcrypt.compare(payload.password, user.password_hash);
  if (!validPassword) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  return {
    user: toUserDto(user),
    tokens: issueTokens(user)
  };
}

export function refreshUserTokens(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret, {
      algorithms: ['HS256'],
      issuer: env.jwtIssuer,
      audience: env.jwtAudience
    });
  } catch (error) {
    const err = new Error(error.name === 'TokenExpiredError' ? 'Refresh token expired' : 'Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  if (payload?.tokenType !== 'refresh') {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  const userId = Number(payload.userId || payload.sub);
  const user = db
    .prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?')
    .get(userId);

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }

  return {
    user: toUserDto(user),
    tokens: issueTokens(user)
  };
}

export function requestPasswordReset(payload) {
  const email = normalizeEmail(payload.email);
  const user = db
    .prepare('SELECT id, email FROM users WHERE email = ?')
    .get(email);

  const response = {
    message: 'If that email exists, a reset link has been generated.'
  };

  if (!user) {
    return response;
  }

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);

  db.prepare(`
    UPDATE password_reset_tokens
    SET used_at = datetime('now')
    WHERE user_id = ? AND used_at IS NULL
  `).run(user.id);

  db.prepare(`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (?, ?, datetime('now', '+' || ? || ' minutes'))
  `).run(user.id, tokenHash, env.passwordResetTokenTtlMinutes);

  if (env.exposeResetToken) {
    return {
      ...response,
      resetToken: rawToken,
      resetUrl: `${env.frontendOrigin}/reset-password?token=${rawToken}`
    };
  }

  return response;
}

export async function resetPassword(payload) {
  const tokenHash = hashResetToken(payload.token);
  const tokenRow = db.prepare(`
    SELECT id, user_id
    FROM password_reset_tokens
    WHERE token_hash = ?
      AND used_at IS NULL
      AND expires_at > datetime('now')
    LIMIT 1
  `).get(tokenHash);

  if (!tokenRow) {
    const err = new Error('Invalid or expired reset token');
    err.statusCode = 400;
    throw err;
  }

  const newPasswordHash = await bcrypt.hash(payload.newPassword, env.bcryptSaltRounds);

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newPasswordHash, tokenRow.user_id);

    db.prepare(`
      UPDATE password_reset_tokens
      SET used_at = datetime('now')
      WHERE user_id = ? AND used_at IS NULL
    `).run(tokenRow.user_id);
  });

  transaction();

  return { message: 'Password reset successful. You can now sign in.' };
}
