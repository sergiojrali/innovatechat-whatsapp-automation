import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { agentService } from '../../services/agentService';
import { templateService } from '../../services/templateService';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

import SectorList from './components/SectorList';
import AgentList from './components/AgentList';
import SectorModal from './components/SectorModal';
import AgentInviteModal from './components/AgentInviteModal';
import InvitationList from './components/InvitationList';
import SectorStats from './components/SectorStats';

const AgentManagement = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('sectors');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados dos dados
  const [sectors, setSectors] = useState([]);
  const [agents, setAgents] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Estados dos modais
  const [sectorModalOpen, setSectorModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Filtros
  const [sectorFilter, setSectorFilter] = useState('all');
  const [agentStatusFilter, setAgentStatusFilter] = useState('all');

  const tabs = [
    {
      id: 'sectors',
      label: 'Setores',
      icon: 'Building2',
      description: 'Gerenciar setores e departamentos'
    },
    {
      id: 'agents',
      label: 'Atendentes',
      icon: 'Users',
      description: 'Gerenciar atendentes por setor'
    },
    {
      id: 'invitations',
      label: 'Convites',
      icon: 'Mail',
      description: 'Convites enviados e pendentes'
    },
    {
      id: 'stats',
      label: 'Estatísticas',
      icon: 'BarChart3',
      description: 'Métricas de performance'
    }
  ];

  // Carregar dados iniciais
  useEffect(() => {
    if (!user || authLoading) return;
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [sectorsData, agentsData, invitationsData, templatesData] = await Promise.all([
        agentService.getSectors(user.id),
        agentService.getAgents(),
        agentService.getInvitations(),
        templateService.getBusinessTemplates()
      ]);

      setSectors(sectorsData || []);
      setAgents(agentsData || []);
      setInvitations(invitationsData || []);
      setTemplates(templatesData || []);

    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handlers para setores
  const handleCreateSector = async (sectorData) => {
    try {
      const newSector = await agentService.createSector({
        ...sectorData,
        user_id: user.id
      });
      
      setSectors(prev => [newSector, ...prev]);
      setSectorModalOpen(false);
      setSelectedSector(null);
      
    } catch (err) {
      setError('Erro ao criar setor: ' + err.message);
    }
  };

  const handleUpdateSector = async (sectorData) => {
    try {
      const updatedSector = await agentService.updateSector(selectedSector.id, sectorData);
      
      setSectors(prev => prev.map(s => s.id === selectedSector.id ? updatedSector : s));
      setSectorModalOpen(false);
      setSelectedSector(null);
      
    } catch (err) {
      setError('Erro ao atualizar setor: ' + err.message);
    }
  };

  const handleDeleteSector = async (sectorId) => {
    if (!window.confirm('Tem certeza que deseja excluir este setor?')) return;
    
    try {
      await agentService.deleteSector(sectorId);
      setSectors(prev => prev.filter(s => s.id !== sectorId));
      
    } catch (err) {
      setError('Erro ao excluir setor: ' + err.message);
    }
  };

  const handleApplyTemplate = async (sectorId, templateId) => {
    try {
      await templateService.applyTemplateToSector(templateId, sectorId);
      await loadData(); // Recarregar dados para mostrar mudanças
      
    } catch (err) {
      setError('Erro ao aplicar template: ' + err.message);
    }
  };

  // Handlers para convites
  const handleSendInvite = async (inviteData) => {
    try {
      const invitation = await agentService.createInvitation({
        ...inviteData,
        invited_by: user.id
      });
      
      setInvitations(prev => [invitation, ...prev]);
      setInviteModalOpen(false);
      
    } catch (err) {
      setError('Erro ao enviar convite: ' + err.message);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Tem certeza que deseja cancelar este convite?')) return;
    
    try {
      await agentService.cancelInvitation(invitationId);
      setInvitations(prev => prev.map(inv => 
        inv.id === invitationId ? { ...inv, status: 'cancelled' } : inv
      ));
      
    } catch (err) {
      setError('Erro ao cancelar convite: ' + err.message);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      const updatedInvitation = await agentService.resendInvitation(invitationId);
      setInvitations(prev => prev.map(inv => 
        inv.id === invitationId ? updatedInvitation : inv
      ));
      
    } catch (err) {
      setError('Erro ao reenviar convite: ' + err.message);
    }
  };

  // Handlers para atendentes
  const handleUpdateAgentStatus = async (agentId, status) => {
    try {
      await agentService.updateAgentStatus(agentId, status);
      setAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, status } : agent
      ));
      
    } catch (err) {
      setError('Erro ao atualizar status do atendente: ' + err.message);
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Tem certeza que deseja excluir este atendente?')) return;
    
    try {
      await agentService.deleteAgent(agentId);
      setAgents(prev => prev.filter(a => a.id !== agentId));
      
    } catch (err) {
      setError('Erro ao excluir atendente: ' + err.message);
    }
  };

  // Filtrar dados
  const filteredSectors = sectors.filter(sector => {
    if (sectorFilter === 'all') return true;
    if (sectorFilter === 'active') return sector.is_active;
    if (sectorFilter === 'inactive') return !sector.is_active;
    return true;
  });

  const filteredAgents = agents.filter(agent => {
    let matches = true;
    
    if (sectorFilter !== 'all') {
      matches = matches && agent.sector_id === sectorFilter;
    }
    
    if (agentStatusFilter !== 'all') {
      matches = matches && agent.status === agentStatusFilter;
    }
    
    return matches;
  });

  const filteredInvitations = invitations.filter(invitation => {
    if (sectorFilter === 'all') return true;
    return invitation.sector_id === sectorFilter;
  });

  // Estatísticas gerais
  const stats = {
    totalSectors: sectors.length,
    activeSectors: sectors.filter(s => s.is_active).length,
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    onlineAgents: agents.filter(a => a.is_online).length,
    pendingInvitations: invitations.filter(i => i.status === 'pending').length
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sectors':
        return (
          <SectorList
            sectors={filteredSectors}
            templates={templates}
            onEdit={(sector) => {
              setSelectedSector(sector);
              setSectorModalOpen(true);
            }}
            onDelete={handleDeleteSector}
            onApplyTemplate={handleApplyTemplate}
            loading={loading}
          />
        );
      case 'agents':
        return (
          <AgentList
            agents={filteredAgents}
            sectors={sectors}
            onUpdateStatus={handleUpdateAgentStatus}
            onDelete={handleDeleteAgent}
            onInvite={() => setInviteModalOpen(true)}
            loading={loading}
          />
        );
      case 'invitations':
        return (
          <InvitationList
            invitations={filteredInvitations}
            onCancel={handleCancelInvitation}
            onResend={handleResendInvitation}
            loading={loading}
          />
        );
      case 'stats':
        return (
          <SectorStats
            sectors={sectors}
            agents={agents}
            stats={stats}
          />
        );
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando gestão de atendentes...</p>
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
        
        <main className="pt-16">
          <div className="p-6">
            <Breadcrumbs />

            {/* Cabeçalho da página */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestão de Atendentes</h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie setores, atendentes e convites do sistema
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSector(null);
                    setSectorModalOpen(true);
                  }}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Novo Setor
                </Button>
                <Button
                  onClick={() => setInviteModalOpen(true)}
                  iconName="UserPlus"
                  iconPosition="left"
                >
                  Convidar Atendente
                </Button>
              </div>
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Setores Ativos</p>
                    <p className="text-2xl font-bold text-foreground">{stats.activeSectors}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon name="Building2" size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Atendentes Online</p>
                    <p className="text-2xl font-bold text-foreground">{stats.onlineAgents}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon name="Users" size={24} className="text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Atendentes</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalAgents}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon name="UserCheck" size={24} className="text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Convites Pendentes</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingInvitations}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Icon name="Mail" size={24} className="text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-card rounded-lg border border-border mb-6">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSectorFilter('all');
                      setAgentStatusFilter('all');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Setor
                    </label>
                    <select
                      value={sectorFilter}
                      onChange={(e) => setSectorFilter(e.target.value)}
                      className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="all">Todos os setores</option>
                      <option value="active">Setores ativos</option>
                      <option value="inactive">Setores inativos</option>
                      {sectors.map(sector => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Status do Atendente
                    </label>
                    <select
                      value={agentStatusFilter}
                      onChange={(e) => setAgentStatusFilter(e.target.value)}
                      className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="all">Todos os status</option>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="pending">Pendente</option>
                      <option value="suspended">Suspenso</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={loadData}
                      iconName="RefreshCw"
                      iconPosition="left"
                      className="w-full"
                    >
                      Atualizar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs de conteúdo */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Navegação das tabs */}
              <div className="border-b border-border bg-muted/30">
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'text-primary border-b-2 border-primary bg-background'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon name={tab.icon} size={18} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conteúdo das tabs */}
              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* Modais */}
          <SectorModal
            isOpen={sectorModalOpen}
            onClose={() => {
              setSectorModalOpen(false);
              setSelectedSector(null);
            }}
            onSave={selectedSector ? handleUpdateSector : handleCreateSector}
            sector={selectedSector}
            templates={templates}
          />

          <AgentInviteModal
            isOpen={inviteModalOpen}
            onClose={() => setInviteModalOpen(false)}
            onSave={handleSendInvite}
            sectors={sectors.filter(s => s.is_active)}
          />

          {/* Notificação de erro */}
          {error && (
            <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg max-w-sm">
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => setError('')}
                className="mt-2 text-xs underline"
              >
                Fechar
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AgentManagement;
