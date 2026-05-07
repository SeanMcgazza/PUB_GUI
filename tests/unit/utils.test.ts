import { describe, it, expect } from 'vitest';
import {
  cn,
  generateId,
  isValidEmail,
  isValidPhone,
  timeToMinutes,
  minutesToTime,
} from '@/lib/utils';

describe('cn', () => {
  it('joins class strings with a space', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('lets later Tailwind utilities override earlier ones', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', null, undefined, false, '', 'b')).toBe('a b');
  });
});

describe('isValidEmail', () => {
  it.each([
    ['user@example.com', true],
    ['a@b.c', true],
    ['no-at-sign', false],
    ['nodomain@', false],
    ['@nolocal.com', false],
    ['has spaces@x.com', false],
    ['', false],
  ])('isValidEmail(%j) -> %s', (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });
});

describe('isValidPhone', () => {
  it('accepts common Irish/UK phone formats', () => {
    expect(isValidPhone('+353 1 234 5678')).toBe(true);
    expect(isValidPhone('(01) 234-5678')).toBe(true);
    expect(isValidPhone('087 123 4567')).toBe(true);
  });

  it('rejects too-short numbers', () => {
    expect(isValidPhone('123')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(isValidPhone('')).toBe(false);
  });
});

describe('timeToMinutes / minutesToTime', () => {
  it('round-trips simple times', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(minutesToTime(570)).toBe('09:30');
  });

  it('handles midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('handles late-evening boundary', () => {
    expect(timeToMinutes('23:59')).toBe(23 * 60 + 59);
    expect(minutesToTime(23 * 60 + 59)).toBe('23:59');
  });

  it('zero-pads single-digit hours and minutes', () => {
    expect(minutesToTime(65)).toBe('01:05');
  });
});

describe('generateId', () => {
  it('uses the supplied prefix', () => {
    expect(generateId('order')).toMatch(/^order_/);
  });

  it('produces distinct values across calls', () => {
    const a = generateId('x');
    const b = generateId('x');
    expect(a).not.toBe(b);
  });
});
