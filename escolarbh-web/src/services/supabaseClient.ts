import { createClient } from '@supabase/supabase-js';

// No ambiente de dev, fallback para as chaves do projeto do usuário caso as variáveis de ambiente não estejam injetadas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://degypfuqwoifstjxrsti.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xYRLeLCv_UcwZLJf-KcDUQ_Vtxk_2oY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
