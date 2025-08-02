-- Migração para Sistema de IA, Atendentes e Setores
-- Data: 02/08/2025
-- Descrição: Adiciona suporte completo para IA, gestão de atendentes, setores e templates de negócios

-- 1. Tipos ENUM adicionais
CREATE TYPE public.agent_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
CREATE TYPE public.ai_provider AS ENUM ('openai', 'openrouter', 'anthropic', 'google');
CREATE TYPE public.business_segment AS ENUM ('solar_energy', 'internet_provider', 'retail', 'healthcare', 'education', 'real_estate', 'automotive', 'finance', 'food_service', 'technology');

-- 2. Tabela de Setores/Departamentos
CREATE TABLE public.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    max_agents INTEGER DEFAULT 10,
    business_hours JSONB DEFAULT '{"enabled": true, "start": "09:00", "end": "18:00", "timezone": "America/Sao_Paulo"}',
    auto_assignment BOOLEAN DEFAULT true,
    welcome_message TEXT,
    away_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Atendentes
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    status public.agent_status DEFAULT 'pending'::public.agent_status,
    is_online BOOLEAN DEFAULT false,
    last_activity_at TIMESTAMPTZ,
    max_concurrent_chats INTEGER DEFAULT 5,
    skills JSONB DEFAULT '[]',
    performance_rating DECIMAL(3,2) DEFAULT 0.00,
    total_chats_handled INTEGER DEFAULT 0,
    average_response_time INTEGER DEFAULT 0, -- em segundos
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Convites para Atendentes
CREATE TABLE public.agent_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    invitation_token TEXT UNIQUE NOT NULL,
    status public.invitation_status DEFAULT 'pending'::public.invitation_status,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de Configurações de IA
CREATE TABLE public.ai_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    provider public.ai_provider NOT NULL,
    api_key TEXT NOT NULL, -- Criptografado
    model_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_tokens INTEGER DEFAULT 1000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    system_prompt TEXT,
    auto_response_enabled BOOLEAN DEFAULT false,
    response_delay_seconds INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de Templates de Negócios
CREATE TABLE public.business_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    segment public.business_segment NOT NULL,
    description TEXT,
    welcome_message TEXT NOT NULL,
    away_message TEXT,
    system_prompt TEXT,
    quick_replies JSONB DEFAULT '[]',
    faq_data JSONB DEFAULT '[]',
    business_hours JSONB DEFAULT '{"enabled": true, "start": "09:00", "end": "18:00"}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de Respostas Automáticas de IA
CREATE TABLE public.ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    provider public.ai_provider NOT NULL,
    model_used TEXT,
    tokens_used INTEGER,
    response_time_ms INTEGER,
    confidence_score DECIMAL(3,2),
    was_helpful BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Modificar tabela de conversas para suporte a setores e atendentes
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'auto', -- 'auto', 'manual'
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1, -- 1=baixa, 2=média, 3=alta, 4=urgente
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS customer_satisfaction INTEGER, -- 1-5 estrelas
ADD COLUMN IF NOT EXISTS resolution_time INTEGER, -- em minutos
ADD COLUMN IF NOT EXISTS first_response_time INTEGER, -- em segundos
ADD COLUMN IF NOT EXISTS last_agent_message_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;

-- 9. Tabela de Filas de Atendimento
CREATE TABLE public.chat_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1,
    estimated_wait_time INTEGER, -- em minutos
    queue_position INTEGER,
    entered_queue_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMPTZ,
    removed_from_queue_at TIMESTAMPTZ
);

-- 10. Índices para performance
CREATE INDEX idx_sectors_user_id ON public.sectors(user_id);
CREATE INDEX idx_sectors_is_active ON public.sectors(is_active);
CREATE INDEX idx_agents_sector_id ON public.agents(sector_id);
CREATE INDEX idx_agents_status ON public.agents(status);
CREATE INDEX idx_agents_is_online ON public.agents(is_online);
CREATE INDEX idx_agent_invitations_email ON public.agent_invitations(email);
CREATE INDEX idx_agent_invitations_token ON public.agent_invitations(invitation_token);
CREATE INDEX idx_agent_invitations_status ON public.agent_invitations(status);
CREATE INDEX idx_ai_configurations_user_id ON public.ai_configurations(user_id);
CREATE INDEX idx_ai_configurations_provider ON public.ai_configurations(provider);
CREATE INDEX idx_business_templates_segment ON public.business_templates(segment);
CREATE INDEX idx_ai_responses_conversation_id ON public.ai_responses(conversation_id);
CREATE INDEX idx_conversations_sector_id ON public.conversations(sector_id);
CREATE INDEX idx_conversations_assigned_agent_id ON public.conversations(assigned_agent_id);
CREATE INDEX idx_conversations_priority ON public.conversations(priority);
CREATE INDEX idx_chat_queues_sector_id ON public.chat_queues(sector_id);
CREATE INDEX idx_chat_queues_priority ON public.chat_queues(priority);

-- 11. Habilitar RLS nas novas tabelas
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_queues ENABLE ROW LEVEL SECURITY;

-- 12. Funções auxiliares para RLS
CREATE OR REPLACE FUNCTION public.is_agent_of_sector(sector_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.agents a
    WHERE a.sector_id = sector_uuid
    AND a.user_id = auth.uid()
    AND a.status = 'active'::public.agent_status
)
$$;

CREATE OR REPLACE FUNCTION public.can_access_conversation_as_agent(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.agents a ON c.assigned_agent_id = a.id
    WHERE c.id = conv_id
    AND a.user_id = auth.uid()
    AND a.status = 'active'::public.agent_status
)
$$;

-- 13. Políticas RLS

-- Setores - usuários podem gerenciar seus próprios setores
CREATE POLICY "users_manage_own_sectors"
ON public.sectors
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_sectors"
ON public.sectors
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Atendentes - usuários podem gerenciar atendentes de seus setores
CREATE POLICY "users_manage_sector_agents"
ON public.agents
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sectors s
        WHERE s.id = agents.sector_id
        AND s.user_id = auth.uid()
    )
    OR user_id = auth.uid() -- Atendentes podem ver seus próprios dados
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sectors s
        WHERE s.id = agents.sector_id
        AND s.user_id = auth.uid()
    )
    OR user_id = auth.uid()
);

CREATE POLICY "admin_full_access_agents"
ON public.agents
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Convites - usuários podem gerenciar convites de seus setores
CREATE POLICY "users_manage_sector_invitations"
ON public.agent_invitations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sectors s
        WHERE s.id = agent_invitations.sector_id
        AND s.user_id = auth.uid()
    )
    OR invited_by = auth.uid()
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sectors s
        WHERE s.id = agent_invitations.sector_id
        AND s.user_id = auth.uid()
    )
);

CREATE POLICY "admin_full_access_invitations"
ON public.agent_invitations
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Configurações de IA - usuários gerenciam suas próprias configurações
CREATE POLICY "users_manage_own_ai_config"
ON public.ai_configurations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_ai_config"
ON public.ai_configurations
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Templates de negócios - todos podem ler, apenas admins podem modificar
CREATE POLICY "everyone_read_business_templates"
ON public.business_templates
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "admin_manage_business_templates"
ON public.business_templates
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Respostas de IA - acesso através de conversas
CREATE POLICY "users_access_ai_responses_via_conversations"
ON public.ai_responses
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = ai_responses.conversation_id
        AND c.user_id = auth.uid()
    )
    OR public.can_access_conversation_as_agent(conversation_id)
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = ai_responses.conversation_id
        AND c.user_id = auth.uid()
    )
    OR public.can_access_conversation_as_agent(conversation_id)
);

CREATE POLICY "admin_full_access_ai_responses"
ON public.ai_responses
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Filas de chat - acesso através de setores
CREATE POLICY "users_access_chat_queues_via_sectors"
ON public.chat_queues
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sectors s
        WHERE s.id = chat_queues.sector_id
        AND s.user_id = auth.uid()
    )
    OR public.is_agent_of_sector(sector_id)
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sectors s
        WHERE s.id = chat_queues.sector_id
        AND s.user_id = auth.uid()
    )
);

CREATE POLICY "admin_full_access_chat_queues"
ON public.chat_queues
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 14. Triggers para updated_at
CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON public.sectors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_configurations_updated_at BEFORE UPDATE ON public.ai_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_business_templates_updated_at BEFORE UPDATE ON public.business_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Funções utilitárias

-- Função para gerar token de convite
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Função para atribuir conversa automaticamente
CREATE OR REPLACE FUNCTION public.auto_assign_conversation(conv_id UUID, sector_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    selected_agent_id UUID;
BEGIN
    -- Seleciona o atendente online com menos conversas ativas
    SELECT a.id INTO selected_agent_id
    FROM public.agents a
    WHERE a.sector_id = sector_uuid
    AND a.status = 'active'::public.agent_status
    AND a.is_online = true
    AND (
        SELECT COUNT(*) FROM public.conversations c
        WHERE c.assigned_agent_id = a.id
        AND c.is_archived = false
    ) < a.max_concurrent_chats
    ORDER BY (
        SELECT COUNT(*) FROM public.conversations c
        WHERE c.assigned_agent_id = a.id
        AND c.is_archived = false
    ) ASC
    LIMIT 1;
    
    -- Atualiza a conversa com o atendente selecionado
    IF selected_agent_id IS NOT NULL THEN
        UPDATE public.conversations
        SET 
            assigned_agent_id = selected_agent_id,
            assignment_type = 'auto',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = conv_id;
        
        -- Remove da fila se estiver lá
        DELETE FROM public.chat_queues WHERE conversation_id = conv_id;
    ELSE
        -- Adiciona à fila se não há atendentes disponíveis
        INSERT INTO public.chat_queues (sector_id, conversation_id, priority, queue_position)
        VALUES (
            sector_uuid, 
            conv_id, 
            1,
            (SELECT COALESCE(MAX(queue_position), 0) + 1 FROM public.chat_queues WHERE sector_id = sector_uuid)
        );
    END IF;
    
    RETURN selected_agent_id;
END;
$$;

-- 16. Inserir templates de negócios pré-configurados
INSERT INTO public.business_templates (name, segment, description, welcome_message, away_message, system_prompt, quick_replies, faq_data) VALUES

-- Energia Solar
('Energia Solar', 'solar_energy', 'Template para empresas de energia solar', 
'Olá! 🌞 Bem-vindo à nossa empresa de energia solar! Como posso ajudá-lo a economizar na sua conta de luz?',
'No momento estamos fora do horário de atendimento. Deixe sua mensagem que retornaremos em breve!',
'Você é um especialista em energia solar. Ajude os clientes com informações sobre painéis solares, economia de energia, financiamento e instalação. Seja técnico mas acessível.',
'["💡 Quero economizar na conta de luz", "📊 Simulação de economia", "💰 Formas de pagamento", "🔧 Como funciona a instalação", "📞 Falar com consultor"]',
'[{"question": "Quanto posso economizar?", "answer": "A economia pode chegar a 95% da sua conta de luz, dependendo do seu consumo e localização."}, {"question": "Qual o prazo de instalação?", "answer": "A instalação completa leva de 1 a 3 dias úteis após aprovação da concessionária."}]'),

-- Provedor de Internet
('Provedor de Internet', 'internet_provider', 'Template para provedores de internet',
'Olá! 🌐 Bem-vindo à nossa central de atendimento! Como posso ajudá-lo com sua internet hoje?',
'Estamos fora do horário de atendimento. Para emergências técnicas, ligue 0800-XXX-XXXX',
'Você é um atendente técnico de provedor de internet. Ajude com problemas de conexão, velocidade, instalação e planos. Seja eficiente e técnico.',
'["🔧 Problema técnico", "📶 Velocidade lenta", "💰 Planos disponíveis", "📅 Agendar instalação", "📞 Suporte técnico"]',
'[{"question": "Internet está lenta", "answer": "Vamos verificar sua conexão. Primeiro, reinicie seu modem por 30 segundos."}, {"question": "Quais planos disponíveis?", "answer": "Temos planos de 100MB, 300MB e 600MB. Qual velocidade você precisa?"}]'),

-- Varejo
('Varejo Geral', 'retail', 'Template para lojas de varejo',
'Olá! 🛍️ Bem-vindo à nossa loja! Como posso ajudá-lo com suas compras hoje?',
'Nossa loja está fechada no momento. Horário de funcionamento: Segunda a Sábado, 9h às 18h.',
'Você é um vendedor experiente. Ajude os clientes com produtos, preços, promoções, estoque e formas de pagamento. Seja prestativo e focado em vendas.',
'["🛒 Ver produtos", "💰 Promoções", "📦 Consultar estoque", "🚚 Entrega", "💳 Formas de pagamento"]',
'[{"question": "Têm entrega?", "answer": "Sim! Entregamos em toda a cidade. Frete grátis acima de R$ 100."}, {"question": "Posso parcelar?", "answer": "Aceitamos cartão em até 12x sem juros e PIX com 5% de desconto."}]'),

-- Saúde
('Clínica de Saúde', 'healthcare', 'Template para clínicas e consultórios',
'Olá! 🏥 Bem-vindo à nossa clínica! Como posso ajudá-lo com seu atendimento médico?',
'Estamos fora do horário de atendimento. Para emergências, procure o hospital mais próximo.',
'Você é um atendente de clínica médica. Ajude com agendamentos, exames, convênios e informações gerais. Seja cuidadoso e empático.',
'["📅 Agendar consulta", "🔬 Marcar exame", "💳 Convênios aceitos", "📋 Resultados", "🚨 Emergência"]',
'[{"question": "Como agendar consulta?", "answer": "Posso agendar para você! Preciso do seu nome, convênio e especialidade desejada."}, {"question": "Quais convênios vocês aceitam?", "answer": "Aceitamos os principais convênios: Unimed, Bradesco Saúde, SulAmérica e outros."}]'),

-- Educação
('Instituição de Ensino', 'education', 'Template para escolas e cursos',
'Olá! 📚 Bem-vindo à nossa instituição de ensino! Como posso ajudá-lo com sua educação?',
'Secretaria fechada. Horário de atendimento: Segunda a Sexta, 8h às 17h.',
'Você é um atendente educacional. Ajude com matrículas, cursos, mensalidades, horários e informações acadêmicas. Seja informativo e acolhedor.',
'["📝 Fazer matrícula", "📖 Cursos disponíveis", "💰 Valores", "📅 Horários", "🎓 Certificados"]',
'[{"question": "Como me matricular?", "answer": "Para matrícula, você precisa de RG, CPF, comprovante de residência e escolaridade anterior."}, {"question": "Têm bolsa de estudos?", "answer": "Sim! Oferecemos bolsas de 20% a 50% baseadas em critérios socioeconômicos."}]'),

-- Imobiliário
('Imobiliária', 'real_estate', 'Template para imobiliárias',
'Olá! 🏠 Bem-vindo à nossa imobiliária! Como posso ajudá-lo a encontrar o imóvel ideal?',
'Estamos fechados. Horário: Segunda a Sexta 8h-18h, Sábado 8h-12h.',
'Você é um corretor de imóveis experiente. Ajude com compra, venda, locação, financiamento e documentação. Seja consultivo e detalhista.',
'["🏠 Comprar imóvel", "🏢 Alugar imóvel", "💰 Vender imóvel", "📋 Documentação", "🏦 Financiamento"]',
'[{"question": "Como financiar um imóvel?", "answer": "Trabalhamos com todos os bancos. Financiamento até 35 anos com entrada a partir de 20%."}, {"question": "Quais documentos preciso?", "answer": "Para locação: RG, CPF, comprovante de renda e residência. Para compra: estes mais certidões negativas."}]');

-- 17. Configurações iniciais do sistema
INSERT INTO public.system_config (key, value, description, is_public) VALUES
('ai_enabled', 'true', 'Habilita funcionalidades de IA no sistema', false),
('max_ai_requests_per_day', '1000', 'Limite de requisições de IA por usuário por dia', false),
('agent_auto_assignment', 'true', 'Habilita atribuição automática de conversas para atendentes', false),
('queue_timeout_minutes', '30', 'Tempo limite em minutos para conversas na fila', false),
('email_invitations_enabled', 'true', 'Habilita envio de convites por email', false),
('max_sectors_per_user', '10', 'Máximo de setores por usuário', false),
('max_agents_per_sector', '50', 'Máximo de atendentes por setor', false);

-- 18. Dados de exemplo (apenas se não existirem setores)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.sectors LIMIT 1) THEN
        -- Inserir setor de exemplo
        INSERT INTO public.sectors (id, user_id, name, description, color, welcome_message, away_message)
        SELECT 
            gen_random_uuid(),
            up.id,
            'Atendimento Comercial',
            'Setor responsável por vendas e atendimento comercial',
            '#10B981',
            'Olá! Bem-vindo ao nosso atendimento comercial. Como posso ajudá-lo?',
            'No momento nosso atendimento comercial está indisponível. Retornaremos em breve!'
        FROM public.user_profiles up
        WHERE up.role = 'admin'::public.user_role
        LIMIT 1;
    END IF;
END $$;

-- 19. Comentários para documentação
COMMENT ON TABLE public.sectors IS 'Setores/departamentos para organização de atendentes';
COMMENT ON TABLE public.agents IS 'Atendentes do sistema com acesso restrito por setor';
COMMENT ON TABLE public.agent_invitations IS 'Convites enviados para novos atendentes';
COMMENT ON TABLE public.ai_configurations IS 'Configurações de IA por usuário';
COMMENT ON TABLE public.business_templates IS 'Templates pré-configurados para diferentes segmentos de negócio';
COMMENT ON TABLE public.ai_responses IS 'Histórico de respostas geradas por IA';
COMMENT ON TABLE public.chat_queues IS 'Fila de conversas aguardando atendimento';

-- 20. Permissões para funções
GRANT EXECUTE ON FUNCTION public.is_agent_of_sector TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_conversation_as_agent TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invitation_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_assign_conversation TO authenticated;
