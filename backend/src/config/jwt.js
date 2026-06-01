const isProduction = process.env.NODE_ENV === 'production';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) return secret;

  if (isProduction) {
    throw new Error('JWT_SECRET is required in production');
  }

  return 'dev-secret';
}
