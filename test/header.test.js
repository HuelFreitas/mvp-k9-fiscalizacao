import { describe, expect, it } from 'vitest';
import { hideUserInfo, updateUserInfo } from '../src/components/header.js';

function els() {
  return {
    userInfo: document.createElement('div'),
    userName: document.createElement('span'),
    userRole: document.createElement('span'),
    userAvatar: document.createElement('span'),
  };
}

describe('header component', () => {
  it('updateUserInfo preenche dados de cliente', () => {
    const refs = els();
    updateUserInfo({ name: 'Ana', role: 'client', company: 'Porto SA' }, refs);
    expect(refs.userInfo.hidden).toBe(false);
    expect(refs.userName.textContent).toBe('Ana');
    expect(refs.userRole.textContent).toBe('Cliente');
    expect(refs.userInfo.className).toContain('client');
  });

  it('updateUserInfo preenche dados de operador', () => {
    const refs = els();
    updateUserInfo({ name: 'Beto', role: 'operator', certification: 'N2' }, refs);
    expect(refs.userRole.textContent).toBe('Operador');
    expect(refs.userInfo.className).toContain('operator');
  });

  it('hideUserInfo limpa campos', () => {
    const refs = els();
    refs.userName.textContent = 'x';
    hideUserInfo(refs);
    expect(refs.userInfo.hidden).toBe(true);
    expect(refs.userName.textContent).toBe('');
    expect(refs.userInfo.title).toBe('');
  });
});
