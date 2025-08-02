import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar",
  variant = "default",
  isLoading = false,
  user = null
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: 'AlertTriangle',
          iconColor: 'text-error',
          bgColor: 'bg-error/10',
          borderColor: 'border-error/20',
          buttonVariant: 'destructive'
        };
      case 'warning':
        return {
          icon: 'AlertCircle',
          iconColor: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          buttonVariant: 'warning'
        };
      case 'success':
        return {
          icon: 'CheckCircle',
          iconColor: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          buttonVariant: 'success'
        };
      default:
        return {
          icon: 'HelpCircle',
          iconColor: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          buttonVariant: 'default'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isLoading}
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`flex items-start space-x-4 p-4 rounded-lg ${styles?.bgColor} border ${styles?.borderColor} mb-6`}>
            <Icon name={styles?.icon} size={24} className={`flex-shrink-0 ${styles?.iconColor}`} />
            <div className="flex-1">
              <p className="text-foreground">{message}</p>
              
              {/* User details if provided */}
              {user && (
                <div className="mt-3 p-3 bg-card/50 rounded border border-border/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {user?.nome?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user?.nome}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">{user?.empresa}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional warnings for destructive actions */}
          {variant === 'destructive' && (
            <div className="bg-error/5 border border-error/10 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="AlertTriangle" size={16} className="text-error" />
                <span className="font-medium text-error">Atenção</span>
              </div>
              <ul className="text-sm text-error space-y-1">
                <li>• Esta ação não pode ser desfeita</li>
                <li>• Todos os dados do usuário serão removidos</li>
                <li>• Campanhas e sessões associadas serão encerradas</li>
                <li>• Histórico de conversas será perdido</li>
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={styles?.buttonVariant}
            onClick={onConfirm}
            loading={isLoading}
            iconName={variant === 'destructive' ? 'Trash2' : 'Check'}
            iconPosition="left"
            iconSize={16}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;