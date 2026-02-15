import dotenv from 'dotenv';

dotenv.config();

function toBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export const env = {
  port: Number(process.env.PORT || 4000),
  dbPath: process.env.DB_PATH || './data/educative_tracker.db',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  jwtIssuer: process.env.JWT_ISSUER || 'educative-tracker',
  jwtAudience: process.env.JWT_AUDIENCE || 'educative-tracker-api',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  passwordResetTokenTtlMinutes: Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30),
  exposeResetToken: toBoolean(process.env.EXPOSE_RESET_TOKEN, process.env.NODE_ENV !== 'production')
};
