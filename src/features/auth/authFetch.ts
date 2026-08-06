import { supabase } from '../../lib/supabase';

export const CMS_AUTH_EXPIRED_EVENT = 'lng79:auth-expired';

export const authFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  if (supabase && !headers.has('Authorization')) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  }
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) window.dispatchEvent(new Event(CMS_AUTH_EXPIRED_EVENT));
  return response;
};
