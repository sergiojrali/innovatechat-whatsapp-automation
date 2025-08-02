const os = require('os');
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class SystemMonitor {
  constructor(supabase, whatsappManager) {
    this.supabase = supabase;
    this.whatsappManager = whatsappManager;
    this.metrics = {
      startTime: Date.now(),
      requests: 0,
      errors: 0,
      whatsappSessions: 0,
      activeCampaigns: 0,
      memoryUsage: {},
      cpuUsage: 0
    };
    
    this.healthChecks = new Map();
    this.alerts = [];
    
    // Inicializar monitoramento
    this.startMonitoring();
  }

  // Iniciar monitoramento contínuo
  startMonitoring() {
    // Coletar métricas a cada 30 segundos
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Health check a cada 60 segundos
    setInterval(() => {
      this.performHealthChecks();
    }, 60000);

    // Limpeza de métricas antigas a cada hora
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);

    logger.info('Sistema de monitoramento iniciado');
  }

  // Coletar métricas do sistema
  async collectMetrics() {
    try {
      // Métricas do sistema
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const systemLoad = os.loadavg();
      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();

      // Métricas da aplicação
      const activeSessions = this.whatsappManager.getActiveSessions().length;
      const { data: activeCampaigns } = await this.supabase
        .from('campaigns')
        .select('id')
        .in('status', ['running', 'scheduled']);

      // Métricas do banco de dados
      const dbMetrics = await this.getDatabaseMetrics();

      const metrics = {
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: {
            used: memoryUsage.rss,
            heap: memoryUsage.heapUsed,
            external: memoryUsage.external,
            free: freeMemory,
            total: totalMemory,
            usage_percent: ((totalMemory - freeMemory) / totalMemory) * 100
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
            load: systemLoad
          },
          disk: await this.getDiskUsage()
        },
        application: {
          requests_total: this.metrics.requests,
          errors_total: this.metrics.errors,
          whatsapp_sessions: activeSessions,
          active_campaigns: activeCampaigns?.length || 0,
          error_rate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0
        },
        database: dbMetrics
      };

      // Salvar métricas no banco
      await this.saveMetrics(metrics);

      // Verificar alertas
      await this.checkAlerts(metrics);

      logger.performance.systemMetrics(metrics);

    } catch (error) {
      logger.error('Erro ao coletar métricas', error);
    }
  }

  // Obter métricas do banco de dados
  async getDatabaseMetrics() {
    try {
      const startTime = Date.now();
      
      // Teste de conectividade
      const { data, error } = await this.supabase
        .from('system_config')
        .select('key')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'error',
          response_time: responseTime,
          error: error.message
        };
      }

      // Contar registros principais
      const [usersCount, sessionsCount, campaignsCount, messagesCount] = await Promise.all([
        this.supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        this.supabase.from('whatsapp_sessions').select('id', { count: 'exact', head: true }),
        this.supabase.from('campaigns').select('id', { count: 'exact', head: true }),
        this.supabase.from('campaign_messages').select('id', { count: 'exact', head: true })
      ]);

      return {
        status: 'healthy',
        response_time: responseTime,
        counts: {
          users: usersCount.count || 0,
          sessions: sessionsCount.count || 0,
          campaigns: campaignsCount.count || 0,
          messages: messagesCount.count || 0
        }
      };

    } catch (error) {
      return {
        status: 'error',
        response_time: null,
        error: error.message
      };
    }
  }

  // Obter uso do disco
  async getDiskUsage() {
    try {
      const stats = fs.statSync(process.cwd());
      const { size } = await fs.promises.stat(process.cwd());
      
      return {
        used: size,
        available: os.freemem(), // Aproximação
        usage_percent: 0 // Seria necessário uma lib específica para cálculo preciso
      };
    } catch (error) {
      return {
        used: 0,
        available: 0,
        usage_percent: 0
      };
    }
  }

  // Salvar métricas no banco
  async saveMetrics(metrics) {
    try {
      await this.supabase
        .from('system_metrics')
        .insert({
          timestamp: metrics.timestamp,
          metrics_data: metrics,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Erro ao salvar métricas', error);
    }
  }

  // Realizar health checks
  async performHealthChecks() {
    const checks = {
      database: await this.checkDatabase(),
      whatsapp: await this.checkWhatsApp(),
      disk_space: await this.checkDiskSpace(),
      memory: await this.checkMemory(),
      external_apis: await this.checkExternalAPIs()
    };

    const overallHealth = Object.values(checks).every(check => check.status === 'healthy');

    const healthReport = {
      timestamp: new Date().toISOString(),
      status: overallHealth ? 'healthy' : 'unhealthy',
      checks: checks,
      uptime: process.uptime()
    };

    // Salvar relatório de saúde
    await this.saveHealthReport(healthReport);

    // Log do status
    if (overallHealth) {
      logger.info('Health check: Sistema saudável', healthReport);
    } else {
      logger.error('Health check: Sistema com problemas', null, healthReport);
    }

    return healthReport;
  }

  // Verificar saúde do banco de dados
  async checkDatabase() {
    try {
      const startTime = Date.now();
      const { data, error } = await this.supabase
        .from('system_config')
        .select('key')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'unhealthy',
          message: error.message,
          response_time: responseTime
        };
      }

      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        message: 'Banco de dados respondendo',
        response_time: responseTime
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        response_time: null
      };
    }
  }

  // Verificar saúde do WhatsApp
  async checkWhatsApp() {
    try {
      const activeSessions = this.whatsappManager.getActiveSessions();
      const connectedSessions = activeSessions.filter(sessionId => 
        this.whatsappManager.isSessionConnected(sessionId)
      );

      return {
        status: 'healthy',
        message: `${connectedSessions.length}/${activeSessions.length} sessões conectadas`,
        active_sessions: activeSessions.length,
        connected_sessions: connectedSessions.length
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        active_sessions: 0,
        connected_sessions: 0
      };
    }
  }

  // Verificar espaço em disco
  async checkDiskSpace() {
    try {
      const freeSpace = os.freemem();
      const totalSpace = os.totalmem();
      const usagePercent = ((totalSpace - freeSpace) / totalSpace) * 100;

      let status = 'healthy';
      let message = 'Espaço em disco adequado';

      if (usagePercent > 90) {
        status = 'unhealthy';
        message = 'Espaço em disco crítico';
      } else if (usagePercent > 80) {
        status = 'degraded';
        message = 'Espaço em disco baixo';
      }

      return {
        status,
        message,
        usage_percent: usagePercent,
        free_space: freeSpace,
        total_space: totalSpace
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  // Verificar uso de memória
  async checkMemory() {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const usagePercent = (memoryUsage.rss / totalMemory) * 100;

      let status = 'healthy';
      let message = 'Uso de memória normal';

      if (usagePercent > 90) {
        status = 'unhealthy';
        message = 'Uso de memória crítico';
      } else if (usagePercent > 80) {
        status = 'degraded';
        message = 'Uso de memória alto';
      }

      return {
        status,
        message,
        usage_percent: usagePercent,
        heap_used: memoryUsage.heapUsed,
        rss: memoryUsage.rss
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  // Verificar APIs externas
  async checkExternalAPIs() {
    const apiChecks = [];

    // Verificar Supabase
    try {
      const startTime = Date.now();
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY
        }
      });
      const responseTime = Date.now() - startTime;

      apiChecks.push({
        name: 'Supabase',
        status: response.ok ? 'healthy' : 'unhealthy',
        response_time: responseTime
      });
    } catch (error) {
      apiChecks.push({
        name: 'Supabase',
        status: 'unhealthy',
        error: error.message
      });
    }

    const overallStatus = apiChecks.every(check => check.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      message: `${apiChecks.filter(c => c.status === 'healthy').length}/${apiChecks.length} APIs saudáveis`,
      checks: apiChecks
    };
  }

  // Salvar relatório de saúde
  async saveHealthReport(report) {
    try {
      await this.supabase
        .from('health_reports')
        .insert({
          timestamp: report.timestamp,
          status: report.status,
          report_data: report,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Erro ao salvar relatório de saúde', error);
    }
  }

  // Verificar alertas
  async checkAlerts(metrics) {
    const alerts = [];

    // Alerta de memória alta
    if (metrics.system.memory.usage_percent > 85) {
      alerts.push({
        type: 'memory_high',
        severity: metrics.system.memory.usage_percent > 95 ? 'critical' : 'warning',
        message: `Uso de memória em ${metrics.system.memory.usage_percent.toFixed(1)}%`,
        value: metrics.system.memory.usage_percent
      });
    }

    // Alerta de taxa de erro alta
    if (metrics.application.error_rate > 5) {
      alerts.push({
        type: 'error_rate_high',
        severity: metrics.application.error_rate > 10 ? 'critical' : 'warning',
        message: `Taxa de erro em ${metrics.application.error_rate.toFixed(1)}%`,
        value: metrics.application.error_rate
      });
    }

    // Alerta de sessões WhatsApp desconectadas
    if (metrics.application.whatsapp_sessions === 0) {
      alerts.push({
        type: 'no_whatsapp_sessions',
        severity: 'critical',
        message: 'Nenhuma sessão WhatsApp ativa',
        value: 0
      });
    }

    // Processar alertas
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  // Processar alerta
  async processAlert(alert) {
    try {
      // Salvar alerta no banco
      await this.supabase
        .from('system_alerts')
        .insert({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          alert_data: alert,
          created_at: new Date().toISOString()
        });

      // Log do alerta
      if (alert.severity === 'critical') {
        logger.error(`ALERTA CRÍTICO: ${alert.message}`, null, alert);
      } else {
        logger.warn(`ALERTA: ${alert.message}`, alert);
      }

      // Aqui você pode adicionar notificações (email, Slack, etc.)
      // await this.sendNotification(alert);

    } catch (error) {
      logger.error('Erro ao processar alerta', error);
    }
  }

  // Limpeza de métricas antigas
  async cleanupOldMetrics() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Limpar métricas antigas
      await this.supabase
        .from('system_metrics')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      // Limpar relatórios de saúde antigos
      await this.supabase
        .from('health_reports')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      // Limpar alertas antigos
      await this.supabase
        .from('system_alerts')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      logger.info('Limpeza de métricas antigas concluída');

    } catch (error) {
      logger.error('Erro na limpeza de métricas antigas', error);
    }
  }

  // Incrementar contador de requests
  incrementRequests() {
    this.metrics.requests++;
  }

  // Incrementar contador de erros
  incrementErrors() {
    this.metrics.errors++;
  }

  // Obter métricas atuais
  getCurrentMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  // Endpoint de health check
  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

module.exports = SystemMonitor;
