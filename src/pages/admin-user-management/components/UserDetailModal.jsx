import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UserDetailModal = ({ user, isOpen, onClose, onEdit, onSuspend, onDelete }) => {
  if (!isOpen || !user) return null;

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
    return new Date(dateString)?.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary">
                {user?.nome?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{user?.nome}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user?.status)}`}>
                  {user?.status}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPlanColor(user?.plano)}`}>
                  {user?.plano}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Account Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Informações da Conta</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID do Usuário:</span>
                    <span className="font-medium text-foreground">{user?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome Completo:</span>
                    <span className="font-medium text-foreground">{user?.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-foreground">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Empresa:</span>
                    <span className="font-medium text-foreground">{user?.empresa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="font-medium text-foreground">{user?.telefone || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Registro:</span>
                    <span className="font-medium text-foreground">{formatDate(user?.dataRegistro)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Último Login:</span>
                    <span className="font-medium text-foreground">
                      {user?.ultimoLogin ? formatDate(user?.ultimoLogin) : 'Nunca logou'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Detalhes da Assinatura</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plano Atual:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPlanColor(user?.plano)}`}>
                      {user?.plano}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Mensal:</span>
                    <span className="font-medium text-foreground">{formatCurrency(user?.valorMensal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próximo Pagamento:</span>
                    <span className="font-medium text-foreground">
                      {user?.proximoPagamento ? formatDate(user?.proximoPagamento) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status Pagamento:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      user?.statusPagamento === 'em_dia' ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'
                    }`}>
                      {user?.statusPagamento === 'em_dia' ? 'Em Dia' : 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Estatísticas de Uso</h3>
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Sessões WhatsApp</span>
                      <span className="text-lg font-semibold text-foreground">{user?.sessoesAtivas || 0}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.min((user?.sessoesAtivas || 0) / 5 * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Limite: 5 sessões</div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Campanhas Ativas</span>
                      <span className="text-lg font-semibold text-foreground">{user?.campanhasAtivas || 0}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-secondary h-2 rounded-full" 
                        style={{ width: `${Math.min((user?.campanhasAtivas || 0) / 10 * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Limite: 10 campanhas</div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Contatos</span>
                      <span className="text-lg font-semibold text-foreground">{user?.totalContatos || 0}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full" 
                        style={{ width: `${Math.min((user?.totalContatos || 0) / 1000 * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Limite: 1.000 contatos</div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Mensagens Enviadas (Mês)</span>
                      <span className="text-lg font-semibold text-foreground">{user?.mensagensEnviadas || 0}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-success h-2 rounded-full" 
                        style={{ width: `${Math.min((user?.mensagensEnviadas || 0) / 5000 * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Limite: 5.000 mensagens</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Atividade Recente</h3>
                <div className="space-y-3">
                  {user?.atividadeRecente?.map((atividade, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon name={atividade?.icon} size={16} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{atividade?.acao}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(atividade?.data)}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma atividade recente
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => {
              onEdit(user);
              onClose();
            }}
            iconName="Edit"
            iconPosition="left"
            iconSize={16}
          >
            Editar Usuário
          </Button>
          <Button
            variant={user?.status === 'ativo' ? 'warning' : 'success'}
            onClick={() => {
              onSuspend(user);
              onClose();
            }}
            iconName={user?.status === 'ativo' ? 'UserX' : 'UserCheck'}
            iconPosition="left"
            iconSize={16}
          >
            {user?.status === 'ativo' ? 'Suspender' : 'Ativar'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onDelete(user);
              onClose();
            }}
            iconName="Trash2"
            iconPosition="left"
            iconSize={16}
          >
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;