import React, { useState, useEffect } from 'react';
import { agentService } from '../../../services/agentService';
import { queueService } from '../../../services/queueService';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SectorStats = ({ sectors, agents, stats }) => {
  const [selectedSector, setSelectedSector] = useState(null);
  const [sectorStats, setSectorStats] = useState({});
  const [queueStats, setQueueStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    if (sectors.length > 0) {
      loadAllStats();
    }
  }, [sectors, dateRange]);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const sectorStatsPromises = sectors.map(async (sector) => {
        const [sectorStat, queueStat] = await Promise.all([
          agentService.getSectorStats(sector.id, startDate.toISOString(), endDate),
          queueService.getQueueStats(sector.id)
        ]);
        return { sectorId: sector.id, sectorStat, queueStat };
      });

      const results = await Promise.all(sectorStatsPromises);
      
      const newSectorStats = {};
      const newQueueStats = {};
      
      results.forEach(({ sectorId, sectorStat, queueStat }) => {
        newSectorStats[sectorId] = sectorStat;
        newQueueStats[sectorId] = queueStat;
      });

      setSectorStats(newSectorStats);
      setQueueStats(newQueueStats);

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectorAgents = (sectorId) => {
    return agents.filter(agent => agent.sector_id === sectorId);
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  const getPerformanceColor = (value, thresholds) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.average) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderOverallStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total de Setores</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalSectors}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon name="Building2" size={24} className="text-blue-600" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-sm text-green-600">
            {stats.activeSectors} ativos
          </span>
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total de Atendentes</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalAgents}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Icon name="Users" size={24} className="text-green-600" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-sm text-green-600">
            {stats.activeAgents} ativos
          </span>
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Atendentes Online</p>
            <p className="text-2xl font-bold text-foreground">{stats.onlineAgents}</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Icon name="UserCheck" size={24} className="text-purple-600" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600">Online agora</span>
          </div>
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Convites Pendentes</p>
            <p className="text-2xl font-bold text-foreground">{stats.pendingInvitations}</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <Icon name="Mail" size={24} className="text-orange-600" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-sm text-muted-foreground">
            Aguardando resposta
          </span>
        </div>
      </div>
    </div>
  );

  const renderSectorDetails = () => (
    <div className="space-y-6">
      {sectors.map((sector) => {
        const sectorAgents = getSectorAgents(sector.id);
        const sectorStat = sectorStats[sector.id] || {};
        const queueStat = queueStats[sector.id] || {};
        const onlineAgents = sectorAgents.filter(a => a.is_online).length;

        return (
          <div key={sector.id} className="bg-background border border-border rounded-lg p-6">
            {/* Cabeçalho do setor */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: sector.color }}
                ></div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {sector.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sector.description || 'Sem descrição'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sector.is_active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}>
                  {sector.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            {/* Estatísticas do setor */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {sectorAgents.length}
                </div>
                <div className="text-sm text-muted-foreground">Atendentes</div>
                <div className="text-xs text-green-600 mt-1">
                  {onlineAgents} online
                </div>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {sectorStat.totalChats || 0}
                </div>
                <div className="text-sm text-muted-foreground">Chats Atendidos</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Últimos {dateRange === '1d' ? '1 dia' : dateRange === '7d' ? '7 dias' : dateRange === '30d' ? '30 dias' : '90 dias'}
                </div>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className={`text-2xl font-bold ${getPerformanceColor(sectorStat.averageResolutionTime || 0, { good: 15, average: 30 })}`}>
                  {formatTime(sectorStat.averageResolutionTime || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Tempo Médio</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Resolução
                </div>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className={`text-2xl font-bold ${getPerformanceColor(sectorStat.averageSatisfaction || 0, { good: 4, average: 3 })}`}>
                  {(sectorStat.averageSatisfaction || 0).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Satisfação</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Média (1-5)
                </div>
              </div>
            </div>

            {/* Fila de atendimento */}
            {queueStat.totalInQueue > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-3">Fila de Atendimento</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-lg font-bold text-yellow-800">
                      {queueStat.totalInQueue}
                    </div>
                    <div className="text-xs text-yellow-600">Na fila</div>
                  </div>

                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-lg font-bold text-red-800">
                      {queueStat.highPriority}
                    </div>
                    <div className="text-xs text-red-600">Alta prioridade</div>
                  </div>

                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-lg font-bold text-blue-800">
                      {formatTime(queueStat.averageWaitTime || 0)}
                    </div>
                    <div className="text-xs text-blue-600">Tempo médio</div>
                  </div>

                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-lg font-bold text-orange-800">
                      {formatTime(queueStat.longestWaitTime || 0)}
                    </div>
                    <div className="text-xs text-orange-600">Maior espera</div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de atendentes */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Atendentes</h4>
              {sectorAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sectorAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <Icon name="User" size={16} className="text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {agent.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {agent.total_chats_handled || 0} chats
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {agent.is_online && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          agent.status === 'active' ? 'text-green-600 bg-green-100' :
                          agent.status === 'inactive' ? 'text-gray-600 bg-gray-100' :
                          agent.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                          'text-red-600 bg-red-100'
                        }`}>
                          {agent.status === 'active' ? 'Ativo' :
                           agent.status === 'inactive' ? 'Inativo' :
                           agent.status === 'pending' ? 'Pendente' : 'Suspenso'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Icon name="Users" size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum atendente neste setor</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* Controles */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Estatísticas dos Setores
        </h2>
        
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
          >
            <option value="1d">Último dia</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllStats}
            loading={loading}
            iconName="RefreshCw"
            iconPosition="left"
          >
            Atualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Estatísticas gerais */}
          {renderOverallStats()}
          
          {/* Detalhes por setor */}
          {sectors.length > 0 ? (
            renderSectorDetails()
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Icon name="BarChart3" size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum setor encontrado
              </h3>
              <p className="text-muted-foreground">
                Crie setores para visualizar estatísticas detalhadas
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SectorStats;
