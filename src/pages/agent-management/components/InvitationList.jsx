import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const InvitationList = ({ invitations, onCancel, onResend, loading }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceito';
      case 'expired':
        return 'Expirado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'Clock';
      case 'accepted':
        return 'CheckCircle';
      case 'expired':
        return 'XCircle';
      case 'cancelled':
        return 'Ban';
      default:
        return 'HelpCircle';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  const getDaysUntilExpiry = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Icon name="Mail" size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum convite encontrado
        </h3>
        <p className="text-muted-foreground">
          Os convites enviados aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div key={invitation.id} className="bg-background border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            {/* Informações do convite */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Icon name="User" size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {invitation.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {invitation.email}
                  </p>
                </div>
              </div>

              {/* Setor */}
              <div className="flex items-center space-x-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: invitation.sectors?.color || '#6B7280' }}
                ></div>
                <span className="text-sm font-medium text-foreground">
                  {invitation.sectors?.name || 'Setor não encontrado'}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2 mb-3">
                <Icon 
                  name={getStatusIcon(invitation.status)} 
                  size={16} 
                  className={getStatusColor(invitation.status).split(' ')[0]} 
                />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                  {getStatusText(invitation.status)}
                </span>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Enviado em:</span>
                  <br />
                  {formatDate(invitation.created_at)}
                </div>
                
                <div>
                  <span className="font-medium">
                    {invitation.status === 'accepted' ? 'Aceito em:' : 'Expira em:'}
                  </span>
                  <br />
                  {invitation.status === 'accepted' && invitation.accepted_at
                    ? formatDate(invitation.accepted_at)
                    : formatDate(invitation.expires_at)
                  }
                </div>
              </div>

              {/* Aviso de expiração */}
              {invitation.status === 'pending' && (
                <div className="mt-3">
                  {isExpired(invitation.expires_at) ? (
                    <div className="flex items-center space-x-2 text-red-600">
                      <Icon name="AlertTriangle" size={16} />
                      <span className="text-sm font-medium">Convite expirado</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <Icon name="Clock" size={16} />
                      <span className="text-sm">
                        Expira em {getDaysUntilExpiry(invitation.expires_at)} dia(s)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Convidado por */}
              {invitation.user_profiles && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium">Convidado por:</span> {invitation.user_profiles.full_name}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center space-x-2 ml-4">
              {invitation.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResend(invitation.id)}
                    iconName="RefreshCw"
                    title="Reenviar convite"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancel(invitation.id)}
                    iconName="X"
                    className="text-destructive hover:text-destructive"
                    title="Cancelar convite"
                  />
                </>
              )}
              
              {invitation.status === 'expired' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResend(invitation.id)}
                  iconName="RefreshCw"
                  title="Reenviar convite"
                >
                  Reenviar
                </Button>
              )}

              {invitation.status === 'accepted' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <Icon name="CheckCircle" size={16} />
                  <span className="text-sm font-medium">Aceito</span>
                </div>
              )}

              {invitation.status === 'cancelled' && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Icon name="Ban" size={16} />
                  <span className="text-sm font-medium">Cancelado</span>
                </div>
              )}
            </div>
          </div>

          {/* Link do convite (apenas para pendentes) */}
          {invitation.status === 'pending' && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">Link do convite:</span>
                  <div className="text-xs text-muted-foreground mt-1">
                    {`${window.location.origin}/agent-invitation/${invitation.invitation_token}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/agent-invitation/${invitation.invitation_token}`
                    );
                  }}
                  iconName="Copy"
                  title="Copiar link"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InvitationList;
