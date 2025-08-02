import React from 'react';
import Icon from '../../../components/AppIcon';

const CampaignStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total de Campanhas',
      value: stats?.totalCampaigns,
      icon: 'BarChart3',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: stats?.campaignChange,
      changeType: stats?.campaignChange >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'Campanhas Ativas',
      value: stats?.activeCampaigns,
      icon: 'Play',
      color: 'text-success',
      bgColor: 'bg-success/10',
      change: stats?.activeChange,
      changeType: stats?.activeChange >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'Mensagens Enviadas',
      value: stats?.totalMessages,
      icon: 'Send',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      change: stats?.messageChange,
      changeType: stats?.messageChange >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'Taxa de Entrega Média',
      value: `${stats?.averageDeliveryRate}%`,
      icon: 'Target',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      change: stats?.deliveryChange,
      changeType: stats?.deliveryChange >= 0 ? 'positive' : 'negative'
    }
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000)?.toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000)?.toFixed(1)}K`;
    }
    return new Intl.NumberFormat('pt-BR')?.format(num);
  };

  const getChangeIcon = (changeType) => {
    return changeType === 'positive' ? 'TrendingUp' : 'TrendingDown';
  };

  const getChangeColor = (changeType) => {
    return changeType === 'positive' ? 'text-success' : 'text-error';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statCards?.map((stat, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${stat?.bgColor} flex items-center justify-center`}>
              <Icon name={stat?.icon} size={24} className={stat?.color} />
            </div>
            {stat?.change !== undefined && (
              <div className={`flex items-center space-x-1 ${getChangeColor(stat?.changeType)}`}>
                <Icon name={getChangeIcon(stat?.changeType)} size={16} />
                <span className="text-sm font-medium">
                  {Math.abs(stat?.change)}%
                </span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {typeof stat?.value === 'number' ? formatNumber(stat?.value) : stat?.value}
            </h3>
            <p className="text-sm text-muted-foreground">{stat?.title}</p>
          </div>
          
          {stat?.change !== undefined && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {stat?.changeType === 'positive' ? 'Aumento' : 'Diminuição'} de{' '}
                <span className={`font-medium ${getChangeColor(stat?.changeType)}`}>
                  {Math.abs(stat?.change)}%
                </span>{' '}
                nos últimos 30 dias
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CampaignStats;