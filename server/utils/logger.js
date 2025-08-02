const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Criar diretório de logs se não existir
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configuração de formatos
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Configuração de transports
const transports = [
  // Console para desenvolvimento
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),

  // Arquivo para todos os logs
  new winston.transports.File({
    filename: path.join(logDir, 'app.log'),
    level: 'info',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: logFormat
  }),

  // Arquivo específico para erros
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: logFormat
  }),

  // Arquivo para auditoria
  new winston.transports.File({
    filename: path.join(logDir, 'audit.log'),
    level: 'info',
    maxsize: 10485760, // 10MB
    maxFiles: 10,
    format: logFormat
  })
];

// Criar logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Logger específico para WhatsApp
const whatsappLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'whatsapp.log'),
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Logger específico para campanhas
const campaignLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'campaigns.log'),
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Logger específico para IA
const aiLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'ai.log'),
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Funções utilitárias de logging
const loggers = {
  // Logger principal
  info: (message, meta = {}) => {
    logger.info(message, { ...meta, timestamp: new Date().toISOString() });
  },

  error: (message, error = null, meta = {}) => {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : {};
    
    logger.error(message, { 
      ...meta, 
      error: errorData,
      timestamp: new Date().toISOString() 
    });
  },

  warn: (message, meta = {}) => {
    logger.warn(message, { ...meta, timestamp: new Date().toISOString() });
  },

  debug: (message, meta = {}) => {
    logger.debug(message, { ...meta, timestamp: new Date().toISOString() });
  },

  // Logger específico para WhatsApp
  whatsapp: {
    info: (message, meta = {}) => {
      whatsappLogger.info(message, { ...meta, timestamp: new Date().toISOString() });
    },
    error: (message, error = null, meta = {}) => {
      const errorData = error ? {
        message: error.message,
        stack: error.stack
      } : {};
      whatsappLogger.error(message, { ...meta, error: errorData, timestamp: new Date().toISOString() });
    },
    sessionEvent: (sessionId, event, data = {}) => {
      whatsappLogger.info(`Session ${sessionId}: ${event}`, {
        sessionId,
        event,
        data,
        timestamp: new Date().toISOString()
      });
    },
    messageEvent: (sessionId, messageId, event, data = {}) => {
      whatsappLogger.info(`Message ${messageId}: ${event}`, {
        sessionId,
        messageId,
        event,
        data,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Logger específico para campanhas
  campaign: {
    info: (message, meta = {}) => {
      campaignLogger.info(message, { ...meta, timestamp: new Date().toISOString() });
    },
    error: (message, error = null, meta = {}) => {
      const errorData = error ? {
        message: error.message,
        stack: error.stack
      } : {};
      campaignLogger.error(message, { ...meta, error: errorData, timestamp: new Date().toISOString() });
    },
    campaignEvent: (campaignId, event, data = {}) => {
      campaignLogger.info(`Campaign ${campaignId}: ${event}`, {
        campaignId,
        event,
        data,
        timestamp: new Date().toISOString()
      });
    },
    messageProcessed: (campaignId, messageId, status, data = {}) => {
      campaignLogger.info(`Campaign ${campaignId} - Message ${messageId}: ${status}`, {
        campaignId,
        messageId,
        status,
        data,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Logger específico para IA
  ai: {
    info: (message, meta = {}) => {
      aiLogger.info(message, { ...meta, timestamp: new Date().toISOString() });
    },
    error: (message, error = null, meta = {}) => {
      const errorData = error ? {
        message: error.message,
        stack: error.stack
      } : {};
      aiLogger.error(message, { ...meta, error: errorData, timestamp: new Date().toISOString() });
    },
    requestEvent: (provider, model, tokensUsed, responseTime, data = {}) => {
      aiLogger.info(`AI Request: ${provider}/${model}`, {
        provider,
        model,
        tokensUsed,
        responseTime,
        data,
        timestamp: new Date().toISOString()
      });
    },
    configEvent: (userId, provider, event, data = {}) => {
      aiLogger.info(`AI Config ${userId}: ${event}`, {
        userId,
        provider,
        event,
        data,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Logger para auditoria de segurança
  security: {
    loginAttempt: (userId, ip, success, data = {}) => {
      logger.info(`Login attempt: ${success ? 'SUCCESS' : 'FAILED'}`, {
        userId,
        ip,
        success,
        data,
        type: 'security',
        timestamp: new Date().toISOString()
      });
    },
    rateLimitExceeded: (ip, endpoint, data = {}) => {
      logger.warn(`Rate limit exceeded: ${ip} on ${endpoint}`, {
        ip,
        endpoint,
        data,
        type: 'security',
        timestamp: new Date().toISOString()
      });
    },
    suspiciousActivity: (userId, ip, activity, data = {}) => {
      logger.error(`Suspicious activity: ${activity}`, {
        userId,
        ip,
        activity,
        data,
        type: 'security',
        timestamp: new Date().toISOString()
      });
    },
    dataAccess: (userId, resource, action, data = {}) => {
      logger.info(`Data access: ${action} on ${resource}`, {
        userId,
        resource,
        action,
        data,
        type: 'audit',
        timestamp: new Date().toISOString()
      });
    }
  },

  // Logger para performance
  performance: {
    apiRequest: (method, url, duration, statusCode, data = {}) => {
      logger.info(`API Request: ${method} ${url}`, {
        method,
        url,
        duration,
        statusCode,
        data,
        type: 'performance',
        timestamp: new Date().toISOString()
      });
    },
    databaseQuery: (query, duration, data = {}) => {
      logger.debug(`Database Query: ${duration}ms`, {
        query,
        duration,
        data,
        type: 'performance',
        timestamp: new Date().toISOString()
      });
    },
    systemMetrics: (metrics) => {
      logger.info('System Metrics', {
        metrics,
        type: 'performance',
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Middleware para logging de requests HTTP
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    };

    if (res.statusCode >= 400) {
      loggers.error(`HTTP ${res.statusCode}: ${req.method} ${req.originalUrl}`, null, logData);
    } else {
      loggers.performance.apiRequest(req.method, req.originalUrl, duration, res.statusCode, logData);
    }
  });

  next();
};

// Função para capturar erros não tratados
const setupErrorHandlers = () => {
  process.on('uncaughtException', (error) => {
    loggers.error('Uncaught Exception', error, { type: 'system' });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    loggers.error('Unhandled Rejection', reason, { 
      promise: promise.toString(),
      type: 'system' 
    });
  });
};

// Função para rotação manual de logs
const rotateLogs = () => {
  const logFiles = ['app.log', 'error.log', 'audit.log', 'whatsapp.log', 'campaigns.log', 'ai.log'];
  
  logFiles.forEach(file => {
    const filePath = path.join(logDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 10485760) { // 10MB
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(logDir, `${file}.${timestamp}`);
        fs.renameSync(filePath, backupPath);
        loggers.info(`Log rotated: ${file} -> ${file}.${timestamp}`);
      }
    }
  });
};

module.exports = {
  logger: loggers,
  httpLogger,
  setupErrorHandlers,
  rotateLogs
};
