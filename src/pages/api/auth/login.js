import { supabase } from '../../../lib/supabase';

export const POST = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 401 });
  }

  const { session } = data;

  if (!session) {
    return new Response(
      JSON.stringify({ error: 'No session provided. Please check if your email is confirmed.' }),
      { status: 401 }
    );
  }

  const maxAge = 60 * 60 * 24 * 7; // 1 week
  const isSecure =
    import.meta.env.PROD ||
    request.headers.get('x-forwarded-proto') === 'https' ||
    new URL(request.url).protocol === 'https:';

  cookies.set('sb-access-token', session.access_token, {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: maxAge,
  });

  cookies.set('sb-refresh-token', session.refresh_token, {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: maxAge,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
