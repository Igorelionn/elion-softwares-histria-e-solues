-- Adicionar campos para rastreamento de reagendamentos e cancelamentos
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar campo para contar reagendamentos (máximo 2)
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0;

-- 2. Adicionar campo para histórico de cancelamentos
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 3. Criar tabela para rastrear cancelamentos por usuário/mês
CREATE TABLE IF NOT EXISTS user_monthly_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    cancellation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

-- 4. Habilitar RLS na tabela de cancelamentos mensais
ALTER TABLE user_monthly_cancellations ENABLE ROW LEVEL SECURITY;

-- 5. Política para usuários lerem seus próprios dados
CREATE POLICY "Users can view their own cancellation stats"
ON user_monthly_cancellations FOR SELECT
USING (auth.uid() = user_id);

-- 6. Política para usuários atualizarem seus próprios dados
CREATE POLICY "Users can update their own cancellation stats"
ON user_monthly_cancellations FOR UPDATE
USING (auth.uid() = user_id);

-- 7. Política para inserir dados
CREATE POLICY "Users can insert their own cancellation stats"
ON user_monthly_cancellations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 8. Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_monthly_cancellations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_monthly_cancellations_updated_at_trigger
    BEFORE UPDATE ON user_monthly_cancellations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_monthly_cancellations_updated_at();

-- Pronto! Agora execute este script no Supabase SQL Editor

