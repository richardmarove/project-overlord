import { supabase } from '../../../lib/supabase';

export const POST = async ({ cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // Get user before signing out to log activity
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'user_logout',
      resource_type: 'auth',
      metadata: {
        email: user.email,
      },
    });
  }

  const { error } = await supabase.auth.signOut();

  // Always delete cookies
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return redirect('/login');
};
