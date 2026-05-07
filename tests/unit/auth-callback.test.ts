/**
 * Guards commit c596d90: the auth callback was previously querying a
 * non-existent `profiles` table to decide between /onboarding and /app
 * after email confirmation. It now queries `pubs.slug` keyed by owner_id.
 *
 * These tests mock the server Supabase client and assert:
 *   1. The query goes to `pubs` (not `profiles`).
 *   2. A user with no pub → redirect to /onboarding.
 *   3. A user with pub.slug → redirect to ?next or /app.
 *   4. A code-exchange error → redirect to /login?error=auth_callback_error.
 *   5. Missing ?code → redirect to /login?error=auth_callback_error.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExchangeCodeForSession = vi.fn();
const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
        getUser: mockGetUser,
      },
      from: mockFrom,
    }),
}));

// Import after the mock is registered.
import { GET } from '@/app/auth/callback/route';

function makeRequest(url: string): Request {
  return new Request(url);
}

describe('auth/callback route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries pubs.slug (not profiles) when checking onboarding state', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
    mockMaybeSingle.mockResolvedValue({ data: { slug: 'the-local' } });

    await GET(makeRequest('http://localhost:3000/auth/callback?code=abc'));

    expect(mockFrom).toHaveBeenCalledWith('pubs');
    expect(mockSelect).toHaveBeenCalledWith('slug');
    expect(mockEq).toHaveBeenCalledWith('owner_id', 'user-123');
  });

  it('redirects to /onboarding when the user has no pub yet', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-without-pub' } },
    });
    mockMaybeSingle.mockResolvedValue({ data: null });

    const response = await GET(
      makeRequest('http://localhost:3000/auth/callback?code=abc')
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/onboarding'
    );
  });

  it('redirects to ?next when the user has a pub.slug', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-with-pub' } },
    });
    mockMaybeSingle.mockResolvedValue({ data: { slug: 'the-local' } });

    const response = await GET(
      makeRequest(
        'http://localhost:3000/auth/callback?code=abc&next=/app/menu'
      )
    );

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/app/menu'
    );
  });

  it('redirects to /app by default when next is not given', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-with-pub' } },
    });
    mockMaybeSingle.mockResolvedValue({ data: { slug: 'the-local' } });

    const response = await GET(
      makeRequest('http://localhost:3000/auth/callback?code=abc')
    );

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/app'
    );
  });

  it('redirects to /login on code-exchange error', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: 'invalid code' },
    });

    const response = await GET(
      makeRequest('http://localhost:3000/auth/callback?code=bad')
    );

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?error=auth_callback_error'
    );
  });

  it('redirects to /login when no code is present', async () => {
    const response = await GET(
      makeRequest('http://localhost:3000/auth/callback')
    );

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?error=auth_callback_error'
    );
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });
});
