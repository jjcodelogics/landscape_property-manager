import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: false, // Disable session persistence for server-side
  },
});
