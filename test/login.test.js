import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/authService.js', () => ({ findUserByEmail: vi.fn() }));
vi.mock('../src/services/authApi.js', () => ({
  loginWithPassword: vi.fn(),
  registerWithPassword: vi.fn(),
}));

import { renderLogin } from '../src/components/login.js';
import { findUserByEmail } from '../src/services/authService.js';
import { loginWithPassword, registerWithPassword } from '../src/services/authApi.js';

describe('login component', () => {
  let app;
  let ctx;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    app = document.getElementById('app');
    ctx = {
      state: { users: [{ id: 'u1', email: 'ana@corp.com', name: 'Ana', role: 'client' }] },
      saveState: vi.fn(),
      onLogin: vi.fn().mockResolvedValue(undefined),
    };
    vi.clearAllMocks();
  });

  it('renderiza feedback inicial', () => {
    renderLogin(app, { ...ctx, feedback: { message: 'ok', type: 'success' } });
    const feedback = document.querySelector('#loginFeedback');
    expect(feedback.textContent).toBe('ok');
  });

  it('mostra boas-vindas para usuário existente no blur do email', () => {
    renderLogin(app, ctx);
    const email = document.querySelector('#loginEmail');
    email.value = 'ana@corp.com';
    email.dispatchEvent(new Event('blur'));
    expect(document.querySelector('#loginWelcomeBack').hidden).toBe(false);
    expect(document.querySelector('#loginNewUserFields').hidden).toBe(true);
  });

  it('alterna campos por perfil', () => {
    renderLogin(app, ctx);
    const role = document.querySelector('#loginRole');
    role.value = 'operator';
    role.dispatchEvent(new Event('change'));
    expect(document.querySelector('#companyField').hidden).toBe(true);
    expect(document.querySelector('#certificationField').hidden).toBe(false);
  });

  it('valida campos obrigatórios no submit', async () => {
    renderLogin(app, ctx);
    const form = document.querySelector('#loginForm');
    await form.dispatchEvent(new Event('submit'));
    expect(document.querySelector('#loginFeedback').textContent).toContain('Preencha o e-mail');
  });

  it('faz login de usuário existente', async () => {
    findUserByEmail.mockReturnValue({ id: 'u1', role: 'client' });
    loginWithPassword.mockResolvedValue({ user: { id: 'u1', name: 'Ana' }, token: 'jwt' });

    renderLogin(app, ctx);
    document.querySelector('#loginEmail').value = 'ana@corp.com';
    document.querySelector('#loginPassword').value = '123456';

    const form = document.querySelector('#loginForm');
    form.dispatchEvent(new Event('submit'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(loginWithPassword).toHaveBeenCalled();
    expect(ctx.onLogin).toHaveBeenCalledWith('u1', 'jwt');
  });

  it('faz registro de novo usuário', async () => {
    findUserByEmail.mockReturnValue(null);
    registerWithPassword.mockResolvedValue({ user: { id: 'u2', name: 'Novo', role: 'client' }, token: 'jwt2' });

    renderLogin(app, ctx);
    document.querySelector('#loginEmail').value = 'novo@corp.com';
    document.querySelector('#loginPassword').value = '123456';
    document.querySelector('#loginName').value = 'Novo';
    document.querySelector('#loginRole').value = 'client';
    document.querySelector('#loginCompany').value = 'Corp';

    const form = document.querySelector('#loginForm');
    form.dispatchEvent(new Event('submit'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(registerWithPassword).toHaveBeenCalled();
    expect(ctx.saveState).toHaveBeenCalled();
  });
});
