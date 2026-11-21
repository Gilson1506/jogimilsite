import { createClient } from '@supabase/supabase-js';
import { ENV, isSupabaseConfigured } from '../config/env.config.js';

let cachedClient = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  if (!cachedClient) {
    cachedClient = createClient(ENV.SUPABASE.url, ENV.SUPABASE.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedClient;
}
