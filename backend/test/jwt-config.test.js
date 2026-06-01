import { describe, it, expect } from 'vitest';
import { getJwtSecret } from '../src/config/jwt.js';

describe('jwt config', () => {
  it('retorna segredo da env quando definido', () => {
    process.env.JWT_SECRET = 'abc123';
    expect(getJwtSecret()).toBe('abc123');
  });

  it('retorna fallback em ambiente não produção quando não definido', () => {
    delete process.env.JWT_SECRET;
    expect(getJwtSecret()).toBe('dev-secret');
  });
});
