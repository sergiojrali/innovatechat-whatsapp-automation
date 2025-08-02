import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const UserLimitsTab = ({ settings, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    maxSessionsPerUser: settings?.maxSessionsPerUser || 5,
    maxContactsPerUser: settings?.maxContactsPerUser || 10000,
    maxCampaignsPerDay: settings?.maxCampaignsPerDay || 10,
    maxMessagesPerCampaign: settings?.maxMessagesPerCampaign || 1000,
    maxFileUploadSize: settings?.maxFileUploadSize || 10,
    sessionTimeoutMinutes: settings?.sessionTimeoutMinutes || 30
  });

  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData?.maxSessionsPerUser < 1 || formData?.maxSessionsPerUser > 50) {
      newErrors.maxSessionsPerUser = 'Deve estar entre 1 e 50 sessões';
    }

    if (formData?.maxContactsPerUser < 100 || formData?.maxContactsPerUser > 100000) {
      newErrors.maxContactsPerUser = 'Deve estar entre 100 e 100.000 contatos';
    }

    if (formData?.maxCampaignsPerDay < 1 || formData?.maxCampaignsPerDay > 100) {
      newErrors.maxCampaignsPerDay = 'Deve estar entre 1 e 100 campanhas';
    }

    if (formData?.maxMessagesPerCampaign < 10 || formData?.maxMessagesPerCampaign > 50000) {
      newErrors.maxMessagesPerCampaign = 'Deve estar entre 10 e 50.000 mensagens';
    }

    if (formData?.maxFileUploadSize < 1 || formData?.maxFileUploadSize > 100) {
      newErrors.maxFileUploadSize = 'Deve estar entre 1 e 100 MB';
    }

    if (formData?.sessionTimeoutMinutes < 5 || formData?.sessionTimeoutMinutes > 480) {
      newErrors.sessionTimeoutMinutes = 'Deve estar entre 5 e 480 minutos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave('userLimits', formData);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setFormData({
      maxSessionsPerUser: settings?.maxSessionsPerUser || 5,
      maxContactsPerUser: settings?.maxContactsPerUser || 10000,
      maxCampaignsPerDay: settings?.maxCampaignsPerDay || 10,
      maxMessagesPerCampaign: settings?.maxMessagesPerCampaign || 1000,
      maxFileUploadSize: settings?.maxFileUploadSize || 10,
      sessionTimeoutMinutes: settings?.sessionTimeoutMinutes || 30
    });
    setErrors({});
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Limites de Usuário</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os limites operacionais para usuários da plataforma
          </p>
        </div>
        {hasChanges && (
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-warning" />
            <span className="text-sm text-warning font-medium">Alterações não salvas</span>
          </div>
        )}
      </div>
      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sessions Limit */}
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-3 flex items-center">
              <Icon name="MessageSquare" size={18} className="mr-2 text-primary" />
              Sessões WhatsApp
            </h4>
            <Input
              label="Máximo de sessões por usuário"
              type="number"
              value={formData?.maxSessionsPerUser}
              onChange={(e) => handleInputChange('maxSessionsPerUser', parseInt(e?.target?.value) || 0)}
              error={errors?.maxSessionsPerUser}
              description="Número máximo de conexões WhatsApp simultâneas"
              min="1"
              max="50"
            />
            <Input
              label="Timeout de sessão (minutos)"
              type="number"
              value={formData?.sessionTimeoutMinutes}
              onChange={(e) => handleInputChange('sessionTimeoutMinutes', parseInt(e?.target?.value) || 0)}
              error={errors?.sessionTimeoutMinutes}
              description="Tempo limite para sessões inativas"
              min="5"
              max="480"
              className="mt-4"
            />
          </div>
        </div>

        {/* Contacts Limit */}
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-3 flex items-center">
              <Icon name="Users" size={18} className="mr-2 text-secondary" />
              Base de Contatos
            </h4>
            <Input
              label="Máximo de contatos por usuário"
              type="number"
              value={formData?.maxContactsPerUser}
              onChange={(e) => handleInputChange('maxContactsPerUser', parseInt(e?.target?.value) || 0)}
              error={errors?.maxContactsPerUser}
              description="Limite total de contatos na base de dados"
              min="100"
              max="100000"
            />
          </div>
        </div>

        {/* Campaign Limits */}
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-3 flex items-center">
              <Icon name="Send" size={18} className="mr-2 text-accent" />
              Campanhas
            </h4>
            <Input
              label="Campanhas por dia"
              type="number"
              value={formData?.maxCampaignsPerDay}
              onChange={(e) => handleInputChange('maxCampaignsPerDay', parseInt(e?.target?.value) || 0)}
              error={errors?.maxCampaignsPerDay}
              description="Limite diário de campanhas por usuário"
              min="1"
              max="100"
            />
            <Input
              label="Mensagens por campanha"
              type="number"
              value={formData?.maxMessagesPerCampaign}
              onChange={(e) => handleInputChange('maxMessagesPerCampaign', parseInt(e?.target?.value) || 0)}
              error={errors?.maxMessagesPerCampaign}
              description="Máximo de mensagens em uma única campanha"
              min="10"
              max="50000"
              className="mt-4"
            />
          </div>
        </div>

        {/* File Upload Limits */}
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-3 flex items-center">
              <Icon name="Upload" size={18} className="mr-2 text-success" />
              Upload de Arquivos
            </h4>
            <Input
              label="Tamanho máximo (MB)"
              type="number"
              value={formData?.maxFileUploadSize}
              onChange={(e) => handleInputChange('maxFileUploadSize', parseInt(e?.target?.value) || 0)}
              error={errors?.maxFileUploadSize}
              description="Limite de tamanho para arquivos de mídia"
              min="1"
              max="100"
            />
          </div>
        </div>
      </div>
      {/* Impact Warning */}
      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <Icon name="AlertTriangle" size={20} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-warning mb-1">Impacto das Alterações</h4>
            <p className="text-sm text-warning/80">
              Alterações nos limites serão aplicadas imediatamente a todos os usuários. 
              Usuários que excedem os novos limites podem ter funcionalidades restritas.
            </p>
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

export default UserLimitsTab;