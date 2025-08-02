import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const CampaignTable = ({ 
  campaigns, 
  selectedCampaigns, 
  onSelectCampaign, 
  onSelectAll, 
  onViewDetails, 
  onPauseCampaign, 
  onResumeCampaign, 
  onDuplicateCampaign, 
  onDeleteCampaign 
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRowExpansion = (campaignId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded?.has(campaignId)) {
      newExpanded?.delete(campaignId);
    } else {
      newExpanded?.add(campaignId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativa': return 'bg-success text-success-foreground';
      case 'pausada': return 'bg-warning text-warning-foreground';
      case 'concluída': return 'bg-primary text-primary-foreground';
      case 'erro': return 'bg-error text-error-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-primary';
  };

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('pt-BR')?.format(num);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="w-12 p-4">
                <Checkbox
                  checked={selectedCampaigns?.length === campaigns?.length}
                  onChange={onSelectAll}
                  indeterminate={selectedCampaigns?.length > 0 && selectedCampaigns?.length < campaigns?.length}
                />
              </th>
              <th className="text-left p-4 font-semibold text-foreground">Nome da Campanha</th>
              <th className="text-left p-4 font-semibold text-foreground">Status</th>
              <th className="text-left p-4 font-semibold text-foreground">Destinatários</th>
              <th className="text-left p-4 font-semibold text-foreground">Progresso</th>
              <th className="text-left p-4 font-semibold text-foreground">Taxa de Entrega</th>
              <th className="text-left p-4 font-semibold text-foreground">Criada em</th>
              <th className="text-center p-4 font-semibold text-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {campaigns?.map((campaign) => (
              <React.Fragment key={campaign?.id}>
                <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedCampaigns?.includes(campaign?.id)}
                      onChange={() => onSelectCampaign(campaign?.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRowExpansion(campaign?.id)}
                        className="w-6 h-6"
                      >
                        <Icon 
                          name={expandedRows?.has(campaign?.id) ? "ChevronDown" : "ChevronRight"} 
                          size={16} 
                        />
                      </Button>
                      <div>
                        <p className="font-medium text-foreground">{campaign?.nome}</p>
                        <p className="text-sm text-muted-foreground">{campaign?.tipo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign?.status)}`}>
                      {campaign?.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{formatNumber(campaign?.totalDestinatarios)}</p>
                      <p className="text-muted-foreground">
                        {formatNumber(campaign?.enviadas)} enviadas
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium text-foreground">{campaign?.progresso}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(campaign?.progresso)}`}
                          style={{ width: `${campaign?.progresso}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{campaign?.taxaEntrega}%</p>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Icon name="Eye" size={12} />
                        <span>{campaign?.taxaLeitura}% lidas</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-foreground">{formatDate(campaign?.criadaEm)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDetails(campaign)}
                        className="w-8 h-8"
                      >
                        <Icon name="Eye" size={16} />
                      </Button>
                      {campaign?.status === 'ativa' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onPauseCampaign(campaign?.id)}
                          className="w-8 h-8"
                        >
                          <Icon name="Pause" size={16} />
                        </Button>
                      ) : campaign?.status === 'pausada' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onResumeCampaign(campaign?.id)}
                          className="w-8 h-8"
                        >
                          <Icon name="Play" size={16} />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDuplicateCampaign(campaign?.id)}
                        className="w-8 h-8"
                      >
                        <Icon name="Copy" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteCampaign(campaign?.id)}
                        className="w-8 h-8 text-error hover:text-error"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
                
                {expandedRows?.has(campaign?.id) && (
                  <tr className="bg-muted/10">
                    <td colSpan="8" className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Estatísticas de Entrega</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Enviadas:</span>
                              <span className="text-success font-medium">{formatNumber(campaign?.enviadas)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Entregues:</span>
                              <span className="text-primary font-medium">{formatNumber(campaign?.entregues)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Lidas:</span>
                              <span className="text-secondary font-medium">{formatNumber(campaign?.lidas)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Falharam:</span>
                              <span className="text-error font-medium">{formatNumber(campaign?.falharam)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Respostas</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total de respostas:</span>
                              <span className="text-foreground font-medium">{formatNumber(campaign?.respostas)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Taxa de resposta:</span>
                              <span className="text-foreground font-medium">{campaign?.taxaResposta}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Última Atividade</h4>
                          <div className="text-sm">
                            <p className="text-muted-foreground">
                              {formatDate(campaign?.ultimaAtividade)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {campaign?.ultimaAcao}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {campaigns?.length === 0 && (
        <div className="p-12 text-center">
          <Icon name="BarChart3" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma campanha encontrada</h3>
          <p className="text-muted-foreground">
            Crie sua primeira campanha para começar a monitorar os resultados.
          </p>
        </div>
      )}
    </div>
  );
};

export default CampaignTable;