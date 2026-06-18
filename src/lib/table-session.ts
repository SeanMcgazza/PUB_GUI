import crypto from 'crypto';

// Short-lived, signed "I scanned the QR at this table" proof.
//
// Minted by /api/checkin after the qr_token is validated against the pub, then
// required by /api/stripe/payment-intent. Because qr_tokens are no longer
// publicly enumerable (RLS lockdown), holding a valid token means the customer
// actually has the physical QR. This session adds a TIME BOUND on top of that:
// a shared link / screenshot stops working once it expires, forcing a re-scan.
//
// Format (opaque to the client; stored in an httpOnly cookie):
//   "<pubId>.<tableId>.<expEpochSecs>.<base64url HMAC-SHA256>"

export const CHECKIN_COOKIE = 'bartab_checkin';
export const CHECKIN_TTL_SECONDS = 90 * 60; // 90 minutes

function getSecret(): string {
  const s = process.env.TABLE_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'TABLE_SESSION_SECRET is not set (needs >= 16 random chars). Required to ' +
        'mint table check-in sessions.'
    );
  }
  return s;
}

export interface TableSession {
  pubId: string;
  tableId: string;
  exp: number; // epoch seconds
}

function hmac(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function signTableSession(
  pubId: string,
  tableId: string,
  ttlSecs: number = CHECKIN_TTL_SECONDS
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSecs;
  const payload = `${pubId}.${tableId}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifyTableSession(token: string | undefined | null): TableSession | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [pubId, tableId, expStr, sig] = parts;

  const expected = hmac(`${pubId}.${tableId}.${expStr}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;

  return { pubId, tableId, exp };
}
