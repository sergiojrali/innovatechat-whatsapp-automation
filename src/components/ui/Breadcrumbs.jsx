import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const Breadcrumbs = ({ customBreadcrumbs = null }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Default breadcrumb mapping
  const breadcrumbMap = {
    '/dashboard': [
      { label: 'Dashboard', path: '/dashboard' }
    ],
    '/whats-app-sessions-management': [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Sessões WhatsApp', path: '/whats-app-sessions-management' }
    ],
    '/contact-management': [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Gerenciar Contatos', path: '/contact-management' }
    ],
    '/campaign-creation': [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Campanhas', path: '/campaign-monitoring' },
      { label: 'Criar Campanha', path: '/campaign-creation' }
    ],
    '/campaign-monitoring': [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Monitorar Campanhas', path: '/campaign-monitoring' }
    ],
    '/live-chat-monitoring': [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Chat ao Vivo', path: '/live-chat-monitoring' }
    ],
    '/admin-user-management': [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Administração', path: '/admin-user-management' },
      { label: 'Gerenciar Usuários', path: '/admin-user-management' }
    ],
    '/system-configuration': [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Administração', path: '/system-configuration' },
      { label: 'Configurações', path: '/system-configuration' }
    ]
  };

  // Use custom breadcrumbs if provided, otherwise use default mapping
  const breadcrumbs = customBreadcrumbs || breadcrumbMap?.[location.pathname] || [
    { label: 'Dashboard', path: '/dashboard' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Don't render breadcrumbs if there's only one item or on login/register pages
  if (breadcrumbs?.length <= 1 || ['/login', '/register']?.includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs?.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs?.length - 1;
          const isClickable = breadcrumb?.path && !isLast;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <Icon 
                  name="ChevronRight" 
                  size={16} 
                  className="text-muted-foreground mx-2" 
                />
              )}
              {isClickable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigation(breadcrumb?.path)}
                  className="h-auto p-0 font-normal text-muted-foreground hover:text-foreground transition-colors"
                >
                  {breadcrumb?.label}
                </Button>
              ) : (
                <span className={`${
                  isLast 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground'
                }`}>
                  {breadcrumb?.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;