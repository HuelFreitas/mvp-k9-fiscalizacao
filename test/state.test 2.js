import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/storage.js', () => ({
  loadState: vi.fn(),
  saveState: vi.fn(),
  loadSession: vi.fn(),
  saveSession: vi.fn(),
}));

import * as storage from '../src/utils/storage.js';
import {
  clearSession,
  getSession,
  getState,
  initializeSession,
  initializeState,
  saveSession,
  saveState,
  setSession,
  setState,
} from '../src/services/state.js';

describe('state service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setState(null);
    setSession(null);
  });

  it('inicializa estado via storage', () => {
    const loaded = { users: [], requests: [] };
    storage.loadState.mockReturnValue(loaded);

    const result = initializeState({ users: [{ id: 1 }], requests: [] });

    expect(result).toBe(loaded);
    expect(getState()).toBe(loaded);
  });

  it('inicializa sessão via storage', () => {
    storage.loadSession.mockReturnValue({ userId: 'u1' });
    expect(initializeSession()).toEqual({ userId: 'u1' });
    expect(getSession()).toEqual({ userId: 'u1' });
  });

  it('saveState não salva quando estado é nulo', () => {
    saveState();
    expect(storage.saveState).not.toHaveBeenCalled();
  });

  it('saveState salva estado atual', () => {
    const s = { users: [{ id: 1 }], requests: [] };
    setState(s);
    saveState();
    expect(storage.saveState).toHaveBeenCalledWith(s);
  });

  it('saveSession salva sessão atual e clearSession limpa sessão', () => {
    setSession({ token: 'abc' });
    saveSession();
    expect(storage.saveSession).toHaveBeenCalledWith({ token: 'abc' });

    clearSession();
    expect(getSession()).toBeNull();
    expect(storage.saveSession).toHaveBeenCalledWith(null);
  });
});
