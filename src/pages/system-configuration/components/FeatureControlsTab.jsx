import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const FeatureControlsTab = ({ settings, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    enableBotAutomation: settings?.enableBotAutomation || true,
    maxBotResponseDelay: settings?.maxBotResponseDelay || 5,
    enableFileUploads: settings?.enableFileUploads || true,
    allowedFileTypes: settings?.allowedFileTypes || ['image', 'document', 'audio'],
    maxFileSize: settings?.maxFileSize || 10,
    enableApiAccess: settings?.enableApiAccess || true,
    apiRateLimit: settings?.apiRateLimit || 1000,
    enableWebhooks: settings?.enableWebhooks || true,
    enableChatExport: settings?.enableChatExport || true,
    enableBulkOperations: settings?.enableBulkOperations || true,
    maxBulkOperationSize: settings?.maxBulkOperationSize || 1000,
    enableAdvancedAnalytics: settings?.enableAdvancedAnalytics || false,
    enableIntegrations: settings?.enableIntegrations || true,
    maintenanceMode: settings?.maintenanceMode || false
  });

  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const fileTypeOptions = [
    { value: 'image', label: 'Imagens (JPG, PNG, GIF)' },
    { value: 'document', label: 'Documentos (PDF, DOC, XLS)' },
    { value: 'audio', label: 'Áudio (MP3, WAV, OGG)' },
    { value: 'video', label: 'Vídeo (MP4, AVI, MOV)' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData?.maxBotResponseDelay < 1 || formData?.maxBotResponseDelay > 60) {
      newErrors.maxBotResponseDelay = 'Deve estar entre 1 e 60 segundos';
    }

    if (formData?.maxFileSize < 1 || formData?.maxFileSize > 100) {
      newErrors.maxFileSize = 'Deve estar entre 1 e 100 MB';
    }

    if (formData?.apiRateLimit < 100 || formData?.apiRateLimit > 10000) {
      newErrors.apiRateLimit = 'Deve estar entre 100 e 10.000 requisições/hora';
    }

    if (formData?.maxBulkOperationSize < 10 || formData?.maxBulkOperationSize > 10000) {
      newErrors.maxBulkOperationSize = 'Deve estar entre 10 e 10.000 itens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave('featureControls', formData);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setFormData({
      enableBotAutomation: settings?.enableBotAutomation || true,
      maxBotResponseDelay: settings?.maxBotResponseDelay || 5,
      enableFileUploads: settings?.enableFileUploads || true,
      allowedFileTypes: settings?.allowedFileTypes || ['image', 'document', 'audio'],
      maxFileSize: settings?.maxFileSize || 10,
      enableApiAccess: settings?.enableApiAccess || true,
      apiRateLimit: settings?.apiRateLimit || 1000,
      enableWebhooks: settings?.enableWebhooks || true,
      enableChatExport: settings?.enableChatExport || true,
      enableBulkOperations: settings?.enableBulkOperations || true,
      maxBulkOperationSize: settings?.maxBulkOperationSize || 1000,
      enableAdvancedAnalytics: settings?.enableAdvancedAnalytics || false,
      enableIntegrations: settings?.enableIntegrations || true,
      maintenanceMode: settings?.maintenanceMode || false
    });
    setErrors({});
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Controles de Funcionalidades</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as funcionalidades disponíveis na plataforma
          </p>
        </div>
        {formData?.maintenanceMode && (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-error/10 border border-error/20 rounded-full">
            <Icon name="AlertTriangle" size={16} className="text-error" />
            <span className="text-sm text-error font-medium">Modo Manutenção Ativo</span>
          </div>
        )}
      </div>
      {/* Bot Automation */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-foreground flex items-center">
            <Icon name="Bot" size={18} className="mr-2 text-primary" />
            Automação de Bot
          </h4>
          <Checkbox
            label="Habilitar"
            checked={formData?.enableBotAutomation}
            onChange={(e) => handleInputChange('enableBotAutomation', e?.target?.checked)}
          />
        </div>
        
        {formData?.enableBotAutomation && (
          <Input
            label="Delay máximo de resposta (segundos)"
            type="number"
            value={formData?.maxBotResponseDelay}
            onChange={(e) => handleInputChange('maxBotResponseDelay', parseInt(e?.target?.value) || 0)}
            error={errors?.maxBotResponseDelay}
            description="Tempo máximo para resposta automática do bot"
            min="1"
            max="60"
          />
        )}
      </div>
      {/* File Upload Controls */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-foreground flex items-center">
            <Icon name="Upload" size={18} className="mr-2 text-secondary" />
            Upload de Arquivos
          </h4>
          <Checkbox
            label="Habilitar"
            checked={formData?.enableFileUploads}
            onChange={(e) => handleInputChange('enableFileUploads', e?.target?.checked)}
          />
        </div>
        
        {formData?.enableFileUploads && (
          <div className="space-y-4">
            <Select
              label="Tipos de arquivo permitidos"
              options={fileTypeOptions}
              value={formData?.allowedFileTypes}
              onChange={(value) => handleInputChange('allowedFileTypes', value)}
              multiple
              description="Selecione os tipos de arquivo que podem ser enviados"
            />
            <Input
              label="Tamanho máximo por arquivo (MB)"
              type="number"
              value={formData?.maxFileSize}
              onChange={(e) => handleInputChange('maxFileSize', parseInt(e?.target?.value) || 0)}
              error={errors?.maxFileSize}
              description="Limite de tamanho para uploads"
              min="1"
              max="100"
            />
          </div>
        )}
      </div>
      {/* API Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground flex items-center">
              <Icon name="Code" size={18} className="mr-2 text-accent" />
              Acesso à API
            </h4>
            <Checkbox
              label="Habilitar"
              checked={formData?.enableApiAccess}
              onChange={(e) => handleInputChange('enableApiAccess', e?.target?.checked)}
            />
          </div>
          
          {formData?.enableApiAccess && (
            <Input
              label="Limite de requisições/hora"
              type="number"
              value={formData?.apiRateLimit}
              onChange={(e) => handleInputChange('apiRateLimit', parseInt(e?.target?.value) || 0)}
              error={errors?.apiRateLimit}
              description="Limite de chamadas à API por usuário"
              min="100"
              max="10000"
            />
          )}
        </div>

        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground flex items-center">
              <Icon name="Webhook" size={18} className="mr-2 text-success" />
              Webhooks
            </h4>
            <Checkbox
              label="Habilitar"
              checked={formData?.enableWebhooks}
              onChange={(e) => handleInputChange('enableWebhooks', e?.target?.checked)}
            />
          </div>
          
          {formData?.enableWebhooks && (
            <p className="text-sm text-muted-foreground">
              Permite integração com sistemas externos via webhooks
            </p>
          )}
        </div>
      </div>
      {/* Bulk Operations */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-foreground flex items-center">
            <Icon name="Database" size={18} className="mr-2 text-warning" />
            Operações em Lote
          </h4>
          <Checkbox
            label="Habilitar"
            checked={formData?.enableBulkOperations}
            onChange={(e) => handleInputChange('enableBulkOperations', e?.target?.checked)}
          />
        </div>
        
        {formData?.enableBulkOperations && (
          <Input
            label="Tamanho máximo do lote"
            type="number"
            value={formData?.maxBulkOperationSize}
            onChange={(e) => handleInputChange('maxBulkOperationSize', parseInt(e?.target?.value) || 0)}
            error={errors?.maxBulkOperationSize}
            description="Número máximo de itens em operações em lote"
            min="10"
            max="10000"
          />
        )}
      </div>
      {/* Additional Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Icon name="BarChart" size={18} className="mr-2 text-primary" />
            Recursos Avançados
          </h4>
          <div className="space-y-3">
            <Checkbox
              label="Análises avançadas"
              description="Relatórios detalhados e métricas avançadas"
              checked={formData?.enableAdvancedAnalytics}
              onChange={(e) => handleInputChange('enableAdvancedAnalytics', e?.target?.checked)}
            />
            <Checkbox
              label="Exportação de conversas"
              description="Permite exportar histórico de conversas"
              checked={formData?.enableChatExport}
              onChange={(e) => handleInputChange('enableChatExport', e?.target?.checked)}
            />
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Icon name="Plug" size={18} className="mr-2 text-secondary" />
            Integrações
          </h4>
          <div className="space-y-3">
            <Checkbox
              label="Integrações externas"
              description="CRM, ERP e outras integrações"
              checked={formData?.enableIntegrations}
              onChange={(e) => handleInputChange('enableIntegrations', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      {/* System Maintenance */}
      <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-error flex items-center">
            <Icon name="Settings" size={18} className="mr-2" />
            Modo Manutenção
          </h4>
          <Checkbox
            label="Ativar"
            checked={formData?.maintenanceMode}
            onChange={(e) => handleInputChange('maintenanceMode', e?.target?.checked)}
          />
        </div>
        <p className="text-sm text-error/80">
          Quando ativo, apenas administradores terão acesso ao sistema. 
          Usuários verão uma página de manutenção.
        </p>
      </div>
      {/* Feature Summary */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <h4 className="font-medium text-foreground mb-3 flex items-center">
          <Icon name="Info" size={18} className="mr-2 text-primary" />
          Resumo das Funcionalidades
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${formData?.enableBotAutomation ? 'bg-success' : 'bg-error'}`}></div>
            <span>Bot Automation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${formData?.enableFileUploads ? 'bg-success' : 'bg-error'}`}></div>
            <span>File Uploads</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${formData?.enableApiAccess ? 'bg-success' : 'bg-error'}`}></div>
            <span>API Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${formData?.enableWebhooks ? 'bg-success' : 'bg-error'}`}></div>
            <span>Webhooks</span>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || isLoading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          loading={isLoading}
          iconName="Save"
          iconPosition="left"
        >
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default FeatureControlsTab;