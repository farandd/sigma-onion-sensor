import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Baris 6 yang menyebabkan error:
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
