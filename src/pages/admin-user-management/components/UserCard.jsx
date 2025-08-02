import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UserCard = ({ user, onEdit, onSuspend, onDelete, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo':
        return 'bg-success/10 text-success border-success/20';
      case 'suspenso':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'inativo':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'Premium':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'Pro':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Básico':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('pt-BR');
  };

  const getLastLoginStatus = (lastLogin) => {
    if (!lastLogin) return 'Nunca logou';
    const daysDiff = Math.floor((new Date() - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) return 'Hoje';
    if (daysDiff === 1) return 'Ontem';
    if (daysDiff <= 7) return `${daysDiff} dias atrás`;
    return formatDate(lastLogin);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-elevation-2 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {user?.nome?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{user?.nome}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user?.status)}`}>
            {user?.status}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewDetails(user)}
            className="h-8 w-8"
          >
            <Icon name="Eye" size={16} />
          </Button>
        </div>
      </div>
      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Empresa:</span>
          <span className="text-sm font-medium text-foreground">{user?.empresa}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Plano:</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPlanColor(user?.plano)}`}>
            {user?.plano}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Registro:</span>
          <span className="text-sm font-medium text-foreground">{formatDate(user?.dataRegistro)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Último Login:</span>
          <span className="text-sm font-medium text-foreground">{getLastLoginStatus(user?.ultimoLogin)}</span>
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center space-x-2 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(user)}
          iconName="Edit"
          iconPosition="left"
          iconSize={14}
          className="flex-1"
        >
          Editar
        </Button>
        <Button
          variant={user?.status === 'ativo' ? 'warning' : 'success'}
          size="sm"
          onClick={() => onSuspend(user)}
          iconName={user?.status === 'ativo' ? 'UserX' : 'UserCheck'}
          iconPosition="left"
          iconSize={14}
          className="flex-1"
        >
          {user?.status === 'ativo' ? 'Suspender' : 'Ativar'}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(user)}
          className="h-8 w-8"
        >
          <Icon name="Trash2" size={14} />
        </Button>
      </div>
    </div>
  );
};

export default UserCard;