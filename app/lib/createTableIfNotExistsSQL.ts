/**
 * Cria a função create_table_if_not_exists no Supabase
 * Isso precisa ser executado no SQL Editor do Supabase antes de usar as funções acima
 */
export const createTableIfNotExistsSQL = `
-- Função para criar tabela se não existir
CREATE OR REPLACE FUNCTION create_table_if_not_exists(
  p_table_name TEXT,
  p_table_definition TEXT
) RETURNS void AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Verificar se a tabela já existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name
  ) INTO table_exists;
  
  -- Se a tabela não existir, criá-la
  IF NOT table_exists THEN
    EXECUTE 'CREATE TABLE public.' || quote_ident(p_table_name) || ' (' || p_table_definition || ')';
    
    -- Adicionar políticas RLS padrão
    EXECUTE 'ALTER TABLE public.' || quote_ident(p_table_name) || ' ENABLE ROW LEVEL SECURITY';
    
    -- Política para permitir que o admin veja todos os registros
    EXECUTE 'CREATE POLICY "Admin can view all rows" ON public.' || 
            quote_ident(p_table_name) || 
            ' FOR SELECT TO authenticated USING (auth.uid() IN (SELECT id FROM auth.users WHERE is_admin = true))';
    
    -- Política para permitir que usuários vejam seus próprios registros
    -- Isso assume que a tabela tem um campo user_id
    IF p_table_definition LIKE '%user_id%' THEN
      EXECUTE 'CREATE POLICY "Users can view own rows" ON public.' || 
              quote_ident(p_table_name) || 
              ' FOR SELECT TO authenticated USING (auth.uid() = user_id)';
              
      EXECUTE 'CREATE POLICY "Users can insert own rows" ON public.' || 
              quote_ident(p_table_name) || 
              ' FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
              
      EXECUTE 'CREATE POLICY "Users can update own rows" ON public.' || 
              quote_ident(p_table_name) || 
              ' FOR UPDATE TO authenticated USING (auth.uid() = user_id)';
              
      EXECUTE 'CREATE POLICY "Users can delete own rows" ON public.' || 
              quote_ident(p_table_name) || 
              ' FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;
    
    -- Para tabelas que têm conteúdo público
    IF p_table_name IN ('advertisements', 'business_profiles') THEN
      EXECUTE 'CREATE POLICY "Public content is viewable by everyone" ON public.' || 
              quote_ident(p_table_name) || 
              ' FOR SELECT USING (true)';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

export default createTableIfNotExistsSQL; 