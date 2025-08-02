import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// URL base da API do backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com/api' 
  : 'http://localhost:4000/api';

export const campaignService = {
  // Message Templates
  async getMessageTemplates() {
    const { data, error } = await supabase?.from('message_templates')?.select('*')?.eq('is_active', true)?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createMessageTemplate(templateData) {
    const { data, error } = await supabase?.from('message_templates')?.insert([templateData])?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async updateMessageTemplate(id, updates) {
    const { data, error } = await supabase?.from('message_templates')?.update(updates)?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async deleteMessageTemplate(id) {
    const { error } = await supabase?.from('message_templates')?.update({ is_active: false })?.eq('id', id);
    
    if (error) throw error;
  },

  // Campaigns
  async getCampaigns() {
    const { data, error } = await supabase?.from('campaigns')?.select(`
        *,
        whatsapp_sessions(session_name, phone_number),
        contact_lists(name),
        message_templates(name)
      `)?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getCampaignById(id) {
    const { data, error } = await supabase?.from('campaigns')?.select(`
        *,
        whatsapp_sessions(session_name, phone_number),
        contact_lists(name),
        message_templates(name, content)
      `)?.eq('id', id)?.single();
    
    if (error) throw error;
    return data;
  },

  async createCampaign(campaignData) {
    const { data, error } = await supabase?.from('campaigns')?.insert([campaignData])?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async updateCampaign(id, updates) {
    const { data, error } = await supabase?.from('campaigns')?.update(updates)?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async deleteCampaign(id) {
    const { error } = await supabase?.from('campaigns')?.delete()?.eq('id', id);
    
    if (error) throw error;
  },

  // Campaign Messages
  async getCampaignMessages(campaignId) {
    const { data, error } = await supabase?.from('campaign_messages')?.select(`
        *,
        contacts(name, phone_number)
      `)?.eq('campaign_id', campaignId)?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createCampaignMessage(messageData) {
    const { data, error } = await supabase?.from('campaign_messages')?.insert([messageData])?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async updateCampaignMessage(id, updates) {
    const { data, error } = await supabase?.from('campaign_messages')?.update(updates)?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async bulkCreateCampaignMessages(messages) {
    const { data, error } = await supabase?.from('campaign_messages')?.insert(messages)?.select();
    
    if (error) throw error;
    return data;
  },

  // Campaign Statistics
  async getCampaignStats(campaignId) {
    const { data, error } = await supabase?.from('campaign_messages')?.select('status')?.eq('campaign_id', campaignId);
    
    if (error) throw error;
    
    const stats = {
      total: data?.length,
      pending: data?.filter(m => m?.status === 'pending')?.length,
      sent: data?.filter(m => m?.status === 'sent')?.length,
      delivered: data?.filter(m => m?.status === 'delivered')?.length,
      read: data?.filter(m => m?.status === 'read')?.length,
      failed: data?.filter(m => m?.status === 'failed')?.length,
    };
    
    return stats;
  },

  // Start campaign (prepare messages)
  async startCampaign(campaignId) {
    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase?.from('campaigns')?.select(`
        *,
        contact_lists!inner(id)
      `)?.eq('id', campaignId)?.single();
    
    if (campaignError) throw campaignError;
    
    // Get contacts from the campaign's list
    const { data: contacts, error: contactsError } = await supabase?.from('contacts')?.select('*')?.eq('list_id', campaign?.list_id)?.eq('is_active', true);
    
    if (contactsError) throw contactsError;
    
    // Create campaign messages for each contact
    const messages = contacts?.map(contact => {
      // Replace variables in message content
      let messageContent = campaign?.message_content;
      if (contact?.variables) {
        Object.entries(contact?.variables)?.forEach(([key, value]) => {
          messageContent = messageContent?.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
      }
      
      return {
        campaign_id: campaignId,
        contact_id: contact?.id,
        phone_number: contact?.phone_number,
        message_content: messageContent,
        message_type: campaign?.message_type,
        media_url: campaign?.media_url,
        status: 'pending'
      };
    });
    
    // Insert campaign messages
    const { data: createdMessages, error: messagesError } = await supabase?.from('campaign_messages')?.insert(messages)?.select();
    
    if (messagesError) throw messagesError;
    
    // Update campaign status and stats
    await supabase?.from('campaigns')?.update({
        status: 'sending',
        started_at: new Date()?.toISOString(),
        total_recipients: contacts?.length
      })?.eq('id', campaignId);
    
    return createdMessages;
  },

  // Subscribe to campaign changes
  subscribeToCampaignChanges(callback) {
    const channel = supabase?.channel('campaigns')?.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns' },
        callback
      )?.subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  },

  // Métodos de integração com o backend
  
  // Processar campanha (enviar mensagens)
  async processCampaign(campaignId) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      logger.log(`Campanha ${campaignId} iniciada:`, result.message);
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao processar campanha:', error);
      return { data: null, error };
    }
  },

  // Pausar campanha
  async pauseCampaign(campaignId) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/pause`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      logger.log(`Campanha ${campaignId} pausada:`, result.message);
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao pausar campanha:', error);
      return { data: null, error };
    }
  },

  // Retomar campanha
  async resumeCampaign(campaignId) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/resume`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      logger.log(`Campanha ${campaignId} retomada:`, result.message);
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao retomar campanha:', error);
      return { data: null, error };
    }
  },

  // Obter estatísticas detalhadas da campanha
  async getCampaignDetailedStats(campaignId) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/stats`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao obter estatísticas da campanha:', error);
      return { data: null, error };
    }
  }
};
