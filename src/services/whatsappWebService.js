import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// URL base da API do backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com/api' 
  : 'http://localhost:4000/api';

/**
 * Serviço integrado com WhatsApp Web.js via backend
 * Este serviço se comunica com o servidor Express que gerencia as sessões do WhatsApp
 */
export const whatsappWebService = {
  // Listar todas as sessões
  async getSessions() {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao buscar sessões:', error);
      return { data: null, error };
    }
  },

  // Obter sessão específica
  async getSessionById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions/${id}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao buscar sessão:', error);
      return { data: null, error };
    }
  },

  // Criar nova sessão
  async createSession(sessionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      logger.log('Sessão criada com sucesso:', result.data.session_name);
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao criar sessão:', error);
      return { data: null, error };
    }
  },

  // Conectar sessão (gerar QR code)
  async connectSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions/${sessionId}/connect`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      logger.log('Sessão conectando:', result.message);
      return { data: result, error: null };
    } catch (error) {
      logger.error('Erro ao conectar sessão:', error);
      return { data: null, error };
    }
  },

  // Desconectar sessão
  async disconnectSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions/${sessionId}/disconnect`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      logger.log('Sessão desconectada:', result.message);
      return { data: result, error: null };
    } catch (error) {
      logger.error('Erro ao desconectar sessão:', error);
      return { data: null, error };
    }
  },

  // Deletar sessão
  async deleteSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      logger.log('Sessão deletada:', result.message);
      return { data: result, error: null };
    } catch (error) {
      logger.error('Erro ao deletar sessão:', error);
      return { data: null, error };
    }
  },

  // Obter QR code da sessão
  async getQRCode(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions/${sessionId}/qr`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao obter QR code:', error);
      return { data: null, error };
    }
  },

  // Enviar mensagem
  async sendMessage(sessionId, phoneNumber, message, mediaUrl = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions/${sessionId}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message: message,
          media_url: mediaUrl
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      logger.log(`Mensagem enviada para ${phoneNumber}:`, message);
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
      return { data: null, error };
    }
  },

  // Atualizar configurações da sessão
  async updateSession(sessionId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      logger.log('Sessão atualizada:', result.message);
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao atualizar sessão:', error);
      return { data: null, error };
    }
  },

  // Obter estatísticas da sessão
  async getSessionStats(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions/${sessionId}/stats`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Erro ao obter estatísticas:', error);
      return { data: null, error };
    }
  },

  // Métodos auxiliares para compatibilidade com o código existente
  async updateSessionStatus(sessionId, status, updates = {}) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .update({
          status,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Erro ao atualizar status da sessão:', error);
      return { data: null, error };
    }
  },

  async logSessionError(sessionId, errorMessage, errorData = {}) {
    try {
      await supabase.rpc('log_session_error', {
        session_id: sessionId,
        error_message: errorMessage,
        error_data: errorData
      });

      return { error: null };
    } catch (error) {
      logger.error('Erro ao registrar erro da sessão:', error);
      return { error };
    }
  },

  async getSessionStatus(sessionId) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('status, connection_error, last_connected_at, client_data')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      // Atualizar estatísticas
      await supabase.rpc('update_session_stats', {
        session_id: sessionId,
        stat_type: 'status_check',
        increment_by: 1
      });

      return { data, error: null };
    } catch (error) {
      logger.error('Erro ao obter status da sessão:', error);
      
      // Registrar erro nas estatísticas
      await supabase.rpc('update_session_stats', {
        session_id: sessionId,
        stat_type: 'failed',
        increment_by: 1
      });

      return { data: null, error };
    }
  },

  async restartSession(sessionId) {
    try {
      const { data: session } = await supabase
        .from('whatsapp_sessions')
        .select('auto_reconnect, restart_count, status')
        .eq('id', sessionId)
        .single();

      if (!session?.auto_reconnect) {
        throw new Error('Reconexão automática está desabilitada para esta sessão');
      }

      await supabase.rpc('increment_restart_count', { session_id: sessionId });
      
      // Usar a API do backend para reconectar
      return await this.connectSession(sessionId);
    } catch (error) {
      logger.error('Erro ao reiniciar sessão:', error);
      return { error };
    }
  },

  // Verificar se sessão está saudável
  async isSessionHealthy(sessionId) {
    try {
      const { data: session } = await this.getSessionStatus(sessionId);
      
      if (!session || session.status !== 'connected') return false;
      
      if (session.last_error_at) {
        const errorTime = new Date(session.last_error_at);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (errorTime > fiveMinutesAgo) return false;
      }

      return true;
    } catch (error) {
      logger.error('Erro ao verificar saúde da sessão:', error);
      return false;
    }
  },

  // Reconexão automática se necessário
  async autoReconnectIfNeeded(sessionId) {
    try {
      const { data: session } = await supabase
        .from('whatsapp_sessions')
        .select('auto_reconnect, restart_count, status')
        .eq('id', sessionId)
        .single();

      if (!session?.auto_reconnect) return false;
      if (session?.restart_count >= 5) return false; // Máximo 5 tentativas
      if (session?.status === 'connected') return false;

      await supabase.rpc('increment_restart_count', { session_id: sessionId });
      const result = await this.connectSession(sessionId);
      
      return result.error === null;
    } catch (error) {
      logger.error('Falha na reconexão automática:', error);
      return false;
    }
  }
};
