import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const DeleteConfirmModal = ({ isOpen, onClose, session, onConfirm }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const requiredText = 'EXCLUIR';
  const canDelete = confirmText === requiredText;

  const handleConfirm = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      await onConfirm(session?.id);
      onClose();
      setConfirmText('');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
            <Icon name="AlertTriangle" size={24} className="text-error" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Excluir Sessão</h2>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        {/* Warning Content */}
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-error/5 border border-error/20 rounded-lg">
            <h3 className="font-semibold text-error mb-2">⚠️ Atenção!</h3>
            <p className="text-sm text-foreground">
              Você está prestes a excluir permanentemente a sessão WhatsApp:
            </p>
            <div className="mt-3 p-3 bg-card rounded border">
              <p className="font-medium text-foreground">{session?.name || session?.phoneNumber}</p>
              <p className="text-sm text-muted-foreground">{session?.phoneNumber}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">O que será perdido:</p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-center space-x-2">
                <Icon name="X" size={14} className="text-error" />
                <span>Todas as configurações de bot</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="X" size={14} className="text-error" />
                <span>Histórico de mensagens automáticas</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="X" size={14} className="text-error" />
                <span>Palavras-chave configuradas</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="X" size={14} className="text-error" />
                <span>Estatísticas e relatórios</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Nota:</strong> A conexão WhatsApp será desconectada automaticamente, 
              mas você poderá reconectar a mesma conta posteriormente se desejar.
            </p>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <Input
            label={`Para confirmar, digite "${requiredText}" abaixo:`}
            type="text"
            placeholder={requiredText}
            value={confirmText}
            onChange={(e) => setConfirmText(e?.target?.value?.toUpperCase())}
            error={confirmText && !canDelete ? `Digite exatamente "${requiredText}"` : ''}
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="flex-1"
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            loading={isDeleting}
            disabled={!canDelete}
            iconName="Trash2"
            iconPosition="left"
            className="flex-1"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir Sessão'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;