-- Corrigir as políticas RLS para transações familiares

-- Primeiro, vamos remover as políticas existentes para a tabela transactions
DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações" ON transactions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações e transações familiares" ON transactions;

-- Criar uma nova política que permita:
-- 1. Ver suas próprias transações (user_id = auth.uid())
-- 2. Ver transações familiares (family_code = código da família do usuário)
CREATE POLICY "transactions_select_policy" 
ON transactions FOR SELECT 
USING (
  -- Transações do próprio usuário
  auth.uid() = user_id 
  OR 
  -- Transações com código familiar que corresponde ao código do usuário
  (
    family_code IS NOT NULL 
    AND 
    family_code IN (
      -- Código da família do usuário
      SELECT family_code FROM profiles 
      WHERE id = auth.uid() AND family_code IS NOT NULL
      
      UNION
      
      -- Código da família associada do usuário
      SELECT associated_family_code FROM profiles 
      WHERE id = auth.uid() AND associated_family_code IS NOT NULL
    )
  )
);

-- Garantir que as políticas de inserção, atualização e exclusão estejam corretas
DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;
CREATE POLICY "transactions_insert_policy" 
ON transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update_policy" ON transactions;
CREATE POLICY "transactions_update_policy" 
ON transactions FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_delete_policy" ON transactions;
CREATE POLICY "transactions_delete_policy" 
ON transactions FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_family_code ON transactions(user_id, family_code);
