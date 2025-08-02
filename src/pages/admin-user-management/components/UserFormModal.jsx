import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const UserFormModal = ({ user, isOpen, onClose, onSave, isEditing = false }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    empresa: '',
    telefone: '',
    plano: 'Básico',
    status: 'ativo',
    senha: '',
    confirmarSenha: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        nome: user?.nome || '',
        email: user?.email || '',
        empresa: user?.empresa || '',
        telefone: user?.telefone || '',
        plano: user?.plano || 'Básico',
        status: user?.status || 'ativo',
        senha: '',
        confirmarSenha: ''
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        empresa: '',
        telefone: '',
        plano: 'Básico',
        status: 'ativo',
        senha: '',
        confirmarSenha: ''
      });
    }
    setErrors({});
  }, [user, isEditing, isOpen]);

  const planOptions = [
    { value: 'Básico', label: 'Básico - R$ 49,90/mês' },
    { value: 'Pro', label: 'Pro - R$ 99,90/mês' },
    { value: 'Premium', label: 'Premium - R$ 199,90/mês' }
  ];

  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'suspenso', label: 'Suspenso' },
    { value: 'inativo', label: 'Inativo' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.nome?.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData?.empresa?.trim()) {
      newErrors.empresa = 'Empresa é obrigatória';
    }

    if (!isEditing) {
      if (!formData?.senha) {
        newErrors.senha = 'Senha é obrigatória';
      } else if (formData?.senha?.length < 6) {
        newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
      }

      if (formData?.senha !== formData?.confirmarSenha) {
        newErrors.confirmarSenha = 'Senhas não coincidem';
      }
    } else if (formData?.senha && formData?.senha !== formData?.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await onSave({
        ...formData,
        id: user?.id
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {isEditing ? 'Editar Usuário' : 'Criar Novo Usuário'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Informações Pessoais</h3>
              
              <Input
                label="Nome Completo"
                type="text"
                required
                value={formData?.nome}
                onChange={(e) => handleInputChange('nome', e?.target?.value)}
                error={errors?.nome}
                placeholder="Digite o nome completo"
              />

              <Input
                label="Email"
                type="email"
                required
                value={formData?.email}
                onChange={(e) => handleInputChange('email', e?.target?.value)}
                error={errors?.email}
                placeholder="Digite o email"
              />

              <Input
                label="Empresa"
                type="text"
                required
                value={formData?.empresa}
                onChange={(e) => handleInputChange('empresa', e?.target?.value)}
                error={errors?.empresa}
                placeholder="Digite o nome da empresa"
              />

              <Input
                label="Telefone"
                type="tel"
                value={formData?.telefone}
                onChange={(e) => handleInputChange('telefone', e?.target?.value)}
                error={errors?.telefone}
                placeholder="(11) 99999-9999"
              />
            </div>

            {/* Account Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Configurações da Conta</h3>
              
              <Select
                label="Plano"
                options={planOptions}
                value={formData?.plano}
                onChange={(value) => handleInputChange('plano', value)}
                required
              />

              <Select
                label="Status"
                options={statusOptions}
                value={formData?.status}
                onChange={(value) => handleInputChange('status', value)}
                required
              />

              <Input
                label={isEditing ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                type="password"
                required={!isEditing}
                value={formData?.senha}
                onChange={(e) => handleInputChange('senha', e?.target?.value)}
                error={errors?.senha}
                placeholder="Digite a senha"
                description={isEditing ? "Deixe em branco para manter a senha atual" : "Mínimo 6 caracteres"}
              />

              <Input
                label="Confirmar Senha"
                type="password"
                required={!isEditing || formData?.senha}
                value={formData?.confirmarSenha}
                onChange={(e) => handleInputChange('confirmarSenha', e?.target?.value)}
                error={errors?.confirmarSenha}
                placeholder="Confirme a senha"
              />
            </div>
          </div>

          {/* Plan Features Info */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Recursos do Plano {formData?.plano}:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              {formData?.plano === 'Básico' && (
                <>
                  <div>• 2 Sessões WhatsApp</div>
                  <div>• 500 Contatos</div>
                  <div>• 1.000 Mensagens/mês</div>
                </>
              )}
              {formData?.plano === 'Pro' && (
                <>
                  <div>• 5 Sessões WhatsApp</div>
                  <div>• 2.000 Contatos</div>
                  <div>• 5.000 Mensagens/mês</div>
                </>
              )}
              {formData?.plano === 'Premium' && (
                <>
                  <div>• 10 Sessões WhatsApp</div>
                  <div>• 10.000 Contatos</div>
                  <div>• 20.000 Mensagens/mês</div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              iconName={isEditing ? "Save" : "Plus"}
              iconPosition="left"
              iconSize={16}
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;