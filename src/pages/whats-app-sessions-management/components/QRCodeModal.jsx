import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { whatsappService } from '../../../services/whatsappService';

const QRCodeModal = ({ isOpen, onClose, session, onConnected }) => {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('generating'); // generating, waiting, connecting, connected, error, expired
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [error, setError] = useState('');
  const [connectionDetails, setConnectionDetails] = useState(null);

  // Timer for QR code expiration
  useEffect(() => {
    if (!isOpen || status !== 'waiting') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, status]);

  // Load QR code when modal opens
  useEffect(() => {
    if (isOpen && session?.id) {
      loadQRCode();
    }
  }, [isOpen, session?.id]);

  // Subscribe to session status changes
  useEffect(() => {
    if (!isOpen || !session?.id) return;

    const unsubscribe = whatsappService?.subscribeToSessionStatus(session?.id, (newStatus) => {
      setStatus(newStatus === 'connected' ? 'connected' : 
              newStatus === 'connecting' ? 'connecting' :
              newStatus === 'error' ? 'error' : 'waiting');
              
      if (newStatus === 'connected') {
        loadConnectionDetails();
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [isOpen, session?.id]);

  const loadQRCode = async () => {
    try {
      setStatus('generating');
      setError('');
      setTimeLeft(300); // Reset timer
      
      // If session already has QR code, use it
      if (session?.qr_code) {
        setQrCode(session?.qr_code);
        setStatus('waiting');
        return;
      }

      // Connect session to generate new QR code
      const result = await whatsappService?.connectSession(session?.id);
      
      if (result?.qrCode) {
        setQrCode(result?.qrCode);
        setStatus('waiting');
      } else {
        throw new Error('Não foi possível gerar o código QR');
      }
    } catch (err) {
      setError(err?.message || 'Erro ao gerar código QR');
      setStatus('error');
    }
  };

  const loadConnectionDetails = async () => {
    try {
      const sessionData = await whatsappService?.getSessionById(session?.id);
      setConnectionDetails({
        phone: sessionData?.phone_number,
        connectedAt: sessionData?.last_connected_at,
        deviceInfo: sessionData?.client_data?.device_info
      });
    } catch (err) {
      console.error('Error loading connection details:', err);
    }
  };

  const handleRetry = () => {
    loadQRCode();
  };

  const handleClose = () => {
    if (status === 'connected') {
      onConnected?.();
    }
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'generating':
        return {
          title: 'Gerando Código QR',
          description: 'Preparando conexão com WhatsApp Web...',
          color: 'text-warning',
          icon: 'Loader'
        };
      case 'waiting':
        return {
          title: 'Aguardando Conexão',
          description: 'Escaneie o código QR com seu WhatsApp',
          color: 'text-primary',
          icon: 'Smartphone'
        };
      case 'connecting':
        return {
          title: 'Conectando',
          description: 'Estabelecendo conexão com WhatsApp...',
          color: 'text-warning',
          icon: 'Loader'
        };
      case 'connected':
        return {
          title: 'Conectado com Sucesso!',
          description: 'Sua sessão WhatsApp está ativa',
          color: 'text-success',
          icon: 'CheckCircle'
        };
      case 'error':
        return {
          title: 'Erro na Conexão',
          description: 'Não foi possível conectar ao WhatsApp',
          color: 'text-destructive',
          icon: 'AlertTriangle'
        };
      case 'expired':
        return {
          title: 'Código QR Expirado',
          description: 'Gere um novo código para tentar novamente',
          color: 'text-muted-foreground',
          icon: 'Clock'
        };
      default:
        return {
          title: 'Status Desconhecido',
          description: '',
          color: 'text-muted-foreground',
          icon: 'HelpCircle'
        };
    }
  };

  if (!isOpen) return null;

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              status === 'connected' ? 'bg-success/10' :
              status === 'error' ? 'bg-destructive/10' :
              status === 'expired'? 'bg-muted/10' : 'bg-primary/10'
            }`}>
              <Icon 
                name={statusInfo?.icon} 
                size={24} 
                className={`${statusInfo?.color} ${
                  (status === 'generating' || status === 'connecting') ? 'animate-spin' : ''
                }`} 
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {statusInfo?.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {session?.session_name}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* QR Code Display */}
          {(status === 'waiting' || status === 'expired') && qrCode && (
            <div className="space-y-4">
              <div className={`mx-auto w-64 h-64 bg-white p-4 rounded-lg border-2 ${
                status === 'expired' ? 'border-muted opacity-50' : 'border-border'
              }`}>
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              {status === 'waiting' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {statusInfo?.description}
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <Icon name="Clock" size={16} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Expira em: <span className="font-mono text-foreground">{formatTime(timeLeft)}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {(status === 'generating' || status === 'connecting') && (
            <div className="space-y-4">
              <div className="mx-auto w-64 h-64 bg-muted/10 rounded-lg border-2 border-dashed border-muted flex items-center justify-center">
                <div className="text-center">
                  <Icon name="Loader" size={48} className="text-muted-foreground animate-spin mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">{statusInfo?.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'connected' && (
            <div className="space-y-4">
              <div className="mx-auto w-64 h-64 bg-success/5 rounded-lg border-2 border-success/20 flex items-center justify-center">
                <div className="text-center">
                  <Icon name="CheckCircle" size={64} className="text-success mx-auto mb-4" />
                  <p className="text-lg font-semibold text-success mb-2">Conectado!</p>
                  <p className="text-sm text-muted-foreground">{statusInfo?.description}</p>
                </div>
              </div>

              {connectionDetails && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-4 text-left">
                  <h4 className="font-semibold text-foreground mb-2">Detalhes da Conexão</h4>
                  <div className="space-y-1 text-sm">
                    {connectionDetails?.phone && (
                      <p><span className="text-muted-foreground">Telefone:</span> {connectionDetails?.phone}</p>
                    )}
                    {connectionDetails?.connectedAt && (
                      <p><span className="text-muted-foreground">Conectado em:</span> {
                        new Date(connectionDetails?.connectedAt)?.toLocaleString('pt-BR')
                      }</p>
                    )}
                    <p><span className="text-muted-foreground">Plataforma:</span> WhatsApp Web</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="mx-auto w-64 h-64 bg-destructive/5 rounded-lg border-2 border-destructive/20 flex items-center justify-center">
                <div className="text-center">
                  <Icon name="AlertTriangle" size={64} className="text-destructive mx-auto mb-4" />
                  <p className="text-lg font-semibold text-destructive mb-2">Erro na Conexão</p>
                  <p className="text-sm text-muted-foreground">{statusInfo?.description}</p>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-left">
                  <h4 className="font-semibold text-destructive mb-2">Detalhes do Erro</h4>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {status === 'waiting' && (
            <div className="bg-muted/10 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-foreground mb-2">Como conectar:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Abra o WhatsApp no seu celular</li>
                <li>Toque em "Mais opções" (⋮) ou "Configurações"</li>
                <li>Toque em "Dispositivos conectados"</li>
                <li>Toque em "Conectar um dispositivo"</li>
                <li>Aponte a câmera do seu celular para este código QR</li>
              </ol>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          {(status === 'error' || status === 'expired') && (
            <Button
              variant="outline"
              onClick={handleRetry}
              iconName="RefreshCw"
              iconPosition="left"
              className="flex-1"
            >
              Tentar Novamente
            </Button>
          )}
          
          <Button
            variant={status === 'connected' ? 'default' : 'ghost'}
            onClick={handleClose}
            className="flex-1"
          >
            {status === 'connected' ? 'Concluir' : 'Cancelar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;