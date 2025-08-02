import React from 'react';
import Icon from '../../../components/AppIcon';

const ActivityFeed = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'campaign':
        return 'Send';
      case 'message':
        return 'MessageCircle';
      case 'contact':
        return 'UserPlus';
      case 'session':
        return 'Smartphone';
      case 'system':
        return 'Settings';
      default:
        return 'Bell';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'campaign':
        return 'text-primary bg-primary/10';
      case 'message':
        return 'text-success bg-success/10';
      case 'contact':
        return 'text-secondary bg-secondary/10';
      case 'session':
        return 'text-warning bg-warning/10';
      case 'system':
        return 'text-muted-foreground bg-muted/30';
      default:
        return 'text-muted-foreground bg-muted/30';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date?.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Atividades Recentes</h3>
        <Icon name="Clock" size={20} className="text-muted-foreground" />
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities?.length > 0 ? (
          activities?.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity?.type)}`}>
                <Icon name={getActivityIcon(activity?.type)} size={16} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">{activity?.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity?.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTime(activity?.timestamp)}</p>
              </div>
              
              {activity?.status && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity?.status === 'success' ? 'bg-success/10 text-success' :
                  activity?.status === 'error' ? 'bg-error/10 text-error' :
                  activity?.status === 'pending'? 'bg-warning/10 text-warning' : 'bg-muted/30 text-muted-foreground'
                }`}>
                  {activity?.status === 'success' ? 'Sucesso' :
                   activity?.status === 'error' ? 'Erro' :
                   activity?.status === 'pending' ? 'Pendente' : 'N/A'}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Icon name="Activity" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma atividade recente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;