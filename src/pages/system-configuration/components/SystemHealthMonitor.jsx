import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SystemHealthMonitor = () => {
  const [systemStatus, setSystemStatus] = useState({
    server: { status: 'healthy', responseTime: 45, uptime: '99.9%' },
    database: { status: 'healthy', connections: 23, maxConnections: 100 },
    whatsappApi: { status: 'healthy', activeSessions: 156, totalSessions: 200 },
    storage: { status: 'warning', usedSpace: 78, totalSpace: 100 },
    memory: { status: 'healthy', usage: 45, total: 100 },
    cpu: { status: 'healthy', usage: 32, cores: 8 }
  });

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setSystemStatus(prev => ({
          ...prev,
          server: {
            ...prev?.server,
            responseTime: Math.floor(Math.random() * 100) + 20
          },
          database: {
            ...prev?.database,
            connections: Math.floor(Math.random() * 50) + 10
          },
          whatsappApi: {
            ...prev?.whatsappApi,
            activeSessions: Math.floor(Math.random() * 50) + 120
          },
          memory: {
            ...prev?.memory,
            usage: Math.floor(Math.random() * 30) + 35
          },
          cpu: {
            ...prev?.cpu,
            usage: Math.floor(Math.random() * 40) + 20
          }
        }));
        setLastUpdate(new Date());
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': return 'XCircle';
      default: return 'Circle';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'healthy': return 'bg-success/10 border-success/20';
      case 'warning': return 'bg-warning/10 border-warning/20';
      case 'error': return 'bg-error/10 border-error/20';
      default: return 'bg-muted/10 border-border';
    }
  };

  const StatusCard = ({ title, icon, status, children }) => (
    <div className={`p-4 rounded-lg border ${getStatusBg(status)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon name={icon} size={18} className={getStatusColor(status)} />
          <h4 className="font-medium text-foreground">{title}</h4>
        </div>
        <Icon 
          name={getStatusIcon(status)} 
          size={16} 
          className={getStatusColor(status)} 
        />
      </div>
      {children}
    </div>
  );

  const ProgressBar = ({ value, max, label, unit = '%' }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}{unit} / {max}{unit}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            (value / max) * 100 > 80 ? 'bg-error' :
            (value / max) * 100 > 60 ? 'bg-warning' : 'bg-success'
          }`}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Monitor de Saúde do Sistema</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento em tempo real dos componentes do sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Última atualização:</p>
            <p className="text-sm font-medium">{lastUpdate?.toLocaleTimeString('pt-BR')}</p>
          </div>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            iconName={autoRefresh ? "Pause" : "Play"}
            iconPosition="left"
          >
            {autoRefresh ? 'Pausar' : 'Iniciar'}
          </Button>
        </div>
      </div>
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Server Status */}
        <StatusCard title="Servidor" icon="Server" status={systemStatus?.server?.status}>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tempo de resposta</span>
              <span className="font-medium">{systemStatus?.server?.responseTime}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">{systemStatus?.server?.uptime}</span>
            </div>
          </div>
        </StatusCard>

        {/* Database Status */}
        <StatusCard title="Banco de Dados" icon="Database" status={systemStatus?.database?.status}>
          <ProgressBar
            value={systemStatus?.database?.connections}
            max={systemStatus?.database?.maxConnections}
            label="Conexões ativas"
            unit=""
          />
        </StatusCard>

        {/* WhatsApp API Status */}
        <StatusCard title="WhatsApp API" icon="MessageSquare" status={systemStatus?.whatsappApi?.status}>
          <ProgressBar
            value={systemStatus?.whatsappApi?.activeSessions}
            max={systemStatus?.whatsappApi?.totalSessions}
            label="Sessões ativas"
            unit=""
          />
        </StatusCard>

        {/* Storage Status */}
        <StatusCard title="Armazenamento" icon="HardDrive" status={systemStatus?.storage?.status}>
          <ProgressBar
            value={systemStatus?.storage?.usedSpace}
            max={systemStatus?.storage?.totalSpace}
            label="Espaço utilizado"
            unit="GB"
          />
        </StatusCard>

        {/* Memory Status */}
        <StatusCard title="Memória RAM" icon="Cpu" status={systemStatus?.memory?.status}>
          <ProgressBar
            value={systemStatus?.memory?.usage}
            max={systemStatus?.memory?.total}
            label="Uso de memória"
            unit="GB"
          />
        </StatusCard>

        {/* CPU Status */}
        <StatusCard title="Processador" icon="Zap" status={systemStatus?.cpu?.status}>
          <div className="space-y-3">
            <ProgressBar
              value={systemStatus?.cpu?.usage}
              max={100}
              label="Uso da CPU"
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Núcleos</span>
              <span className="font-medium">{systemStatus?.cpu?.cores}</span>
            </div>
          </div>
        </StatusCard>
      </div>
      {/* Integration Status */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-foreground mb-4 flex items-center">
          <Icon name="Plug" size={18} className="mr-2 text-primary" />
          Status das Integrações
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
            <div>
              <p className="font-medium text-foreground">WhatsApp Business API</p>
              <p className="text-sm text-success">Conectado</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <div>
              <p className="font-medium text-foreground">Sistema de Pagamento</p>
              <p className="text-sm text-success">Operacional</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border">
            <div className="w-3 h-3 bg-warning rounded-full"></div>
            <div>
              <p className="font-medium text-foreground">Serviço de Email</p>
              <p className="text-sm text-warning">Lentidão</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <div>
              <p className="font-medium text-foreground">CDN</p>
              <p className="text-sm text-success">Ativo</p>
            </div>
          </div>
        </div>
      </div>
      {/* Recent Events */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-foreground mb-4 flex items-center">
          <Icon name="Activity" size={18} className="mr-2 text-secondary" />
          Eventos Recentes
        </h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-card rounded-lg border">
            <Icon name="CheckCircle" size={16} className="text-success mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Sistema reiniciado com sucesso</p>
              <p className="text-xs text-muted-foreground">Há 2 horas</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-card rounded-lg border">
            <Icon name="AlertTriangle" size={16} className="text-warning mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Alto uso de armazenamento detectado</p>
              <p className="text-xs text-muted-foreground">Há 4 horas</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-card rounded-lg border">
            <Icon name="Info" size={16} className="text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Backup automático concluído</p>
              <p className="text-xs text-muted-foreground">Há 6 horas</p>
            </div>
          </div>
        </div>
      </div>
      {/* System Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          iconName="Download"
          iconPosition="left"
        >
          Exportar Relatório
        </Button>
        <Button
          variant="outline"
          iconName="RefreshCw"
          iconPosition="left"
        >
          Atualizar Status
        </Button>
        <Button
          variant="default"
          iconName="Settings"
          iconPosition="left"
        >
          Configurar Alertas
        </Button>
      </div>
    </div>
  );
};

export default SystemHealthMonitor;