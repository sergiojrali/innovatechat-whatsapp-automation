import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { whatsappService } from '../../../services/whatsappService';

const SessionCard = ({ 
  session, 
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onConnect, 
  onDisconnect,
  showUserInfo = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localSession, setLocalSession] = useState(session);
  const [stats, setStats] = useState(null);

  // Update local session when prop changes
  useEffect(() => {
    setLocalSession(session);
  }, [session]);

  // Load session stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const sessionStats = await whatsappService?.getSessionStats(session?.id);
        setStats(sessionStats);
      } catch (error) {
        console.error('Error loading session stats:', error);
      }
    };

    if (session?.id) {
      loadStats();
    }
  }, [session?.id]);

  // Subscribe to status changes for this specific session
  useEffect(() => {
    if (!session?.id) return;

    const unsubscribe = whatsappService?.subscribeToSessionStatus(session?.id, (newStatus) => {
      setLocalSession(prev => ({
        ...prev,
        status: newStatus
      }));
    });

    return () => {
      unsubscribe?.();
    };
  }, [session?.id]);

  const handleConnect = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onConnect?.(session?.id);
    } catch (error) {
      console.error('Error connecting session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onDisconnect?.(session?.id);
    } catch (error) {
      console.error('Error disconnecting session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onDelete?.(session);
    } catch (error) {
      console.error('Error deleting session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(session);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-success bg-success/10 border-success/20';
      case 'connecting':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'disconnected':
        return 'text-muted-foreground bg-muted/10 border-border';
      case 'error':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'Nunca';
    
    try {
      const now = new Date();
      const activity = new Date(timestamp);
      const diffInMinutes = Math.floor((now - activity) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Agora mesmo';
      if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
      return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    } catch (error) {
      return 'Inválido';
    }
  };

  // Get message stats from session or loaded stats
  const messageStats = stats?.message_stats || localSession?.message_stats || { sent: 0, received: 0, failed: 0 };
  const messagesToday = messageStats?.sent || 0;
  const messagesReceived = messageStats?.received || 0;

  return (
    <div className={`bg-card border rounded-lg p-6 hover:shadow-elevation-2 transition-all duration-200 ${
      isSelected ? 'border-primary shadow-elevation-1' : 'border-border'
    }`}>
      {/* Header with selection checkbox */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Selection checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(session?.id)}
            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
          />
          
          <div className="relative">
            <Image
              src={localSession?.phone_number ? 
                `https://api.dicebear.com/7.x/initials/svg?seed=${localSession?.phone_number}` :
                `https://api.dicebear.com/7.x/initials/svg?seed=${localSession?.session_name}`
              }
              alt={`Perfil ${localSession?.session_name}`}
              className="w-12 h-12 rounded-full object-cover bg-muted"
            />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
              localSession?.status === 'connected' ? 'bg-success' : 
              localSession?.status === 'connecting' ? 'bg-warning animate-pulse' : 
              localSession?.status === 'error' ? 'bg-destructive' : 'bg-muted'
            }`} />
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {localSession?.session_name || 'Sessão sem nome'}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {localSession?.phone_number || 'Não conectado'}
            </p>
            {showUserInfo && localSession?.user_profiles && (
              <p className="text-xs text-muted-foreground truncate">
                Por: {localSession?.user_profiles?.full_name}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(localSession?.status)}`}>
            {getStatusText(localSession?.status)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </div>

      {/* Connection Error Display */}
      {localSession?.connection_error && (
        <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="AlertTriangle" size={16} className="text-destructive flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-destructive">Erro de Conexão</p>
              <p className="text-xs text-muted-foreground truncate" title={localSession?.connection_error}>
                {localSession?.connection_error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-2xl font-bold text-foreground">{messagesToday}</p>
          <p className="text-xs text-muted-foreground">Enviadas hoje</p>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-2xl font-bold text-foreground">{messagesReceived}</p>
          <p className="text-xs text-muted-foreground">Recebidas</p>
        </div>
      </div>

      {/* Session Configuration Info */}
      {localSession?.session_config?.auto_reply && (
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            <Icon name="Bot" size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Resposta Automática</span>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            Ativo
          </span>
        </div>
      )}

      {/* Last Activity */}
      <div className="flex items-center space-x-2 mb-4 text-sm text-muted-foreground">
        <Icon name="Clock" size={14} />
        <span>Última atividade: {formatLastActivity(localSession?.last_connected_at)}</span>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {localSession?.status === 'connected' ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={isLoading}
              iconName="Settings"
              iconPosition="left"
              className="flex-1"
            >
              Configurar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={isLoading}
              loading={isLoading}
              iconName="Unplug"
              iconPosition="left"
              className="flex-1"
            >
              Desconectar
            </Button>
          </>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleConnect}
            disabled={isLoading || localSession?.status === 'connecting'}
            loading={isLoading || localSession?.status === 'connecting'}
            iconName="Smartphone"
            iconPosition="left"
            className="w-full"
          >
            {localSession?.status === 'connecting' ? 'Conectando...' : 'Conectar'}
          </Button>
        )}
      </div>

      {/* Auto-reconnect indicator */}
      {localSession?.auto_reconnect && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-muted-foreground">
          <Icon name="RefreshCw" size={12} />
          <span>Reconexão automática ativa</span>
        </div>
      )}
    </div>
  );
};

export default SessionCard;