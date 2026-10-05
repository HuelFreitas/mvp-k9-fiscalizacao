import { describe, it, expect, beforeEach } from 'vitest';
import {
  listRequestsHandler,
  createRequestHandler,
  getRequestHandler,
  updateRequestHandler,
  deleteRequestHandler,
  updateRequestStatusHandler,
  addRequestProgressHandler,
  submitRequestReportHandler,
} from '../src/controllers/requestsController.js';
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
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('requests controllers', () => {
  beforeEach(() => {
    initAppState();
  });

  it('lista apenas requests do client autenticado', async () => {
    const req = { user: { id: 'client-porto', role: 'client' } };
    const res = mockRes();
    await listRequestsHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.items.every((i) => i.clientId === 'client-porto')).toBe(true);
  });

  it('operador vê apenas solicitações livres ou atribuídas a ele', async () => {
    global.appState.requests.push({
      id: 'req-other-operator',
      clientId: 'client-porto',
      assignedOperatorId: 'operator-other',
      status: 'pending',
      timeline: [],
    });
    const req = { user: { id: 'operator-santos', role: 'operator' } };
    const res = mockRes();
    await listRequestsHandler(req, res);
    expect(res.body.items.some((item) => item.id === 'req-other-operator')).toBe(false);
  });

  it('bloqueia acesso de client a request de outro client', async () => {
    global.appState.requests.push({
      id: 'req-other',
      clientId: 'client-2',
      title: 'x',
      port: 'x',
      vessel: 'x',
      description: 'x',
      scheduledFor: '2026-01-01T10:00:00',
      timeline: [],
    });
    const req = { user: { id: 'client-porto', role: 'client' }, params: { id: 'req-other' } };
    const res = mockRes();
    await getRequestHandler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('permite update e delete para admin', async () => {
    const reqId = global.appState.requests[0].id;
    const updateReq = { user: { id: 'admin-1', role: 'admin' }, params: { id: reqId }, body: { title: 'Novo título' } };
    const updateRes = mockRes();
    await updateRequestHandler(updateReq, updateRes);
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.request.title).toBe('Novo título');

    const deleteReq = { user: { id: 'admin-1', role: 'admin' }, params: { id: reqId } };
    const deleteRes = mockRes();
    await deleteRequestHandler(deleteReq, deleteRes);
    expect(deleteRes.statusCode).toBe(204);
  });

  it('retorna 422 ao criar request com payload inválido', async () => {
    const req = { user: { id: 'client-porto', role: 'client' }, body: { title: 'sem campos' } };
    const res = mockRes();
    await createRequestHandler(req, res);
    expect(res.statusCode).toBe(422);
  });

  it('retorna 422 ao atualizar request com payload vazio', async () => {
    const reqId = global.appState.requests[0].id;
    const req = { user: { id: 'admin-1', role: 'admin' }, params: { id: reqId }, body: {} };
    const res = mockRes();
    await updateRequestHandler(req, res);
    expect(res.statusCode).toBe(422);
  });

  it('bloqueia alteração de campos sensíveis e edição geral por operador', async () => {
    const reqId = global.appState.requests[0].id;
    const sensitiveRes = mockRes();
    await updateRequestHandler(
      { user: { id: 'admin-1', role: 'admin' }, params: { id: reqId }, body: { status: 'completed' } },
      sensitiveRes
    );
    expect(sensitiveRes.statusCode).toBe(422);

    const operatorRes = mockRes();
    await updateRequestHandler(
      { user: { id: 'operator-santos', role: 'operator' }, params: { id: reqId }, body: { title: 'Alterado' } },
      operatorRes
    );
    expect(operatorRes.statusCode).toBe(403);
  });

  it('impede operador de atuar em solicitação atribuída a outro operador', async () => {
    const reqId = global.appState.requests[0].id;
    const res = mockRes();
    await updateRequestStatusHandler(
      { user: { id: 'operator-other', role: 'operator' }, params: { id: reqId }, body: { status: 'completed' } },
      res
    );
    expect(res.statusCode).toBe(404);
  });

  it('retorna 404 para request inexistente em operações de status/progresso/relatório', async () => {
    const params = { id: 'inexistente' };
    const user = { id: 'operator-x', role: 'operator' };

    const statusRes = mockRes();
    await updateRequestStatusHandler({ user, params, body: { status: 'in-progress' } }, statusRes);
    expect(statusRes.statusCode).toBe(404);

    const progressRes = mockRes();
    await addRequestProgressHandler({ user, params, body: { title: 't', details: 'd' } }, progressRes);
    expect(progressRes.statusCode).toBe(404);

    const reportRes = mockRes();
    await submitRequestReportHandler({ user, params, body: { summary: 's', findings: 'f', recommendations: 'r' } }, reportRes);
    expect(reportRes.statusCode).toBe(404);
  });

  it('retorna 422 para payload inválido em status/progresso/relatório', async () => {
    const reqId = global.appState.requests[0].id;
    const user = { id: 'operator-santos', role: 'operator' };

    const statusRes = mockRes();
    await updateRequestStatusHandler({ user, params: { id: reqId }, body: { status: 'x' } }, statusRes);
    expect(statusRes.statusCode).toBe(422);

    const progressRes = mockRes();
    await addRequestProgressHandler({ user, params: { id: reqId }, body: { title: '' } }, progressRes);
    expect(progressRes.statusCode).toBe(422);

    const reportRes = mockRes();
    await submitRequestReportHandler({ user, params: { id: reqId }, body: { summary: 's' } }, reportRes);
    expect(reportRes.statusCode).toBe(422);
  });

  it('executa com sucesso status/progresso/relatório para operador', async () => {
    const reqId = global.appState.requests[0].id;
    const user = { id: 'operator-santos', role: 'operator' };

    const statusRes = mockRes();
    await updateRequestStatusHandler({ user, params: { id: reqId }, body: { status: 'in-progress', notes: 'ok' } }, statusRes);
    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.body.entry).toBeTruthy();

    const progressRes = mockRes();
    await addRequestProgressHandler(
      { user, params: { id: reqId }, body: { title: 'Checkpoint', details: 'Detalhes', next: 'Próximo' } },
      progressRes
    );
    expect(progressRes.statusCode).toBe(201);
    expect(progressRes.body.entry).toBeTruthy();

    const reportRes = mockRes();
    await submitRequestReportHandler(
      { user, params: { id: reqId }, body: { summary: 'Resumo', findings: 'Achados', recommendations: 'Recomendações' } },
      reportRes
    );
    expect(reportRes.statusCode).toBe(200);
    expect(reportRes.body.request.status).toBe('completed');
    expect(reportRes.body.request.report).toBeTruthy();
  });
});
