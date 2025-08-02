import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const Sidebar = ({ isCollapsed = false, onToggle = () => {}, userRole = 'user' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionStatus, setSessionStatus] = useState('connected');
  const [activeCampaigns, setActiveCampaigns] = useState(3);
  const [liveChats, setLiveChats] = useState(7);

  // Navigation items with role-based access
  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      role: 'all'
    },
    {
      label: 'Sessões WhatsApp',
      path: '/whatsapp-sessions',
      icon: 'MessageSquare',
      role: 'all',
      badge: sessionStatus === 'connected' ? 'online' : 'offline'
    },
    {
      label: 'Contatos',
      path: '/contacts',
      icon: 'Users',
      role: 'all'
    },
    {
      label: 'Criar Campanha',
      path: '/campaigns/create',
      icon: 'Plus',
      role: 'all'
    },
    {
      label: 'Monitorar Campanhas',
      path: '/campaigns/monitor',
      icon: 'BarChart3',
      role: 'all',
      badge: activeCampaigns > 0 ? activeCampaigns?.toString() : null
    },
    {
      label: 'Chat ao Vivo',
      path: '/chat',
      icon: 'MessageCircle',
      role: 'all',
      badge: liveChats > 0 ? liveChats?.toString() : null
    },
    {
      label: 'Gestão de Atendentes',
      path: '/agents',
      icon: 'Users',
      role: 'all'
    },
    {
      label: 'Configuração de IA',
      path: '/ai-config',
      icon: 'Bot',
      role: 'all'
    },
    {
      label: 'Gerenciar Usuários',
      path: '/admin/users',
      icon: 'UserCog',
      role: 'admin'
    },
    {
      label: 'Configurações',
      path: '/admin/settings',
      icon: 'Settings',
      role: 'admin'
    }
  ];

  // Filter navigation items based on user role
  const filteredNavigation = navigationItems?.filter(item => 
    item?.role === 'all' || item?.role === userRole
  );

  // Group navigation items
  const coreOperations = filteredNavigation?.filter(item => 
    ['Dashboard', 'Sessões WhatsApp', 'Contatos']?.includes(item?.label)
  );
  
  const campaigns = filteredNavigation?.filter(item => 
    ['Criar Campanha', 'Monitorar Campanhas']?.includes(item?.label)
  );
  
  const monitoring = filteredNavigation?.filter(item => 
    ['Chat ao Vivo', 'Gestão de Atendentes']?.includes(item?.label)
  );

  const aiAndAutomation = filteredNavigation?.filter(item => 
    item?.label === 'Configuração de IA'
  );
  
  const administration = filteredNavigation?.filter(item => 
    ['Gerenciar Usuários', 'Configurações']?.includes(item?.label)
  );

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getBadgeColor = (badge, type = 'default') => {
    if (badge === 'online') return 'bg-success text-success-foreground';
    if (badge === 'offline') return 'bg-error text-error-foreground';
    if (type === 'campaign') return 'bg-accent text-accent-foreground';
    if (type === 'chat') return 'bg-secondary text-secondary-foreground';
    return 'bg-primary text-primary-foreground';
  };

  const NavItem = ({ item, showBadge = true }) => (
    <button
      onClick={() => handleNavigation(item?.path)}
      className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
        isActive(item?.path)
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
    >
      <Icon 
        name={item?.icon} 
        size={20} 
        className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
      />
      {!isCollapsed && (
        <>
          <span className="font-medium flex-1">{item?.label}</span>
          {showBadge && item?.badge && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              getBadgeColor(
                item?.badge, 
                item?.label?.includes('Campanha') ? 'campaign' : 
                item?.label?.includes('Chat') ? 'chat' : 'default'
              )
            }`}>
              {item?.badge}
            </span>
          )}
        </>
      )}
    </button>
  );

  const SectionHeader = ({ title }) => (
    !isCollapsed && (
      <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
    )
  );

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-card border-r border-border z-50 transition-all duration-300 ${
        isCollapsed ? 'w-16 lg:w-16' : 'w-112 lg:w-112'
      } ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
        
        {/* Logo Section */}
        <div className="flex items-center h-16 px-6 border-b border-border">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="MessageSquare" size={20} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">InnovateChat</h1>
                <p className="text-xs text-muted-foreground">WhatsApp Automation</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <Icon name="MessageSquare" size={20} className="text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
          
          {/* Core Operations */}
          <div className="space-y-1">
            <SectionHeader title="Principal" />
            {coreOperations?.map((item) => (
              <NavItem key={item?.path} item={item} />
            ))}
          </div>

          {/* Campaigns */}
          {campaigns?.length > 0 && (
            <div className="space-y-1">
              <SectionHeader title="Campanhas" />
              {campaigns?.map((item) => (
                <NavItem key={item?.path} item={item} />
              ))}
            </div>
          )}

          {/* Monitoring */}
          {monitoring?.length > 0 && (
            <div className="space-y-1">
              <SectionHeader title="Atendimento" />
              {monitoring?.map((item) => (
                <NavItem key={item?.path} item={item} />
              ))}
            </div>
          )}

          {/* AI and Automation */}
          {aiAndAutomation?.length > 0 && (
            <div className="space-y-1">
              <SectionHeader title="IA e Automação" />
              {aiAndAutomation?.map((item) => (
                <NavItem key={item?.path} item={item} />
              ))}
            </div>
          )}

          {/* Administration */}
          {administration?.length > 0 && (
            <div className="space-y-1">
              <SectionHeader title="Administração" />
              {administration?.map((item) => (
                <NavItem key={item?.path} item={item} />
              ))}
            </div>
          )}
        </nav>

        {/* Collapse Toggle */}
        <div className="hidden lg:block p-3 border-t border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-full"
          >
            <Icon 
              name={isCollapsed ? "ChevronRight" : "ChevronLeft"} 
              size={20} 
            />
          </Button>
        </div>

        {/* Connection Status */}
        {!isCollapsed && (
          <div className="p-3 border-t border-border">
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                sessionStatus === 'connected' ? 'bg-success animate-pulse' : 'bg-error'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {sessionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                </p>
                <p className="text-xs text-muted-foreground">
                  WhatsApp Business API
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;