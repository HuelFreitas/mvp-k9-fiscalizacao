import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/misc.js', () => ({
  uid: vi.fn((prefix) => `${prefix}-mocked`),
}));

import { createUser, findUserByEmail, resolveOrCreateUser } from '../src/services/authService.js';

describe('authService', () => {
  it('findUserByEmail retorna null para entradas inválidas', () => {
    expect(findUserByEmail('', { users: [] })).toBeNull();
    expect(findUserByEmail('a@b.com', null)).toBeNull();
  });

  it('findUserByEmail encontra usuário ignorando case no e-mail recebido', () => {
    const state = { users: [{ email: 'user@corp.com', id: '1' }] };
    expect(findUserByEmail('USER@CORP.COM', state)).toEqual(state.users[0]);
  });

  it('createUser cria cliente com defaults', () => {
    const state = { users: [] };
    const user = createUser({ email: ' cli@corp.com ', name: ' Cliente ', role: 'client', company: '' }, state);

    expect(user).toMatchObject({
      id: 'client-mocked',
      role: 'client',
      name: 'Cliente',
      email: 'cli@corp.com',
      company: 'Organização não informada',
    });
    expect(state.users).toHaveLength(1);
  });

  it('createUser cria operador com certificação padrão', () => {
    const state = { users: [] };
    const user = createUser({ email: 'op@corp.com', name: 'Op', role: 'operator', certification: '' }, state);

    expect(user).toMatchObject({
      id: 'operator-mocked',
      role: 'operator',
      certification: 'Certificação pendente',
    });
  });

  it('resolveOrCreateUser retorna usuário existente antes de criar', () => {
    const existing = { id: 'x1', email: 'exists@corp.com', role: 'client' };
    const state = { users: [existing] };

    const result = resolveOrCreateUser({ email: 'EXISTS@corp.com', name: 'Novo', role: 'client' }, state);

    expect(result).toBe(existing);
    expect(state.users).toHaveLength(1);
  });
});
