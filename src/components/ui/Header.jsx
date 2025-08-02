import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const Header = ({ user = null, onMenuToggle = () => {}, notifications = [] }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const location = useLocation();

  const unreadNotifications = notifications?.filter(n => !n?.read)?.length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef?.current && !userMenuRef?.current?.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef?.current && !notificationRef?.current?.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  const handleNotificationToggle = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    // Logout logic here
    console.log('Logout clicked');
  };

  const handleProfileClick = () => {
    // Profile navigation logic
    console.log('Profile clicked');
  };

  const handleSettingsClick = () => {
    // Settings navigation logic
    console.log('Settings clicked');
  };

  const getPageTitle = () => {
    const pathTitles = {
      '/dashboard': 'Dashboard',
      '/whats-app-sessions-management': 'Sessões WhatsApp',
      '/contact-management': 'Gerenciar Contatos',
      '/campaign-creation': 'Criar Campanha',
      '/campaign-monitoring': 'Monitorar Campanhas',
      '/live-chat-monitoring': 'Chat ao Vivo',
      '/admin-user-management': 'Gerenciar Usuários',
      '/system-configuration': 'Configurações do Sistema'
    };
    return pathTitles?.[location.pathname] || 'InnovateChat';
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-112 h-16 bg-card border-b border-border z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Mobile Menu Toggle */}
        <div className="flex items-center lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="mr-3"
          >
            <Icon name="Menu" size={20} />
          </Button>
        </div>

        {/* Page Title */}
        <div className="flex-1 lg:flex-none">
          <h1 className="text-lg font-semibold text-foreground">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2">
          {/* System Status Indicator */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-success/10 rounded-full">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm text-success font-medium">Online</span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotificationToggle}
              className="relative"
            >
              <Icon name="Bell" size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-error-foreground text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-elevation-3 z-50">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-popover-foreground">Notificações</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications?.length > 0 ? (
                    notifications?.slice(0, 5)?.map((notification, index) => (
                      <div
                        key={index}
                        className={`p-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${
                          !notification?.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification?.type === 'success' ? 'bg-success' :
                            notification?.type === 'warning' ? 'bg-warning' :
                            notification?.type === 'error' ? 'bg-error' : 'bg-primary'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm text-popover-foreground font-medium">
                              {notification?.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification?.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification?.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Icon name="Bell" size={32} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhuma notificação</p>
                    </div>
                  )}
                </div>
                {notifications?.length > 5 && (
                  <div className="p-3 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full">
                      Ver todas as notificações
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              onClick={handleUserMenuToggle}
              className="flex items-center space-x-2 px-3 py-2"
            >
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium text-sm">
                {user?.name ? user?.name?.charAt(0)?.toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground">
                {user?.name || 'Usuário'}
              </span>
              <Icon name="ChevronDown" size={16} className="text-muted-foreground" />
            </Button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-elevation-3 z-50">
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-popover-foreground">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.email || 'usuario@exemplo.com'}
                  </p>
                </div>
                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full px-3 py-2 text-sm text-popover-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Icon name="User" size={16} className="mr-3" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={handleSettingsClick}
                    className="flex items-center w-full px-3 py-2 text-sm text-popover-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Icon name="Settings" size={16} className="mr-3" />
                    Configurações
                  </button>
                </div>
                <div className="border-t border-border py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                  >
                    <Icon name="LogOut" size={16} className="mr-3" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;