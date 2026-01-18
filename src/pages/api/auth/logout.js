import { supabase } from '../../../lib/supabase';

export const POST = async ({ cookies, redirect }) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });

  return redirect('/login');
};
