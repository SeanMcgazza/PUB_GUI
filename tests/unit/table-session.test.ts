import { describe, it, expect, beforeAll } from 'vitest';
import { signTableSession, verifyTableSession } from '@/lib/table-session';

// Guards the presence/anti-prankster check-in token (audit C4). A tampered,
// expired, or wrong-secret token must never verify.

const PUB = 'pub-123';
const TABLE = 'table-456';

beforeAll(() => {
  process.env.TABLE_SESSION_SECRET = 'unit-test-secret-key-1234567890';
});

describe('table-session', () => {
  it('round-trips a valid session', () => {
    const token = signTableSession(PUB, TABLE);
    const s = verifyTableSession(token);
    expect(s).not.toBeNull();
    expect(s!.pubId).toBe(PUB);
    expect(s!.tableId).toBe(TABLE);
    expect(s!.exp * 1000).toBeGreaterThan(Date.now());
  });

  it('rejects a tampered payload (table swapped, original signature kept)', () => {
    const [pub, , exp, sig] = signTableSession(PUB, TABLE).split('.');
    const forged = `${pub}.evil-table.${exp}.${sig}`;
    expect(verifyTableSession(forged)).toBeNull();
  });

  it('rejects a tampered signature', () => {
    const [pub, table, exp] = signTableSession(PUB, TABLE).split('.');
    const forged = `${pub}.${table}.${exp}.AAAAAAAA`;
    expect(verifyTableSession(forged)).toBeNull();
  });

  it('rejects an expired session', () => {
    const token = signTableSession(PUB, TABLE, -10); // already expired
    expect(verifyTableSession(token)).toBeNull();
  });

  it('rejects malformed / empty tokens', () => {
    expect(verifyTableSession(undefined)).toBeNull();
    expect(verifyTableSession(null)).toBeNull();
    expect(verifyTableSession('')).toBeNull();
    expect(verifyTableSession('a.b.c')).toBeNull();
    expect(verifyTableSession('too.many.parts.here.extra')).toBeNull();
  });

  it('does not verify a token signed with a different secret', () => {
    const token = signTableSession(PUB, TABLE);
    process.env.TABLE_SESSION_SECRET = 'a-totally-different-secret-key-xyz';
    expect(verifyTableSession(token)).toBeNull();
    process.env.TABLE_SESSION_SECRET = 'unit-test-secret-key-1234567890';
  });
});
