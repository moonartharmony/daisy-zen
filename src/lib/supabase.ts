/**
 * Supabase client singleton — browser + Cloudflare Workers safe.
 *
 * Auth config:
 *  • autoRefreshToken  — keeps session alive automatically
 *  • persistSession    — stored in localStorage (no cookies needed)
 *  • detectSessionInUrl — auto-exchanges PKCE code on /auth/callback
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl:true,
  },
});

export type { Session, User } from '@supabase/supabase-js';
