/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return url.startsWith('http');
  } catch {
    return false;
  }
};

// Fallback to defaults if the environment variables from Vercel are incorrectly formed
const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : 'https://clbtnolkfkmcgawigbes.supabase.co';
const supabaseAnonKey = rawKey.length > 20 ? rawKey : 'sb_publishable_LyfnVHbh0vX3Ofsh9ZGqGg_ToEbiVqz';

if (!isValidUrl(rawUrl) || rawKey.length <= 20) {
  console.warn('Using fallback Supabase credentials. Missing or invalid VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
