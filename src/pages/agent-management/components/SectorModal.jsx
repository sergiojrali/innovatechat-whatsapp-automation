import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const SectorModal = ({ isOpen, onClose, onSave, sector, templates }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true,
    max_agents: 10,
    auto_assignment: true,
    welcome_message: '',
    away_message: '',
    business_hours: {
      enabled: true,
      start: '09:00',
      end: '18:00',
      timezone: 'America/Sao_Paulo'
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const colorOptions = [
    { value: '#3B82F6', label: 'Azul', color: '#3B82F6' },
    { value: '#10B981', label: 'Verde', color: '#10B981' },
    { value: '#F59E0B', label: 'Amarelo', color: '#F59E0B' },
    { value: '#EF4444', label: 'Vermelho', color: '#EF4444' },
    { value: '#8B5CF6', label: 'Roxo', color: '#8B5CF6' },
    { value: '#06B6D4', label: 'Ciano', color: '#06B6D4' },
    { value: '#84CC16', label: 'Lima', color: '#84CC16' },
    { value: '#F97316', label: 'Laranja', color: '#F97316' }
  ];

  const tabs = [
    { id: 'basic', label: 'Básico', icon: 'Settings' },
    { id: 'messages', label: 'Mensagens', icon: 'MessageCircle' },
    { id: 'schedule', label: 'Horários', icon: 'Clock' },
    { id: 'advanced', label: 'Avançado', icon: 'Cog' }
  ];

  useEffect(() => {
    if (sector) {
      setFormData({
        name: sector.name || '',
        description: sector.description || '',
        color: sector.color || '#3B82F6',
        is_active: sector.is_active !== undefined ? sector.is_active : true,
        max_agents: sector.max_agents || 10,
        auto_assignment: sector.auto_assignment !== undefined ? sector.auto_assignment : true,
        welcome_message: sector.welcome_message || '',
        away_message: sector.away_message || '',
        business_hours: sector.business_hours || {
          enabled: true,
          start: '09:00',
          end: '18:00',
          timezone: 'America/Sao_Paulo'
        }
      });
    } else {
      // Reset form for new sector
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        is_active: true,
        max_agents: 10,
        auto_assignment: true,
        welcome_message: '',
        away_message: '',
        business_hours: {
          enabled: true,
          start: '09:00',
          end: '18:00',
          timezone: 'America/Sao_Paulo'
        }
      });
    }
    setErrors({});
    setActiveTab('basic');
  }, [sector, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleBusinessHoursChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.max_agents < 1 || formData.max_agents > 100) {
      newErrors.max_agents = 'Máximo de atendentes deve ser entre 1 e 100';
    }

    if (formData.business_hours.enabled) {
      if (!formData.business_hours.start) {
        newErrors.start_time = 'Horário de início é obrigatório';
      }
      if (!formData.business_hours.end) {
        newErrors.end_time = 'Horário de fim é obrigatório';
      }
      if (formData.business_hours.start >= formData.business_hours.end) {
        newErrors.time_range = 'Horário de início deve ser anterior ao horário de fim';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      welcome_message: template.welcome_message || prev.welcome_message,
      away_message: template.away_message || prev.away_message,
      business_hours: template.business_hours || prev.business_hours
    }));
  };

  if (!isOpen) return null;

  const renderBasicTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Nome do Setor *
        </label>
        <Input
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Ex: Atendimento Comercial"
          error={errors.name}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Descrição do setor e suas responsabilidades"
          rows={3}
          className="w-full p-3 border border-border rounded-md bg-background text-foreground resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Cor do Setor
        </label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange('color', option.value)}
              className={`w-8 h-8 rounded-full border-2 ${
                formData.color === option.value ? 'border-foreground' : 'border-border'
              }`}
              style={{ backgroundColor: option.color }}
              title={option.label}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Máximo de Atendentes *
          </label>
          <Input
            type="number"
            value={formData.max_agents}
            onChange={(e) => handleInputChange('max_agents', parseInt(e.target.value) || 0)}
            min="1"
            max="100"
            error={errors.max_agents}
          />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => handleInputChange('is_active', e.target.checked)}
            className="rounded border-border"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-foreground">
            Setor ativo
          </label>
        </div>
      </div>
    </div>
  );

  const renderMessagesTab = () => (
    <div className="space-y-4">
      {/* Template selector */}
      {templates && templates.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Aplicar Template
          </label>
          <select
            onChange={(e) => {
              const template = templates.find(t => t.id === e.target.value);
              if (template) applyTemplate(template);
            }}
            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="">Selecione um template...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.segment.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Mensagem de Boas-vindas
        </label>
        <textarea
          value={formData.welcome_message}
          onChange={(e) => handleInputChange('welcome_message', e.target.value)}
          placeholder="Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo?"
          rows={3}
          className="w-full p-3 border border-border rounded-md bg-background text-foreground resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Esta mensagem será enviada automaticamente quando um cliente iniciar uma conversa.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Mensagem de Ausência
        </label>
        <textarea
          value={formData.away_message}
          onChange={(e) => handleInputChange('away_message', e.target.value)}
          placeholder="No momento estamos fora do horário de atendimento. Retornaremos em breve!"
          rows={3}
          className="w-full p-3 border border-border rounded-md bg-background text-foreground resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Esta mensagem será enviada quando não houver atendentes disponíveis ou fora do horário comercial.
        </p>
      </div>
    </div>
  );

  const renderScheduleTab = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="business_hours_enabled"
          checked={formData.business_hours.enabled}
          onChange={(e) => handleBusinessHoursChange('enabled', e.target.checked)}
          className="rounded border-border"
        />
        <label htmlFor="business_hours_enabled" className="text-sm font-medium text-foreground">
          Habilitar horário comercial
        </label>
      </div>

      {formData.business_hours.enabled && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Horário de Início *
              </label>
              <Input
                type="time"
                value={formData.business_hours.start}
                onChange={(e) => handleBusinessHoursChange('start', e.target.value)}
                error={errors.start_time}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Horário de Fim *
              </label>
              <Input
                type="time"
                value={formData.business_hours.end}
                onChange={(e) => handleBusinessHoursChange('end', e.target.value)}
                error={errors.end_time}
              />
            </div>
          </div>

          {errors.time_range && (
            <p className="text-sm text-destructive">{errors.time_range}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fuso Horário
            </label>
            <select
              value={formData.business_hours.timezone}
              onChange={(e) => handleBusinessHoursChange('timezone', e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
              <option value="America/Manaus">Manaus (GMT-4)</option>
              <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
            </select>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Info" size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-foreground">Informação</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Durante o horário comercial, as conversas serão atribuídas automaticamente aos atendentes disponíveis. 
              Fora do horário, a mensagem de ausência será enviada automaticamente.
            </p>
          </div>
        </>
      )}
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="auto_assignment"
          checked={formData.auto_assignment}
          onChange={(e) => handleInputChange('auto_assignment', e.target.checked)}
          className="rounded border-border"
        />
        <label htmlFor="auto_assignment" className="text-sm font-medium text-foreground">
          Atribuição automática de conversas
        </label>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="Zap" size={16} className="text-yellow-600" />
          <span className="text-sm font-medium text-foreground">Atribuição Automática</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Quando habilitada, as novas conversas serão automaticamente atribuídas ao atendente disponível 
          com menor número de conversas ativas. Se não houver atendentes disponíveis, a conversa será 
          adicionada à fila de espera.
        </p>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="Lightbulb" size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Dicas de Configuração</span>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Configure mensagens personalizadas para melhor experiência do cliente</li>
          <li>• Defina horários comerciais para otimizar o atendimento</li>
          <li>• Use cores diferentes para identificar facilmente cada setor</li>
          <li>• Ajuste o máximo de atendentes conforme a demanda do setor</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground">
            {sector ? 'Editar Setor' : 'Novo Setor'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            iconName="X"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'basic' && renderBasicTab()}
            {activeTab === 'messages' && renderMessagesTab()}
            {activeTab === 'schedule' && renderScheduleTab()}
            {activeTab === 'advanced' && renderAdvancedTab()}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 p-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              iconName="Save"
              iconPosition="left"
            >
              {sector ? 'Atualizar' : 'Criar'} Setor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SectorModal;
