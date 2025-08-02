import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SuccessModal = ({ isOpen, userEmail, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleResendEmail = () => {
    // Mock resend email functionality
    console.log('Reenviando email de verificação para:', userEmail);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-elevation-3 max-w-md w-full p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="CheckCircle" size={40} className="text-success" />
        </div>

        {/* Success Message */}
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Conta Criada com Sucesso!
        </h2>
        
        <p className="text-muted-foreground mb-6">
          Enviamos um email de verificação para:
        </p>
        
        <div className="bg-muted/30 rounded-lg p-4 mb-6">
          <p className="font-medium text-foreground">{userEmail}</p>
        </div>

        {/* Instructions */}
        <div className="text-left bg-primary/5 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center">
            <Icon name="Mail" size={16} className="mr-2" />
            Próximos passos:
          </h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="font-medium text-primary mr-2">1.</span>
              Verifique sua caixa de entrada (e spam)
            </li>
            <li className="flex items-start">
              <span className="font-medium text-primary mr-2">2.</span>
              Clique no link de verificação no email
            </li>
            <li className="flex items-start">
              <span className="font-medium text-primary mr-2">3.</span>
              Faça login na plataforma
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="default"
            fullWidth
            onClick={handleGoToLogin}
            iconName="ArrowRight"
            iconPosition="right"
          >
            Ir para Login
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={handleResendEmail}
            iconName="RefreshCw"
            iconPosition="left"
          >
            Reenviar Email
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Não recebeu o email? Verifique sua pasta de spam ou{' '}
            <button
              onClick={handleResendEmail}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              clique aqui para reenviar
            </button>
          </p>
        </div>

        {/* Support Contact */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">
            Precisa de ajuda?{' '}
            <a
              href="mailto:suporte@innovatechat.com.br"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;