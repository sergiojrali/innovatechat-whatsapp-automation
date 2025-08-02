import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SessionStatusWidget = ({ sessions = [] }) => {
  const [refreshingSession, setRefreshingSession] = useState(null);

  const handleRefreshQR = async (sessionId) => {
    setRefreshingSession(sessionId);
    // Simulate QR refresh
    setTimeout(() => {
      setRefreshingSession(null);
    }, 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-success';
      case 'disconnected':
        return 'text-error';
      case 'connecting':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return 'CheckCircle';
      case 'disconnected':
        return 'XCircle';
      case 'connecting':
        return 'Clock';
      default:
        return 'Circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'connecting':
        return 'Conectando';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Sessões WhatsApp</h3>
        <Button variant="outline" size="sm" iconName="Plus">
          Nova Sessão
        </Button>
      </div>
      <div className="space-y-4">
        {sessions?.length > 0 ? (
          sessions?.map((session) => (
            <div key={session?.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  session?.status === 'connected' ? 'bg-success animate-pulse' : 
                  session?.status === 'connecting' ? 'bg-warning animate-pulse' : 'bg-error'
                }`}></div>
                <div>
                  <p className="font-medium text-foreground">{session?.name}</p>
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name={getStatusIcon(session?.status)} 
                      size={14} 
                      className={getStatusColor(session?.status)} 
                    />
                    <span className={`text-sm ${getStatusColor(session?.status)}`}>
                      {getStatusText(session?.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {session?.status === 'disconnected' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRefreshQR(session?.id)}
                    loading={refreshingSession === session?.id}
                    iconName="RefreshCw"
                  >
                    Conectar
                  </Button>
                )}
                <Button variant="ghost" size="icon">
                  <Icon name="Settings" size={16} />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Icon name="MessageSquare" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma sessão WhatsApp configurada</p>
            <Button variant="outline" iconName="Plus">
              Conectar WhatsApp
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionStatusWidget;