-- Migration para aprimorar as políticas de Row Level Security (RLS)
-- Esta migration garante que todas as tabelas tenham RLS ativado e
-- adiciona políticas para compartilhamento familiar

-- Garantir que RLS está habilitado em todas as tabelas
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar com lógica aprimorada
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios perfis" ON profiles;

DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações" ON transactions;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias transações" ON transactions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias transações" ON transactions;
DROP POLICY IF EXISTS "Usuários podem excluir suas próprias transações" ON transactions;

-- Políticas para perfis (profiles)
-- Política para SELECT: usuários podem ver seu próprio perfil
CREATE POLICY "profiles_select_policy" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Política para INSERT: usuários só podem inserir seu próprio perfil
CREATE POLICY "profiles_insert_policy" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Política para UPDATE: usuários só podem atualizar seu próprio perfil
CREATE POLICY "profiles_update_policy" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Política para DELETE: usuários não podem excluir perfis (proteção adicional)
CREATE POLICY "profiles_delete_policy" 
  ON profiles FOR DELETE 
  USING (false);

-- Políticas para transações (transactions)
-- Política para SELECT: usuários podem ver suas próprias transações OU transações de membros da família
CREATE POLICY "transactions_select_policy" 
  ON transactions FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2 
      WHERE p1.id = auth.uid() 
      AND p2.id = transactions.user_id 
      AND p1.family_code = p2.family_code 
      AND p1.family_code IS NOT NULL
    )
  );

-- Política para INSERT: usuários só podem inserir suas próprias transações
CREATE POLICY "transactions_insert_policy" 
  ON transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários só podem atualizar suas próprias transações
CREATE POLICY "transactions_update_policy" 
  ON transactions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para DELETE: usuários só podem excluir suas próprias transações
CREATE POLICY "transactions_delete_policy" 
  ON transactions FOR DELETE 
  USING (auth.uid() = user_id);

-- Função para verificar se um usuário pertence à mesma família
CREATE OR REPLACE FUNCTION is_same_family(user_id_1 UUID, user_id_2 UUID)
RETURNS BOOLEAN AS $$
DECLARE
  family_code_1 TEXT;
  family_code_2 TEXT;
BEGIN
  -- Obter o código de família do primeiro usuário
  SELECT family_code INTO family_code_1 FROM profiles WHERE id = user_id_1;
  
  -- Obter o código de família do segundo usuário
  SELECT family_code INTO family_code_2 FROM profiles WHERE id = user_id_2;
  
  -- Verificar se ambos têm o mesmo código de família e se não é nulo
  RETURN family_code_1 IS NOT NULL AND family_code_1 = family_code_2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar índice para melhorar a performance das consultas de família
CREATE INDEX IF NOT EXISTS idx_profiles_family_code ON profiles(family_code);

-- Adicionar coluna para controlar visibilidade familiar (se ainda não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'transactions' AND column_name = 'shared_with_family') THEN
    ALTER TABLE transactions ADD COLUMN shared_with_family BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Atualizar a política de SELECT para considerar a flag de compartilhamento
DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
CREATE POLICY "transactions_select_policy" 
  ON transactions FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    (
      shared_with_family = TRUE
      AND
      EXISTS (
        SELECT 1 FROM profiles p1, profiles p2 
        WHERE p1.id = auth.uid() 
        AND p2.id = transactions.user_id 
        AND p1.family_code = p2.family_code 
        AND p1.family_code IS NOT NULL
      )
    )
  );

-- Adicionar comentários às tabelas para documentação
COMMENT ON TABLE profiles IS 'Perfis de usuários com configurações pessoais e códigos de família';
COMMENT ON TABLE transactions IS 'Transações financeiras dos usuários com suporte a compartilhamento familiar';

-- Adicionar comentários às colunas para documentação
COMMENT ON COLUMN profiles.family_code IS 'Código único para agrupar membros da família. Usado para compartilhamento de dados.';
COMMENT ON COLUMN profiles.associated_family_code IS 'Código de família associado para convites pendentes.';
COMMENT ON COLUMN transactions.shared_with_family IS 'Controla se a transação é visível para outros membros da família.';
