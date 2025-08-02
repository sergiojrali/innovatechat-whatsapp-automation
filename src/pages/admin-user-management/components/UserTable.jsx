import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UserTable = ({ users, onEdit, onSuspend, onDelete, onViewDetails, onSort, sortField, sortDirection }) => {
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

  const SortableHeader = ({ field, children }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          <Icon 
            name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
            size={14} 
          />
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <SortableHeader field="nome">Nome Completo</SortableHeader>
              <SortableHeader field="email">Email</SortableHeader>
              <SortableHeader field="empresa">Empresa</SortableHeader>
              <SortableHeader field="plano">Plano</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <SortableHeader field="dataRegistro">Data Registro</SortableHeader>
              <SortableHeader field="ultimoLogin">Último Login</SortableHeader>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {users?.map((user) => (
              <tr key={user?.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-primary">
                        {user?.nome?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{user?.nome}</div>
                      <div className="text-sm text-muted-foreground">ID: {user?.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">{user?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">{user?.empresa}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPlanColor(user?.plano)}`}>
                    {user?.plano}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user?.status)}`}>
                    {user?.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {formatDate(user?.dataRegistro)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {getLastLoginStatus(user?.ultimoLogin)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails(user)}
                      className="h-8 w-8"
                    >
                      <Icon name="Eye" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(user)}
                      className="h-8 w-8"
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSuspend(user)}
                      className="h-8 w-8"
                    >
                      <Icon name={user?.status === 'ativo' ? 'UserX' : 'UserCheck'} size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(user)}
                      className="h-8 w-8 text-error hover:text-error"
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;