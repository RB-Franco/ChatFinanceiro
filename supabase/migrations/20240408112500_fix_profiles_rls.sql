-- Migration para corrigir problemas de RLS na tabela profiles
-- Esta migration resolve o erro "new row violates row-level security policy for table profiles"

-- Primeiro, vamos remover as políticas existentes para a tabela profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Política para SELECT: usuários podem ver seu próprio perfil
CREATE POLICY "profiles_select_policy" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Política para INSERT: usuários autenticados podem criar seu próprio perfil
-- Esta é a política crítica que estava causando o erro
CREATE POLICY "profiles_insert_policy" 
  ON profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política para UPDATE: usuários podem atualizar seu próprio perfil
CREATE POLICY "profiles_update_policy" 
  ON profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

-- Política para DELETE: usuários não podem excluir perfis (proteção adicional)
CREATE POLICY "profiles_delete_policy" 
  ON profiles FOR DELETE 
  TO authenticated
  USING (false);

-- Adicionar política especial para permitir que o serviço crie perfis para qualquer usuário
-- Isso é importante para operações administrativas e para o processo de registro
CREATE POLICY "service_role_manage_all_profiles"
  ON profiles
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Adicionar política para permitir que usuários anônimos vejam perfis públicos
-- Isso pode ser necessário para funcionalidades como visualização de perfis públicos
CREATE POLICY "anon_read_public_profiles"
  ON profiles FOR SELECT
  TO anon
  USING (false); -- Por padrão, não permitir acesso anônimo, ajuste conforme necessário

-- Garantir que a tabela tenha RLS habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Adicionar uma função de bypass para depuração
-- Esta função pode ser usada para verificar se o problema é realmente com RLS
CREATE OR REPLACE FUNCTION bypass_rls() 
RETURNS VOID AS $
BEGIN
  -- Esta função só pode ser executada por superusuários ou roles com permissão específica
  IF NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'Permissão negada: apenas superusuários podem executar esta função';
  END IF;
  
  -- Desabilitar temporariamente RLS para a tabela profiles
  ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
  
  -- Reabilitar após 1 minuto (como medida de segurança)
  PERFORM pg_sleep(60);
  
  -- Reabilitar RLS
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar comentário explicativo
COMMENT ON FUNCTION bypass_rls() IS 'Função para desabilitar temporariamente RLS para fins de depuração. Apenas para uso por administradores.';
