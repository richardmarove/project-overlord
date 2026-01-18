import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect, locals } = context;
  const url = new URL(request.url);

  // Precise check for admin routes: matches /admin and /admin/*
  const isAdminRoute = url.pathname === '/admin' || url.pathname.startsWith('/admin/');

  if (isAdminRoute) {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
      return redirect('/login');
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      // Access token might be expired, try refreshing with the refresh token
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (refreshError || !refreshData.user || !refreshData.session) {
        // Refresh failed, clear everything and redirect to login
        cookies.delete('sb-access-token', { path: '/' });
        cookies.delete('sb-refresh-token', { path: '/' });
        return redirect('/login');
      }

      // Refresh successful! Set new cookies and attach user
      const { session, user: refreshedUser } = refreshData;
      const maxAge = 60 * 60 * 24 * 7; // 1 week

      // Determine secure flag (production, forwarded proto, or current protocol)
      const isSecure =
        import.meta.env.PROD ||
        request.headers.get('x-forwarded-proto') === 'https' ||
        url.protocol === 'https:';

      // We use context.cookies.set for consistency with Astro middleware
      cookies.set('sb-access-token', session.access_token, {
        path: '/',
        maxAge,
        sameSite: 'lax',
        secure: isSecure,
      });
      cookies.set('sb-refresh-token', session.refresh_token, {
        path: '/',
        maxAge,
        sameSite: 'lax',
        secure: isSecure,
      });

      locals.user = refreshedUser;
    } else {
      // Token is valid
      locals.user = user;
    }
  }

  return next();
});
