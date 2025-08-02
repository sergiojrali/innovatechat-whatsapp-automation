// Carregar variáveis de ambiente
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const WhatsAppManager = require('./whatsappManager');

const app = express();
const PORT = process.env.PORT || 4000;

// Configurar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// Instância global do gerenciador do WhatsApp
const whatsappManager = new WhatsAppManager(supabase);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para adicionar instâncias aos requests
app.use((req, res, next) => {
  req.supabase = supabase;
  req.whatsappManager = whatsappManager;
  next();
});

// Endpoint de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    whatsapp_sessions: whatsappManager.getActiveSessions().length
  });
});

// Rotas do WhatsApp
app.use('/api/whatsapp', require('./routes/whatsapp'));

// Rotas de campanhas
app.use('/api/campaigns', require('./routes/campaigns'));

// Rotas de webhooks
app.use('/webhook', require('./routes/webhooks'));

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error('[Erro do Servidor]', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
  console.log(`📱 Gerenciador WhatsApp inicializado`);
  
  // Inicializar sessões existentes do banco de dados
  whatsappManager.initializeExistingSessions();
});

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  await whatsappManager.destroyAllSessions();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Encerrando servidor...');
  await whatsappManager.destroyAllSessions();
  process.exit(0);
});
