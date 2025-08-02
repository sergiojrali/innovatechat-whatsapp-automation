// Carregar variáveis de ambiente
require('dotenv').config();
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const WhatsAppManager = require('./whatsappManager');

// Configurar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// Instância do gerenciador WhatsApp
const whatsappManager = new WhatsAppManager(supabase);

console.log('🤖 Processador de Campanhas iniciado');

// Job para processar campanhas agendadas (executa a cada minuto)
cron.schedule('* * * * *', async () => {
  try {
    console.log('[Campaign Processor] Verificando campanhas agendadas...');
    
    // Buscar campanhas agendadas que devem ser executadas
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        whatsapp_sessions!inner(id, session_id, status),
        contact_lists!inner(id, name)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());
      
    if (error) {
      console.error('[Campaign Processor] Erro ao buscar campanhas:', error);
      return;
    }
    
    if (campaigns && campaigns.length > 0) {
      console.log(`[Campaign Processor] Encontradas ${campaigns.length} campanhas para processar`);
      
      for (const campaign of campaigns) {
        await processCampaign(campaign);
      }
    }
  } catch (err) {
    console.error('[Campaign Processor] Erro na execução:', err);
  }
});

// Job para verificar sessões desconectadas e tentar reconectar (executa a cada 5 minutos)
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('[Session Monitor] Verificando sessões desconectadas...');
    
    // Buscar sessões que devem ser reconectadas
    const { data: sessions, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('auto_reconnect', true)
      .eq('status', 'disconnected')
      .lt('restart_count', 5); // Máximo 5 tentativas
      
    if (error) {
      console.error('[Session Monitor] Erro ao buscar sessões:', error);
      return;
    }
    
    if (sessions && sessions.length > 0) {
      console.log(`[Session Monitor] Tentando reconectar ${sessions.length} sessões`);
      
      for (const session of sessions) {
        try {
          console.log(`[Session Monitor] Reconectando sessão: ${session.session_name}`);
          
          // Incrementar contador de restart
          await supabase.rpc('increment_restart_count', { 
            session_id: session.id 
          });
          
          // Tentar reconectar
          await whatsappManager.createSession(session.id, session.session_id);
          
        } catch (sessionError) {
          console.error(`[Session Monitor] Erro ao reconectar ${session.session_name}:`, sessionError);
        }
      }
    }
  } catch (err) {
    console.error('[Session Monitor] Erro na execução:', err);
  }
});

// Job para limpeza de dados antigos (executa diariamente às 2:00)
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('[Data Cleanup] Iniciando limpeza de dados antigos...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Limpar logs de auditoria antigos
    const { error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());
    
    if (auditError) {
      console.error('[Data Cleanup] Erro ao limpar audit logs:', auditError);
    } else {
      console.log('[Data Cleanup] Audit logs antigos removidos');
    }
    
    // Limpar QR codes antigos (mais de 1 dia)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { error: qrError } = await supabase
      .from('whatsapp_sessions')
      .update({ qr_code: null })
      .not('qr_code', 'is', null)
      .lt('updated_at', oneDayAgo.toISOString());
    
    if (qrError) {
      console.error('[Data Cleanup] Erro ao limpar QR codes:', qrError);
    } else {
      console.log('[Data Cleanup] QR codes antigos removidos');
    }
    
    console.log('[Data Cleanup] Limpeza concluída');
    
  } catch (err) {
    console.error('[Data Cleanup] Erro na execução:', err);
  }
});

// Job para atualizar estatísticas do sistema (executa a cada hora)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('[Stats Update] Atualizando estatísticas do sistema...');
    
    // Contar sessões ativas
    const activeSessions = whatsappManager.getActiveSessions();
    
    // Buscar estatísticas gerais
    const { data: campaignStats } = await supabase
      .from('campaigns')
      .select('status');
    
    const { data: messageStats } = await supabase
      .from('campaign_messages')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    // Salvar estatísticas no sistema
    await supabase
      .from('system_config')
      .upsert({
        key: 'system_stats',
        value: {
          active_sessions: activeSessions.length,
          campaigns_today: campaignStats?.filter(c => 
            new Date(c.created_at).toDateString() === new Date().toDateString()
          ).length || 0,
          messages_24h: messageStats?.length || 0,
          messages_sent_24h: messageStats?.filter(m => m.status === 'sent').length || 0,
          last_updated: new Date().toISOString()
        },
        description: 'Estatísticas gerais do sistema',
        updated_at: new Date().toISOString()
      });
    
    console.log(`[Stats Update] Estatísticas atualizadas - ${activeSessions.length} sessões ativas`);
    
  } catch (err) {
    console.error('[Stats Update] Erro na execução:', err);
  }
});

// Função para processar uma campanha específica
async function processCampaign(campaign) {
  try {
    console.log(`[Campaign Processor] Processando campanha: ${campaign.name}`);
    
    // Verificar se a sessão está conectada
    if (!whatsappManager.isSessionConnected(campaign.whatsapp_sessions.session_id)) {
      console.log(`[Campaign Processor] Sessão não conectada para campanha: ${campaign.name}`);
      
      // Marcar campanha como falha
      await supabase
        .from('campaigns')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id);
      
      return;
    }
    
    // Buscar contatos da lista
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('list_id', campaign.list_id)
      .eq('is_active', true);
    
    if (contactsError) {
      console.error(`[Campaign Processor] Erro ao buscar contatos:`, contactsError);
      return;
    }
    
    if (!contacts || contacts.length === 0) {
      console.log(`[Campaign Processor] Nenhum contato ativo encontrado para: ${campaign.name}`);
      
      // Marcar campanha como concluída (sem contatos)
      await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_recipients: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id);
      
      return;
    }
    
    // Atualizar status da campanha para 'sending'
    await supabase
      .from('campaigns')
      .update({
        status: 'sending',
        started_at: new Date().toISOString(),
        total_recipients: contacts.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id);
    
    // Criar mensagens da campanha
    const campaignMessages = contacts.map(contact => ({
      campaign_id: campaign.id,
      contact_id: contact.id,
      phone_number: contact.phone_number,
      message_content: replaceVariables(campaign.message_content, contact.variables || {}),
      message_type: campaign.message_type,
      media_url: campaign.media_url,
      status: 'pending'
    }));
    
    const { data: createdMessages, error: messagesError } = await supabase
      .from('campaign_messages')
      .insert(campaignMessages)
      .select();
    
    if (messagesError) {
      console.error(`[Campaign Processor] Erro ao criar mensagens:`, messagesError);
      return;
    }
    
    console.log(`[Campaign Processor] Criadas ${createdMessages.length} mensagens para: ${campaign.name}`);
    
    // Processar mensagens em background
    processCampaignMessages(campaign, createdMessages);
    
  } catch (error) {
    console.error(`[Campaign Processor] Erro ao processar campanha ${campaign.name}:`, error);
    
    // Marcar campanha como falha
    await supabase
      .from('campaigns')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id);
  }
}

// Função para processar mensagens da campanha
async function processCampaignMessages(campaign, messages) {
  console.log(`[Message Processor] Iniciando envio de ${messages.length} mensagens`);
  
  let sentCount = 0;
  let failedCount = 0;
  
  for (const message of messages) {
    try {
      // Verificar se campanha foi pausada
      const { data: currentCampaign } = await supabase
        .from('campaigns')
        .select('status')
        .eq('id', campaign.id)
        .single();
      
      if (currentCampaign?.status === 'paused') {
        console.log(`[Message Processor] Campanha pausada: ${campaign.name}`);
        break;
      }
      
      // Verificar se sessão ainda está conectada
      if (!whatsappManager.isSessionConnected(campaign.whatsapp_sessions.session_id)) {
        console.log(`[Message Processor] Sessão desconectada: ${campaign.name}`);
        
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
      console.log(`[Message Processor] Enviada ${sentCount}/${messages.length} - ${message.phone_number}`);
      
      // Delay entre mensagens (5-15 segundos)
      const delay = Math.random() * 10000 + 5000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      console.error(`[Message Processor] Erro ao enviar para ${message.phone_number}:`, error);
      
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
  
  // Atualizar estatísticas finais da campanha
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
  
  console.log(`[Message Processor] Campanha ${campaign.name} finalizada:`);
  console.log(`  - Enviadas: ${stats.sent}`);
  console.log(`  - Falharam: ${stats.failed}`);
  console.log(`  - Status: ${isCompleted ? 'Concluída' : 'Em andamento'}`);
}

// Função auxiliar para substituir variáveis
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

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando processador de campanhas...');
  await whatsappManager.destroyAllSessions();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Encerrando processador de campanhas...');
  await whatsappManager.destroyAllSessions();
  process.exit(0);
});

console.log('✅ Processador de Campanhas configurado e rodando');
console.log('📅 Jobs agendados:');
console.log('  - Campanhas agendadas: a cada minuto');
console.log('  - Monitor de sessões: a cada 5 minutos');
console.log('  - Limpeza de dados: diariamente às 2:00');
console.log('  - Atualização de stats: a cada hora');
