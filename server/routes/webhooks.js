const express = require('express');
const router = express.Router();

// Webhook para receber eventos do WhatsApp (para integrações externas)
router.post('/whatsapp', async (req, res) => {
  try {
    const eventData = req.body;
    console.log('[Webhook WhatsApp] Evento recebido:', eventData);

    // Processar diferentes tipos de eventos
    switch (eventData.type) {
      case 'message_status':
        await handleMessageStatusUpdate(req.supabase, eventData);
        break;
      
      case 'session_status':
        await handleSessionStatusUpdate(req.supabase, req.whatsappManager, eventData);
        break;
      
      case 'incoming_message':
        await handleIncomingMessage(req.supabase, eventData);
        break;
      
      default:
        console.log(`[Webhook] Tipo de evento não reconhecido: ${eventData.type}`);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Webhook processado com sucesso' 
    });

  } catch (error) {
    console.error('[Webhook WhatsApp] Erro ao processar:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao processar webhook' 
    });
  }
});

// Webhook para notificações de sistema
router.post('/system', async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log('[Webhook Sistema] Evento recebido:', { type, data });

    switch (type) {
      case 'campaign_scheduled':
        await handleScheduledCampaign(req.supabase, req.whatsappManager, data);
        break;
      
      case 'session_cleanup':
        await handleSessionCleanup(req.whatsappManager, data);
        break;
      
      case 'health_check':
        await handleHealthCheck(req.supabase, req.whatsappManager);
        break;
      
      default:
        console.log(`[Webhook Sistema] Tipo não reconhecido: ${type}`);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Webhook de sistema processado' 
    });

  } catch (error) {
    console.error('[Webhook Sistema] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao processar webhook de sistema' 
    });
  }
});

// Webhook para integração com CRM/ERP externos
router.post('/integration/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const integrationData = req.body;
    
    console.log(`[Webhook Integração] ${service.toUpperCase()}:`, integrationData);

    switch (service.toLowerCase()) {
      case 'crm':
        await handleCRMIntegration(req.supabase, integrationData);
        break;
      
      case 'erp':
        await handleERPIntegration(req.supabase, integrationData);
        break;
      
      case 'zapier':
        await handleZapierIntegration(req.supabase, req.whatsappManager, integrationData);
        break;
      
      default:
        return res.status(400).json({ 
          success: false, 
          error: `Serviço de integração não suportado: ${service}` 
        });
    }

    res.status(200).json({ 
      success: true, 
      message: `Integração ${service} processada com sucesso` 
    });

  } catch (error) {
    console.error(`[Webhook Integração] Erro em ${req.params.service}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao processar integração' 
    });
  }
});

// Funções auxiliares para processar eventos

async function handleMessageStatusUpdate(supabase, eventData) {
  try {
    const { message_id, status, timestamp } = eventData;
    
    // Atualizar status da mensagem da campanha
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    // Adicionar timestamp específico baseado no status
    switch (status) {
      case 'delivered':
        updateData.delivered_at = new Date(timestamp).toISOString();
        break;
      case 'read':
        updateData.read_at = new Date(timestamp).toISOString();
        break;
      case 'failed':
        updateData.failed_at = new Date(timestamp).toISOString();
        updateData.error_message = eventData.error_message || 'Falha no envio';
        break;
    }

    await supabase
      .from('campaign_messages')
      .update(updateData)
      .eq('whatsapp_message_id', message_id);

    console.log(`[Webhook] Status da mensagem ${message_id} atualizado para: ${status}`);

  } catch (error) {
    console.error('[Webhook] Erro ao atualizar status da mensagem:', error);
  }
}

async function handleSessionStatusUpdate(supabase, whatsappManager, eventData) {
  try {
    const { session_id, status, error_message } = eventData;

    // Atualizar status no banco
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (error_message) {
      updateData.connection_error = error_message;
      updateData.last_error_at = new Date().toISOString();
    }

    if (status === 'connected') {
      updateData.last_connected_at = new Date().toISOString();
      updateData.connection_error = null;
    }

    await supabase
      .from('whatsapp_sessions')
      .update(updateData)
      .eq('session_id', session_id);

    console.log(`[Webhook] Status da sessão ${session_id} atualizado para: ${status}`);

  } catch (error) {
    console.error('[Webhook] Erro ao atualizar status da sessão:', error);
  }
}

async function handleIncomingMessage(supabase, eventData) {
  try {
    const { session_id, from, message, timestamp, message_type } = eventData;

    // Buscar sessão
    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('id, user_id')
      .eq('session_id', session_id)
      .single();

    if (!session) {
      console.log(`[Webhook] Sessão não encontrada: ${session_id}`);
      return;
    }

    // Buscar ou criar conversa
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', session.id)
      .eq('phone_number', from)
      .single();

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          user_id: session.user_id,
          session_id: session.id,
          phone_number: from,
          contact_name: eventData.contact_name || from,
          unread_count: 0
        })
        .select()
        .single();
      
      conversation = newConversation;
    }

    // Salvar mensagem
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        whatsapp_message_id: eventData.message_id,
        phone_number: from,
        content: message,
        message_type: message_type || 'text',
        media_url: eventData.media_url,
        is_from_contact: true,
        timestamp: new Date(timestamp).toISOString()
      });

    // Atualizar conversa
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date(timestamp).toISOString(),
        last_message_preview: message.substring(0, 100),
        unread_count: conversation.unread_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id);

    console.log(`[Webhook] Mensagem recebida de ${from} salva na conversa ${conversation.id}`);

  } catch (error) {
    console.error('[Webhook] Erro ao processar mensagem recebida:', error);
  }
}

async function handleScheduledCampaign(supabase, whatsappManager, data) {
  try {
    const { campaign_id } = data;

    // Buscar campanha agendada
    const { data: campaign } = await supabase
      .from('campaigns')
      .select(`
        *,
        whatsapp_sessions!inner(id, session_id, status)
      `)
      .eq('id', campaign_id)
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .single();

    if (!campaign) {
      console.log(`[Webhook] Campanha agendada não encontrada: ${campaign_id}`);
      return;
    }

    // Verificar se sessão está conectada
    if (!whatsappManager.isSessionConnected(campaign.whatsapp_sessions.session_id)) {
      console.log(`[Webhook] Sessão não conectada para campanha ${campaign_id}`);
      
      // Marcar campanha como falha
      await supabase
        .from('campaigns')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign_id);
      
      return;
    }

    console.log(`[Webhook] Iniciando campanha agendada: ${campaign.name}`);
    
    // Aqui você chamaria a função de processamento de campanha
    // que está no arquivo campaigns.js
    
  } catch (error) {
    console.error('[Webhook] Erro ao processar campanha agendada:', error);
  }
}

async function handleSessionCleanup(whatsappManager, data) {
  try {
    const { max_inactive_hours = 24 } = data;
    
    console.log(`[Webhook] Iniciando limpeza de sessões inativas (${max_inactive_hours}h)`);
    
    const activeSessions = whatsappManager.getActiveSessions();
    let cleanedCount = 0;

    for (const sessionId of activeSessions) {
      const state = whatsappManager.getSessionState(sessionId);
      
      if (state && state.lastActivity) {
        const hoursInactive = (new Date() - new Date(state.lastActivity)) / (1000 * 60 * 60);
        
        if (hoursInactive > max_inactive_hours) {
          console.log(`[Webhook] Limpando sessão inativa: ${sessionId}`);
          await whatsappManager.destroySession(sessionId);
          cleanedCount++;
        }
      }
    }

    console.log(`[Webhook] Limpeza concluída: ${cleanedCount} sessões removidas`);

  } catch (error) {
    console.error('[Webhook] Erro na limpeza de sessões:', error);
  }
}

async function handleHealthCheck(supabase, whatsappManager) {
  try {
    const activeSessions = whatsappManager.getActiveSessions();
    const timestamp = new Date().toISOString();

    // Registrar health check no sistema
    await supabase
      .from('system_config')
      .upsert({
        key: 'last_health_check',
        value: {
          timestamp: timestamp,
          active_sessions: activeSessions.length,
          status: 'healthy'
        },
        description: 'Último health check do sistema',
        updated_at: timestamp
      });

    console.log(`[Webhook] Health check realizado: ${activeSessions.length} sessões ativas`);

  } catch (error) {
    console.error('[Webhook] Erro no health check:', error);
  }
}

async function handleCRMIntegration(supabase, data) {
  try {
    const { action, contact_data, campaign_data } = data;

    switch (action) {
      case 'create_contact':
        // Criar contato no sistema
        await supabase
          .from('contacts')
          .insert({
            phone_number: contact_data.phone,
            name: contact_data.name,
            variables: contact_data.custom_fields || {},
            list_id: contact_data.list_id
          });
        break;

      case 'trigger_campaign':
        // Disparar campanha específica
        await supabase
          .from('campaigns')
          .update({
            status: 'scheduled',
            scheduled_at: new Date().toISOString()
          })
          .eq('id', campaign_data.campaign_id);
        break;
    }

    console.log(`[Webhook CRM] Ação processada: ${action}`);

  } catch (error) {
    console.error('[Webhook CRM] Erro:', error);
  }
}

async function handleERPIntegration(supabase, data) {
  try {
    const { event_type, order_data, customer_data } = data;

    // Exemplo: criar contato quando novo pedido é criado
    if (event_type === 'new_order' && customer_data) {
      await supabase
        .from('contacts')
        .upsert({
          phone_number: customer_data.phone,
          name: customer_data.name,
          variables: {
            customer_id: customer_data.id,
            last_order: order_data.id,
            order_value: order_data.total
          }
        });
    }

    console.log(`[Webhook ERP] Evento processado: ${event_type}`);

  } catch (error) {
    console.error('[Webhook ERP] Erro:', error);
  }
}

async function handleZapierIntegration(supabase, whatsappManager, data) {
  try {
    const { trigger_type, payload } = data;

    switch (trigger_type) {
      case 'send_message':
        // Enviar mensagem via Zapier
        const { session_id, phone_number, message } = payload;
        
        if (whatsappManager.isSessionConnected(session_id)) {
          await whatsappManager.sendMessage(session_id, phone_number, message);
        }
        break;

      case 'create_campaign':
        // Criar campanha via Zapier
        await supabase
          .from('campaigns')
          .insert({
            name: payload.name,
            message_content: payload.message,
            list_id: payload.list_id,
            session_id: payload.session_id,
            status: 'draft'
          });
        break;
    }

    console.log(`[Webhook Zapier] Trigger processado: ${trigger_type}`);

  } catch (error) {
    console.error('[Webhook Zapier] Erro:', error);
  }
}

module.exports = router;
