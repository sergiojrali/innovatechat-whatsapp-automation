import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const CampaignScheduling = ({ formData, onFormChange, errors }) => {
  const [scheduleType, setScheduleType] = useState(formData?.scheduleType || 'immediate');

  const handleScheduleTypeChange = (type) => {
    setScheduleType(type);
    onFormChange('scheduleType', type);
    
    if (type === 'immediate') {
      onFormChange('scheduledDate', '');
      onFormChange('scheduledTime', '');
    }
  };

  const deliverySpeedOptions = [
    { value: 'slow', label: 'Lenta (1 msg/min)', description: 'Mais segura, menor risco de bloqueio' },
    { value: 'medium', label: 'Média (5 msgs/min)', description: 'Equilibrio entre velocidade e segurança' },
    { value: 'fast', label: 'Rápida (10 msgs/min)', description: 'Mais rápida, maior risco de bloqueio' }
  ];

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now?.getFullYear();
    const month = String(now?.getMonth() + 1)?.padStart(2, '0');
    const day = String(now?.getDate())?.padStart(2, '0');
    const hours = String(now?.getHours())?.padStart(2, '0');
    const minutes = String(now?.getMinutes())?.padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      datetime: `${day}/${month}/${year} ${hours}:${minutes}`
    };
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return '';
    const [year, month, day] = date?.split('-');
    return `${day}/${month}/${year} ${time}`;
  };

  const getEstimatedDuration = () => {
    const totalContacts = 100; // This would come from selected contacts
    const speed = formData?.deliverySpeed || 'medium';
    const messagesPerMinute = speed === 'slow' ? 1 : speed === 'medium' ? 5 : 10;
    const totalMinutes = Math.ceil(totalContacts / messagesPerMinute);
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutos`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-primary font-semibold">4</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Agendamento e Configurações</h3>
          <p className="text-sm text-muted-foreground">Configure quando e como sua campanha será enviada</p>
        </div>
      </div>
      <div className="space-y-6">
        {/* Schedule Type */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Quando Enviar</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                scheduleType === 'immediate' ?'border-primary bg-primary/5' :'border-border hover:border-primary/50'
              }`}
              onClick={() => handleScheduleTypeChange('immediate')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  scheduleType === 'immediate' ?'border-primary bg-primary' :'border-muted-foreground'
                }`}>
                  {scheduleType === 'immediate' && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Enviar Agora</h4>
                  <p className="text-sm text-muted-foreground">Iniciar campanha imediatamente</p>
                </div>
              </div>
            </div>

            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                scheduleType === 'scheduled' ?'border-primary bg-primary/5' :'border-border hover:border-primary/50'
              }`}
              onClick={() => handleScheduleTypeChange('scheduled')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  scheduleType === 'scheduled' ?'border-primary bg-primary' :'border-muted-foreground'
                }`}>
                  {scheduleType === 'scheduled' && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Agendar</h4>
                  <p className="text-sm text-muted-foreground">Escolher data e hora específica</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled DateTime */}
        {scheduleType === 'scheduled' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data"
              type="date"
              value={formData?.scheduledDate}
              onChange={(e) => onFormChange('scheduledDate', e?.target?.value)}
              error={errors?.scheduledDate}
              min={getCurrentDateTime()?.date}
              required
            />
            <Input
              label="Hora"
              type="time"
              value={formData?.scheduledTime}
              onChange={(e) => onFormChange('scheduledTime', e?.target?.value)}
              error={errors?.scheduledTime}
              required
            />
          </div>
        )}

        {/* Delivery Speed */}
        <Select
          label="Velocidade de Entrega"
          placeholder="Selecione a velocidade"
          options={deliverySpeedOptions}
          value={formData?.deliverySpeed}
          onChange={(value) => onFormChange('deliverySpeed', value)}
          error={errors?.deliverySpeed}
          required
          description="Velocidades mais lentas reduzem o risco de bloqueio pelo WhatsApp"
        />

        {/* Campaign Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Configurações Avançadas</h4>
          
          <Checkbox
            label="Evitar duplicatas"
            description="Não enviar para contatos que já receberam esta campanha"
            checked={formData?.avoidDuplicates || false}
            onChange={(e) => onFormChange('avoidDuplicates', e?.target?.checked)}
          />

          <Checkbox
            label="Parar em caso de erro"
            description="Pausar campanha se houver muitos erros de entrega"
            checked={formData?.stopOnError || false}
            onChange={(e) => onFormChange('stopOnError', e?.target?.checked)}
          />

          <Checkbox
            label="Salvar como modelo"
            description="Salvar esta campanha como modelo para reutilização"
            checked={formData?.saveAsTemplate || false}
            onChange={(e) => onFormChange('saveAsTemplate', e?.target?.checked)}
          />
        </div>

        {/* Campaign Summary */}
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-4">Resumo da Campanha</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">100</div>
              <div className="text-sm text-muted-foreground">Destinatários</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {scheduleType === 'immediate' ? 'Agora' : 'Agendado'}
              </div>
              <div className="text-sm text-muted-foreground">
                {scheduleType === 'scheduled' && formData?.scheduledDate && formData?.scheduledTime
                  ? formatDateTime(formData?.scheduledDate, formData?.scheduledTime)
                  : 'Início'
                }
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{getEstimatedDuration()}</div>
              <div className="text-sm text-muted-foreground">Duração Estimada</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">R$ 5,00</div>
              <div className="text-sm text-muted-foreground">Custo Total</div>
            </div>
          </div>

          {scheduleType === 'scheduled' && formData?.scheduledDate && formData?.scheduledTime && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="Clock" size={16} className="text-primary" />
                <span className="text-sm font-medium text-primary">
                  Campanha agendada para {formatDateTime(formData?.scheduledDate, formData?.scheduledTime)} (GMT-3)
                </span>
              </div>
            </div>
          )}

          {scheduleType === 'immediate' && (
            <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="Play" size={16} className="text-success" />
                <span className="text-sm font-medium text-success">
                  Campanha será iniciada imediatamente após confirmação
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Timezone Notice */}
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Info" size={16} className="text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">Fuso Horário</p>
              <p className="text-sm text-muted-foreground">
                Todos os horários são baseados no fuso horário de Brasília (GMT-3). 
                Certifique-se de que o horário escolhido respeita as boas práticas de envio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignScheduling;