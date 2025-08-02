import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const AgentList = ({ 
  agents, 
  sectors, 
  onUpdateStatus, 
  onDelete, 
  onInvite, 
  loading 
}) => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'suspended':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'pending':
        return 'Pendente';
      case 'suspended':
        return 'Suspenso';
      default:
        return 'Desconhecido';
    }
  };

  const getSectorName = (sectorId) => {
    const sector = sectors.find(s => s.id === sectorId);
    return sector ? sector.name : 'Setor não encontrado';
  };

  const getSectorColor = (sectorId) => {
    const sector = sectors.find(s => s.id === sectorId);
    return sector ? sector.color : '#6B7280';
  };

  const formatLastActivity = (lastActivity) => {
    if (!lastActivity) return 'Nunca';
    
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleStatusChange = async (agentId, newStatus) => {
    await onUpdateStatus(agentId, newStatus);
  };

  const showAgentDetails = (agent) => {
    setSelectedAgent(agent);
    setDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Icon name="Users" size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum atendente encontrado
        </h3>
        <p className="text-muted-foreground mb-4">
          Convide atendentes para começar a gerenciar seu atendimento
        </p>
        <Button onClick={onInvite} iconName="UserPlus" iconPosition="left">
          Convidar Atendente
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              {/* Informações do atendente */}
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Icon name="User" size={24} className="text-muted-foreground" />
                </div>

                {/* Dados principais */}
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      {agent.full_name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                      {getStatusText(agent.status)}
                    </span>
                    {agent.is_online && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">Online</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {agent.email}
                    </span>
                    {agent.phone && (
                      <span className="text-sm text-muted-foreground">
                        {agent.phone}
                      </span>
                    )}
                  </div>

                  {/* Setor */}
                  <div className="flex items-center space-x-2 mt-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getSectorColor(agent.sector_id) }}
                    ></div>
                    <span className="text-sm font-medium text-foreground">
                      {getSectorName(agent.sector_id)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showAgentDetails(agent)}
                  iconName="Eye"
                />
                
                {/* Dropdown de status */}
                <select
                  value={agent.status}
                  onChange={(e) => handleStatusChange(agent.id, e.target.value)}
                  className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(agent.id)}
                  iconName="Trash2"
                  className="text-destructive hover:text-destructive"
                />
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {agent.total_chats_handled || 0}
                </div>
                <div className="text-xs text-muted-foreground">Chats Atendidos</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {agent.max_concurrent_chats}
                </div>
                <div className="text-xs text-muted-foreground">Máx. Simultâneos</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {agent.performance_rating ? agent.performance_rating.toFixed(1) : '0.0'}
                </div>
                <div className="text-xs text-muted-foreground">Avaliação</div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">
                  {formatLastActivity(agent.last_activity_at)}
                </div>
                <div className="text-xs text-muted-foreground">Última Atividade</div>
              </div>
            </div>

            {/* Habilidades */}
            {agent.skills && agent.skills.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-foreground mb-2">Habilidades:</div>
                <div className="flex flex-wrap gap-2">
                  {agent.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de detalhes do atendente */}
      {detailsModalOpen && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Detalhes do Atendente
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedAgent(null);
                }}
                iconName="X"
              />
            </div>

            <div className="space-y-6">
              {/* Informações pessoais */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-3">
                  Informações Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Nome Completo
                    </label>
                    <div className="text-foreground">{selectedAgent.full_name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <div className="text-foreground">{selectedAgent.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Telefone
                    </label>
                    <div className="text-foreground">{selectedAgent.phone || 'Não informado'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAgent.status)}`}>
                      {getStatusText(selectedAgent.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações do setor */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-3">
                  Setor
                </h4>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getSectorColor(selectedAgent.sector_id) }}
                  ></div>
                  <span className="text-foreground font-medium">
                    {getSectorName(selectedAgent.sector_id)}
                  </span>
                </div>
              </div>

              {/* Configurações */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-3">
                  Configurações
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Máximo de Chats Simultâneos
                    </label>
                    <div className="text-foreground">{selectedAgent.max_concurrent_chats}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Status Online
                    </label>
                    <div className="text-foreground">
                      {selectedAgent.is_online ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Estatísticas de performance */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-3">
                  Performance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {selectedAgent.total_chats_handled || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Chats Atendidos</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {selectedAgent.performance_rating ? selectedAgent.performance_rating.toFixed(1) : '0.0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Avaliação Média</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {selectedAgent.average_response_time ? `${Math.floor(selectedAgent.average_response_time / 60)}min` : '0min'}
                    </div>
                    <div className="text-sm text-muted-foreground">Tempo Médio de Resposta</div>
                  </div>
                </div>
              </div>

              {/* Habilidades */}
              {selectedAgent.skills && selectedAgent.skills.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-3">
                    Habilidades
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Datas */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-3">
                  Informações de Data
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Data de Cadastro
                    </label>
                    <div className="text-foreground">
                      {new Date(selectedAgent.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Última Atividade
                    </label>
                    <div className="text-foreground">
                      {formatLastActivity(selectedAgent.last_activity_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedAgent(null);
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgentList;
