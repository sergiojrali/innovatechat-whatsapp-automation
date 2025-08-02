const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');

// Rate limiting
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ error: message });
    }
  });
};

// Rate limiters específicos
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  100, // máximo 100 requests por IP
  'Muitas requisições. Tente novamente em 15 minutos.'
);

const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  5, // máximo 5 tentativas de login por IP
  'Muitas tentativas de login. Tente novamente em 15 minutos.'
);

const whatsappLimiter = createRateLimiter(
  60 * 1000, // 1 minuto
  10, // máximo 10 mensagens por minuto
  'Limite de mensagens excedido. Aguarde 1 minuto.'
);

// Configuração CORS para produção
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'https://app.yourdomain.com'
    ];
    
    // Permitir requests sem origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware de validação de token JWT
const validateJWT = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    // Validar token com Supabase
    const { data: { user }, error } = await req.supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na validação JWT:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware de validação de permissões
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const { data: profile, error } = await req.supabase
        .from('user_profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({ error: 'Perfil de usuário não encontrado' });
      }

      if (!roles.includes(profile.role)) {
        return res.status(403).json({ error: 'Permissão insuficiente' });
      }

      req.userRole = profile.role;
      next();
    } catch (error) {
      console.error('Erro na validação de permissões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

// Criptografia para dados sensíveis
const encrypt = (text) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('InnovateChat', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

const decrypt = (encryptedData) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAAD(Buffer.from('InnovateChat', 'utf8'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Middleware de sanitização de entrada
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove scripts maliciosos
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // Remove SQL injection básico
        obj[key] = obj[key].replace(/('|(\\')|(;)|(\\)|(\/\*)|(--)|(\*\/))/g, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

// Middleware de auditoria
const auditLog = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log da ação após resposta
      setImmediate(async () => {
        try {
          await req.supabase
            .from('audit_logs')
            .insert({
              user_id: req.user?.id,
              action: action,
              resource: req.originalUrl,
              ip_address: req.ip,
              user_agent: req.get('User-Agent'),
              request_data: {
                method: req.method,
                params: req.params,
                query: req.query,
                body: req.body
              },
              response_status: res.statusCode,
              timestamp: new Date().toISOString()
            });
        } catch (error) {
          console.error('Erro ao registrar audit log:', error);
        }
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  generalLimiter,
  authLimiter,
  whatsappLimiter,
  corsOptions,
  validateJWT,
  requireRole,
  encrypt,
  decrypt,
  sanitizeInput,
  auditLog,
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.supabase.co", "wss://realtime.supabase.co"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
};
