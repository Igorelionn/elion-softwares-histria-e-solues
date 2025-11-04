-- ============================================
-- SISTEMA DE ADMINISTRAÇÃO - ELION SOFTWARES
-- ============================================
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar campos de administração na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES users(id);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_blocked ON users(is_blocked);

-- 3. Adicionar campos de status nas reuniões
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 4. Criar tabela de logs de atividade admin
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'block_user', 'unblock_user', 'delete_user', 'approve_meeting', 'cancel_meeting', etc
    target_type TEXT NOT NULL, -- 'user', 'meeting'
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_activity_logs(created_at DESC);

-- 5. RLS para admin_activity_logs
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all activity logs"
ON admin_activity_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Admins podem inserir logs
CREATE POLICY "Admins can insert activity logs"
ON admin_activity_logs FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 6. Atualizar políticas de users para admins
-- Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
    auth.uid() = id OR
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Admins podem atualizar qualquer usuário
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Admins podem deletar usuários
CREATE POLICY "Admins can delete users"
ON users FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 7. Atualizar políticas de meetings para admins
-- Admins podem ver todas as reuniões
CREATE POLICY "Admins can view all meetings"
ON meetings FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Admins podem atualizar qualquer reunião
CREATE POLICY "Admins can update any meeting"
ON meetings FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Admins podem deletar reuniões
CREATE POLICY "Admins can delete meetings"
ON meetings FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 8. Função para promover usuário a admin (apenas via SQL por segurança)
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET role = 'admin'
    WHERE email = user_email;
    
    RAISE NOTICE 'User % promoted to admin', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Função para obter estatísticas (para dashboard)
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM users),
        'blocked_users', (SELECT COUNT(*) FROM users WHERE is_blocked = true),
        'total_meetings', (SELECT COUNT(*) FROM meetings),
        'pending_meetings', (SELECT COUNT(*) FROM meetings WHERE status = 'pending'),
        'confirmed_meetings', (SELECT COUNT(*) FROM meetings WHERE status = 'confirmed'),
        'completed_meetings', (SELECT COUNT(*) FROM meetings WHERE status = 'completed'),
        'cancelled_meetings', (SELECT COUNT(*) FROM meetings WHERE status = 'cancelled'),
        'users_last_30_days', (
            SELECT COUNT(*) FROM users 
            WHERE created_at >= now() - interval '30 days'
        ),
        'meetings_last_30_days', (
            SELECT COUNT(*) FROM meetings 
            WHERE created_at >= now() - interval '30 days'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. IMPORTANTE: Promover seu primeiro admin
-- SUBSTITUA 'seu-email@exemplo.com' pelo seu email real!
SELECT promote_to_admin('igorelion8@gmail.com');

-- ============================================
-- INSTALAÇÃO CONCLUÍDA! ✅
-- ============================================
-- Próximos passos:
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Acesse /admin com sua conta promovida
-- 3. Gerencie usuários e reuniões!
-- ============================================

