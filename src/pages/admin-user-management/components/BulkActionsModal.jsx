import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const BulkActionsModal = ({ selectedUsers, isOpen, onClose, onExecute }) => {
  const [action, setAction] = useState('');
  const [actionData, setActionData] = useState({});
  const [confirmAction, setConfirmAction] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const actionOptions = [
    { value: '', label: 'Selecione uma ação' },
    { value: 'change_plan', label: 'Alterar Plano' },
    { value: 'change_status', label: 'Alterar Status' },
    { value: 'send_notification', label: 'Enviar Notificação' },
    { value: 'export_data', label: 'Exportar Dados' },
    { value: 'delete_users', label: 'Excluir Usuários' }
  ];

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

  const notificationTemplates = [
    { value: 'welcome', label: 'Mensagem de Boas-vindas' },
    { value: 'plan_upgrade', label: 'Upgrade de Plano' },
    { value: 'payment_reminder', label: 'Lembrete de Pagamento' },
    { value: 'feature_announcement', label: 'Anúncio de Recursos' },
    { value: 'custom', label: 'Mensagem Personalizada' }
  ];

  const handleExecute = async () => {
    if (!action || !confirmAction) return;

    setIsLoading(true);
    
    try {
      await onExecute({
        action,
        users: selectedUsers,
        data: actionData
      });
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao executar ação em lote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAction('');
    setActionData({});
    setConfirmAction(false);
  };

  const getActionDescription = () => {
    switch (action) {
      case 'change_plan':
        return `Alterar o plano de ${selectedUsers?.length} usuário(s) para ${actionData?.newPlan || '[Selecione um plano]'}`;
      case 'change_status':
        return `Alterar o status de ${selectedUsers?.length} usuário(s) para ${actionData?.newStatus || '[Selecione um status]'}`;
      case 'send_notification':
        return `Enviar notificação para ${selectedUsers?.length} usuário(s)`;
      case 'export_data':
        return `Exportar dados de ${selectedUsers?.length} usuário(s)`;
      case 'delete_users':
        return `EXCLUIR permanentemente ${selectedUsers?.length} usuário(s)`;
      default:
        return '';
    }
  };

  const isActionDestructive = () => {
    return action === 'delete_users';
  };

  const canExecute = () => {
    if (!action || !confirmAction) return false;
    
    switch (action) {
      case 'change_plan':
        return actionData?.newPlan;
      case 'change_status':
        return actionData?.newStatus;
      case 'send_notification':
        return actionData?.template && (actionData?.template !== 'custom' || actionData?.customMessage);
      case 'export_data': case'delete_users':
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Ações em Lote
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Selected Users Info */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Users" size={20} className="text-primary" />
              <span className="font-medium text-foreground">
                {selectedUsers?.length} usuário(s) selecionado(s)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUsers?.slice(0, 5)?.map((user) => (
                <span key={user?.id} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
                  {user?.nome}
                </span>
              ))}
              {selectedUsers?.length > 5 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full border border-border">
                  +{selectedUsers?.length - 5} mais
                </span>
              )}
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-6">
            <Select
              label="Selecione a Ação"
              options={actionOptions}
              value={action}
              onChange={(value) => {
                setAction(value);
                setActionData({});
                setConfirmAction(false);
              }}
              required
            />

            {/* Action-specific inputs */}
            {action === 'change_plan' && (
              <Select
                label="Novo Plano"
                options={planOptions}
                value={actionData?.newPlan || ''}
                onChange={(value) => setActionData(prev => ({ ...prev, newPlan: value }))}
                required
              />
            )}

            {action === 'change_status' && (
              <Select
                label="Novo Status"
                options={statusOptions}
                value={actionData?.newStatus || ''}
                onChange={(value) => setActionData(prev => ({ ...prev, newStatus: value }))}
                required
              />
            )}

            {action === 'send_notification' && (
              <div className="space-y-4">
                <Select
                  label="Template de Notificação"
                  options={notificationTemplates}
                  value={actionData?.template || ''}
                  onChange={(value) => setActionData(prev => ({ ...prev, template: value }))}
                  required
                />
                
                {actionData?.template === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Mensagem Personalizada
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Digite sua mensagem personalizada..."
                      value={actionData?.customMessage || ''}
                      onChange={(e) => setActionData(prev => ({ ...prev, customMessage: e?.target?.value }))}
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action Preview */}
            {action && (
              <div className={`p-4 rounded-lg border ${
                isActionDestructive() 
                  ? 'bg-error/10 border-error/20 text-error' :'bg-primary/10 border-primary/20 text-primary'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Icon 
                    name={isActionDestructive() ? "AlertTriangle" : "Info"} 
                    size={16} 
                  />
                  <span className="font-medium">Prévia da Ação</span>
                </div>
                <p className="text-sm">{getActionDescription()}</p>
              </div>
            )}

            {/* Confirmation */}
            {action && (
              <div className="space-y-3">
                <Checkbox
                  label={`Confirmo que desejo executar esta ação em ${selectedUsers?.length} usuário(s)`}
                  checked={confirmAction}
                  onChange={(e) => setConfirmAction(e?.target?.checked)}
                  required
                />
                
                {isActionDestructive() && (
                  <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon name="AlertTriangle" size={16} className="text-error" />
                      <span className="font-medium text-error">Atenção: Ação Irreversível</span>
                    </div>
                    <p className="text-sm text-error">
                      Esta ação não pode ser desfeita. Os dados dos usuários serão permanentemente removidos do sistema.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant={isActionDestructive() ? "destructive" : "default"}
            onClick={handleExecute}
            disabled={!canExecute() || isLoading}
            loading={isLoading}
            iconName={isActionDestructive() ? "AlertTriangle" : "Play"}
            iconPosition="left"
            iconSize={16}
          >
            {isActionDestructive() ? 'Excluir Usuários' : 'Executar Ação'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsModal;