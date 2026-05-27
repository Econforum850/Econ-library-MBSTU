import { createClient } from '@supabase/supabase-js';

// ==========================================
// CENTRAL SUPABASE CONFIGURATION
// ==========================================
// Replace these values with your own project configuration from the Supabase Dashboard:
// Settings -> API -> Project URL & Project API Keys (anon public)

const SUPABASE_URL = "https://rjaowzndjbkwjehbtcgy.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_IraEirx1MMrg6Wqh3JILpg_FaacTqfm";

// Initialize and export the twin Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
