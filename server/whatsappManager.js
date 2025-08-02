const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

class WhatsAppManager {
  constructor(supabase) {
    this.supabase = supabase;
    this.clients = new Map(); // sessionId -> client instance
    this.sessionStates = new Map(); // sessionId -> state info
    this.sessionPath = process.env.WHATSAPP_SESSION_PATH || './whatsapp-sessions';
    
    // Criar diretório de sessões se não existir
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
  }

  // Inicializar sessões existentes do banco de dados
  async initializeExistingSessions() {
    try {
      console.log('🔄 Inicializando sessões existentes...');
      
      const { data: sessions, error } = await this.supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('auto_reconnect', true);

      if (error) {
        console.error('Erro ao buscar sessões:', error);
        return;
      }

      for (const session of sessions || []) {
        if (session.status === 'connected' || session.auto_reconnect) {
          console.log(`🔄 Reconectando sessão: ${session.session_name}`);
          await this.createSession(session.id, session.session_id);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar sessões:', error);
    }
  }

  // Criar nova sessão do WhatsApp
  async createSession(sessionDbId, sessionId) {
    try {
      if (this.clients.has(sessionId)) {
        console.log(`⚠️ Sessão ${sessionId} já existe`);
        return { success: false, message: 'Sessão já existe' };
      }

      console.log(`🆕 Criando nova sessão: ${sessionId}`);

      // Configurar cliente WhatsApp
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: sessionId,
          dataPath: this.sessionPath
        }),
        puppeteer: {
          headless: true,
          args: process.env.WHATSAPP_PUPPETEER_ARGS?.split(',') || [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      // Configurar eventos do cliente
      this.setupClientEvents(client, sessionDbId, sessionId);

      // Armazenar cliente
      this.clients.set(sessionId, client);
      this.sessionStates.set(sessionId, {
        status: 'connecting',
        qrCode: null,
        lastActivity: new Date()
      });

      // Atualizar status no banco
      await this.updateSessionStatus(sessionDbId, 'connecting');

      // Inicializar cliente
      await client.initialize();

      return { success: true, message: 'Sessão criada com sucesso' };
    } catch (error) {
      console.error(`Erro ao criar sessão ${sessionId}:`, error);
      await this.logSessionError(sessionDbId, error.message);
      return { success: false, message: error.message };
    }
  }

  // Configurar eventos do cliente WhatsApp
  setupClientEvents(client, sessionDbId, sessionId) {
    // Evento QR Code
    client.on('qr', async (qr) => {
      try {
        console.log(`📱 QR Code gerado para sessão: ${sessionId}`);
        
        // Gerar QR code como imagem base64
        const qrCodeImage = await qrcode.toDataURL(qr);
        
        // Atualizar estado local
        this.sessionStates.set(sessionId, {
          ...this.sessionStates.get(sessionId),
          qrCode: qrCodeImage,
          status: 'qr_ready'
        });

        // Salvar QR code no banco
        await this.supabase
          .from('whatsapp_sessions')
          .update({
            qr_code: qrCodeImage,
            status: 'disconnected',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionDbId);

      } catch (error) {
        console.error(`Erro ao processar QR code para ${sessionId}:`, error);
      }
    });

    // Evento de autenticação
    client.on('authenticated', async () => {
      console.log(`✅ Sessão ${sessionId} autenticada`);
      await this.updateSessionStatus(sessionDbId, 'connecting');
    });

    // Evento de falha na autenticação
    client.on('auth_failure', async (msg) => {
      console.error(`❌ Falha na autenticação da sessão ${sessionId}:`, msg);
      await this.logSessionError(sessionDbId, `Falha na autenticação: ${msg}`);
      await this.updateSessionStatus(sessionDbId, 'error');
    });

    // Evento de cliente pronto
    client.on('ready', async () => {
      console.log(`🚀 Sessão ${sessionId} está pronta!`);
      
      // Obter informações do cliente
      const info = client.info;
      
      // Atualizar estado local
      this.sessionStates.set(sessionId, {
        ...this.sessionStates.get(sessionId),
        status: 'connected',
        qrCode: null,
        clientInfo: info
      });

      // Atualizar banco de dados
      await this.supabase
        .from('whatsapp_sessions')
        .update({
          status: 'connected',
          phone_number: info.wid.user,
          qr_code: null,
          last_connected_at: new Date().toISOString(),
          connection_error: null,
          client_data: {
            phone: info.wid.user,
            name: info.pushname,
            platform: info.platform,
            connected_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionDbId);

      console.log(`📞 Sessão ${sessionId} conectada como: ${info.wid.user}`);
    });

    // Evento de desconexão
    client.on('disconnected', async (reason) => {
      console.log(`🔌 Sessão ${sessionId} desconectada:`, reason);
      
      // Atualizar estado local
      this.sessionStates.set(sessionId, {
        ...this.sessionStates.get(sessionId),
        status: 'disconnected'
      });

      // Atualizar banco
      await this.updateSessionStatus(sessionDbId, 'disconnected');
      await this.logSessionError(sessionDbId, `Desconectado: ${reason}`);

      // Tentar reconectar se auto_reconnect estiver ativo
      const { data: session } = await this.supabase
        .from('whatsapp_sessions')
        .select('auto_reconnect, restart_count')
        .eq('id', sessionDbId)
        .single();

      if (session?.auto_reconnect && session.restart_count < 5) {
        console.log(`🔄 Tentando reconectar sessão ${sessionId}...`);
        setTimeout(() => {
          this.reconnectSession(sessionDbId, sessionId);
        }, 5000);
      }
    });

    // Evento de mensagem recebida
    client.on('message', async (message) => {
      try {
        await this.handleIncomingMessage(sessionDbId, sessionId, message);
      } catch (error) {
        console.error(`Erro ao processar mensagem recebida:`, error);
      }
    });

    // Evento de mudança de estado da mensagem
    client.on('message_ack', async (message, ack) => {
      try {
        await this.handleMessageAck(sessionDbId, message, ack);
      } catch (error) {
        console.error(`Erro ao processar ACK da mensagem:`, error);
      }
    });
  }

  // Processar mensagem recebida
  async handleIncomingMessage(sessionDbId, sessionId, message) {
    try {
      console.log(`📨 Mensagem recebida na sessão ${sessionId}:`, message.body);

      // Atualizar estatísticas da sessão
      await this.updateSessionStats(sessionDbId, 'received');

      // Buscar ou criar conversa
      const conversation = await this.findOrCreateConversation(
        sessionDbId, 
        message.from, 
        message._data.notifyName || message.from
      );

      // Salvar mensagem no banco
      await this.supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          whatsapp_message_id: message.id._serialized,
          phone_number: message.from,
          content: message.body,
          message_type: message.type,
          is_from_contact: true,
          timestamp: new Date(message.timestamp * 1000).toISOString()
        });

      // Atualizar conversa
      await this.supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: message.body.substring(0, 100),
          unread_count: conversation.unread_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error);
    }
  }

  // Processar ACK de mensagem
  async handleMessageAck(sessionDbId, message, ack) {
    try {
      let status = 'sent';
      
      switch (ack) {
        case 1: status = 'sent'; break;
        case 2: status = 'delivered'; break;
        case 3: status = 'read'; break;
        default: status = 'pending';
      }

      // Atualizar mensagem da campanha se existir
      await this.supabase
        .from('campaign_messages')
        .update({
          status: status,
          [`${status}_at`]: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('whatsapp_message_id', message.id._serialized);

    } catch (error) {
      console.error('Erro ao processar ACK:', error);
    }
  }

  // Buscar ou criar conversa
  async findOrCreateConversation(sessionDbId, phoneNumber, contactName) {
    try {
      // Buscar conversa existente
      let { data: conversation, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('session_id', sessionDbId)
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Criar nova conversa se não existir
      if (!conversation) {
        const { data: newConversation, error: createError } = await this.supabase
          .from('conversations')
          .insert({
            session_id: sessionDbId,
            phone_number: phoneNumber,
            contact_name: contactName,
            unread_count: 0,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        conversation = newConversation;
      }

      return conversation;
    } catch (error) {
      console.error('Erro ao buscar/criar conversa:', error);
      throw error;
    }
  }

  // Enviar mensagem
  async sendMessage(sessionId, phoneNumber, message, mediaUrl = null) {
    try {
      const client = this.clients.get(sessionId);
      if (!client) {
        throw new Error('Sessão não encontrada');
      }

      const state = this.sessionStates.get(sessionId);
      if (state?.status !== 'connected') {
        throw new Error('Sessão não está conectada');
      }

      let sentMessage;

      if (mediaUrl) {
        // Enviar mídia
        const media = await MessageMedia.fromUrl(mediaUrl);
        sentMessage = await client.sendMessage(phoneNumber, media, { caption: message });
      } else {
        // Enviar texto
        sentMessage = await client.sendMessage(phoneNumber, message);
      }

      console.log(`📤 Mensagem enviada para ${phoneNumber}: ${message}`);
      return {
        success: true,
        messageId: sentMessage.id._serialized,
        timestamp: sentMessage.timestamp
      };

    } catch (error) {
      console.error(`Erro ao enviar mensagem:`, error);
      throw error;
    }
  }

  // Destruir sessão
  async destroySession(sessionId) {
    try {
      const client = this.clients.get(sessionId);
      if (client) {
        await client.destroy();
        this.clients.delete(sessionId);
        this.sessionStates.delete(sessionId);
        console.log(`🗑️ Sessão ${sessionId} destruída`);
      }
    } catch (error) {
      console.error(`Erro ao destruir sessão ${sessionId}:`, error);
    }
  }

  // Destruir todas as sessões
  async destroyAllSessions() {
    const promises = Array.from(this.clients.keys()).map(sessionId => 
      this.destroySession(sessionId)
    );
    await Promise.all(promises);
  }

  // Reconectar sessão
  async reconnectSession(sessionDbId, sessionId) {
    try {
      // Incrementar contador de restart
      await this.supabase.rpc('increment_restart_count', { session_id: sessionDbId });
      
      // Destruir sessão atual
      await this.destroySession(sessionId);
      
      // Criar nova sessão
      await this.createSession(sessionDbId, sessionId);
    } catch (error) {
      console.error(`Erro ao reconectar sessão ${sessionId}:`, error);
    }
  }

  // Atualizar status da sessão
  async updateSessionStatus(sessionDbId, status) {
    try {
      await this.supabase
        .from('whatsapp_sessions')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionDbId);
    } catch (error) {
      console.error('Erro ao atualizar status da sessão:', error);
    }
  }

  // Registrar erro da sessão
  async logSessionError(sessionDbId, errorMessage) {
    try {
      await this.supabase.rpc('log_session_error', {
        session_id: sessionDbId,
        error_message: errorMessage,
        error_data: {}
      });
    } catch (error) {
      console.error('Erro ao registrar erro da sessão:', error);
    }
  }

  // Atualizar estatísticas da sessão
  async updateSessionStats(sessionDbId, statType, incrementBy = 1) {
    try {
      await this.supabase.rpc('update_session_stats', {
        session_id: sessionDbId,
        stat_type: statType,
        increment_by: incrementBy
      });
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }

  // Obter sessões ativas
  getActiveSessions() {
    return Array.from(this.clients.keys());
  }

  // Obter estado da sessão
  getSessionState(sessionId) {
    return this.sessionStates.get(sessionId);
  }

  // Verificar se sessão está conectada
  isSessionConnected(sessionId) {
    const state = this.sessionStates.get(sessionId);
    return state?.status === 'connected';
  }
}

module.exports = WhatsAppManager;
