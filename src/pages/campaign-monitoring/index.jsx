import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campaignService } from '../../services/campaignService';
import { adminService } from '../../services/adminService';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';

import CampaignTable from './components/CampaignTable';
import CampaignFilters from './components/CampaignFilters';
import CampaignStats from './components/CampaignStats';
import CampaignCharts from './components/CampaignCharts';
import CampaignDetailModal from './components/CampaignDetailModal';

const CampaignMonitoring = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: 'todas',
    performance: 'todas',
    dateFrom: '',
    dateTo: '',
    sortBy: 'created_at_desc'
  });

  // Load campaigns data
  useEffect(() => {
    if (!user || authLoading) return;
    
    loadCampaignsData();
  }, [user, authLoading]);

  const loadCampaignsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load campaigns based on user role
      const campaignsData = userProfile?.role === 'admin' ? 
        await adminService?.getAllCampaigns() :
        await campaignService?.getCampaigns();

      setCampaigns(campaignsData || []);
      
      // Calculate stats from campaigns
      const calculatedStats = calculateStats(campaignsData || []);
      setStats(calculatedStats);
      
    } catch (err) {
      setError('Erro ao carregar campanhas: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (campaignsData) => {
    const activeCampaigns = campaignsData?.filter(c => 
      c?.status === 'sending' || c?.status === 'scheduled'
    );
    
    const totalMessages = campaignsData?.reduce((total, campaign) => 
      total + (campaign?.messages_sent || 0), 0
    );
    
    const totalDelivered = campaignsData?.reduce((total, campaign) => 
      total + (campaign?.messages_delivered || 0), 0
    );
    
    const averageDeliveryRate = totalMessages > 0 ? 
      ((totalDelivered / totalMessages) * 100)?.toFixed(1) : 0;

    return {
      totalCampaigns: campaignsData?.length || 0,
      activeCampaigns: activeCampaigns?.length || 0,
      totalMessages,
      averageDeliveryRate: parseFloat(averageDeliveryRate),
      campaignChange: 0, // Could calculate from previous period
      activeChange: 0,
      messageChange: 0,
      deliveryChange: 0
    };
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const unsubscribe = campaignService?.subscribeToCampaignChanges(() => {
      loadCampaignsData();
    });

    return () => {
      unsubscribe?.();
    };
  }, [user]);

  // Filter campaigns based on current filters
  const filteredCampaigns = campaigns?.filter(campaign => {
    if (filters?.search && !campaign?.name?.toLowerCase()?.includes(filters?.search?.toLowerCase())) {
      return false;
    }
    if (filters?.status !== 'todas' && campaign?.status !== filters?.status) {
      return false;
    }
    if (filters?.performance !== 'todas') {
      const deliveryRate = campaign?.total_recipients > 0 ? 
        ((campaign?.messages_delivered || 0) / campaign?.total_recipients) * 100 : 0;
      
      switch (filters?.performance) {
        case 'excelente': return deliveryRate > 90;
        case 'boa': return deliveryRate >= 70 && deliveryRate <= 90;
        case 'regular': return deliveryRate >= 50 && deliveryRate < 70;
        case 'baixa': return deliveryRate < 50;
        default: return true;
      }
    }
    
    // Date filters
    if (filters?.dateFrom) {
      const campaignDate = new Date(campaign?.created_at);
      const fromDate = new Date(filters?.dateFrom);
      if (campaignDate < fromDate) return false;
    }
    
    if (filters?.dateTo) {
      const campaignDate = new Date(campaign?.created_at);
      const toDate = new Date(filters?.dateTo);
      toDate?.setHours(23, 59, 59, 999);
      if (campaignDate > toDate) return false;
    }
    
    return true;
  }) || [];

  // Sort campaigns
  const sortedCampaigns = [...filteredCampaigns]?.sort((a, b) => {
    const [field, direction] = filters?.sortBy?.split('_');
    const multiplier = direction === 'desc' ? -1 : 1;
    
    if (field === 'created_at') {
      return multiplier * (new Date(a?.created_at) - new Date(b?.created_at));
    }
    if (field === 'name') {
      return multiplier * a?.name?.localeCompare(b?.name);
    }
    return multiplier * (a?.[field] - b?.[field]);
  });

  // Transform campaigns for table component
  const transformedCampaigns = sortedCampaigns?.map(campaign => {
    const deliveryRate = campaign?.total_recipients > 0 ? 
      ((campaign?.messages_delivered || 0) / campaign?.total_recipients) * 100 : 0;
    const readRate = campaign?.total_recipients > 0 ? 
      ((campaign?.messages_read || 0) / campaign?.total_recipients) * 100 : 0;

    return {
      id: campaign?.id,
      nome: campaign?.name,
      tipo: getMessageTypeLabel(campaign?.message_type),
      status: campaign?.status,
      totalDestinatarios: campaign?.total_recipients || 0,
      enviadas: campaign?.messages_sent || 0,
      entregues: campaign?.messages_delivered || 0,
      lidas: campaign?.messages_read || 0,
      falharam: campaign?.messages_failed || 0,
      respostas: 0, // This would need to be calculated from conversations
      progresso: campaign?.total_recipients > 0 ? 
        Math.round(((campaign?.messages_sent || 0) / campaign?.total_recipients) * 100) : 0,
      taxaEntrega: Math.round(deliveryRate),
      taxaLeitura: Math.round(readRate),
      taxaResposta: 0, // Would need conversation data
      criadaEm: campaign?.created_at,
      ultimaAtividade: campaign?.updated_at,
      ultimaAcao: getLastAction(campaign)
    };
  });

  const getMessageTypeLabel = (type) => {
    const types = {
      'text': 'Texto',
      'image': 'Imagem', 
      'audio': 'Áudio',
      'document': 'Documento'
    };
    return types?.[type] || 'Texto';
  };

  const getLastAction = (campaign) => {
    switch (campaign?.status) {
      case 'draft': return 'Campanha criada';
      case 'scheduled': return 'Agendada para envio';
      case 'sending': return 'Enviando mensagens';
      case 'completed': return 'Campanha finalizada';
      case 'failed': return 'Erro no envio';
      case 'paused': return 'Campanha pausada';
      default: return 'Status desconhecido';
    }
  };

  // Generate mock chart data from real campaigns (simplified for now)
  const generateChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date?.setDate(date?.getDate() - i);
      return {
        data: date?.toISOString()?.split('T')?.[0],
        entregues: Math.floor(Math.random() * 100) + 70,
        lidas: Math.floor(Math.random() * 80) + 50
      };
    })?.reverse();

    const performanceData = sortedCampaigns?.slice(0, 5)?.map(campaign => {
      const deliveryRate = campaign?.total_recipients > 0 ? 
        ((campaign?.messages_delivered || 0) / campaign?.total_recipients) * 100 : 0;
      return {
        nome: campaign?.name?.substring(0, 15) + (campaign?.name?.length > 15 ? '...' : ''),
        taxaEntrega: Math.round(deliveryRate)
      };
    }) || [];

    const statusDistribution = [
      { name: "Ativas", value: campaigns?.filter(c => c?.status === 'sending')?.length || 0 },
      { name: "Pausadas", value: campaigns?.filter(c => c?.status === 'paused')?.length || 0 },
      { name: "Concluídas", value: campaigns?.filter(c => c?.status === 'completed')?.length || 0 },
      { name: "Com Erro", value: campaigns?.filter(c => c?.status === 'failed')?.length || 0 }
    ];

    return { last7Days, performanceData, statusDistribution };
  };

  const chartData = generateChartData();

  // Campaign actions
  const handlePauseCampaign = async (campaignId) => {
    try {
      await campaignService?.updateCampaign(campaignId, { status: 'paused' });
      loadCampaignsData();
    } catch (err) {
      setError('Erro ao pausar campanha: ' + err?.message);
    }
  };

  const handleResumeCampaign = async (campaignId) => {
    try {
      await campaignService?.updateCampaign(campaignId, { status: 'scheduled' });
      loadCampaignsData();
    } catch (err) {
      setError('Erro ao retomar campanha: ' + err?.message);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta campanha?')) return;
    
    try {
      await campaignService?.deleteCampaign(campaignId);
      loadCampaignsData();
    } catch (err) {
      setError('Erro ao excluir campanha: ' + err?.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCampaigns?.length === 0) {
      alert('Selecione pelo menos uma campanha');
      return;
    }
    
    try {
      switch (action) {
        case 'pause':
          await Promise.all(selectedCampaigns?.map(id => 
            campaignService?.updateCampaign(id, { status: 'paused' })
          ));
          break;
        case 'resume':
          await Promise.all(selectedCampaigns?.map(id => 
            campaignService?.updateCampaign(id, { status: 'scheduled' })
          ));
          break;
        case 'delete':
          if (window.confirm(`Tem certeza que deseja excluir ${selectedCampaigns?.length} campanha(s)?`)) {
            await Promise.all(selectedCampaigns?.map(id => 
              campaignService?.deleteCampaign(id)
            ));
          }
          break;
      }
      setSelectedCampaigns([]);
      loadCampaignsData();
    } catch (err) {
      setError('Erro na ação em lote: ' + err?.message);
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={userProfile?.role}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-112'}`}>
        <Header 
          user={{
            name: userProfile?.full_name || user?.email,
            email: user?.email,
            role: userProfile?.role
          }}
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          notifications={[]}
        />
        
        <main className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-destructive text-sm">{error}</p>
                <button 
                  onClick={() => setError('')}
                  className="mt-2 text-xs text-destructive underline"
                >
                  Fechar
                </button>
              </div>
            )}
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Monitoramento de Campanhas
                </h1>
                <p className="text-muted-foreground">
                  Acompanhe o desempenho das suas campanhas WhatsApp em tempo real
                </p>
              </div>
              
              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                {selectedCampaigns?.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('pause')}
                      iconName="Pause"
                      iconPosition="left"
                    >
                      Pausar ({selectedCampaigns?.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('delete')}
                      iconName="Trash2"
                      iconPosition="left"
                    >
                      Excluir
                    </Button>
                  </div>
                )}
                
                <Button
                  variant="default"
                  onClick={() => navigate('/campaign-creation')}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Nova Campanha
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && <CampaignStats stats={stats} />}

            {/* Charts */}
            <CampaignCharts 
              deliveryData={chartData?.last7Days}
              performanceData={chartData?.performanceData}
              statusDistribution={chartData?.statusDistribution}
            />

            {/* Filters */}
            <CampaignFilters
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={() => setFilters({
                search: '', status: 'todas', performance: 'todas',
                dateFrom: '', dateTo: '', sortBy: 'created_at_desc'
              })}
              onExportData={() => console.log('Export feature would be implemented')}
            />

            {/* Campaign Table */}
            <CampaignTable
              campaigns={transformedCampaigns}
              selectedCampaigns={selectedCampaigns}
              onSelectCampaign={(id) => setSelectedCampaigns(prev => 
                prev?.includes(id) ? prev?.filter(cId => cId !== id) : [...prev, id]
              )}
              onSelectAll={() => setSelectedCampaigns(
                selectedCampaigns?.length === transformedCampaigns?.length ? 
                [] : transformedCampaigns?.map(c => c?.id)
              )}
              onViewDetails={(campaign) => {
                setSelectedCampaign(campaign);
                setShowDetailModal(true);
              }}
              onPauseCampaign={handlePauseCampaign}
              onResumeCampaign={handleResumeCampaign}
              onDuplicateCampaign={(id) => navigate('/campaign-creation', { state: { duplicateFrom: id } })}
              onDeleteCampaign={handleDeleteCampaign}
            />

            {/* Real-time Status */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Dados atualizados em tempo real via Supabase</span>
              <span>•</span>
              <span>Última atualização: {new Date()?.toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </main>
      </div>

      {/* Campaign Detail Modal */}
      <CampaignDetailModal
        campaign={selectedCampaign}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onNavigateToChat={(phoneNumber) => {
          navigate('/live-chat-monitoring', { state: { openChat: phoneNumber } });
          setShowDetailModal(false);
        }}
      />
    </div>
  );
};

export default CampaignMonitoring;