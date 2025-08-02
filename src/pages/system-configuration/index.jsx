import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import UserLimitsTab from './components/UserLimitsTab';
import OperationalHoursTab from './components/OperationalHoursTab';
import FeatureControlsTab from './components/FeatureControlsTab';
import BillingConfigTab from './components/BillingConfigTab';
import SystemHealthMonitor from './components/SystemHealthMonitor';

const SystemConfiguration = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('userLimits');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mock system settings
  const [systemSettings, setSystemSettings] = useState({
    userLimits: {
      maxSessionsPerUser: 5,
      maxContactsPerUser: 10000,
      maxCampaignsPerDay: 10,
      maxMessagesPerCampaign: 1000,
      maxFileUploadSize: 10,
      sessionTimeoutMinutes: 30
    },
    operationalHours: {
      timezone: 'America/Sao_Paulo',
      operatingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '08:00',
      endTime: '18:00',
      maintenanceWindow: '02:00-04:00',
      enableWeekendOperations: false,
      weekendStartTime: '09:00',
      weekendEndTime: '17:00',
      enableHolidayRestrictions: true,
      emergencyOverride: false
    },
    featureControls: {
      enableBotAutomation: true,
      maxBotResponseDelay: 5,
      enableFileUploads: true,
      allowedFileTypes: ['image', 'document', 'audio'],
      maxFileSize: 10,
      enableApiAccess: true,
      apiRateLimit: 1000,
      enableWebhooks: true,
      enableChatExport: true,
      enableBulkOperations: true,
      maxBulkOperationSize: 1000,
      enableAdvancedAnalytics: false,
      enableIntegrations: true,
      maintenanceMode: false
    },
    billingConfig: {
      currency: 'BRL',
      basicPlanPrice: 49.90,
      proPlanPrice: 99.90,
      enterprisePlanPrice: 199.90,
      enableFreeTrial: true,
      freeTrialDays: 14,
      paymentMethods: ['credit_card', 'pix', 'bank_slip'],
      enableAutoRenewal: true,
      gracePeriodDays: 7,
      enableProration: true,
      taxRate: 0,
      enableDiscounts: true,
      maxDiscountPercent: 50,
      billingCycle: 'monthly',
      enableInvoiceGeneration: true
    }
  });

  // Mock user data
  const currentUser = {
    name: "Administrador",
    email: "admin@innovatechat.com",
    role: "admin"
  };

  // Mock notifications
  const notifications = [
    {
      title: "Configuração atualizada",
      message: "Limites de usuário foram modificados",
      time: "Há 5 minutos",
      type: "success",
      read: false
    },
    {
      title: "Sistema em manutenção",
      message: "Manutenção programada para hoje às 02:00",
      time: "Há 1 hora",
      type: "warning",
      read: false
    }
  ];

  const tabs = [
    {
      id: 'userLimits',
      label: 'Limites de Usuário',
      icon: 'Users',
      description: 'Configure limites operacionais para usuários'
    },
    {
      id: 'operationalHours',
      label: 'Horários Operacionais',
      icon: 'Clock',
      description: 'Defina horários de funcionamento do sistema'
    },
    {
      id: 'featureControls',
      label: 'Controles de Funcionalidades',
      icon: 'Settings',
      description: 'Habilite ou desabilite funcionalidades'
    },
    {
      id: 'billingConfig',
      label: 'Configuração de Cobrança',
      icon: 'CreditCard',
      description: 'Configure preços e métodos de pagamento'
    },
    {
      id: 'systemHealth',
      label: 'Saúde do Sistema',
      icon: 'Activity',
      description: 'Monitor de performance e status'
    }
  ];

  useEffect(() => {
    // Check for unsaved changes before leaving
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e?.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSaveSettings = async (section, data) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSystemSettings(prev => ({
        ...prev,
        [section]: data
      }));
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Show success notification (in real app, this would be handled by a notification system)
      console.log(`Configurações de ${section} salvas com sucesso`);
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'Você tem alterações não salvas. Deseja continuar sem salvar?'
      );
      if (!confirmLeave) return;
    }
    
    setActiveTab(tabId);
    setHasUnsavedChanges(false);
  };

  const handleExportConfig = () => {
    const configData = {
      exportDate: new Date()?.toISOString(),
      settings: systemSettings
    };
    
    const blob = new Blob([JSON.stringify(configData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-config-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'userLimits':
        return (
          <UserLimitsTab
            settings={systemSettings?.userLimits}
            onSave={handleSaveSettings}
            isLoading={isLoading}
          />
        );
      case 'operationalHours':
        return (
          <OperationalHoursTab
            settings={systemSettings?.operationalHours}
            onSave={handleSaveSettings}
            isLoading={isLoading}
          />
        );
      case 'featureControls':
        return (
          <FeatureControlsTab
            settings={systemSettings?.featureControls}
            onSave={handleSaveSettings}
            isLoading={isLoading}
          />
        );
      case 'billingConfig':
        return (
          <BillingConfigTab
            settings={systemSettings?.billingConfig}
            onSave={handleSaveSettings}
            isLoading={isLoading}
          />
        );
      case 'systemHealth':
        return <SystemHealthMonitor />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={currentUser?.role}
      />
      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-112'
      }`}>
        {/* Header */}
        <Header
          user={currentUser}
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          notifications={notifications}
        />

        {/* Page Content */}
        <main className="pt-16 min-h-screen">
          <div className="p-6">
            {/* Breadcrumbs */}
            <Breadcrumbs />

            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Configurações do Sistema</h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie configurações globais da plataforma InnovateChat
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {lastSaved && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Última alteração:</p>
                    <p className="text-sm font-medium text-foreground">
                      {lastSaved?.toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={handleExportConfig}
                  iconName="Download"
                  iconPosition="left"
                >
                  Exportar Config
                </Button>
              </div>
            </div>

            {/* Configuration Tabs */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-border bg-muted/30">
                <div className="flex overflow-x-auto">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => handleTabChange(tab?.id)}
                      className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab?.id
                          ? 'text-primary border-b-2 border-primary bg-background' :'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon name={tab?.icon} size={18} />
                      <span>{tab?.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>

            {/* System Status Footer */}
            <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-foreground">Sistema Operacional</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Versão 2.1.0 • Última atualização: 02/08/2025
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Icon name="Shield" size={16} />
                  <span>Configurações protegidas por criptografia</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemConfiguration;