import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pfmiwusneqjplwwwlvyh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbWl3dXNuZXFqcGx3d3dsdnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTI2OTQsImV4cCI6MjA4NTkyODY5NH0.f65WA8Lr3kJmEqfwZuNhoc5d_pFJq0nLfsJGoR0MH0Q';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;
