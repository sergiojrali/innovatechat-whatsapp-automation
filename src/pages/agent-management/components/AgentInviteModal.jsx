import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const AgentInviteModal = ({ isOpen, onClose, onSave, sectors }) => {
  const [formData, setFormData] = useState({
    sector_id: '',
    email: '',
    full_name: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        sector_id: sectors.length > 0 ? sectors[0].id : '',
        email: '',
        full_name: ''
      });
      setErrors({});
    }
  }, [isOpen, sectors]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sector_id) {
      newErrors.sector_id = 'Setor é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Nome deve ter pelo menos 2 caracteres';
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
      onClose();
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      setErrors({ submit: 'Erro ao enviar convite. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSector = () => {
    return sectors.find(s => s.id === formData.sector_id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground">
            Convidar Atendente
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            iconName="X"
          />
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Setor */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Setor *
              </label>
              <select
                value={formData.sector_id}
                onChange={(e) => handleInputChange('sector_id', e.target.value)}
                className={`w-full p-3 border rounded-md bg-background text-foreground ${
                  errors.sector_id ? 'border-destructive' : 'border-border'
                }`}
              >
                <option value="">Selecione um setor</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
              {errors.sector_id && (
                <p className="text-sm text-destructive mt-1">{errors.sector_id}</p>
              )}
            </div>

            {/* Informações do setor selecionado */}
            {formData.sector_id && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getSelectedSector()?.color }}
                  ></div>
                  <span className="font-medium text-foreground">
                    {getSelectedSector()?.name}
                  </span>
                </div>
                {getSelectedSector()?.description && (
                  <p className="text-sm text-muted-foreground">
                    {getSelectedSector().description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">
                    Máximo de atendentes: {getSelectedSector()?.max_agents}
                  </span>
                  <span className="text-muted-foreground">
                    Atribuição automática: {getSelectedSector()?.auto_assignment ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            )}

            {/* Nome completo */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome Completo *
              </label>
              <Input
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Ex: João Silva Santos"
                error={errors.full_name}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Ex: joao@empresa.com"
                error={errors.email}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Um convite será enviado para este email com instruções para criar a conta.
              </p>
            </div>

            {/* Informações sobre o convite */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Info" size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Como funciona o convite</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Um email será enviado com um link de convite</li>
                <li>• O convite expira em 7 dias</li>
                <li>• O atendente criará sua própria senha</li>
                <li>• Acesso será restrito apenas ao setor selecionado</li>
              </ul>
            </div>

            {/* Error de submit */}
            {errors.submit && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{errors.submit}</p>
              </div>
            )}
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
              iconName="Send"
              iconPosition="left"
            >
              Enviar Convite
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentInviteModal;
