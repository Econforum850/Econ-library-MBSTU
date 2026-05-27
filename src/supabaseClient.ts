import { createClient } from '@supabase/supabase-js';

// ==========================================
// CENTRAL SUPABASE CONFIGURATION
// ==========================================
// Checks localStorage overrides first, then env variables, then default fallback.

const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null;
const savedKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null;

export const SUPABASE_URL = savedUrl || import.meta.env.VITE_SUPABASE_URL || "https://rjaowzndjbkwjehbtcgy.supabase.co";
export const SUPABASE_PUBLIC_KEY = savedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_IraEirx1MMrg6Wqh3JILpg_FaacTqfm";

// Initialize and export the twin Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

