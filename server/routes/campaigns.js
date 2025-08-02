const express = require('express');
const router = express.Router();

// Processar campanha (enviar mensagens)
router.post('/:id/process', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar campanha
    const { data: campaign, error: campaignError } = await req.supabase
      .from('campaigns')
      .select(`
        *,
        whatsapp_sessions!inner(id, session_id, status),
        contact_lists!inner(id, name)
      `)
      .eq('id', id)
      .single();

    if (campaignError) throw campaignError;

    // Verificar se a sessão está conectada
    if (!req.whatsappManager.isSessionConnected(campaign.whatsapp_sessions.session_id)) {
      return res.status(400).json({
        success: false,
        error: 'Sessão do WhatsApp não está conectada'
      });
    }

    // Verificar se campanha já está sendo processada
    if (campaign.status === 'sending') {
      return res.status(400).json({
        success: false,
        error: 'Campanha já está sendo processada'
      });
    }

    // Buscar contatos da lista
    const { data: contacts, error: contactsError } = await req.supabase
      .from('contacts')
      .select('*')
      .eq('list_id', campaign.list_id)
      .eq('is_active', true);

    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum contato ativo encontrado na lista'
      });
    }

    // Atualizar status da campanha para 'sending'
    await req.supabase
      .from('campaigns')
      .update({
        status: 'sending',
        started_at: new Date().toISOString(),
        total_recipients: contacts.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Criar mensagens da campanha
    const campaignMessages = contacts.map(contact => ({
      campaign_id: id,
      contact_id: contact.id,
      phone_number: contact.phone_number,
      message_content: replaceVariables(campaign.message_content, contact.variables || {}),
      message_type: campaign.message_type,
      media_url: campaign.media_url,
      status: 'pending'
    }));

    const { data: createdMessages, error: messagesError } = await req.supabase
      .from('campaign_messages')
      .insert(campaignMessages)
      .select();

    if (messagesError) throw messagesError;

    // Processar mensagens em background
    processCampaignMessages(
      req.whatsappManager,
      req.supabase,
      campaign,
      createdMessages
    );

    res.json({
      success: true,
      message: 'Campanha iniciada com sucesso',
      data: {
        campaign_id: id,
        total_recipients: contacts.length,
        status: 'sending'
      }
    });

  } catch (error) {
    console.error('Erro ao processar campanha:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pausar campanha
router.post('/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: campaign, error } = await req.supabase
      .from('campaigns')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Campanha pausada com sucesso',
      data: campaign
    });

  } catch (error) {
    console.error('Erro ao pausar campanha:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Retomar campanha
router.post('/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar campanha
    const { data: campaign, error: campaignError } = await req.supabase
      .from('campaigns')
      .select(`
        *,
        whatsapp_sessions!inner(id, session_id, status)
      `)
      .eq('id', id)
      .single();

    if (campaignError) throw campaignError;

    // Verificar se a sessão está conectada
    if (!req.whatsappManager.isSessionConnected(campaign.whatsapp_sessions.session_id)) {
      return res.status(400).json({
        success: false,
        error: 'Sessão do WhatsApp não está conectada'
      });
    }

    // Atualizar status
    await req.supabase
      .from('campaigns')
      .update({
        status: 'sending',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Buscar mensagens pendentes
    const { data: pendingMessages, error: messagesError } = await req.supabase
      .from('campaign_messages')
      .select('*')
      .eq('campaign_id', id)
      .eq('status', 'pending');

    if (messagesError) throw messagesError;

    if (pendingMessages && pendingMessages.length > 0) {
      // Retomar processamento
      processCampaignMessages(
        req.whatsappManager,
        req.supabase,
        campaign,
        pendingMessages
      );
    }

    res.json({
      success: true,
      message: 'Campanha retomada com sucesso',
      data: { pending_messages: pendingMessages?.length || 0 }
    });

  } catch (error) {
    console.error('Erro ao retomar campanha:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter estatísticas da campanha
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar estatísticas das mensagens
    const { data: messageStats, error: statsError } = await req.supabase
      .from('campaign_messages')
      .select('status')
      .eq('campaign_id', id);

    if (statsError) throw statsError;

    // Calcular estatísticas
    const stats = {
      total: messageStats.length,
      pending: messageStats.filter(m => m.status === 'pending').length,
      sent: messageStats.filter(m => m.status === 'sent').length,
      delivered: messageStats.filter(m => m.status === 'delivered').length,
      read: messageStats.filter(m => m.status === 'read').length,
      failed: messageStats.filter(m => m.status === 'failed').length
    };

    // Calcular porcentagens
    const percentages = {
      sent: stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0,
      delivered: stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0,
      read: stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0,
      failed: stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0
    };

    res.json({
      success: true,
      data: {
        counts: stats,
        percentages: percentages
      }
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas da campanha:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter mensagens da campanha
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, status } = req.query;

    const offset = (page - 1) * limit;

    let query = req.supabase
      .from('campaign_messages')
      .select(`
        *,
        contacts(name, phone_number)
      `)
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: messages.length
      }
    });

  } catch (error) {
    console.error('Erro ao obter mensagens da campanha:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Função auxiliar para substituir variáveis na mensagem
function replaceVariables(message, variables) {
  let processedMessage = message;
  
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    processedMessage = processedMessage.replace(
      new RegExp(placeholder, 'g'), 
      variables[key] || ''
    );
  });

  return processedMessage;
}

// Função para processar mensagens da campanha em background
async function processCampaignMessages(whatsappManager, supabase, campaign, messages) {
  console.log(`🚀 Iniciando processamento de ${messages.length} mensagens da campanha: ${campaign.name}`);

  let sentCount = 0;
  let failedCount = 0;
  let deliveredCount = 0;
  let readCount = 0;

  for (const message of messages) {
    try {
      // Verificar se campanha foi pausada
      const { data: currentCampaign } = await supabase
        .from('campaigns')
        .select('status')
        .eq('id', campaign.id)
        .single();

      if (currentCampaign?.status === 'paused') {
        console.log(`⏸️ Campanha ${campaign.name} foi pausada`);
        break;
      }

      // Verificar se sessão ainda está conectada
      if (!whatsappManager.isSessionConnected(campaign.whatsapp_sessions.session_id)) {
        console.log(`❌ Sessão desconectada durante campanha ${campaign.name}`);
        
        // Marcar mensagens restantes como falha
        await supabase
          .from('campaign_messages')
          .update({
            status: 'failed',
            error_message: 'Sessão do WhatsApp desconectada',
            failed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('campaign_id', campaign.id)
          .eq('status', 'pending');

        break;
      }

      // Enviar mensagem
      const result = await whatsappManager.sendMessage(
        campaign.whatsapp_sessions.session_id,
        message.phone_number,
        message.message_content,
        message.media_url
      );

      // Atualizar status da mensagem
      await supabase
        .from('campaign_messages')
        .update({
          status: 'sent',
          whatsapp_message_id: result.messageId,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', message.id);

      sentCount++;
      console.log(`📤 Mensagem enviada para ${message.phone_number} (${sentCount}/${messages.length})`);

      // Delay entre mensagens
      const delayMin = campaign.delay_between_messages || 5;
      const delayMax = Math.max(delayMin + 5, 15);
      const delay = Math.random() * (delayMax - delayMin) + delayMin;
      
      await new Promise(resolve => setTimeout(resolve, delay * 1000));

    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para ${message.phone_number}:`, error);

      // Marcar mensagem como falha
      await supabase
        .from('campaign_messages')
        .update({
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', message.id);

      failedCount++;
    }
  }

  // Verificar se todas as mensagens foram processadas
  const { data: remainingMessages } = await supabase
    .from('campaign_messages')
    .select('status')
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending');

  const isCompleted = !remainingMessages || remainingMessages.length === 0;

  // Atualizar estatísticas da campanha
  const { data: finalStats } = await supabase
    .from('campaign_messages')
    .select('status')
    .eq('campaign_id', campaign.id);

  const stats = {
    sent: finalStats.filter(m => m.status === 'sent').length,
    delivered: finalStats.filter(m => m.status === 'delivered').length,
    read: finalStats.filter(m => m.status === 'read').length,
    failed: finalStats.filter(m => m.status === 'failed').length
  };

  await supabase
    .from('campaigns')
    .update({
      status: isCompleted ? 'completed' : 'sending',
      completed_at: isCompleted ? new Date().toISOString() : null,
      messages_sent: stats.sent,
      messages_delivered: stats.delivered,
      messages_read: stats.read,
      messages_failed: stats.failed,
      updated_at: new Date().toISOString()
    })
    .eq('id', campaign.id);

  console.log(`✅ Processamento da campanha ${campaign.name} finalizado:`);
  console.log(`   - Enviadas: ${stats.sent}`);
  console.log(`   - Entregues: ${stats.delivered}`);
  console.log(`   - Lidas: ${stats.read}`);
  console.log(`   - Falharam: ${stats.failed}`);
  console.log(`   - Status: ${isCompleted ? 'Concluída' : 'Em andamento'}`);
}

module.exports = router;
