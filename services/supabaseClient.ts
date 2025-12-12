import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vuhkbbxqzhosmbztjten.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5YvH1dKcxkDgoRRNXBgeVw_6DOJ5vN3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);