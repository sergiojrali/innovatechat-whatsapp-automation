-- Migração para Sistema de Monitoramento e Auditoria em Produção
-- Data: 03/01/2025
-- Descrição: Adiciona tabelas para monitoramento, métricas, logs de auditoria e alertas

-- 1. Tabela de métricas do sistema
CREATE TABLE public.system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metrics_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de relatórios de saúde
CREATE TABLE public.health_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    report_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de alertas do sistema
CREATE TABLE public.system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    alert_data JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de logs de auditoria
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_status INTEGER,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de sessões de usuário (para controle de acesso)
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de tentativas de login
CREATE TABLE public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de configurações de backup
CREATE TABLE public.backup_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    schedule TEXT NOT NULL, -- cron expression
    tables_to_backup TEXT[] NOT NULL,
    retention_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    last_backup_at TIMESTAMPTZ,
    next_backup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabela de histórico de backups
CREATE TABLE public.backup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.backup_configs(id) ON DELETE CASCADE,
    backup_file TEXT NOT NULL,
    file_size BIGINT,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 9. Tabela de rate limiting
CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP ou user_id
    endpoint TEXT NOT NULL,
    requests_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabela de notificações do sistema
CREATE TABLE public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
    target_users UUID[], -- Array de user_ids ou null para todos
    is_read BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Índices para performance
CREATE INDEX idx_system_metrics_timestamp ON public.system_metrics(timestamp DESC);
CREATE INDEX idx_health_reports_timestamp ON public.health_reports(timestamp DESC);
CREATE INDEX idx_health_reports_status ON public.health_reports(status);
CREATE INDEX idx_system_alerts_type ON public.system_alerts(type);
CREATE INDEX idx_system_alerts_severity ON public.system_alerts(severity);
CREATE INDEX idx_system_alerts_resolved ON public.system_alerts(resolved);
CREATE INDEX idx_system_alerts_created_at ON public.system_alerts(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_timestamp ON public.login_attempts(timestamp DESC);
CREATE INDEX idx_backup_history_config_id ON public.backup_history(config_id);
CREATE INDEX idx_backup_history_status ON public.backup_history(status);
CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX idx_rate_limits_endpoint ON public.rate_limits(endpoint);
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits(window_start);
CREATE INDEX idx_system_notifications_target_users ON public.system_notifications USING GIN(target_users);
CREATE INDEX idx_system_notifications_created_at ON public.system_notifications(created_at DESC);

-- 12. Habilitar RLS nas novas tabelas
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- 13. Políticas RLS

-- Métricas do sistema - apenas admins
CREATE POLICY "admin_full_access_system_metrics"
ON public.system_metrics
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Relatórios de saúde - apenas admins
CREATE POLICY "admin_full_access_health_reports"
ON public.health_reports
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Alertas do sistema - apenas admins
CREATE POLICY "admin_full_access_system_alerts"
ON public.system_alerts
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Logs de auditoria - usuários podem ver seus próprios logs, admins veem tudo
CREATE POLICY "users_view_own_audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_user());

CREATE POLICY "admin_full_access_audit_logs"
ON public.audit_logs
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Sessões de usuário - usuários gerenciam suas próprias sessões
CREATE POLICY "users_manage_own_sessions"
ON public.user_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_user_sessions"
ON public.user_sessions
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Tentativas de login - apenas admins
CREATE POLICY "admin_view_login_attempts"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- Configurações de backup - apenas admins
CREATE POLICY "admin_full_access_backup_configs"
ON public.backup_configs
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Histórico de backups - apenas admins
CREATE POLICY "admin_full_access_backup_history"
ON public.backup_history
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Rate limits - apenas sistema (sem acesso direto)
CREATE POLICY "system_only_rate_limits"
ON public.rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Notificações do sistema - usuários veem suas notificações
CREATE POLICY "users_view_own_notifications"
ON public.system_notifications
FOR SELECT
TO authenticated
USING (
  target_users IS NULL OR 
  auth.uid() = ANY(target_users) OR 
  public.is_admin_user()
);

CREATE POLICY "admin_manage_notifications"
ON public.system_notifications
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 14. Triggers para updated_at
CREATE TRIGGER update_backup_configs_updated_at 
BEFORE UPDATE ON public.backup_configs 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at 
BEFORE UPDATE ON public.rate_limits 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Funções utilitárias

-- Função para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Limpar métricas antigas (30 dias)
  DELETE FROM public.system_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Limpar relatórios de saúde antigos (30 dias)
  DELETE FROM public.health_reports 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Limpar logs de auditoria antigos (90 dias)
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Limpar tentativas de login antigas (30 dias)
  DELETE FROM public.login_attempts 
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  -- Limpar sessões expiradas
  DELETE FROM public.user_sessions 
  WHERE expires_at < NOW() OR (is_active = false AND created_at < NOW() - INTERVAL '7 days');
  
  -- Limpar rate limits antigos (1 dia)
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 day';
  
  -- Limpar notificações expiradas
  DELETE FROM public.system_notifications 
  WHERE expires_at < NOW();
  
  RAISE NOTICE 'Limpeza de logs antigos concluída';
END;
$$;

-- Função para registrar tentativa de login
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.login_attempts (
    email,
    ip_address,
    user_agent,
    success,
    failure_reason
  ) VALUES (
    p_email,
    p_ip_address,
    p_user_agent,
    p_success,
    p_failure_reason
  );
END;
$$;

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_limit INTEGER,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Contar requests no período
  SELECT COALESCE(SUM(requests_count), 0) INTO current_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start > window_start;
  
  -- Se excedeu o limite, bloquear
  IF current_count >= p_limit THEN
    -- Atualizar ou inserir bloqueio
    INSERT INTO public.rate_limits (identifier, endpoint, requests_count, blocked_until)
    VALUES (p_identifier, p_endpoint, current_count + 1, NOW() + (p_window_minutes || ' minutes')::INTERVAL)
    ON CONFLICT (identifier, endpoint) 
    DO UPDATE SET 
      requests_count = rate_limits.requests_count + 1,
      blocked_until = NOW() + (p_window_minutes || ' minutes')::INTERVAL,
      updated_at = NOW();
    
    RETURN FALSE;
  END IF;
  
  -- Incrementar contador
  INSERT INTO public.rate_limits (identifier, endpoint, requests_count)
  VALUES (p_identifier, p_endpoint, 1)
  ON CONFLICT (identifier, endpoint)
  DO UPDATE SET 
    requests_count = rate_limits.requests_count + 1,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$;

-- Função para criar notificação do sistema
CREATE OR REPLACE FUNCTION public.create_system_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT,
  p_target_users UUID[] DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.system_notifications (
    type,
    title,
    message,
    severity,
    target_users,
    expires_at
  ) VALUES (
    p_type,
    p_title,
    p_message,
    p_severity,
    p_target_users,
    p_expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- 16. Configurações iniciais

-- Inserir configuração de backup padrão
INSERT INTO public.backup_configs (name, schedule, tables_to_backup, retention_days, is_active) VALUES
('Backup Diário Completo', '0 2 * * *', ARRAY[
  'user_profiles', 'whatsapp_sessions', 'campaigns', 'campaign_messages', 
  'contacts', 'contact_lists', 'conversations', 'chat_messages',
  'sectors', 'agents', 'ai_configurations', 'business_templates'
], 30, true),
('Backup Semanal Auditoria', '0 3 * * 0', ARRAY[
  'audit_logs', 'system_metrics', 'health_reports', 'system_alerts'
], 90, true);

-- Inserir configurações do sistema para monitoramento
INSERT INTO public.system_config (key, value, description, is_public) VALUES
('monitoring_enabled', 'true', 'Habilita sistema de monitoramento', false),
('metrics_retention_days', '30', 'Dias para manter métricas do sistema', false),
('health_check_interval', '60', 'Intervalo de health check em segundos', false),
('alert_email_enabled', 'false', 'Habilita alertas por email', false),
('alert_email_recipients', '[]', 'Lista de emails para receber alertas', false),
('backup_enabled', 'true', 'Habilita sistema de backup automático', false),
('rate_limit_enabled', 'true', 'Habilita rate limiting', false),
('audit_log_enabled', 'true', 'Habilita logs de auditoria', false),
('session_timeout_hours', '24', 'Timeout de sessão em horas', false),
('max_login_attempts', '5', 'Máximo de tentativas de login por IP', false);

-- 17. Comentários para documentação
COMMENT ON TABLE public.system_metrics IS 'Métricas de performance e uso do sistema';
COMMENT ON TABLE public.health_reports IS 'Relatórios de saúde do sistema';
COMMENT ON TABLE public.system_alerts IS 'Alertas e notificações do sistema';
COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria de ações dos usuários';
COMMENT ON TABLE public.user_sessions IS 'Sessões ativas de usuários';
COMMENT ON TABLE public.login_attempts IS 'Histórico de tentativas de login';
COMMENT ON TABLE public.backup_configs IS 'Configurações de backup automático';
COMMENT ON TABLE public.backup_history IS 'Histórico de execução de backups';
COMMENT ON TABLE public.rate_limits IS 'Controle de rate limiting por IP/usuário';
COMMENT ON TABLE public.system_notifications IS 'Notificações do sistema para usuários';

-- 18. Permissões para funções
GRANT EXECUTE ON FUNCTION public.cleanup_old_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_login_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_system_notification TO authenticated;
