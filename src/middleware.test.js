import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequest } from './middleware';
import { supabase } from './lib/supabase';

vi.mock('./lib/supabase');

describe('Auth Middleware', () => {
    let context;
    let next;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mocking Astro context
        next = vi.fn().mockResolvedValue('next-called');
        context = {
            request: {
                url: 'http://localhost:4321/dashboard',
                headers: new Map(),
            },
            cookies: {
                get: vi.fn(),
                set: vi.fn(),
                delete: vi.fn(),
            },
            redirect: vi.fn().mockReturnValue('redirect-to-login'),
            locals: {},
        };
    });

    it('should pass through non-admin routes without checking auth', async () => {
        context.request.url = 'http://localhost:4321/';

        const result = await onRequest(context, next);

        expect(next).toHaveBeenCalled();
        expect(result).toBe('next-called');
        expect(supabase.auth.getUser).not.toHaveBeenCalled();
    });

    it('should redirect to /login if admin route is accessed without cookies', async () => {
        context.request.url = 'http://localhost:4321/admin/posts';
        context.cookies.get.mockReturnValue(undefined);

        const result = await onRequest(context, next);

        expect(context.redirect).toHaveBeenCalledWith('/login');
        expect(result).toBe('redirect-to-login');
        expect(next).not.toHaveBeenCalled();
    });

    it('should allow access if valid token is provided', async () => {
        context.request.url = 'http://localhost:4321/admin';
        context.cookies.get.mockImplementation((name) => {
            if (name === 'sb-access-token') return { value: 'valid-access' };
            if (name === 'sb-refresh-token') return { value: 'valid-refresh' };
        });

        const mockUser = { id: 'user-123' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null });

        await onRequest(context, next);

        expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-access');
        expect(context.locals.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
    });

    it('should attempt refresh and allow access if access token is expired but refresh succeeds', async () => {
        context.request.url = 'http://localhost:4321/admin/settings';
        context.cookies.get.mockImplementation((name) => {
            if (name === 'sb-access-token') return { value: 'expired-access' };
            if (name === 'sb-refresh-token') return { value: 'valid-refresh' };
        });

        // First call fails
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: { message: 'Expired' } });

        // Refresh succeeds
        const newSession = { access_token: 'new-access', refresh_token: 'new-refresh' };
        const newUser = { id: 'user-123' };
        vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
            data: { user: newUser, session: newSession },
            error: null
        });

        await onRequest(context, next);

        expect(supabase.auth.refreshSession).toHaveBeenCalledWith({ refresh_token: 'valid-refresh' });
        expect(context.cookies.set).toHaveBeenCalledWith('sb-access-token', 'new-access', expect.any(Object));
        expect(context.cookies.set).toHaveBeenCalledWith('sb-refresh-token', 'new-refresh', expect.any(Object));
        expect(context.locals.user).toEqual(newUser);
        expect(next).toHaveBeenCalled();
    });

    it('should delete cookies and redirect to /login if refresh fails', async () => {
        context.request.url = 'http://localhost:4321/admin';
        context.cookies.get.mockImplementation((name) => {
            if (name === 'sb-access-token') return { value: 'expired-access' };
            if (name === 'sb-refresh-token') return { value: 'failed-refresh' };
        });

        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: { message: 'Expired' } });
        vi.mocked(supabase.auth.refreshSession).mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid' } });

        const result = await onRequest(context, next);

        expect(context.cookies.delete).toHaveBeenCalledWith('sb-access-token', { path: '/' });
        expect(context.cookies.delete).toHaveBeenCalledWith('sb-refresh-token', { path: '/' });
        expect(context.redirect).toHaveBeenCalledWith('/login');
        expect(result).toBe('redirect-to-login');
    });
});
