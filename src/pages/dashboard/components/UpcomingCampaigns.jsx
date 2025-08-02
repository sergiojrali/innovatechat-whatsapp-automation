import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UpcomingCampaigns = ({ campaigns = [] }) => {
  const navigate = useNavigate();

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date?.toLocaleDateString('pt-BR'),
      time: date?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-warning/10 text-warning';
      case 'running':
        return 'bg-success/10 text-success';
      case 'paused':
        return 'bg-muted/30 text-muted-foreground';
      default:
        return 'bg-muted/30 text-muted-foreground';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Agendada';
      case 'running':
        return 'Executando';
      case 'paused':
        return 'Pausada';
      default:
        return 'Desconhecido';
    }
  };

  const handleViewCampaign = (campaignId) => {
    navigate(`/campaign-monitoring?id=${campaignId}`);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Campanhas Agendadas</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/campaign-creation')}
          iconName="Plus"
        >
          Nova
        </Button>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {campaigns?.length > 0 ? (
          campaigns?.map((campaign) => {
            const { date, time } = formatDateTime(campaign?.scheduledAt);
            
            return (
              <div key={campaign?.id} className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{campaign?.name}</h4>
                    <p className="text-sm text-muted-foreground">{campaign?.description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign?.status)}`}>
                    {getStatusText(campaign?.status)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4 text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Icon name="Calendar" size={14} />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Icon name="Clock" size={14} />
                      <span>{time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Icon name="Users" size={14} />
                      <span>{campaign?.contactCount} contatos</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewCampaign(campaign?.id)}
                  >
                    Ver
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Icon name="Calendar" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma campanha agendada</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/campaign-creation')}
              iconName="Plus"
            >
              Criar Campanha
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingCampaigns;