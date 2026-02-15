import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

function parseBearerToken(headerValue) {
  if (!headerValue || !headerValue.startsWith('Bearer ')) {
    return null;
  }

  const token = headerValue.slice('Bearer '.length).trim();
  return token || null;
}

export function authenticate(req, res, next) {
  const token = parseBearerToken(req.get('authorization'));
  if (!token) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret, {
      algorithms: ['HS256'],
      issuer: env.jwtIssuer,
      audience: env.jwtAudience
    });

    const userId = Number(payload.userId || payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    req.userId = userId;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired' });
    }
    return res.status(401).json({ error: 'Invalid access token' });
  }
}
