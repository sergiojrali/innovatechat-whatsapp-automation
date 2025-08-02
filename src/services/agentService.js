import { supabase } from '../lib/supabase';

class AgentService {
  // Setores
  async getSectors(userId = null) {
    let query = supabase.from('sectors').select(`
      *,
      agents(count)
    `);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getSectorById(id) {
    const { data, error } = await supabase
      .from('sectors')
      .select(`
        *,
        agents(
          id,
          email,
          full_name,
          status,
          is_online,
          last_activity_at,
          total_chats_handled,
          performance_rating
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createSector(sectorData) {
    const { data, error } = await supabase
      .from('sectors')
      .insert([sectorData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateSector(id, updates) {
    const { data, error } = await supabase
      .from('sectors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteSector(id) {
    // Verificar se há atendentes ativos no setor
    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('sector_id', id)
      .eq('status', 'active');

    if (agents && agents.length > 0) {
      throw new Error('Não é possível excluir um setor com atendentes ativos');
    }

    const { error } = await supabase
      .from('sectors')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Atendentes
  async getAgents(sectorId = null, status = null) {
    let query = supabase.from('agents').select(`
      *,
      sectors(name, color),
      user_profiles(full_name, email)
    `);
    
    if (sectorId) {
      query = query.eq('sector_id', sectorId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getAgentById(id) {
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        sectors(name, color, description),
        user_profiles(full_name, email, created_at)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getAgentByUserId(userId) {
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        sectors(name, color, description, business_hours)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateAgent(id, updates) {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateAgentStatus(id, status) {
    const updates = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'active') {
      updates.last_activity_at = new Date().toISOString();
    }

    return await this.updateAgent(id, updates);
  }

  async setAgentOnlineStatus(agentId, isOnline) {
    const updates = {
      is_online: isOnline,
      last_activity_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteAgent(id) {
    // Verificar se há conversas ativas atribuídas ao atendente
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('assigned_agent_id', id)
      .eq('is_archived', false);

    if (conversations && conversations.length > 0) {
      throw new Error('Não é possível excluir um atendente com conversas ativas');
    }

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Convites
  async createInvitation(invitationData) {
    // Gerar token único
    const token = this.generateInvitationToken();
    
    // Definir data de expiração (7 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = {
      ...invitationData,
      invitation_token: token,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('agent_invitations')
      .insert([invitation])
      .select(`
        *,
        sectors(name, description)
      `)
      .single();
    
    if (error) throw error;

    // Enviar email de convite
    await this.sendInvitationEmail(data);
    
    return data;
  }

  async getInvitations(sectorId = null, status = null) {
    let query = supabase.from('agent_invitations').select(`
      *,
      sectors(name, color),
      user_profiles!invited_by(full_name, email)
    `);
    
    if (sectorId) {
      query = query.eq('sector_id', sectorId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getInvitationByToken(token) {
    const { data, error } = await supabase
      .from('agent_invitations')
      .select(`
        *,
        sectors(name, description, color, business_hours)
      `)
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();
    
    if (error) throw error;

    // Verificar se não expirou
    if (new Date(data.expires_at) < new Date()) {
      throw new Error('Convite expirado');
    }
    
    return data;
  }

  async acceptInvitation(token, userData) {
    // Buscar convite
    const invitation = await this.getInvitationByToken(token);
    
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: userData.password,
        options: {
          data: {
            full_name: invitation.full_name,
            role: 'agent'
          }
        }
      });

      if (authError) throw authError;

      // Criar registro de atendente
      const agentData = {
        user_id: authData.user.id,
        sector_id: invitation.sector_id,
        email: invitation.email,
        full_name: invitation.full_name,
        phone: userData.phone || null,
        status: 'active'
      };

      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert([agentData])
        .select()
        .single();

      if (agentError) throw agentError;

      // Marcar convite como aceito
      await supabase
        .from('agent_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      return {
        user: authData.user,
        agent: agent,
        sector: invitation.sectors
      };

    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      throw error;
    }
  }

  async cancelInvitation(id) {
    const { data, error } = await supabase
      .from('agent_invitations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async resendInvitation(id) {
    // Buscar convite
    const { data: invitation, error } = await supabase
      .from('agent_invitations')
      .select(`
        *,
        sectors(name, description)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Gerar novo token e data de expiração
    const newToken = this.generateInvitationToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Atualizar convite
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('agent_invitations')
      .update({
        invitation_token: newToken,
        expires_at: newExpiresAt.toISOString(),
        status: 'pending'
      })
      .eq('id', id)
      .select(`
        *,
        sectors(name, description)
      `)
      .single();

    if (updateError) throw updateError;

    // Reenviar email
    await this.sendInvitationEmail(updatedInvitation);

    return updatedInvitation;
  }

  // Estatísticas de atendentes
  async getAgentStats(agentId, startDate = null, endDate = null) {
    let query = supabase
      .from('conversations')
      .select('id, created_at, resolution_time, first_response_time, customer_satisfaction')
      .eq('assigned_agent_id', agentId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: conversations, error } = await query;
    if (error) throw error;

    // Calcular estatísticas
    const stats = {
      totalChats: conversations.length,
      averageResolutionTime: conversations.length > 0 
        ? conversations.reduce((sum, conv) => sum + (conv.resolution_time || 0), 0) / conversations.length 
        : 0,
      averageFirstResponseTime: conversations.length > 0 
        ? conversations.reduce((sum, conv) => sum + (conv.first_response_time || 0), 0) / conversations.length 
        : 0,
      averageSatisfaction: conversations.length > 0 
        ? conversations.reduce((sum, conv) => sum + (conv.customer_satisfaction || 0), 0) / conversations.length 
        : 0,
      satisfactionCount: conversations.filter(conv => conv.customer_satisfaction).length
    };

    return stats;
  }

  async getSectorStats(sectorId, startDate = null, endDate = null) {
    // Buscar todos os atendentes do setor
    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('sector_id', sectorId)
      .eq('status', 'active');

    if (!agents || agents.length === 0) {
      return {
        totalAgents: 0,
        onlineAgents: 0,
        totalChats: 0,
        averageResolutionTime: 0,
        averageSatisfaction: 0
      };
    }

    const agentIds = agents.map(a => a.id);

    // Buscar conversas do setor
    let query = supabase
      .from('conversations')
      .select('id, resolution_time, customer_satisfaction, assigned_agent_id')
      .in('assigned_agent_id', agentIds);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: conversations, error } = await query;
    if (error) throw error;

    // Contar atendentes online
    const { data: onlineAgents } = await supabase
      .from('agents')
      .select('id')
      .eq('sector_id', sectorId)
      .eq('is_online', true);

    const stats = {
      totalAgents: agents.length,
      onlineAgents: onlineAgents?.length || 0,
      totalChats: conversations.length,
      averageResolutionTime: conversations.length > 0 
        ? conversations.reduce((sum, conv) => sum + (conv.resolution_time || 0), 0) / conversations.length 
        : 0,
      averageSatisfaction: conversations.length > 0 
        ? conversations.reduce((sum, conv) => sum + (conv.customer_satisfaction || 0), 0) / conversations.length 
        : 0
    };

    return stats;
  }

  // Atribuição de conversas
  async assignConversationToAgent(conversationId, agentId, assignmentType = 'manual') {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        assigned_agent_id: agentId,
        assignment_type: assignmentType,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) throw error;

    // Remover da fila se estiver lá
    await supabase
      .from('chat_queues')
      .delete()
      .eq('conversation_id', conversationId);

    return data;
  }

  async unassignConversation(conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        assigned_agent_id: null,
        assignment_type: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Utilitários
  generateInvitationToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async sendInvitationEmail(invitation) {
    try {
      // URL do convite
      const inviteUrl = `${window.location.origin}/agent-invitation/${invitation.invitation_token}`;
      
      // Template do email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Convite para ser Atendente</h2>
          <p>Olá <strong>${invitation.full_name}</strong>,</p>
          <p>Você foi convidado(a) para ser atendente do setor <strong>${invitation.sectors.name}</strong>.</p>
          <p><strong>Descrição do setor:</strong> ${invitation.sectors.description || 'Não informada'}</p>
          <p>Para aceitar o convite e criar sua conta, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Aceitar Convite
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Este convite expira em 7 dias. Se você não conseguir clicar no botão, copie e cole este link no seu navegador:
          </p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">
            ${inviteUrl}
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            Este é um email automático do sistema InnovateChat. Não responda este email.
          </p>
        </div>
      `;

      // Usar Supabase Edge Functions para envio de email
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: invitation.email,
          subject: `Convite para ser Atendente - ${invitation.sectors.name}`,
          html: emailHtml
        }
      });

      if (error) {
        console.error('Erro ao enviar email:', error);
        // Não falhar se o email não for enviado
      }

    } catch (error) {
      console.error('Erro ao enviar email de convite:', error);
      // Não falhar se o email não for enviado
    }
  }

  // Busca de atendentes disponíveis
  async getAvailableAgents(sectorId) {
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        conversations!assigned_agent_id(count)
      `)
      .eq('sector_id', sectorId)
      .eq('status', 'active')
      .eq('is_online', true);
    
    if (error) throw error;

    // Filtrar atendentes que não atingiram o limite de conversas
    return data.filter(agent => {
      const activeChats = agent.conversations?.[0]?.count || 0;
      return activeChats < agent.max_concurrent_chats;
    });
  }

  // Validações
  async validateSectorName(name, userId, excludeId = null) {
    let query = supabase
      .from('sectors')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.length === 0;
  }

  async validateAgentEmail(email, sectorId, excludeId = null) {
    let query = supabase
      .from('agents')
      .select('id')
      .eq('sector_id', sectorId)
      .eq('email', email);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.length === 0;
  }
}

export const agentService = new AgentService();
