import { describe, it, expect, vi } from 'vitest';
import { isDemoMode } from '@/lib/demo-data';

// These tests guard the regression we just fixed: isDemoMode() used to be
// hardcoded to `true` on the client regardless of env vars.

describe('isDemoMode', () => {
  it('returns true when NEXT_PUBLIC_SUPABASE_URL is empty', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(isDemoMode()).toBe(true);
  });

  it('returns true when NEXT_PUBLIC_SUPABASE_URL contains "placeholder"', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co');
    expect(isDemoMode()).toBe(true);
  });

  it('returns false when a real Supabase URL is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abcdefgh.supabase.co');
    expect(isDemoMode()).toBe(false);
  });

  it('returns false for typical https Supabase URLs', () => {
    vi.stubEnv(
      'NEXT_PUBLIC_SUPABASE_URL',
      'https://kxwmxpfvkbwjnxqlytfm.supabase.co'
    );
    expect(isDemoMode()).toBe(false);
  });
});
