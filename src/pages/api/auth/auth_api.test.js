import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as loginPost } from './login';
import { POST as logoutPost } from './logout';
import { supabase } from '../../../lib/supabase';

vi.mock('../../../lib/supabase');

describe('Auth API Routes', () => {
  let cookies;

  beforeEach(() => {
    vi.clearAllMocks();
    cookies = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
  });

  describe('login.js', () => {
    it('should login successfully and set cookies', async () => {
      const request = {
        json: vi.fn().mockResolvedValue({ email: 'test@example.com', password: 'password123' }),
        url: 'http://localhost:4321/api/auth/login',
        headers: new Map(),
      };

      const mockSession = {
        access_token: 'mock-access',
        refresh_token: 'mock-refresh',
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const response = await loginPost({ request, cookies });
      const data = await response.json();

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(cookies.set).toHaveBeenCalledTimes(2);
      expect(cookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        'mock-access',
        expect.any(Object)
      );
      expect(cookies.set).toHaveBeenCalledWith(
        'sb-refresh-token',
        'mock-refresh',
        expect.any(Object)
      );
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 401 on invalid credentials', async () => {
      const request = {
        json: vi.fn().mockResolvedValue({ email: 'wrong@example.com', password: 'wrong' }),
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      });

      const response = await loginPost({ request, cookies });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid login credentials');
    });

    it('should return 401 if email is not confirmed (no session)', async () => {
      const request = {
        json: vi.fn().mockResolvedValue({ email: 'unconfirmed@example.com', password: 'password' }),
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const response = await loginPost({ request, cookies });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Please check if your email is confirmed');
    });
  });

  describe('logout.js', () => {
    it('should signOut and delete cookies', async () => {
      const redirect = vi.fn().mockReturnValue('redirect-to-login');
      cookies.get.mockImplementation((name) => {
        if (name === 'sb-access-token') return { value: 'token-a' };
        if (name === 'sb-refresh-token') return { value: 'token-b' };
      });

      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const result = await logoutPost({ cookies, redirect });

      expect(supabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'token-a',
        refresh_token: 'token-b',
      });
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(cookies.delete).toHaveBeenCalledWith('sb-access-token', { path: '/' });
      expect(cookies.delete).toHaveBeenCalledWith('sb-refresh-token', { path: '/' });
      expect(redirect).toHaveBeenCalledWith('/login');
      expect(result).toBe('redirect-to-login');
    });

    it('should sign out even if no cookies are present', async () => {
      const redirect = vi.fn().mockReturnValue('redirect-to-login');
      cookies.get.mockReturnValue(undefined);
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      await logoutPost({ cookies, redirect });

      expect(supabase.auth.setSession).not.toHaveBeenCalled();
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(cookies.delete).toHaveBeenCalledTimes(2);
    });

    it('should return 500 if signOut fails', async () => {
      const redirect = vi.fn();
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: { message: 'Signout failed' } });

      const response = await logoutPost({ cookies, redirect });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Signout failed');
    });
  });
});
