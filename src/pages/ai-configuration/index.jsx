import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';

const AIConfiguration = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados dos dados
  const [configurations, setConfigurations] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);
  const [usageStats, setUsageStats] = useState(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    provider: 'openai',
    api_key: '',
    model_name: '',
    max_tokens: 1000,
    temperature: 0.7,
    system_prompt: '',
    auto_response_enabled: false,
    response_delay_seconds: 2
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [testingConfig, setTestingConfig] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    if (!user || authLoading) return;
    loadConfigurations();
    loadUsageStats();
  }, [user, authLoading]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const configs = await aiService.getAIConfigurations(user.id);
      setConfigurations(configs);
      
      const active = configs.find(c => c.is_active);
      setActiveConfig(active);
      
    } catch (err) {
      setError('Erro ao carregar configurações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const stats = await aiService.getUsageStats(user.id);
      setUsageStats(stats);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProviderChange = (provider) => {
    const models = aiService.getAvailableModels(provider);
    setFormData(prev => ({
      ...prev,
      provider,
      model_name: models.length > 0 ? models[0] : '',
      api_key: '',
      system_prompt: getDefaultSystemPrompt(provider)
    }));
  };

  const getDefaultSystemPrompt = (provider) => {
    const prompts = {
      openai: 'Você é um assistente de atendimento ao cliente profissional e prestativo. Responda de forma clara, objetiva e sempre mantenha um tom cordial.',
      openrouter: 'Você é um assistente inteligente especializado em atendimento ao cliente. Seja útil, preciso e sempre educado em suas respostas.',
      anthropic: 'Você é Claude, um assistente de IA criado pela Anthropic para ajudar com atendimento ao cliente. Seja útil, inofensivo e honesto.',
      google: 'Você é um assistente de IA do Google especializado em atendimento ao cliente. Forneça respostas úteis e precisas.'
    };
    return prompts[provider] || prompts.openai;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      
      const configData = {
        ...formData,
        user_id: user.id
      };

      if (isEditing) {
        await aiService.updateAIConfiguration(editingId, configData);
        setSuccess('Configuração atualizada com sucesso!');
      } else {
        await aiService.createAIConfiguration(configData);
        setSuccess('Configuração criada com sucesso!');
      }

      await loadConfigurations();
      resetForm();
      
    } catch (err) {
      setError('Erro ao salvar configuração: ' + err.message);
    }
  };

  const handleEdit = (config) => {
    setFormData({
      provider: config.provider,
      api_key: '', // Não mostrar a chave por segurança
      model_name: config.model_name,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      system_prompt: config.system_prompt || '',
      auto_response_enabled: config.auto_response_enabled,
      response_delay_seconds: config.response_delay_seconds
    });
    setIsEditing(true);
    setEditingId(config.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta configuração?')) return;
    
    try {
      await aiService.deleteAIConfiguration(id);
      await loadConfigurations();
      setSuccess('Configuração excluída com sucesso!');
    } catch (err) {
      setError('Erro ao excluir configuração: ' + err.message);
    }
  };

  const handleActivate = async (id) => {
    try {
      // Desativar todas as outras configurações
      const updatePromises = configurations.map(config => 
        aiService.updateAIConfiguration(config.id, { is_active: config.id === id })
      );
      
      await Promise.all(updatePromises);
      await loadConfigurations();
      setSuccess('Configuração ativada com sucesso!');
      
    } catch (err) {
      setError('Erro ao ativar configuração: ' + err.message);
    }
  };

  const handleTestConfiguration = async () => {
    try {
      setTestingConfig(true);
      setError('');
      
      const result = await aiService.testAIConfiguration(
        formData.provider,
        formData.api_key,
        formData.model_name
      );
      
      if (result.success) {
        setSuccess('Configuração testada com sucesso! ✅');
      } else {
        setError('Erro no teste: ' + result.message);
      }
      
    } catch (err) {
      setError('Erro ao testar configuração: ' + err.message);
    } finally {
      setTestingConfig(false);
    }
  };

  const resetForm = () => {
    setFormData({
      provider: 'openai',
      api_key: '',
      model_name: '',
      max_tokens: 1000,
      temperature: 0.7,
      system_prompt: '',
      auto_response_enabled: false,
      response_delay_seconds: 2
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const getProviderIcon = (provider) => {
    const icons = {
      openai: '🤖',
      openrouter: '🔀',
      anthropic: '🧠',
      google: '🔍'
    };
    return icons[provider] || '🤖';
  };

  const getProviderName = (provider) => {
    const names = {
      openai: 'OpenAI',
      openrouter: 'OpenRouter',
      anthropic: 'Anthropic',
      google: 'Google'
    };
    return names[provider] || provider;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando configurações de IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={userProfile?.role}
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-112'}`}>
        <Header 
          user={{
            name: userProfile?.full_name || user?.email,
            email: user?.email,
            role: userProfile?.role
          }}
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          notifications={[]}
        />
        
        <main className="pt-16">
          <div className="p-6">
            <Breadcrumbs />

            {/* Cabeçalho da página */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Configuração de IA</h1>
                <p className="text-muted-foreground mt-1">
                  Configure integrações com provedores de IA para respostas automáticas
                </p>
              </div>
            </div>

            {/* Estatísticas de uso */}
            {usageStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Requisições</p>
                      <p className="text-2xl font-bold text-foreground">{usageStats.totalRequests}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon name="MessageSquare" size={24} className="text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tokens Utilizados</p>
                      <p className="text-2xl font-bold text-foreground">{usageStats.totalTokens.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon name="Zap" size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                      <p className="text-2xl font-bold text-foreground">{Math.round(usageStats.averageResponseTime)}ms</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon name="Clock" size={24} className="text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Respostas Úteis</p>
                      <p className="text-2xl font-bold text-foreground">{usageStats.helpfulResponses}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Icon name="ThumbsUp" size={24} className="text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Formulário de configuração */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                  {isEditing ? 'Editar Configuração' : 'Nova Configuração'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Provedor */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Provedor de IA *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {aiService.getAllProviders().map((provider) => (
                        <button
                          key={provider}
                          type="button"
                          onClick={() => handleProviderChange(provider)}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            formData.provider === provider
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getProviderIcon(provider)}</span>
                            <span className="font-medium">{getProviderName(provider)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      API Key *
                    </label>
                    <Input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => handleInputChange('api_key', e.target.value)}
                      placeholder="Insira sua API key"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Sua API key será criptografada e armazenada com segurança.
                    </p>
                  </div>

                  {/* Modelo */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Modelo *
                    </label>
                    <select
                      value={formData.model_name}
                      onChange={(e) => handleInputChange('model_name', e.target.value)}
                      className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                      required
                    >
                      <option value="">Selecione um modelo</option>
                      {aiService.getAvailableModels(formData.provider).map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Configurações avançadas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Máximo de Tokens
                      </label>
                      <Input
                        type="number"
                        value={formData.max_tokens}
                        onChange={(e) => handleInputChange('max_tokens', parseInt(e.target.value))}
                        min="100"
                        max="4000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Temperatura
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                        min="0"
                        max="2"
                      />
                    </div>
                  </div>

                  {/* Prompt do sistema */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Prompt do Sistema
                    </label>
                    <textarea
                      value={formData.system_prompt}
                      onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                      placeholder="Defina como a IA deve se comportar..."
                      rows={4}
                      className="w-full p-3 border border-border rounded-md bg-background text-foreground resize-none"
                    />
                  </div>

                  {/* Configurações de resposta automática */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto_response"
                        checked={formData.auto_response_enabled}
                        onChange={(e) => handleInputChange('auto_response_enabled', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="auto_response" className="text-sm font-medium text-foreground">
                        Habilitar respostas automáticas
                      </label>
                    </div>

                    {formData.auto_response_enabled && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Delay de Resposta (segundos)
                        </label>
                        <Input
                          type="number"
                          value={formData.response_delay_seconds}
                          onChange={(e) => handleInputChange('response_delay_seconds', parseInt(e.target.value))}
                          min="1"
                          max="30"
                        />
                      </div>
                    )}
                  </div>

                  {/* Botões */}
                  <div className="flex justify-between space-x-2 pt-4">
                    <div>
                      {formData.api_key && formData.model_name && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestConfiguration}
                          loading={testingConfig}
                          iconName="TestTube"
                          iconPosition="left"
                        >
                          Testar Configuração
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetForm}
                        >
                          Cancelar
                        </Button>
                      )}
                      <Button
                        type="submit"
                        iconName="Save"
                        iconPosition="left"
                      >
                        {isEditing ? 'Atualizar' : 'Salvar'} Configuração
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Lista de configurações */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                  Configurações Existentes
                </h2>

                {configurations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                      <Icon name="Bot" size={24} className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      Nenhuma configuração de IA encontrada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {configurations.map((config) => (
                      <div
                        key={config.id}
                        className={`p-4 border rounded-lg ${
                          config.is_active ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getProviderIcon(config.provider)}</span>
                            <div>
                              <h3 className="font-medium text-foreground">
                                {getProviderName(config.provider)}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {config.model_name}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {config.is_active && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">
                                Ativo
                              </span>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(config)}
                              iconName="Edit"
                            />
                            
                            {!config.is_active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleActivate(config.id)}
                                iconName="Play"
                                className="text-green-600 hover:text-green-600"
                              />
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(config.id)}
                              iconName="Trash2"
                              className="text-destructive hover:text-destructive"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tokens:</span>
                            <span className="ml-2 text-foreground">{config.max_tokens}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Temperatura:</span>
                            <span className="ml-2 text-foreground">{config.temperature}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Auto-resposta:</span>
                            <span className="ml-2 text-foreground">
                              {config.auto_response_enabled ? 'Sim' : 'Não'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Criado em:</span>
                            <span className="ml-2 text-foreground">
                              {new Date(config.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notificações */}
          {error && (
            <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg max-w-sm">
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => setError('')}
                className="mt-2 text-xs underline"
              >
                Fechar
              </button>
            </div>
          )}

          {success && (
            <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
              <p className="text-sm">{success}</p>
              <button 
                onClick={() => setSuccess('')}
                className="mt-2 text-xs underline"
              >
                Fechar
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AIConfiguration;
