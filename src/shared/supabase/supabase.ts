import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || '';

const hasValidUrl = (() => {
  if (!supabaseUrl) return false;
  try {
    const url = new URL(supabaseUrl);
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return false;
  }
})();

export const supabaseConfiguration = {
  configured: hasValidUrl && Boolean(supabasePublishableKey),
  hasUrl: Boolean(supabaseUrl),
  hasPublishableKey: Boolean(supabasePublishableKey),
} as const;

export const supabase: SupabaseClient | null = supabaseConfiguration.configured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase chưa được cấu hình. Hãy thêm VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY vào .env.');
  }
  return supabase;
};
export interface CmsProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  account_type: 'admin' | 'user';
  status: 'pending' | 'active' | 'disabled';
  company?: string | null;
  department?: string | null;
  last_login?: string | null;
}

export const getCurrentCmsProfile = async (): Promise<CmsProfile | null> => {
  if (!supabase) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;
  const { data, error } = await supabase
    .from('users')
    .select('id,name,email,username,account_type,status,company,department,last_login')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (error || data?.status !== 'active') return null;
  return data as CmsProfile;
};
