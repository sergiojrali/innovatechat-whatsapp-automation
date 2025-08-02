import { supabase } from '../lib/supabase';
import { aiService } from './aiService';
import { agentService } from './agentService';
import { queueService } from './queueService';
import { templateService } from './templateService';

export const chatService = {
  // Conversations
  async getConversations(sessionId = null, sectorId = null, agentId = null) {
    let query = supabase?.from('conversations')?.select(`
        *,
        whatsapp_sessions(session_name, phone_number),
        contacts(name),
        sectors(name, color),
        agents(full_name, email)
      `);
    
    if (sessionId) {
      query = query?.eq('session_id', sessionId);
    }
    
    if (sectorId) {
      query = query?.eq('sector_id', sectorId);
    }
    
    if (agentId) {
      query = query?.eq('assigned_agent_id', agentId);
    }
    
    const { data, error } = await query?.order('last_message_at', { ascending: false, nullsFirst: false })?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get conversations for agent (restricted by sector)
  async getConversationsForAgent(agentUserId) {
    const agent = await agentService.getAgentByUserId(agentUserId);
    if (!agent) {
      throw new Error('Atendente não encontrado');
    }

    return await this.getConversations(null, agent.sector_id, agent.id);
  },

  async getConversationById(id) {
    const { data, error } = await supabase?.from('conversations')?.select(`
        *,
        whatsapp_sessions(session_name, phone_number),
        contacts(name)
      `)?.eq('id', id)?.single();
    
    if (error) throw error;
    return data;
  },

  async createConversation(conversationData) {
    const { data, error } = await supabase?.from('conversations')?.insert([conversationData])?.select()?.single();
    
    if (error) throw error;

    // Se há um setor definido, tentar atribuição automática
    if (conversationData.sector_id) {
      try {
        await queueService.autoAssignConversation(data.id, conversationData.sector_id);
      } catch (err) {
        console.error('Erro na atribuição automática:', err);
      }
    }

    return data;
  },

  async updateConversation(id, updates) {
    const { data, error } = await supabase?.from('conversations')?.update(updates)?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async markConversationAsRead(id) {
    const { data, error } = await supabase?.from('conversations')?.update({ unread_count: 0 })?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async archiveConversation(id, isArchived = true) {
    const { data, error } = await supabase?.from('conversations')?.update({ is_archived: isArchived })?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  // Chat Messages
  async getChatMessages(conversationId, limit = 50, offset = 0) {
    const { data, error } = await supabase?.from('chat_messages')?.select('*')?.eq('conversation_id', conversationId)?.order('timestamp', { ascending: false })?.range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data?.reverse(); // Return in chronological order
  },

  async createChatMessage(messageData) {
    const { data, error } = await supabase?.from('chat_messages')?.insert([messageData])?.select()?.single();
    
    if (error) throw error;
    
    // Update conversation last message info
    await this.updateConversationLastMessage(
      messageData?.conversation_id, 
      messageData?.content,
      messageData?.is_from_contact
    );
    
    return data;
  },

  async updateConversationLastMessage(conversationId, messageContent, isFromContact) {
    const updates = {
      last_message_at: new Date()?.toISOString(),
      last_message_preview: messageContent?.substring(0, 100) || ''
    };
    
    // If message is from contact, increment unread count
    if (isFromContact) {
      const { data: conversation } = await supabase?.from('conversations')?.select('unread_count')?.eq('id', conversationId)?.single();
      
      updates.unread_count = (conversation?.unread_count || 0) + 1;
    }
    
    await supabase?.from('conversations')?.update(updates)?.eq('id', conversationId);
  },

  // Send message (outgoing)
  async sendMessage(conversationId, content, messageType = 'text', mediaUrl = null, userId = null) {
    const messageData = {
      conversation_id: conversationId,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      is_from_contact: false,
      timestamp: new Date()?.toISOString()
    };
    
    const message = await this.createChatMessage(messageData);

    // Atualizar tempo de primeira resposta se for a primeira mensagem do atendente
    if (userId) {
      await this.updateFirstResponseTime(conversationId);
    }

    return message;
  },

  // Receive message (incoming)
  async receiveMessage(conversationId, phoneNumber, content, messageType = 'text', mediaUrl = null, whatsappMessageId = null, userId = null) {
    const messageData = {
      conversation_id: conversationId,
      phone_number: phoneNumber,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      is_from_contact: true,
      whatsapp_message_id: whatsappMessageId,
      timestamp: new Date()?.toISOString()
    };
    
    const message = await this.createChatMessage(messageData);

    // Tentar resposta automática com IA se habilitada
    if (userId) {
      try {
        await this.processAutoResponse(conversationId, content, userId);
      } catch (err) {
        console.error('Erro na resposta automática:', err);
      }
    }

    return message;
  },

  // Processar resposta automática com IA
  async processAutoResponse(conversationId, userMessage, userId) {
    try {
      // Buscar conversa para verificar configurações
      const conversation = await this.getConversationById(conversationId);
      if (!conversation || !conversation.ai_enabled) {
        return;
      }

      // Verificar se há configuração de IA ativa
      const aiConfig = await aiService.getActiveAIConfiguration(userId);
      if (!aiConfig || !aiConfig.auto_response_enabled) {
        return;
      }

      // Aguardar delay configurado
      if (aiConfig.response_delay_seconds > 0) {
        await new Promise(resolve => setTimeout(resolve, aiConfig.response_delay_seconds * 1000));
      }

      // Gerar resposta com IA
      const aiResponse = await aiService.generateResponse(
        conversationId,
        userMessage,
        userId,
        aiConfig.system_prompt
      );

      // Enviar resposta automática
      await this.sendMessage(
        conversationId,
        aiResponse.content,
        'text',
        null,
        userId
      );

    } catch (error) {
      console.error('Erro ao processar resposta automática:', error);
    }
  },

  // Processar resposta com template de negócio
  async processTemplateResponse(conversationId, userMessage, templateId, isFirstMessage = false) {
    try {
      const response = await templateService.generateTemplateResponse(
        templateId,
        userMessage,
        { isFirstMessage }
      );

      if (response) {
        await this.sendMessage(
          conversationId,
          response.content,
          'text'
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao processar resposta do template:', error);
      return false;
    }
  },

  // Atualizar tempo de primeira resposta
  async updateFirstResponseTime(conversationId) {
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('created_at, first_response_time')
        .eq('id', conversationId)
        .single();

      if (conversation && !conversation.first_response_time) {
        const firstResponseTime = Math.floor(
          (new Date() - new Date(conversation.created_at)) / 1000
        );

        await supabase
          .from('conversations')
          .update({ first_response_time: firstResponseTime })
          .eq('id', conversationId);
      }
    } catch (error) {
      console.error('Erro ao atualizar tempo de primeira resposta:', error);
    }
  },

  // Avaliar satisfação do cliente
  async rateConversation(conversationId, rating, feedback = null) {
    const updates = {
      customer_satisfaction: rating,
      updated_at: new Date().toISOString()
    };

    if (feedback) {
      updates.tags = ['feedback_received'];
    }

    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;

    // Se há feedback, salvar separadamente
    if (feedback) {
      await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: conversationId,
          content: `Feedback do cliente: ${feedback}`,
          message_type: 'text',
          is_from_contact: false,
          timestamp: new Date().toISOString()
        }]);
    }

    return data;
  },

  // Transferir conversa para outro setor
  async transferConversation(conversationId, toSectorId, reason = null, transferredBy = null) {
    try {
      const conversation = await this.getConversationById(conversationId);
      const fromSectorId = conversation.sector_id;

      // Usar o serviço de fila para transferência
      const result = await queueService.transferToSector(
        conversationId,
        fromSectorId,
        toSectorId,
        reason
      );

      // Adicionar mensagem de sistema sobre a transferência
      await this.createChatMessage({
        conversation_id: conversationId,
        content: `Conversa transferida para outro setor. Motivo: ${reason || 'Não informado'}`,
        message_type: 'text',
        is_from_contact: false,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('Erro ao transferir conversa:', error);
      throw error;
    }
  },

  // Finalizar conversa
  async closeConversation(conversationId, closedBy = null, resolution = null) {
    try {
      const conversation = await this.getConversationById(conversationId);
      const resolutionTime = Math.floor(
        (new Date() - new Date(conversation.created_at)) / 1000 / 60
      );

      const updates = {
        is_archived: true,
        resolution_time: resolutionTime,
        updated_at: new Date().toISOString()
      };

      if (resolution) {
        updates.tags = ['resolved'];
      }

      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;

      // Remover da fila se estiver lá
      await queueService.removeFromQueue(conversationId);

      // Adicionar mensagem de sistema
      await this.createChatMessage({
        conversation_id: conversationId,
        content: resolution || 'Conversa finalizada',
        message_type: 'text',
        is_from_contact: false,
        timestamp: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('Erro ao finalizar conversa:', error);
      throw error;
    }
  },

  // Search conversations
  async searchConversations(searchTerm) {
    const { data, error } = await supabase?.from('conversations')?.select(`
        *,
        whatsapp_sessions(session_name, phone_number),
        contacts(name)
      `)?.or(`contact_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)?.order('last_message_at', { ascending: false, nullsFirst: false });
    
    if (error) throw error;
    return data;
  },

  // Get conversation statistics
  async getConversationStats() {
    const { data, error } = await supabase?.from('conversations')?.select('unread_count, is_archived');
    
    if (error) throw error;
    
    const stats = {
      total: data?.length,
      unread: data?.filter(c => c?.unread_count > 0)?.length,
      archived: data?.filter(c => c?.is_archived)?.length,
      active: data?.filter(c => !c?.is_archived)?.length,
      totalUnreadMessages: data?.reduce((sum, c) => sum + (c?.unread_count || 0), 0)
    };
    
    return stats;
  },

  // Find or create conversation by phone number
  async findOrCreateConversation(sessionId, phoneNumber, contactName = null) {
    // Try to find existing conversation
    let { data: conversation, error } = await supabase?.from('conversations')?.select('*')?.eq('session_id', sessionId)?.eq('phone_number', phoneNumber)?.single();
    
    if (error && error?.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }
    
    // If no conversation exists, create one
    if (!conversation) {
      const { data: newConversation, error: createError } = await supabase?.from('conversations')?.insert([{
          session_id: sessionId,
          phone_number: phoneNumber,
          contact_name: contactName || phoneNumber,
          created_at: new Date()?.toISOString()
        }])?.select()?.single();
      
      if (createError) throw createError;
      conversation = newConversation;
    }
    
    return conversation;
  },

  // Subscribe to conversation changes
  subscribeToConversationChanges(callback) {
    const channel = supabase?.channel('conversations')?.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        callback
      )?.subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  },

  // Subscribe to message changes for a specific conversation
  subscribeToMessageChanges(conversationId, callback) {
    const channel = supabase?.channel(`chat_messages_${conversationId}`)?.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        callback
      )?.subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }
};