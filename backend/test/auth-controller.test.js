import { beforeEach, describe, expect, it } from 'vitest';
import { loginHandler, registerHandler } from '../src/controllers/authController.js';
import { initAppState } from '../src/initState.js';

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

describe('authController', () => {
  beforeEach(() => {
    initAppState();
    delete process.env.ALLOW_DEV_PASSWORDLESS_LOGIN;
  });

  it('retorna 422 para payload de login inválido', async () => {
    const req = { body: { email: 'invalido' } };
    const res = mockRes();
    await loginHandler(req, res);
    expect(res.statusCode).toBe(422);
  });

  it('retorna 404 para usuário não encontrado', async () => {
    const req = { body: { email: 'naoexiste@x.com', password: '123456' } };
    const res = mockRes();
    await loginHandler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 401 quando senha está incorreta', async () => {
    const req = { body: { email: 'marina@portosafemar.com', password: 'senha-errada' } };
    const res = mockRes();
    await loginHandler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('realiza login com sucesso', async () => {
    const req = { body: { email: 'marina@portosafemar.com', password: '123456' } };
    const res = mockRes();
    await loginHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('registra usuário e bloqueia duplicado', async () => {
    const req = {
      body: {
        email: 'novo@empresa.com',
        name: 'Novo',
        role: 'client',
        company: 'Empresa',
        password: '123456',
      },
    };
    const res = mockRes();
    await registerHandler(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe('novo@empresa.com');

    const reqDup = { body: req.body };
    const resDup = mockRes();
    await registerHandler(reqDup, resDup);
    expect(resDup.statusCode).toBe(409);
  });

  it('aceita passwordless em dev quando habilitado', async () => {
    process.env.ALLOW_DEV_PASSWORDLESS_LOGIN = 'true';
    const req = { body: { email: 'marina@portosafemar.com' } };
    const res = mockRes();
    await loginHandler(req, res);
    expect(res.statusCode).toBe(200);
  });
});
