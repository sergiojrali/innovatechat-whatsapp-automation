const { logger } = require('./logger');

// Tipos de erro customizados
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
    this.type = 'validation';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401);
    this.type = 'authentication';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
    this.type = 'authorization';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado`, 404);
    this.type = 'not_found';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflito de dados') {
    super(message, 409);
    this.type = 'conflict';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Muitas requisições') {
    super(message, 429);
    this.type = 'rate_limit';
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = 'Serviço indisponível') {
    super(`${service}: ${message}`, 502);
    this.service = service;
    this.type = 'external_service';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Erro no banco de dados') {
    super(message, 500);
    this.type = 'database';
  }
}

class WhatsAppError extends AppError {
  constructor(message = 'Erro no WhatsApp', sessionId = null) {
    super(message, 500);
    this.sessionId = sessionId;
    this.type = 'whatsapp';
  }
}

class AIServiceError extends AppError {
  constructor(provider, message = 'Erro no serviço de IA') {
    super(`${provider}: ${message}`, 500);
    this.provider = provider;
    this.type = 'ai_service';
  }
}

// Mapeamento de erros do Supabase
const mapSupabaseError = (error) => {
  const { code, message, details } = error;
  
  switch (code) {
    case 'PGRST116':
      return new NotFoundError('Registro');
    case '23505':
      return new ConflictError('Dados duplicados');
    case '23503':
      return new ValidationError('Referência inválida');
    case '42501':
      return new AuthorizationError('Permissão insuficiente');
    case 'PGRST301':
      return new ValidationError('Dados inválidos');
    default:
      return new DatabaseError(message || 'Erro no banco de dados');
  }
};

// Mapeamento de erros do WhatsApp Web.js
const mapWhatsAppError = (error, sessionId = null) => {
  const message = error.message || error.toString();
  
  if (message.includes('Session closed')) {
    return new WhatsAppError('Sessão WhatsApp fechada', sessionId);
  }
  
  if (message.includes('QR code')) {
    return new WhatsAppError('QR Code necessário', sessionId);
  }
  
  if (message.includes('Rate limit')) {
    return new RateLimitError('Limite de mensagens WhatsApp excedido');
  }
  
  if (message.includes('Authentication')) {
    return new WhatsAppError('Falha na autenticação WhatsApp', sessionId);
  }
  
  return new WhatsAppError(message, sessionId);
};

// Mapeamento de erros de IA
const mapAIError = (error, provider) => {
  const message = error.message || error.toString();
  
  if (error.response?.status === 401) {
    return new AIServiceError(provider, 'Chave de API inválida');
  }
  
  if (error.response?.status === 429) {
    return new RateLimitError(`Limite de requisições ${provider} excedido`);
  }
  
  if (error.response?.status === 402) {
    return new AIServiceError(provider, 'Cota excedida');
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new ExternalServiceError(provider, 'Serviço indisponível');
  }
  
  return new AIServiceError(provider, message);
};

// Handler principal de erros
const errorHandler = (err, req, res, next) => {
  let error = err;
  
  // Mapear erros conhecidos
  if (err.code && err.code.startsWith('PGRST')) {
    error = mapSupabaseError(err);
  } else if (err.name === 'WhatsAppError' || err.message?.includes('whatsapp')) {
    error = mapWhatsAppError(err, req.sessionId);
  } else if (err.provider || err.message?.includes('AI') || err.message?.includes('OpenAI')) {
    error = mapAIError(err, err.provider || 'AI');
  } else if (!(err instanceof AppError)) {
    // Erro não mapeado - tratar como erro interno
    error = new AppError('Erro interno do servidor', 500, false);
  }
  
  // Log do erro
  const errorData = {
    message: error.message,
    statusCode: error.statusCode,
    type: error.type,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: error.timestamp || new Date().toISOString()
  };
  
  // Log baseado na severidade
  if (error.statusCode >= 500) {
    logger.error(`Server Error: ${error.message}`, error, errorData);
  } else if (error.statusCode >= 400) {
    logger.warn(`Client Error: ${error.message}`, errorData);
  } else {
    logger.info(`Request Error: ${error.message}`, errorData);
  }
  
  // Salvar erro crítico no banco
  if (error.statusCode >= 500 && error.isOperational) {
    saveErrorToDatabase(error, req).catch(dbErr => {
      logger.error('Erro ao salvar erro no banco', dbErr);
    });
  }
  
  // Resposta para o cliente
  const response = {
    error: {
      message: error.message,
      type: error.type || 'unknown',
      timestamp: error.timestamp || new Date().toISOString()
    }
  };
  
  // Adicionar detalhes em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
    response.error.statusCode = error.statusCode;
  }
  
  // Adicionar campo específico se existir
  if (error.field) {
    response.error.field = error.field;
  }
  
  if (error.service) {
    response.error.service = error.service;
  }
  
  if (error.provider) {
    response.error.provider = error.provider;
  }
  
  res.status(error.statusCode || 500).json(response);
};

// Salvar erro no banco de dados
const saveErrorToDatabase = async (error, req) => {
  try {
    if (!req.supabase) return;
    
    await req.supabase
      .from('system_alerts')
      .insert({
        type: 'application_error',
        severity: error.statusCode >= 500 ? 'critical' : 'warning',
        message: error.message,
        alert_data: {
          statusCode: error.statusCode,
          type: error.type,
          stack: error.stack,
          url: req.originalUrl,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id,
          timestamp: error.timestamp
        }
      });
  } catch (dbError) {
    logger.error('Erro ao salvar erro no banco', dbError);
  }
};

// Handler para rotas não encontradas
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Rota ${req.originalUrl}`);
  next(error);
};

// Handler para erros assíncronos
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validador de entrada
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      const validationError = new ValidationError(
        error.details[0].message,
        error.details[0].path[0]
      );
      return next(validationError);
    }
    
    req.validatedBody = value;
    next();
  };
};

// Wrapper para operações do Supabase
const supabaseWrapper = async (operation, errorContext = 'Operação do banco') => {
  try {
    const result = await operation();
    
    if (result.error) {
      throw mapSupabaseError(result.error);
    }
    
    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error(`${errorContext}: ${error.message}`, error);
    throw new DatabaseError(`${errorContext} falhou`);
  }
};

// Wrapper para operações do WhatsApp
const whatsappWrapper = async (operation, sessionId, errorContext = 'Operação WhatsApp') => {
  try {
    return await operation();
  } catch (error) {
    const whatsappError = mapWhatsAppError(error, sessionId);
    logger.whatsapp.error(`${errorContext}: ${whatsappError.message}`, error, { sessionId });
    throw whatsappError;
  }
};

// Wrapper para operações de IA
const aiWrapper = async (operation, provider, errorContext = 'Operação de IA') => {
  try {
    return await operation();
  } catch (error) {
    const aiError = mapAIError(error, provider);
    logger.ai.error(`${errorContext}: ${aiError.message}`, error, { provider });
    throw aiError;
  }
};

// Handler para timeout de requisições
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      const error = new AppError('Timeout da requisição', 408);
      next(error);
    }, timeout);
    
    res.on('finish', () => {
      clearTimeout(timer);
    });
    
    next();
  };
};

// Middleware para capturar erros de parsing JSON
const jsonErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const error = new ValidationError('JSON inválido');
    return next(error);
  }
  next(err);
};

// Função para reportar erro crítico
const reportCriticalError = async (error, context = {}) => {
  logger.error('ERRO CRÍTICO', error, context);
  
  // Aqui você pode adicionar integração com serviços como Sentry, Bugsnag, etc.
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context });
  // }
  
  // Notificar administradores
  try {
    if (process.env.ALERT_EMAIL_ENABLED === 'true') {
      // await sendAlertEmail(error, context);
    }
  } catch (emailError) {
    logger.error('Erro ao enviar email de alerta', emailError);
  }
};

// Função para verificar saúde dos serviços
const healthCheck = async (req, res, next) => {
  try {
    const checks = {
      database: false,
      whatsapp: false,
      ai: false
    };
    
    // Verificar banco de dados
    try {
      const { data } = await req.supabase
        .from('system_config')
        .select('key')
        .limit(1);
      checks.database = true;
    } catch (error) {
      logger.error('Health check - Database failed', error);
    }
    
    // Verificar WhatsApp
    try {
      const activeSessions = req.whatsappManager?.getActiveSessions() || [];
      checks.whatsapp = activeSessions.length > 0;
    } catch (error) {
      logger.error('Health check - WhatsApp failed', error);
    }
    
    // Verificar IA (se configurada)
    checks.ai = true; // Assumir OK se não houver configuração específica
    
    const isHealthy = Object.values(checks).every(check => check === true);
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: checks,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Classes de erro
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  WhatsAppError,
  AIServiceError,
  
  // Handlers
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateInput,
  timeoutHandler,
  jsonErrorHandler,
  healthCheck,
  
  // Wrappers
  supabaseWrapper,
  whatsappWrapper,
  aiWrapper,
  
  // Utilitários
  reportCriticalError,
  
  // Mapeadores
  mapSupabaseError,
  mapWhatsAppError,
  mapAIError
};
