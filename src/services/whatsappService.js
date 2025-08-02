import { supabase } from '../lib/supabase';
import { whatsappWebService } from './whatsappWebService';

export const whatsappService = {
  // Get all sessions for current user
  async getSessions() {
    const { data, error } = await supabase?.from('whatsapp_sessions')?.select(`
        *,
        user_profiles!whatsapp_sessions_user_id_fkey (
          full_name,
          email
        )
      `)?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get session by ID
  async getSessionById(id) {
    const { data, error } = await supabase?.from('whatsapp_sessions')?.select(`
        *,
        user_profiles!whatsapp_sessions_user_id_fkey (
          full_name,
          email
        )
      `)?.eq('id', id)?.single();
    
    if (error) throw error;
    return data;
  },

  // Create new session
  async createSession(sessionData) {
    try {
      // Validate required fields
      if (!sessionData?.session_name || !sessionData?.session_id) {
        throw new Error('Nome da sessão e ID da sessão são obrigatórios');
      }

      // Check for duplicate session_id
      const { data: existingSession } = await supabase?.from('whatsapp_sessions')?.select('id')?.eq('session_id', sessionData?.session_id)?.single();

      if (existingSession) {
        throw new Error('Já existe uma sessão com este ID');
      }

      // Create session with WhatsApp Web service
      const session = await whatsappWebService?.createSession({
        session_id: sessionData?.session_id,
        session_name: sessionData?.session_name,
        user_id: sessionData?.user_id,
        auto_reconnect: sessionData?.auto_reconnect || true,
        daily_message_limit: sessionData?.daily_message_limit || 1000,
        message_delay_min: sessionData?.message_delay_min || 3,
        message_delay_max: sessionData?.message_delay_max || 10,
        session_config: sessionData?.session_config || {}
      });

      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  // Update session
  async updateSession(id, updates) {
    try {
      const { data, error } = await supabase?.from('whatsapp_sessions')?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })?.eq('id', id)?.select()?.single();
    
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  // Delete session
  async deleteSession(id) {
    try {
      // Use WhatsApp Web service for proper cleanup
      await whatsappWebService?.deleteSession(id);
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },

  // Connect session
  async connectSession(id) {
    try {
      const result = await whatsappWebService?.connectSession(id);
      return result;
    } catch (error) {
      console.error('Error connecting session:', error);
      throw error;
    }
  },

  // Disconnect session
  async disconnectSession(id) {
    try {
      await whatsappWebService?.disconnectSession(id);
      return true;
    } catch (error) {
      console.error('Error disconnecting session:', error);
      throw error;
    }
  },

  // Update session status
  async updateSessionStatus(id, status, connectionError = null) {
    try {
      return await whatsappWebService?.updateSessionStatus(id, status, connectionError);
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  },

  // Generate QR Code for session
  async generateQRCode(sessionId, qrCodeData) {
    try {
      const { data, error } = await supabase?.from('whatsapp_sessions')?.update({ 
          qr_code: qrCodeData,
          status: 'connecting'
        })?.eq('id', sessionId)?.select()?.single();
    
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  },

  // Get session status
  async getSessionStatus(sessionId) {
    try {
      return await whatsappWebService?.getSessionStatus(sessionId);
    } catch (error) {
      console.error('Error getting session status:', error);
      throw error;
    }
  },

  // Check if session is healthy
  async isSessionHealthy(sessionId) {
    try {
      return await whatsappWebService?.isSessionHealthy(sessionId);
    } catch (error) {
      console.error('Error checking session health:', error);
      return false;
    }
  },

  // Get session statistics  
  async getSessionStats(sessionId) {
    try {
      return await whatsappWebService?.getSessionStats(sessionId);
    } catch (error) {
      console.error('Error getting session stats:', error);
      throw error;
    }
  },

  // Send message
  async sendMessage(sessionId, phoneNumber, message) {
    try {
      return await whatsappWebService?.sendMessage(sessionId, phoneNumber, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Subscribe to session changes
  subscribeToSessionChanges(callback) {
    const channel = supabase?.channel('whatsapp_sessions_changes')?.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_sessions' },
        (payload) => {
          callback(payload);
        }
      )?.subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  },

  // Subscribe to specific session status changes
  subscribeToSessionStatus(sessionId, callback) {
    return whatsappWebService?.onStatusChange(sessionId, callback);
  },

  // Bulk operations
  async bulkUpdateStatus(sessionIds, status) {
    try {
      const promises = sessionIds?.map(id => 
        this.updateSessionStatus(id, status)
      );
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  },

  async bulkConnect(sessionIds) {
    try {
      const promises = sessionIds?.map(id => 
        this.connectSession(id)
      );
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error in bulk connect:', error);
      throw error;
    }
  },

  async bulkDisconnect(sessionIds) {
    try {
      const promises = sessionIds?.map(id => 
        this.disconnectSession(id)
      );
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error in bulk disconnect:', error);
      throw error;
    }
  },

  async bulkDelete(sessionIds) {
    try {
      const promises = sessionIds?.map(id => 
        this.deleteSession(id)
      );
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error in bulk delete:', error);
      throw error;
    }
  }
};