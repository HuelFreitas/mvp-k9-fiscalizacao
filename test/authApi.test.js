import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginWithPassword, registerWithPassword } from '../src/services/authApi.js';

describe('authApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('faz login com payload correto', async () => {
    const responseData = { token: 'jwt' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseData),
    });

    const result = await loginWithPassword({ email: 'a@b.com', password: '123456' });

    expect(result).toEqual(responseData);
    expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: '123456' }),
    });
  });

  it('retorna erro amigável quando login falha sem payload de erro', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockRejectedValue(new Error('bad json')),
    });

    await expect(loginWithPassword({ email: 'x@y.com', password: 'x' })).rejects.toThrow('Senha inválida');
  });

  it('faz registro e propaga mensagem de erro da API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: { message: 'E-mail já cadastrado' } }),
    });

    await expect(
      registerWithPassword({
        email: 'novo@corp.com',
        name: 'Novo',
        role: 'client',
        company: 'Corp',
        certification: '',
        password: '123456',
      }),
    ).rejects.toThrow('E-mail já cadastrado');
  });
});
