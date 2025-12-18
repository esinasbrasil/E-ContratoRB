
import { createClient } from '@supabase/supabase-js';

// Configurações extraídas do seu painel Supabase
const supabaseUrl = 'https://vuhkbbxqzhosmbztjten.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aGtiYnhxemhvc21ienRqdGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTA3NjgsImV4cCI6MjA4MTA2Njc2OH0.YcHc_7iPvai3aAI9VZqVuXIqADoWdqHqrO-OUW-6CBA';

// O sistema agora está configurado e pronto para operar em nuvem
export const isSupabaseConfigured = true;

// Inicialização do cliente Supabase oficial
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
