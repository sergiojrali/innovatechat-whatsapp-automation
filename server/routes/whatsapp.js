const express = require('express');
const router = express.Router();

// Listar todas as sessões
router.get('/sessions', async (req, res) => {
  try {
    const { data: sessions, error } = await req.supabase
      .from('whatsapp_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Adicionar estado em tempo real das sessões
    const sessionsWithState = sessions.map(session => ({
      ...session,
      runtime_state: req.whatsappManager.getSessionState(session.session_id) || {
        status: 'disconnected',
        qrCode: null
      }
    }));

    res.json({ success: true, data: sessionsWithState });
  } catch (error) {
    console.error('Erro ao listar sessões:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter sessão específica
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: session, error } = await req.supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Adicionar estado em tempo real
    session.runtime_state = req.whatsappManager.getSessionState(session.session_id) || {
      status: 'disconnected',
      qrCode: null
    };

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar nova sessão
router.post('/sessions', async (req, res) => {
  try {
    const { session_name, auto_reconnect = true, daily_message_limit = 1000 } = req.body;

    if (!session_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome da sessão é obrigatório' 
      });
    }

    // Gerar ID único para a sessão
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Criar sessão no banco de dados
    const { data: session, error } = await req.supabase
      .from('whatsapp_sessions')
      .insert({
        session_name,
        session_id: sessionId,
        auto_reconnect,
        daily_message_limit,
        status: 'disconnected'
      })
      .select()
      .single();

    if (error) throw error;

    // Inicializar sessão do WhatsApp
    const result = await req.whatsappManager.createSession(session.id, sessionId);

    if (!result.success) {
      // Remover sessão do banco se falhou
      await req.supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('id', session.id);

      return res.status(500).json({ 
        success: false, 
        error: result.message 
      });
    }

    res.status(201).json({ 
      success: true, 
      data: session,
      message: 'Sessão criada com sucesso. Escaneie o QR code para conectar.'
    });

  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conectar sessão (gerar QR code)
router.post('/sessions/:id/connect', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: session, error } = await req.supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Verificar se já está conectada
    if (req.whatsappManager.isSessionConnected(session.session_id)) {
      return res.json({ 
        success: true, 
        message: 'Sessão já está conectada',
        status: 'connected'
      });
    }

    // Inicializar sessão
    const result = await req.whatsappManager.createSession(session.id, session.session_id);

    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Conectando... Aguarde o QR code ser gerado.',
      status: 'connecting'
    });

  } catch (error) {
    console.error('Erro ao conectar sessão:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Desconectar sessão
router.post('/sessions/:id/disconnect', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: session, error } = await req.supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Destruir sessão
    await req.whatsappManager.destroySession(session.session_id);

    // Atualizar status no banco
    await req.supabase
      .from('whatsapp_sessions')
      .update({
        status: 'disconnected',
        qr_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({ 
      success: true, 
      message: 'Sessão desconectada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desconectar sessão:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar sessão
router.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: session, error } = await req.supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Destruir sessão ativa
    await req.whatsappManager.destroySession(session.session_id);

    // Deletar do banco
    const { error: deleteError } = await req.supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ 
      success: true, 
      message: 'Sessão deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar sessão:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter QR code da sessão
router.get('/sessions/:id/qr', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: session, error } = await req.supabase
      .from('whatsapp_sessions')
      .select('session_id, qr_code')
      .eq('id', id)
      .single();

    if (error) throw error;

    const state = req.whatsappManager.getSessionState(session.session_id);
    
    res.json({ 
      success: true, 
      data: {
        qr_code: state?.qrCode || session.qr_code,
        status: state?.status || 'disconnected'
      }
    });

  } catch (error) {
    console.error('Erro ao obter QR code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enviar mensagem
router.post('/sessions/:id/send-message', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone_number, message, media_url } = req.body;

    if (!phone_number || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Número de telefone e mensagem são obrigatórios' 
      });
    }

    const { data: session, error } = await req.supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Verificar se sessão está conectada
    if (!req.whatsappManager.isSessionConnected(session.session_id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sessão não está conectada' 
      });
    }

    // Enviar mensagem
    const result = await req.whatsappManager.sendMessage(
      session.session_id, 
      phone_number, 
      message, 
      media_url
    );

    // Atualizar estatísticas
    await req.supabase.rpc('update_session_stats', {
      session_id: session.id,
      stat_type: 'sent',
      increment_by: 1
    });

    res.json({ 
      success: true, 
      data: result,
      message: 'Mensagem enviada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    
    // Atualizar estatísticas de falha
    try {
      const { id } = req.params;
      const { data: session } = await req.supabase
        .from('whatsapp_sessions')
        .select('id')
        .eq('id', id)
        .single();

      if (session) {
        await req.supabase.rpc('update_session_stats', {
          session_id: session.id,
          stat_type: 'failed',
          increment_by: 1
        });
      }
    } catch (statsError) {
      console.error('Erro ao atualizar estatísticas de falha:', statsError);
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

// Atualizar configurações da sessão
router.put('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Campos permitidos para atualização
    const allowedFields = [
      'session_name', 
      'auto_reconnect', 
      'daily_message_limit',
      'message_delay_min',
      'message_delay_max'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum campo válido para atualização' 
      });
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { data: session, error } = await req.supabase
      .from('whatsapp_sessions')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      data: session,
      message: 'Sessão atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter estatísticas da sessão
router.get('/sessions/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: session, error } = await req.supabase
      .from('whatsapp_sessions')
      .select('message_stats, restart_count, last_connected_at, created_at')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Calcular estatísticas adicionais
    const stats = {
      ...session.message_stats,
      restart_count: session.restart_count,
      last_connected_at: session.last_connected_at,
      uptime_days: session.last_connected_at 
        ? Math.floor((new Date() - new Date(session.last_connected_at)) / (1000 * 60 * 60 * 24))
        : 0,
      total_days: Math.floor((new Date() - new Date(session.created_at)) / (1000 * 60 * 60 * 24))
    };

    res.json({ success: true, data: stats });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
