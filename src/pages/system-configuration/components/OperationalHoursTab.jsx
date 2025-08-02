import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const OperationalHoursTab = ({ settings, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    timezone: settings?.timezone || 'America/Sao_Paulo',
    operatingDays: settings?.operatingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: settings?.startTime || '08:00',
    endTime: settings?.endTime || '18:00',
    maintenanceWindow: settings?.maintenanceWindow || '02:00-04:00',
    enableWeekendOperations: settings?.enableWeekendOperations || false,
    weekendStartTime: settings?.weekendStartTime || '09:00',
    weekendEndTime: settings?.weekendEndTime || '17:00',
    enableHolidayRestrictions: settings?.enableHolidayRestrictions || true,
    emergencyOverride: settings?.emergencyOverride || false
  });

  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const timezoneOptions = [
    { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
    { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
    { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
    { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' }
  ];

  const dayOptions = [
    { value: 'monday', label: 'Segunda-feira' },
    { value: 'tuesday', label: 'Terça-feira' },
    { value: 'wednesday', label: 'Quarta-feira' },
    { value: 'thursday', label: 'Quinta-feira' },
    { value: 'friday', label: 'Sexta-feira' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
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

  const handleDayToggle = (day, checked) => {
    const updatedDays = checked 
      ? [...formData?.operatingDays, day]
      : formData?.operatingDays?.filter(d => d !== day);
    
    handleInputChange('operatingDays', updatedDays);
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData?.operatingDays?.length === 0) {
      newErrors.operatingDays = 'Selecione pelo menos um dia operacional';
    }

    if (!formData?.startTime || !formData?.endTime) {
      newErrors.timeRange = 'Horários de início e fim são obrigatórios';
    }

    if (formData?.startTime >= formData?.endTime) {
      newErrors.timeRange = 'Horário de início deve ser anterior ao fim';
    }

    if (formData?.enableWeekendOperations) {
      if (!formData?.weekendStartTime || !formData?.weekendEndTime) {
        newErrors.weekendTimeRange = 'Horários de fim de semana são obrigatórios';
      }
      
      if (formData?.weekendStartTime >= formData?.weekendEndTime) {
        newErrors.weekendTimeRange = 'Horário de início deve ser anterior ao fim';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave('operationalHours', formData);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setFormData({
      timezone: settings?.timezone || 'America/Sao_Paulo',
      operatingDays: settings?.operatingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: settings?.startTime || '08:00',
      endTime: settings?.endTime || '18:00',
      maintenanceWindow: settings?.maintenanceWindow || '02:00-04:00',
      enableWeekendOperations: settings?.enableWeekendOperations || false,
      weekendStartTime: settings?.weekendStartTime || '09:00',
      weekendEndTime: settings?.weekendEndTime || '17:00',
      enableHolidayRestrictions: settings?.enableHolidayRestrictions || true,
      emergencyOverride: settings?.emergencyOverride || false
    });
    setErrors({});
    setHasChanges(false);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const options = {
      timeZone: formData?.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    return now?.toLocaleString('pt-BR', options);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Horários Operacionais</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os horários de funcionamento da plataforma
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Horário atual:</p>
          <p className="text-lg font-mono font-semibold text-foreground">{getCurrentTime()}</p>
        </div>
      </div>
      {/* Timezone Configuration */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-foreground mb-3 flex items-center">
          <Icon name="Clock" size={18} className="mr-2 text-primary" />
          Fuso Horário
        </h4>
        <Select
          label="Fuso horário do sistema"
          options={timezoneOptions}
          value={formData?.timezone}
          onChange={(value) => handleInputChange('timezone', value)}
          description="Todos os horários serão baseados neste fuso"
        />
      </div>
      {/* Operating Days */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-foreground mb-3 flex items-center">
          <Icon name="Calendar" size={18} className="mr-2 text-secondary" />
          Dias Operacionais
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {dayOptions?.map((day) => (
            <Checkbox
              key={day?.value}
              label={day?.label}
              checked={formData?.operatingDays?.includes(day?.value)}
              onChange={(e) => handleDayToggle(day?.value, e?.target?.checked)}
            />
          ))}
        </div>
        {errors?.operatingDays && (
          <p className="text-sm text-error mt-2">{errors?.operatingDays}</p>
        )}
      </div>
      {/* Operating Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Icon name="Sun" size={18} className="mr-2 text-accent" />
            Horário Comercial
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Início"
              type="time"
              value={formData?.startTime}
              onChange={(e) => handleInputChange('startTime', e?.target?.value)}
              error={errors?.timeRange}
            />
            <Input
              label="Fim"
              type="time"
              value={formData?.endTime}
              onChange={(e) => handleInputChange('endTime', e?.target?.value)}
              error={errors?.timeRange}
            />
          </div>
          {errors?.timeRange && (
            <p className="text-sm text-error mt-2">{errors?.timeRange}</p>
          )}
        </div>

        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Icon name="Moon" size={18} className="mr-2 text-muted-foreground" />
            Janela de Manutenção
          </h4>
          <Input
            label="Período de manutenção"
            type="text"
            value={formData?.maintenanceWindow}
            onChange={(e) => handleInputChange('maintenanceWindow', e?.target?.value)}
            placeholder="02:00-04:00"
            description="Formato: HH:MM-HH:MM"
          />
        </div>
      </div>
      {/* Weekend Operations */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-foreground flex items-center">
            <Icon name="Calendar" size={18} className="mr-2 text-success" />
            Operações de Fim de Semana
          </h4>
          <Checkbox
            label="Habilitar"
            checked={formData?.enableWeekendOperations}
            onChange={(e) => handleInputChange('enableWeekendOperations', e?.target?.checked)}
          />
        </div>
        
        {formData?.enableWeekendOperations && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Início (Fim de Semana)"
              type="time"
              value={formData?.weekendStartTime}
              onChange={(e) => handleInputChange('weekendStartTime', e?.target?.value)}
              error={errors?.weekendTimeRange}
            />
            <Input
              label="Fim (Fim de Semana)"
              type="time"
              value={formData?.weekendEndTime}
              onChange={(e) => handleInputChange('weekendEndTime', e?.target?.value)}
              error={errors?.weekendTimeRange}
            />
          </div>
        )}
        {errors?.weekendTimeRange && (
          <p className="text-sm text-error mt-2">{errors?.weekendTimeRange}</p>
        )}
      </div>
      {/* Additional Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Icon name="Shield" size={18} className="mr-2 text-warning" />
            Restrições
          </h4>
          <div className="space-y-3">
            <Checkbox
              label="Respeitar feriados brasileiros"
              description="Sistema será desabilitado em feriados nacionais"
              checked={formData?.enableHolidayRestrictions}
              onChange={(e) => handleInputChange('enableHolidayRestrictions', e?.target?.checked)}
            />
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Icon name="AlertTriangle" size={18} className="mr-2 text-error" />
            Emergência
          </h4>
          <div className="space-y-3">
            <Checkbox
              label="Modo de emergência ativo"
              description="Ignora restrições de horário em situações críticas"
              checked={formData?.emergencyOverride}
              onChange={(e) => handleInputChange('emergencyOverride', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      {/* Status Indicator */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            formData?.emergencyOverride ? 'bg-error animate-pulse' : 'bg-success'
          }`}></div>
          <div>
            <h4 className="font-medium text-foreground">
              Status: {formData?.emergencyOverride ? 'Modo Emergência' : 'Operação Normal'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {formData?.emergencyOverride 
                ? 'Todas as restrições de horário estão desabilitadas' :'Sistema operando dentro dos horários configurados'
              }
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

export default OperationalHoursTab;