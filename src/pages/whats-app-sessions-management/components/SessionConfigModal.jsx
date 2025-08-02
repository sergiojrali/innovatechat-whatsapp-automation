import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const SessionConfigModal = ({ isOpen, onClose, session, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    session_name: '',
    session_id: '',
    auto_reconnect: true,
    daily_message_limit: 1000,
    message_delay_min: 3,
    message_delay_max: 10,
    session_config: {
      auto_reply: false,
      business_hours: {
        enabled: false,
        start: '09:00',
        end: '18:00',
        timezone: 'America/Sao_Paulo'
      },
      welcome_message: 'Olá! Obrigado por entrar em contato. Como posso ajudá-lo?',
      away_message: 'Obrigado pela sua mensagem. No momento estamos fora do horário de atendimento. Retornaremos em breve!',
      trigger_keywords: [],
      max_daily_messages: 100,
      webhook_url: '',
      notifications: {
        new_message: true,
        connection_lost: true,
        daily_report: false
      }
    }
  });

  const [newKeyword, setNewKeyword] = useState('');

  // Initialize config when modal opens or session changes
  useEffect(() => {
    if (isOpen) {
      if (session) {
        // Editing existing session
        setConfig({
          session_name: session?.session_name || '',
          session_id: session?.session_id || '',
          auto_reconnect: session?.auto_reconnect !== false,
          daily_message_limit: session?.daily_message_limit || 1000,
          message_delay_min: session?.message_delay_min || 3,
          message_delay_max: session?.message_delay_max || 10,
          session_config: {
            auto_reply: session?.session_config?.auto_reply || false,
            business_hours: {
              enabled: session?.session_config?.business_hours?.enabled || false,
              start: session?.session_config?.business_hours?.start || '09:00',
              end: session?.session_config?.business_hours?.end || '18:00',
              timezone: session?.session_config?.business_hours?.timezone || 'America/Sao_Paulo'
            },
            welcome_message: session?.session_config?.welcome_message || 'Olá! Obrigado por entrar em contato. Como posso ajudá-lo?',
            away_message: session?.session_config?.away_message || 'Obrigado pela sua mensagem. No momento estamos fora do horário de atendimento.',
            trigger_keywords: session?.session_config?.trigger_keywords || [],
            max_daily_messages: session?.session_config?.max_daily_messages || 100,
            webhook_url: session?.session_config?.webhook_url || '',
            notifications: {
              new_message: session?.session_config?.notifications?.new_message !== false,
              connection_lost: session?.session_config?.notifications?.connection_lost !== false,
              daily_report: session?.session_config?.notifications?.daily_report || false
            }
          }
        });
      } else {
        // Creating new session - generate unique session ID
        const uniqueId = `session_${Date.now()}_${Math.random()?.toString(36)?.substr(2, 9)}`;
        setConfig(prev => ({
          ...prev,
          session_id: uniqueId,
          session_name: `Nova Sessão ${new Date()?.toLocaleDateString('pt-BR')}`
        }));
      }
    }
  }, [isOpen, session]);

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSessionConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      session_config: {
        ...prev?.session_config,
        [field]: value
      }
    }));
  };

  const handleBusinessHoursChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      session_config: {
        ...prev?.session_config,
        business_hours: {
          ...prev?.session_config?.business_hours,
          [field]: value
        }
      }
    }));
  };

  const handleNotificationChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      session_config: {
        ...prev?.session_config,
        notifications: {
          ...prev?.session_config?.notifications,
          [field]: value
        }
      }
    }));
  };

  const addKeyword = () => {
    if (newKeyword?.trim() && !config?.session_config?.trigger_keywords?.includes(newKeyword?.trim())) {
      handleSessionConfigChange('trigger_keywords', [
        ...config?.session_config?.trigger_keywords,
        newKeyword?.trim()
      ]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword) => {
    handleSessionConfigChange('trigger_keywords', 
      config?.session_config?.trigger_keywords?.filter(k => k !== keyword)
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!config?.session_name?.trim()) {
        throw new Error('Nome da sessão é obrigatório');
      }
      
      if (!config?.session_id?.trim()) {
        throw new Error('ID da sessão é obrigatório');
      }

      await onSave(config);
      onClose();
    } catch (error) {
      console.error('Error saving session config:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {session ? `Configurar Sessão - ${session?.session_name}` : 'Nova Sessão WhatsApp'}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleClose} disabled={loading}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Configurações Básicas</h3>
            
            <Input
              label="Nome da Sessão *"
              type="text"
              placeholder="Ex: Atendimento Principal"
              value={config?.session_name}
              onChange={(e) => handleConfigChange('session_name', e?.target?.value)}
              disabled={loading}
              required
            />

            <Input
              label="ID da Sessão *"
              type="text"
              placeholder="Ex: session_principal_01"
              value={config?.session_id}
              onChange={(e) => handleConfigChange('session_id', e?.target?.value)}
              disabled={loading || !!session} // Disable editing for existing sessions
              required
              description={session ? 'ID não pode ser alterado após criação' : 'Identificador único para esta sessão'}
            />

            <Checkbox
              label="Reconexão Automática"
              description="Tenta reconectar automaticamente em caso de desconexão"
              checked={config?.auto_reconnect}
              onChange={(e) => handleConfigChange('auto_reconnect', e?.target?.checked)}
              disabled={loading}
            />
          </div>

          {/* Message Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Limites de Mensagens</h3>
            
            <Input
              label="Limite Diário de Mensagens"
              type="number"
              min="1"
              max="10000"
              value={config?.daily_message_limit}
              onChange={(e) => handleConfigChange('daily_message_limit', parseInt(e?.target?.value) || 1000)}
              disabled={loading}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Delay Mínimo (segundos)"
                type="number"
                min="1"
                max="60"
                value={config?.message_delay_min}
                onChange={(e) => handleConfigChange('message_delay_min', parseInt(e?.target?.value) || 3)}
                disabled={loading}
              />
              <Input
                label="Delay Máximo (segundos)"
                type="number"
                min="1"
                max="60"
                value={config?.message_delay_max}
                onChange={(e) => handleConfigChange('message_delay_max', parseInt(e?.target?.value) || 10)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Auto Reply Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Resposta Automática</h3>
            
            <Checkbox
              label="Ativar Resposta Automática"
              description="Responde automaticamente às mensagens recebidas"
              checked={config?.session_config?.auto_reply}
              onChange={(e) => handleSessionConfigChange('auto_reply', e?.target?.checked)}
              disabled={loading}
            />

            {config?.session_config?.auto_reply && (
              <div className="pl-6 space-y-4">
                {/* Business Hours */}
                <Checkbox
                  label="Ativar Horário Comercial"
                  description="Resposta automática apenas durante horário definido"
                  checked={config?.session_config?.business_hours?.enabled}
                  onChange={(e) => handleBusinessHoursChange('enabled', e?.target?.checked)}
                  disabled={loading}
                />

                {config?.session_config?.business_hours?.enabled && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <Input
                      label="Horário de Início"
                      type="time"
                      value={config?.session_config?.business_hours?.start}
                      onChange={(e) => handleBusinessHoursChange('start', e?.target?.value)}
                      disabled={loading}
                    />
                    <Input
                      label="Horário de Fim"
                      type="time"
                      value={config?.session_config?.business_hours?.end}
                      onChange={(e) => handleBusinessHoursChange('end', e?.target?.value)}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Messages */}
                <Input
                  label="Mensagem de Boas-vindas"
                  type="text"
                  placeholder="Mensagem enviada quando alguém inicia uma conversa"
                  value={config?.session_config?.welcome_message}
                  onChange={(e) => handleSessionConfigChange('welcome_message', e?.target?.value)}
                  disabled={loading}
                />

                <Input
                  label="Mensagem Fora do Horário"
                  type="text"
                  placeholder="Mensagem enviada fora do horário comercial"
                  value={config?.session_config?.away_message}
                  onChange={(e) => handleSessionConfigChange('away_message', e?.target?.value)}
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Trigger Keywords */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Palavras-chave de Ativação</h3>
            <p className="text-sm text-muted-foreground">
              Palavras que ativam respostas automáticas específicas
            </p>
            
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Digite uma palavra-chave"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e?.target?.value)}
                className="flex-1"
                disabled={loading}
                onKeyPress={(e) => e?.key === 'Enter' && addKeyword()}
              />
              <Button 
                onClick={addKeyword} 
                iconName="Plus" 
                iconPosition="left"
                disabled={loading || !newKeyword?.trim()}
              >
                Adicionar
              </Button>
            </div>

            {config?.session_config?.trigger_keywords?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {config?.session_config?.trigger_keywords?.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    <span>{keyword}</span>
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-destructive transition-colors"
                      disabled={loading}
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Webhook */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Integração Externa</h3>
            
            <Input
              label="URL do Webhook (Opcional)"
              type="url"
              placeholder="https://seu-site.com/webhook"
              description="Receba notificações de mensagens em tempo real"
              value={config?.session_config?.webhook_url}
              onChange={(e) => handleSessionConfigChange('webhook_url', e?.target?.value)}
              disabled={loading}
            />
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Notificações</h3>
            
            <div className="space-y-3">
              <Checkbox
                label="Nova Mensagem"
                description="Notificar quando receber novas mensagens"
                checked={config?.session_config?.notifications?.new_message}
                onChange={(e) => handleNotificationChange('new_message', e?.target?.checked)}
                disabled={loading}
              />
              
              <Checkbox
                label="Conexão Perdida"
                description="Notificar quando a sessão for desconectada"
                checked={config?.session_config?.notifications?.connection_lost}
                onChange={(e) => handleNotificationChange('connection_lost', e?.target?.checked)}
                disabled={loading}
              />
              
              <Checkbox
                label="Relatório Diário"
                description="Receber resumo diário de atividades"
                checked={config?.session_config?.notifications?.daily_report}
                onChange={(e) => handleNotificationChange('daily_report', e?.target?.checked)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6">
          <div className="flex space-x-3 justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              iconName="Save" 
              iconPosition="left"
              loading={loading}
              disabled={loading}
            >
              {session ? 'Salvar Alterações' : 'Criar Sessão'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionConfigModal;