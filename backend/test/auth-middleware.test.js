import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { ensureAuth, ensureRole } from '../src/middleware/authMiddleware.js';

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('auth middleware', () => {
  it('retorna 401 sem authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    let called = false;
    ensureAuth(req, res, () => {
      called = true;
    });
    expect(res.statusCode).toBe(401);
    expect(called).toBe(false);
  });

  it('retorna 401 com token inválido', () => {
    const req = { headers: { authorization: 'Bearer token-invalido' } };
    const res = mockRes();
    ensureAuth(req, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  it('aceita token válido e popula req.user', () => {
    process.env.JWT_SECRET = 'teste-secret';
    const token = jwt.sign({ sub: 'u1', role: 'client' }, 'teste-secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let called = false;
    ensureAuth(req, res, () => {
      called = true;
    });
    expect(called).toBe(true);
    expect(req.user).toEqual({ id: 'u1', role: 'client' });
  });

  it('ensureRole retorna 403 para role não permitido', () => {
    const req = { user: { id: 'u1', role: 'client' } };
    const res = mockRes();
    let called = false;
    ensureRole(['admin'])(req, res, () => {
      called = true;
    });
    expect(res.statusCode).toBe(403);
    expect(called).toBe(false);
  });
});
