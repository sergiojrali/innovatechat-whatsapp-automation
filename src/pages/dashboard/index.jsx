import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/adminService';
import { campaignService } from '../../services/campaignService';
import { contactService } from '../../services/contactService';
import { whatsappService } from '../../services/whatsappService';
import { chatService } from '../../services/chatService';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import MetricCard from './components/MetricCard';
import QuickActionCard from './components/QuickActionCard';
import SessionStatusWidget from './components/SessionStatusWidget';
import ActivityFeed from './components/ActivityFeed';
import UpcomingCampaigns from './components/UpcomingCampaigns';
import PerformanceChart from './components/PerformanceChart';


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    sessions: [],
    activities: [],
    upcomingCampaigns: [],
    conversations: []
  });
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  // Load dashboard data
  useEffect(() => {
    if (!user || authLoading) return;
    
    loadDashboardData();
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [
        stats,
        sessions,
        campaigns,
        conversations
      ] = await Promise.all([
        userProfile?.role === 'admin' ? adminService?.getDashboardStats() : loadUserStats(),
        whatsappService?.getSessions(),
        campaignService?.getCampaigns(),
        chatService?.getConversations()
      ]);

      // Get recent activities from audit logs if admin
      let activities = [];
      if (userProfile?.role === 'admin') {
        const auditLogs = await adminService?.getAuditLogs(5);
        activities = auditLogs?.map(log => ({
          type: log?.resource_type?.toLowerCase() || 'system',
          title: `${log?.action} - ${log?.resource_type}`,
          description: `Ação realizada por ${log?.user_profiles?.full_name || 'Sistema'}`,
          timestamp: new Date(log?.created_at),
          status: 'success'
        })) || [];
      }

      // Get upcoming campaigns (scheduled)
      const upcomingCampaigns = campaigns?.filter(c => 
        c?.status === 'scheduled' && 
        c?.scheduled_at && 
        new Date(c?.scheduled_at) > new Date()
      )?.slice(0, 3);

      // Generate notifications from recent data
      const newNotifications = generateNotifications(sessions, campaigns, conversations);

      setDashboardData({
        stats,
        sessions: sessions || [],
        activities,
        upcomingCampaigns: upcomingCampaigns || [],
        conversations: conversations?.slice(0, 5) || []
      });
      
      setNotifications(newNotifications);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const [campaigns, contacts, sessions] = await Promise.all([
        campaignService?.getCampaigns(),
        contactService?.getContacts(),
        whatsappService?.getSessions()
      ]);

      const today = new Date()?.toISOString()?.split('T')?.[0];
      const todayMessages = campaigns?.reduce((total, campaign) => 
        total + (campaign?.messages_sent || 0), 0
      );

      return {
        totalUsers: 1, // Current user
        activeSessions: sessions?.filter(s => s?.status === 'connected')?.length || 0,
        totalSessions: sessions?.length || 0,
        totalCampaigns: campaigns?.length || 0,
        todayMessages,
        totalContacts: contacts?.length || 0
      };
    } catch (error) {
      return {
        totalUsers: 0,
        activeSessions: 0,
        totalSessions: 0,
        totalCampaigns: 0,
        todayMessages: 0,
        totalContacts: 0
      };
    }
  };

  const generateNotifications = (sessions, campaigns, conversations) => {
    const notifications = [];
    
    // Check for disconnected sessions
    const disconnectedSessions = sessions?.filter(s => s?.status === 'disconnected');
    if (disconnectedSessions?.length > 0) {
      notifications?.push({
        title: "Sessões desconectadas",
        message: `${disconnectedSessions?.length} sessão(ões) WhatsApp desconectada(s)`,
        time: "Agora",
        type: "warning",
        read: false
      });
    }

    // Check for completed campaigns
    const recentCompletedCampaigns = campaigns?.filter(c => 
      c?.status === 'completed' && 
      new Date(c?.completed_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    if (recentCompletedCampaigns?.length > 0) {
      notifications?.push({
        title: "Campanhas finalizadas",
        message: `${recentCompletedCampaigns?.length} campanha(s) finalizada(s) recentemente`,
        time: "Hoje",
        type: "success",
        read: false
      });
    }

    // Check for unread messages
    const unreadCount = conversations?.reduce((total, conv) => total + (conv?.unread_count || 0), 0);
    if (unreadCount > 0) {
      notifications?.push({
        title: "Novas mensagens",
        message: `${unreadCount} mensagem(ns) não lida(s)`,
        time: "Recente",
        type: "info",
        read: false
      });
    }

    return notifications?.slice(0, 3);
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to session changes
    const unsubscribeSessions = whatsappService?.subscribeToSessionChanges(() => {
      loadDashboardData();
    });

    // Subscribe to campaign changes  
    const unsubscribeCampaigns = campaignService?.subscribeToCampaignChanges(() => {
      loadDashboardData();
    });

    // Subscribe to conversation changes
    const unsubscribeConversations = chatService?.subscribeToConversationChanges(() => {
      loadDashboardData();
    });

    return () => {
      unsubscribeSessions?.();
      unsubscribeCampaigns?.();
      unsubscribeConversations?.();
    };
  }, [user]);

  // Generate metrics from real data
  const metrics = [
    {
      title: "Sessões Ativas",
      value: dashboardData?.stats?.activeSessions?.toString() || "0",
      icon: "Smartphone",
      trend: "up",
      trendValue: "+0",
      color: "success"
    },
    {
      title: "Campanhas Ativas",
      value: dashboardData?.stats?.totalCampaigns?.toString() || "0",
      icon: "Send",
      trend: "up", 
      trendValue: "+0",
      color: "primary"
    },
    {
      title: "Mensagens Hoje",
      value: dashboardData?.stats?.todayMessages?.toString() || "0",
      icon: "MessageCircle",
      trend: "up",
      trendValue: "+0",
      color: "secondary"
    },
    {
      title: userProfile?.role === 'admin' ? "Total de Usuários" : "Total de Contatos",
      value: userProfile?.role === 'admin' ? 
        dashboardData?.stats?.totalUsers?.toString() || "0" : dashboardData?.stats?.totalContacts?.toString() ||"0",
      icon: "Users",
      trend: "up",
      trendValue: "+0", 
      color: "warning"
    }
  ];

  // Quick actions based on user role
  const quickActions = userProfile?.role === 'admin' ? [
    {
      title: "Gerenciar Usuários",
      description: "Administrar contas de usuários do sistema",
      icon: "UserCog",
      route: "/admin-user-management",
      color: "primary"
    },
    {
      title: "Configurações do Sistema",
      description: "Configurar parâmetros globais do sistema",
      icon: "Settings",
      route: "/system-configuration",
      color: "secondary"
    },
    {
      title: "Monitorar Campanhas",
      description: "Visualizar todas as campanhas do sistema",
      icon: "BarChart",
      route: "/campaign-monitoring",
      color: "success"
    }
  ] : [
    {
      title: "Nova Campanha",
      description: "Criar e configurar uma nova campanha de mensagens",
      icon: "Plus",
      route: "/campaign-creation",
      color: "primary"
    },
    {
      title: "Conectar WhatsApp",
      description: "Adicionar nova sessão WhatsApp Business",
      icon: "Smartphone",
      route: "/whats-app-sessions-management",
      color: "success"
    },
    {
      title: "Importar Contatos",
      description: "Importar lista de contatos via CSV/Excel",
      icon: "Upload",
      route: "/contact-management",
      color: "secondary"
    }
  ];

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            <p className="font-semibold">Erro ao carregar dashboard</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        userRole={userProfile?.role}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-112'}`}>
        <Header 
          user={{
            name: userProfile?.full_name || user?.email,
            email: user?.email,
            role: userProfile?.role
          }}
          onMenuToggle={handleSidebarToggle}
          notifications={notifications}
        />
        
        <main className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Bem-vindo, {userProfile?.full_name || user?.email?.split('@')?.[0]}!
              </h1>
              <p className="text-muted-foreground">
                {userProfile?.role === 'admin' ? 'Monitore todo o sistema e gerencie usuários.': 'Gerencie suas campanhas WhatsApp e monitore o desempenho em tempo real.'
                }
              </p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics?.map((metric, index) => (
                <MetricCard
                  key={index}
                  title={metric?.title}
                  value={metric?.value}
                  icon={metric?.icon}
                  trend={metric?.trend}
                  trendValue={metric?.trendValue}
                  color={metric?.color}
                  loading={loading}
                />
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {quickActions?.map((action, index) => (
                <QuickActionCard
                  key={index}
                  title={action?.title}
                  description={action?.description}
                  icon={action?.icon}
                  route={action?.route}
                  color={action?.color}
                />
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Left Column - Sessions and Performance */}
              <div className="lg:col-span-2 space-y-6">
                <SessionStatusWidget sessions={dashboardData?.sessions} />
                <PerformanceChart />
              </div>

              {/* Right Column - Activities and Campaigns */}
              <div className="space-y-6">
                <ActivityFeed activities={dashboardData?.activities} />
                <UpcomingCampaigns campaigns={dashboardData?.upcomingCampaigns} />
              </div>
            </div>

            {/* System Status */}
            <div className="mb-8">
              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Status do Sistema</h3>
                    <p className="text-muted-foreground">Conectado ao Supabase • Dados em tempo real</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="text-sm text-success">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;