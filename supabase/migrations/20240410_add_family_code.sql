-- Adicionar coluna family_code à tabela de transações
ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS family_code TEXT;

-- Criar índice para melhorar a performance de consultas por family_code
CREATE INDEX IF NOT EXISTS idx_transactions_family_code ON transactions(family_code);

-- Atualizar política RLS para permitir acesso a transações familiares
CREATE OR REPLACE POLICY "Usuários podem ver suas próprias transações e transações familiares"
  ON transactions FOR SELECT
  USING (
    auth.uid() = user_id OR 
    (family_code IS NOT NULL AND family_code IN (
      SELECT family_code FROM profiles WHERE id = auth.uid()
      UNION
      SELECT associated_family_code FROM profiles WHERE id = auth.uid() AND associated_family_code IS NOT NULL
    ))
  );
