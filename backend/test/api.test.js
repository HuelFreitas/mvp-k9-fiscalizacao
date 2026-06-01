import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { initAppState } from '../src/initState.js';

describe('API backend', () => {
  beforeEach(() => {
    initAppState();
  });

  it('registra e autentica usuário com senha', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      email: 'teste@empresa.com',
      name: 'Teste',
      role: 'client',
      company: 'Empresa Teste',
      password: '123456',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeTypeOf('string');
    expect(registerRes.body.user.email).toBe('teste@empresa.com');

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'teste@empresa.com',
      password: '123456',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTypeOf('string');
  });

  it('bloqueia /api/requests sem token', async () => {
    const res = await request(app).get('/api/requests');
    expect(res.status).toBe(401);
  });

  it('permite criar e listar requests com token de client', async () => {
    const authRes = await request(app).post('/api/auth/register').send({
      email: 'cliente@empresa.com',
      name: 'Cliente',
      role: 'client',
      company: 'Empresa',
      password: '123456',
    });

    const token = authRes.body.token;
    expect(token).toBeTypeOf('string');

    const createRes = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Inspecao',
        port: 'Porto',
        vessel: 'Navio',
        cargo: 'Carga',
        scheduledFor: '2026-06-01',
        scheduledTime: '10:00',
        description: 'Descricao',
        tags: ['teste'],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.request.title).toBe('Inspecao');

    const listRes = await request(app).get('/api/requests').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.items)).toBe(true);
    expect(listRes.body.total).toBeGreaterThanOrEqual(1);
  });

  it('não permite que um client veja request de outro client', async () => {
    const clientA = await request(app).post('/api/auth/register').send({
      email: 'a@empresa.com',
      name: 'A',
      role: 'client',
      company: 'Empresa A',
      password: '123456',
    });
    const clientB = await request(app).post('/api/auth/register').send({
      email: 'b@empresa.com',
      name: 'B',
      role: 'client',
      company: 'Empresa B',
      password: '123456',
    });

    const tokenA = clientA.body.token;
    const tokenB = clientB.body.token;

    const created = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Privada A',
        port: 'Porto',
        vessel: 'Navio',
        scheduledFor: '2026-06-01',
        scheduledTime: '11:00',
        description: 'Desc',
      });

    const reqId = created.body.request.id;
    const getByB = await request(app).get(`/api/requests/${reqId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(getByB.status).toBe(404);

    const listB = await request(app).get('/api/requests').set('Authorization', `Bearer ${tokenB}`);
    expect(listB.status).toBe(200);
    expect(listB.body.items.some((r) => r.id === reqId)).toBe(false);
  });

  it('retorna 422 para payload inválido em auth e requests', async () => {
    const badRegister = await request(app).post('/api/auth/register').send({
      email: 'nao-email',
      name: '',
      role: 'client',
      password: '123',
    });
    expect(badRegister.status).toBe(422);

    const authRes = await request(app).post('/api/auth/register').send({
      email: 'ok@empresa.com',
      name: 'OK',
      role: 'client',
      company: 'Empresa',
      password: '123456',
    });
    const token = authRes.body.token;

    const badCreate = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'faltando campos' });
    expect(badCreate.status).toBe(422);
  });
});
