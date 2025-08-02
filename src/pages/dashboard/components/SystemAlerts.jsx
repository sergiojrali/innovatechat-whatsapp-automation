import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SystemAlerts = ({ alerts = [] }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return 'AlertCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'info':
        return 'Info';
      case 'success':
        return 'CheckCircle';
      default:
        return 'Bell';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error':
        return 'bg-error/10 border-error/20 text-error';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning';
      case 'info':
        return 'bg-primary/10 border-primary/20 text-primary';
      case 'success':
        return 'bg-success/10 border-success/20 text-success';
      default:
        return 'bg-muted/30 border-border text-muted-foreground';
    }
  };

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const visibleAlerts = alerts?.filter(alert => !dismissedAlerts?.has(alert.id));

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Alertas do Sistema</h3>
        <Icon name="Shield" size={20} className="text-muted-foreground" />
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {visibleAlerts?.length > 0 ? (
          visibleAlerts?.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Icon 
                    name={getAlertIcon(alert.type)} 
                    size={20} 
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{alert.title}</h4>
                    <p className="text-sm opacity-90">{alert.message}</p>
                    {alert.action && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 p-0 h-auto text-current hover:text-current"
                        onClick={alert.action?.onClick}
                      >
                        {alert.action?.label}
                      </Button>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDismiss(alert.id)}
                  className="w-6 h-6 text-current hover:text-current opacity-70 hover:opacity-100"
                >
                  <Icon name="X" size={14} />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Icon name="Shield" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum alerta do sistema</p>
            <p className="text-sm text-muted-foreground mt-1">Tudo funcionando perfeitamente!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAlerts;