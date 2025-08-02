import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const CampaignBasicInfo = ({ formData, onFormChange, whatsappSessions, errors }) => {
  const handleInputChange = (field, value) => {
    onFormChange(field, value);
  };

  const sessionOptions = whatsappSessions?.map(session => ({
    value: session?.id,
    label: `${session?.name} - ${session?.phone}`,
    description: session?.status === 'connected' ? 'Conectado' : 'Desconectado',
    disabled: session?.status !== 'connected'
  }));

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-primary font-semibold">1</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Informações Básicas</h3>
          <p className="text-sm text-muted-foreground">Configure o nome e sessão WhatsApp da campanha</p>
        </div>
      </div>
      <div className="space-y-6">
        <Input
          label="Nome da Campanha"
          type="text"
          placeholder="Ex: Promoção Black Friday 2025"
          value={formData?.name}
          onChange={(e) => handleInputChange('name', e?.target?.value)}
          error={errors?.name}
          required
          description="Escolha um nome descritivo para identificar sua campanha"
        />

        <Input
          label="Descrição (Opcional)"
          type="text"
          placeholder="Descreva o objetivo desta campanha"
          value={formData?.description}
          onChange={(e) => handleInputChange('description', e?.target?.value)}
          description="Adicione detalhes sobre o propósito da campanha"
        />

        <Select
          label="Sessão WhatsApp"
          placeholder="Selecione uma sessão conectada"
          options={sessionOptions}
          value={formData?.whatsappSessionId}
          onChange={(value) => handleInputChange('whatsappSessionId', value)}
          error={errors?.whatsappSessionId}
          required
          description="Escolha qual conta WhatsApp será usada para enviar as mensagens"
        />

        {formData?.whatsappSessionId && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-sm font-medium text-success">
                Sessão selecionada está conectada e pronta para uso
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignBasicInfo;