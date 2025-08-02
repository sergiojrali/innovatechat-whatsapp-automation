// Configurações específicas para ambiente de produção
const path = require('path');

module.exports = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 4000,
    host: process.env.HOST || '0.0.0.0',
    environment: 'production',
    trustProxy: true,
    
    // Timeouts
    requestTimeout: 30000,
    keepAliveTimeout: 65000,
    headersTimeout: 66000,
    
    // Limites
    maxRequestSize: '50mb',
    maxParameterLimit: 1000,
    maxFieldsLimit: 100
  },

  // Configurações de segurança
  security: {
    // CORS
    cors: {
      origin: [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        'https://app.yourdomain.com'
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      maxAge: 86400 // 24 horas
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por IP
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    
    // Rate limiting específico para auth
    authRateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 tentativas de login
      skipSuccessfulRequests: true
    },
    
    // Rate limiting para WhatsApp
    whatsappRateLimit: {
      windowMs: 60 * 1000, // 1 minuto
      max: 10, // máximo 10 mensagens por minuto
      skipSuccessfulRequests: false
    },
    
    // Helmet configurações
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: [
            "'self'", 
            "https://api.supabase.co", 
            "wss://realtime.supabase.co",
            "https://api.openai.com",
            "https://api.anthropic.com",
            "https://openrouter.ai"
          ]
        }
      },
      hsts: {
        maxAge: 31536000, // 1 ano
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: "same-origin" }
    },
    
    // Configurações de criptografia
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16
    },
    
    // Configurações de sessão
    session: {
      timeoutHours: 24,
      maxConcurrentSessions: 5,
      cleanupInterval: 3600000 // 1 hora
    }
  },

  // Configurações do banco de dados
  database: {
    supabase: {
      url: process.env.VITE_SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE,
      anonKey: process.env.VITE_SUPABASE_ANON_KEY,
      
      // Configurações de conexão
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      },
      
      // Pool de conexões
      db: {
        schema: 'public'
      },
      
      // Realtime
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    },
    
    // Configurações de backup
    backup: {
      enabled: true,
      schedule: '0 2 * * *', // Diariamente às 2:00
      retentionDays: 30,
      compressionLevel: 6,
      encryptBackups: true,
      
      // Tabelas para backup
      tables: [
        'user_profiles',
        'whatsapp_sessions', 
        'campaigns',
        'campaign_messages',
        'contacts',
        'contact_lists',
        'conversations',
        'chat_messages',
        'sectors',
        'agents',
        'ai_configurations',
        'business_templates',
        'audit_logs',
        'system_metrics'
      ],
      
      // Configurações de armazenamento
      storage: {
        type: 'local', // 'local', 's3', 'gcs'
        path: './backups',
        
        // Para S3 (se usado)
        s3: {
          bucket: process.env.BACKUP_S3_BUCKET,
          region: process.env.BACKUP_S3_REGION,
          accessKeyId: process.env.BACKUP_S3_ACCESS_KEY,
          secretAccessKey: process.env.BACKUP_S3_SECRET_KEY
        }
      }
    }
  },

  // Configurações do WhatsApp
  whatsapp: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-sessions',
    maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 50,
    sessionTimeout: 300000, // 5 minutos
    reconnectInterval: 30000, // 30 segundos
    maxReconnectAttempts: 5,
    
    // Configurações do Puppeteer
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      
      // Configurações de performance
      defaultViewport: {
        width: 1366,
        height: 768
      },
      
      // Timeouts
      timeout: 30000,
      navigationTimeout: 30000,
      
      // Configurações de rede
      ignoreHTTPSErrors: true,
      slowMo: 0
    },
    
    // Configurações de mensagens
    messaging: {
      maxMessageLength: 4096,
      maxMediaSize: 16 * 1024 * 1024, // 16MB
      allowedMediaTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'audio/mpeg',
        'audio/ogg',
        'application/pdf'
      ],
      
      // Rate limiting por sessão
      rateLimit: {
        messagesPerMinute: 20,
        messagesPerHour: 1000,
        messagesPerDay: 10000
      }
    }
  },

  // Configurações de IA
  ai: {
    // Timeouts
    requestTimeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    
    // Rate limiting
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000
    },
    
    // Configurações por provider
    providers: {
      openai: {
        baseURL: 'https://api.openai.com/v1',
        timeout: 30000,
        maxTokens: 4000,
        temperature: 0.7
      },
      
      anthropic: {
        baseURL: 'https://api.anthropic.com/v1',
        timeout: 30000,
        maxTokens: 4000,
        temperature: 0.7
      },
      
      openrouter: {
        baseURL: 'https://openrouter.ai/api/v1',
        timeout: 30000,
        maxTokens: 4000,
        temperature: 0.7
      },
      
      google: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        timeout: 30000,
        maxTokens: 4000,
        temperature: 0.7
      }
    },
    
    // Cache de respostas
    cache: {
      enabled: true,
      ttl: 3600, // 1 hora
      maxSize: 1000
    }
  },

  // Configurações de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    
    // Configurações de arquivos
    files: {
      app: {
        filename: './logs/app.log',
        maxSize: '10m',
        maxFiles: 5
      },
      error: {
        filename: './logs/error.log',
        maxSize: '10m',
        maxFiles: 5
      },
      whatsapp: {
        filename: './logs/whatsapp.log',
        maxSize: '10m',
        maxFiles: 5
      },
      campaigns: {
        filename: './logs/campaigns.log',
        maxSize: '10m',
        maxFiles: 5
      },
      ai: {
        filename: './logs/ai.log',
        maxSize: '10m',
        maxFiles: 5
      },
      audit: {
        filename: './logs/audit.log',
        maxSize: '10m',
        maxFiles: 10
      }
    },
    
    // Configurações de console
    console: {
      enabled: false, // Desabilitado em produção
      level: 'error'
    },
    
    // Configurações de rotação
    rotation: {
      enabled: true,
      interval: '24h',
      maxSize: '10m'
    }
  },

  // Configurações de monitoramento
  monitoring: {
    enabled: true,
    
    // Intervalos de coleta
    intervals: {
      metrics: 30000, // 30 segundos
      healthCheck: 60000, // 1 minuto
      cleanup: 3600000 // 1 hora
    },
    
    // Retenção de dados
    retention: {
      metrics: 30, // dias
      healthReports: 30, // dias
      auditLogs: 90, // dias
      alerts: 30 // dias
    },
    
    // Alertas
    alerts: {
      enabled: true,
      
      // Thresholds
      thresholds: {
        memoryUsage: 85, // %
        cpuUsage: 80, // %
        diskUsage: 90, // %
        errorRate: 5, // %
        responseTime: 5000 // ms
      },
      
      // Notificações
      notifications: {
        email: {
          enabled: false,
          recipients: []
        },
        webhook: {
          enabled: false,
          url: process.env.ALERT_WEBHOOK_URL
        }
      }
    },
    
    // Health checks
    healthChecks: {
      database: true,
      whatsapp: true,
      ai: true,
      externalAPIs: true
    }
  },

  // Configurações de cache
  cache: {
    enabled: true,
    
    // Configurações Redis (se usado)
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      
      // Configurações de conexão
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      
      // Pool de conexões
      family: 4,
      keepAlive: true
    },
    
    // TTL padrão
    defaultTTL: 3600, // 1 hora
    
    // Configurações por tipo
    types: {
      sessions: 86400, // 24 horas
      userProfiles: 3600, // 1 hora
      aiResponses: 1800, // 30 minutos
      systemConfig: 7200 // 2 horas
    }
  },

  // Configurações de email
  email: {
    enabled: process.env.SMTP_HOST ? true : false,
    
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      
      // Configurações adicionais
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    },
    
    // Templates
    templates: {
      path: './email-templates',
      defaultFrom: process.env.SMTP_FROM || 'noreply@yourdomain.com'
    }
  },

  // Configurações de performance
  performance: {
    // Compressão
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024
    },
    
    // Clustering
    cluster: {
      enabled: process.env.CLUSTER_ENABLED === 'true',
      workers: process.env.CLUSTER_WORKERS || 'auto'
    },
    
    // Garbage collection
    gc: {
      enabled: true,
      interval: 300000 // 5 minutos
    }
  },

  // Configurações de desenvolvimento (para referência)
  development: {
    hotReload: false,
    debugMode: false,
    verboseLogging: false,
    mockExternalServices: false
  }
};
