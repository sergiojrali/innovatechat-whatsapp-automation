-- WhatsApp Web.js Integration Enhancement Migration
-- This migration adds necessary columns and functions for real WhatsApp Web.js integration

-- Add new columns for WhatsApp Web.js integration
ALTER TABLE public.whatsapp_sessions 
ADD COLUMN IF NOT EXISTS client_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS webhook_events JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS message_stats JSONB DEFAULT '{"sent": 0, "received": 0, "failed": 0}',
ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS restart_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS browser_ws_endpoint TEXT,
ADD COLUMN IF NOT EXISTS session_config JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_client_data ON public.whatsapp_sessions USING GIN (client_data);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_last_error_at ON public.whatsapp_sessions (last_error_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_restart_count ON public.whatsapp_sessions (restart_count);

-- Function to update session statistics
CREATE OR REPLACE FUNCTION public.update_session_stats(
  session_id UUID,
  stat_type TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.whatsapp_sessions 
  SET 
    message_stats = CASE 
      WHEN stat_type = 'sent' THEN 
        jsonb_set(
          message_stats, 
          '{sent}', 
          to_jsonb((message_stats->>'sent')::integer + increment_by)
        )
      WHEN stat_type = 'received' THEN 
        jsonb_set(
          message_stats, 
          '{received}', 
          to_jsonb((message_stats->>'received')::integer + increment_by)
        )
      WHEN stat_type = 'failed' THEN 
        jsonb_set(
          message_stats, 
          '{failed}', 
          to_jsonb((message_stats->>'failed')::integer + increment_by)
        )
      ELSE message_stats
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = session_id;
END;
$$;

-- Function to log session errors
CREATE OR REPLACE FUNCTION public.log_session_error(
  session_id UUID,
  error_message TEXT,
  error_data JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.whatsapp_sessions 
  SET 
    connection_error = error_message,
    last_error_at = CURRENT_TIMESTAMP,
    client_data = jsonb_set(
      COALESCE(client_data, '{}'),
      '{last_error}',
      jsonb_build_object(
        'message', error_message,
        'data', error_data,
        'timestamp', CURRENT_TIMESTAMP
      )
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = session_id;
END;
$$;

-- Function to increment restart count
CREATE OR REPLACE FUNCTION public.increment_restart_count(session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.whatsapp_sessions 
  SET 
    restart_count = restart_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = session_id;
END;
$$;

-- Function to reset session data (for new connections)
CREATE OR REPLACE FUNCTION public.reset_session_data(session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.whatsapp_sessions 
  SET 
    qr_code = NULL,
    connection_error = NULL,
    browser_ws_endpoint = NULL,
    client_data = jsonb_set(
      COALESCE(client_data, '{}'),
      '{reset_at}',
      to_jsonb(CURRENT_TIMESTAMP)
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = session_id;
END;
$$;

-- Add some initial mock data for testing (only if no sessions exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.whatsapp_sessions LIMIT 1) THEN
    INSERT INTO public.whatsapp_sessions (
      id,
      session_id,
      session_name,
      phone_number,
      status,
      user_id,
      auto_reconnect,
      daily_message_limit,
      message_delay_min,
      message_delay_max,
      session_config,
      message_stats
    ) VALUES (
      gen_random_uuid(),
      'session_demo_001',
      'Sessão Demo - Principal',
      '+55 11 99999-9999',
      'disconnected'::session_status,
      (SELECT id FROM auth.users LIMIT 1), -- Use first available user
      true,
      1000,
      3,
      10,
      jsonb_build_object(
        'auto_reply', true,
        'business_hours', jsonb_build_object(
          'enabled', true,
          'start', '09:00',
          'end', '18:00',
          'timezone', 'America/Sao_Paulo'
        ),
        'welcome_message', 'Olá! Obrigado por entrar em contato. Como posso ajudá-lo?',
        'away_message', 'No momento estamos fora do horário de atendimento.'
      ),
      jsonb_build_object('sent', 0, 'received', 0, 'failed', 0)
    );
  END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_session_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_session_error TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_restart_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_session_data TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.whatsapp_sessions.client_data IS 'JSON data for storing WhatsApp Web.js client information';
COMMENT ON COLUMN public.whatsapp_sessions.webhook_events IS 'Array of webhook events for external integrations';
COMMENT ON COLUMN public.whatsapp_sessions.message_stats IS 'Statistics for messages sent, received, and failed';
COMMENT ON COLUMN public.whatsapp_sessions.last_error_at IS 'Timestamp of the last error occurrence';
COMMENT ON COLUMN public.whatsapp_sessions.restart_count IS 'Number of times the session has been restarted';
COMMENT ON COLUMN public.whatsapp_sessions.browser_ws_endpoint IS 'WebSocket endpoint for browser connection';
COMMENT ON COLUMN public.whatsapp_sessions.session_config IS 'Configuration settings for the WhatsApp session';