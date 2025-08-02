-- Location: supabase/migrations/20250802023538_innovate_chat_complete_system.sql
-- Schema Analysis: Fresh project - no existing tables
-- Integration Type: Complete WhatsApp automation system
-- Dependencies: None - creating complete system from scratch

-- 1. Extensions & Custom Types
CREATE TYPE public.user_role AS ENUM ('admin', 'user');
CREATE TYPE public.session_status AS ENUM ('disconnected', 'connecting', 'connected', 'error');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'completed', 'failed', 'paused');
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'audio', 'document');
CREATE TYPE public.message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');
CREATE TYPE public.contact_import_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 2. Core user profiles table (intermediary for auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. WhatsApp Sessions Management
CREATE TABLE public.whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    status public.session_status DEFAULT 'disconnected'::public.session_status,
    qr_code TEXT,
    last_connected_at TIMESTAMPTZ,
    connection_error TEXT,
    auto_reconnect BOOLEAN DEFAULT true,
    message_delay_min INTEGER DEFAULT 5,
    message_delay_max INTEGER DEFAULT 15,
    daily_message_limit INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Contact Lists Management
CREATE TABLE public.contact_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    total_contacts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Contacts Management
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    list_id UUID REFERENCES public.contact_lists(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    name TEXT,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Contact Import Jobs
CREATE TABLE public.contact_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    list_id UUID REFERENCES public.contact_lists(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT,
    status public.contact_import_status DEFAULT 'pending'::public.contact_import_status,
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    successful_imports INTEGER DEFAULT 0,
    failed_imports INTEGER DEFAULT 0,
    column_mapping JSONB DEFAULT '{}',
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Message Templates
CREATE TABLE public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    message_type public.message_type DEFAULT 'text'::public.message_type,
    media_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Campaigns
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.whatsapp_sessions(id) ON DELETE SET NULL,
    list_id UUID REFERENCES public.contact_lists(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    message_content TEXT NOT NULL,
    message_type public.message_type DEFAULT 'text'::public.message_type,
    media_url TEXT,
    status public.campaign_status DEFAULT 'draft'::public.campaign_status,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_recipients INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    delay_between_messages INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Campaign Messages (Individual message tracking)
CREATE TABLE public.campaign_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    message_type public.message_type DEFAULT 'text'::public.message_type,
    media_url TEXT,
    status public.message_status DEFAULT 'pending'::public.message_status,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    whatsapp_message_id TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Chat Conversations
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    contact_name TEXT,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    unread_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Chat Messages
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    whatsapp_message_id TEXT,
    phone_number TEXT NOT NULL,
    content TEXT,
    message_type public.message_type DEFAULT 'text'::public.message_type,
    media_url TEXT,
    media_filename TEXT,
    is_from_contact BOOLEAN DEFAULT true,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. System Configuration
CREATE TABLE public.system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. Essential Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_whatsapp_sessions_user_id ON public.whatsapp_sessions(user_id);
CREATE INDEX idx_whatsapp_sessions_status ON public.whatsapp_sessions(status);
CREATE INDEX idx_contact_lists_user_id ON public.contact_lists(user_id);
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_list_id ON public.contacts(list_id);
CREATE INDEX idx_contacts_phone_number ON public.contacts(phone_number);
CREATE INDEX idx_contact_imports_user_id ON public.contact_imports(user_id);
CREATE INDEX idx_contact_imports_status ON public.contact_imports(status);
CREATE INDEX idx_message_templates_user_id ON public.message_templates(user_id);
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_scheduled_at ON public.campaigns(scheduled_at);
CREATE INDEX idx_campaign_messages_campaign_id ON public.campaign_messages(campaign_id);
CREATE INDEX idx_campaign_messages_status ON public.campaign_messages(status);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX idx_conversations_phone_number ON public.conversations(phone_number);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_timestamp ON public.chat_messages(timestamp);
CREATE INDEX idx_system_config_key ON public.system_config(key);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 15. Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 16. Helper Functions (MUST BE BEFORE RLS POLICIES)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'admin' 
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- 17. RLS Policies

-- Pattern 1: Core user table (user_profiles) - Simple only, no functions
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admin access to all user profiles
CREATE POLICY "admin_full_access_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Pattern 2: Simple user ownership for most tables
CREATE POLICY "users_manage_own_whatsapp_sessions"
ON public.whatsapp_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_whatsapp_sessions"
ON public.whatsapp_sessions
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "users_manage_own_contact_lists"
ON public.contact_lists
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_contact_lists"
ON public.contact_lists
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "users_manage_own_contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "users_manage_own_contact_imports"
ON public.contact_imports
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_contact_imports"
ON public.contact_imports
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "users_manage_own_message_templates"
ON public.message_templates
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_message_templates"
ON public.message_templates
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "users_manage_own_campaigns"
ON public.campaigns
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_campaigns"
ON public.campaigns
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Campaign messages access through campaign ownership
CREATE OR REPLACE FUNCTION public.can_access_campaign_message(message_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.campaign_messages cm
    JOIN public.campaigns c ON cm.campaign_id = c.id
    WHERE cm.id = message_id
    AND c.user_id = auth.uid()
)
$$;

CREATE POLICY "users_manage_own_campaign_messages"
ON public.campaign_messages
FOR ALL
TO authenticated
USING (public.can_access_campaign_message(id))
WITH CHECK (public.can_access_campaign_message(id));

CREATE POLICY "admin_full_access_campaign_messages"
ON public.campaign_messages
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "users_manage_own_conversations"
ON public.conversations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_conversations"
ON public.conversations
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Chat messages access through conversation ownership
CREATE OR REPLACE FUNCTION public.can_access_chat_message(message_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.chat_messages cm
    JOIN public.conversations c ON cm.conversation_id = c.id
    WHERE cm.id = message_id
    AND c.user_id = auth.uid()
)
$$;

CREATE POLICY "users_manage_own_chat_messages"
ON public.chat_messages
FOR ALL
TO authenticated
USING (public.can_access_chat_message(id))
WITH CHECK (public.can_access_chat_message(id));

CREATE POLICY "admin_full_access_chat_messages"
ON public.chat_messages
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- System config - admin only
CREATE POLICY "admin_only_system_config"
ON public.system_config
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Audit logs - admin can view all, users can view their own
CREATE POLICY "users_view_own_audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admin_full_access_audit_logs"
ON public.audit_logs
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 18. Triggers for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'sergioasj93@gmail.com' THEN 'admin'::public.user_role
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'user')::public.user_role
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 19. Utility Functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_sessions_updated_at BEFORE UPDATE ON public.whatsapp_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_lists_updated_at BEFORE UPDATE ON public.contact_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_imports_updated_at BEFORE UPDATE ON public.contact_imports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaign_messages_updated_at BEFORE UPDATE ON public.campaign_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON public.system_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 20. Mock Data
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    user_uuid UUID := gen_random_uuid();
    session_uuid UUID := gen_random_uuid();
    list_uuid UUID := gen_random_uuid();
    template_uuid UUID := gen_random_uuid();
    campaign_uuid UUID := gen_random_uuid();
    conversation_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users with required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'sergioasj93@gmail.com', crypt('Abreu1993@', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Sergio Admin", "role": "admin"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'user@innovatechat.com', crypt('user123456', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Regular User", "role": "user"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Sample WhatsApp Session
    INSERT INTO public.whatsapp_sessions (id, user_id, session_name, session_id, phone_number, status) VALUES
        (session_uuid, user_uuid, 'Main Session', 'session_001', '+5511999999999', 'connected'::public.session_status);

    -- Sample Contact List
    INSERT INTO public.contact_lists (id, user_id, name, description, total_contacts) VALUES
        (list_uuid, user_uuid, 'Leads Principais', 'Lista de leads mais importantes', 3);

    -- Sample Contacts
    INSERT INTO public.contacts (user_id, list_id, phone_number, name, variables) VALUES
        (user_uuid, list_uuid, '+5511888888888', 'João Silva', '{"nome": "João", "empresa": "Tech Corp"}'),
        (user_uuid, list_uuid, '+5511777777777', 'Maria Santos', '{"nome": "Maria", "empresa": "Digital Ltd"}'),
        (user_uuid, list_uuid, '+5511666666666', 'Pedro Costa', '{"nome": "Pedro", "empresa": "StartupXYZ"}');

    -- Sample Message Template
    INSERT INTO public.message_templates (id, user_id, name, content, variables, message_type) VALUES
        (template_uuid, user_uuid, 'Mensagem de Boas-vindas', 
         'Olá {{nome}}! Bem-vindo à {{empresa}}. Como podemos ajudar você hoje?',
         '["nome", "empresa"]'::jsonb, 'text'::public.message_type);

    -- Sample Campaign
    INSERT INTO public.campaigns (id, user_id, session_id, list_id, template_id, name, message_content, status, total_recipients) VALUES
        (campaign_uuid, user_uuid, session_uuid, list_uuid, template_uuid, 
         'Campanha de Boas-vindas', 
         'Olá! Bem-vindo à nossa plataforma. Como podemos ajudar você hoje?',
         'completed'::public.campaign_status, 3);

    -- Sample Conversation
    INSERT INTO public.conversations (id, user_id, session_id, phone_number, contact_name, last_message_preview, unread_count) VALUES
        (conversation_uuid, user_uuid, session_uuid, '+5511888888888', 'João Silva', 'Olá! Tudo bem?', 2);

    -- Sample Chat Messages
    INSERT INTO public.chat_messages (conversation_id, phone_number, content, message_type, is_from_contact) VALUES
        (conversation_uuid, '+5511888888888', 'Olá! Tudo bem?', 'text'::public.message_type, true),
        (conversation_uuid, '+5511888888888', 'Olá João! Tudo ótimo, e você?', 'text'::public.message_type, false),
        (conversation_uuid, '+5511888888888', 'Também! Preciso de informações sobre seus serviços.', 'text'::public.message_type, true);

    -- System Configuration
    INSERT INTO public.system_config (key, value, description, is_public) VALUES
        ('daily_message_limit', '1000', 'Limite diário de mensagens por usuário', false),
        ('auto_reconnect', 'true', 'Reconexão automática de sessões', false),
        ('message_delay_min', '5', 'Delay mínimo entre mensagens (segundos)', false),
        ('message_delay_max', '15', 'Delay máximo entre mensagens (segundos)', false);

END $$;