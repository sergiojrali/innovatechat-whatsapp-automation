import React from 'react';
import Icon from '../../../components/AppIcon';

const ContactStats = ({ stats }) => {
  const statItems = [
    {
      label: 'Total de Contatos',
      value: stats?.total,
      icon: 'Users',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Contatos Ativos',
      value: stats?.active,
      icon: 'UserCheck',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'Com Email',
      value: stats?.withEmail,
      icon: 'Mail',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      label: 'Com Telefone',
      value: stats?.withPhone,
      icon: 'Phone',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      label: 'Importados Hoje',
      value: stats?.importedToday,
      icon: 'Calendar',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'Empresas Únicas',
      value: stats?.uniqueCompanies,
      icon: 'Building',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/30'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statItems?.map((item, index) => (
        <div key={index} className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg ${item?.bgColor} flex items-center justify-center`}>
              <Icon name={item?.icon} size={20} className={item?.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-foreground">
                {item?.value?.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {item?.label}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactStats;