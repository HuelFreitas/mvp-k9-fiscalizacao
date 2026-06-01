import { describe, expect, it, vi } from 'vitest';
import { isPastDate, isToday } from '../src/utils/validators.js';

describe('validators', () => {
  it('isPastDate identifica data passada', () => {
    expect(isPastDate('2000-01-01T00:00:00.000Z')).toBe(true);
  });

  it('isPastDate identifica data futura', () => {
    expect(isPastDate('2999-01-01T00:00:00.000Z')).toBe(false);
  });

  it('isToday retorna true para qualquer hora do dia atual', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-28T10:00:00.000Z'));

    expect(isToday('2026-05-28T23:59:59.000Z')).toBe(true);
    expect(isToday('2026-05-27T23:59:59.000Z')).toBe(true);
    expect(isToday('2026-06-01T12:00:00.000Z')).toBe(false);

    vi.useRealTimers();
  });
});
