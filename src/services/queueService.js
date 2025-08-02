import { supabase } from '../lib/supabase';
import { agentService } from './agentService';

class QueueService {
  // Gerenciamento de filas
  async getQueueBySector(sectorId) {
    const { data, error } = await supabase
      .from('chat_queues')
      .select(`
        *,
        conversations(
          id,
          phone_number,
          contact_name,
          last_message_preview,
          created_at,
          priority
        )
      `)
      .eq('sector_id', sectorId)
      .order('priority', { ascending: false })
      .order('entered_queue_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async addToQueue(conversationId, sectorId, priority = 1) {
    try {
      // Verificar se a conversa já está na fila
      const { data: existing } = await supabase
        .from('chat_queues')
        .select('id')
        .eq('conversation_id', conversationId)
        .single();

      if (existing) {
        throw new Error('Conversa já está na fila');
      }

      // Calcular posição na fila
      const { data: queueData } = await supabase
        .from('chat_queues')
        .select('queue_position')
        .eq('sector_id', sectorId)
        .order('queue_position', { ascending: false })
        .limit(1);

      const nextPosition = queueData && queueData.length > 0 
        ? queueData[0].queue_position + 1 
        : 1;

      // Estimar tempo de espera (baseado na posição e tempo médio de atendimento)
      const estimatedWaitTime = await this.calculateEstimatedWaitTime(sectorId, nextPosition);

      const queueEntry = {
        sector_id: sectorId,
        conversation_id: conversationId,
        priority: priority,
        queue_position: nextPosition,
        estimated_wait_time: estimatedWaitTime,
        entered_queue_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('chat_queues')
        .insert([queueEntry])
        .select()
        .single();

      if (error) throw error;

      // Atualizar conversa para indicar que está na fila
      await supabase
        .from('conversations')
        .update({
          sector_id: sectorId,
          priority: priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return data;

    } catch (error) {
      console.error('Erro ao adicionar à fila:', error);
      throw error;
    }
  }

  async removeFromQueue(conversationId) {
    const { data, error } = await supabase
      .from('chat_queues')
      .delete()
      .eq('conversation_id', conversationId)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Reorganizar posições na fila
    if (data) {
      await this.reorganizeQueue(data.sector_id);
    }

    return data;
  }

  async updateQueuePriority(conversationId, newPriority) {
    const { data, error } = await supabase
      .from('chat_queues')
      .update({ 
        priority: newPriority,
        estimated_wait_time: await this.calculateEstimatedWaitTime(
          data?.sector_id, 
          data?.queue_position
        )
      })
      .eq('conversation_id', conversationId)
      .select()
      .single();

    if (error) throw error;

    // Reorganizar fila por prioridade
    await this.reorganizeQueueByPriority(data.sector_id);

    return data;
  }

  async getNextInQueue(sectorId) {
    const { data, error } = await supabase
      .from('chat_queues')
      .select(`
        *,
        conversations(
          id,
          phone_number,
          contact_name,
          last_message_preview,
          created_at
        )
      `)
      .eq('sector_id', sectorId)
      .order('priority', { ascending: false })
      .order('entered_queue_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Atribuição automática
  async processQueue(sectorId) {
    try {
      // Buscar atendentes disponíveis
      const availableAgents = await agentService.getAvailableAgents(sectorId);
      
      if (availableAgents.length === 0) {
        return { assigned: 0, message: 'Nenhum atendente disponível' };
      }

      // Buscar próximas conversas na fila
      const { data: queueItems, error } = await supabase
        .from('chat_queues')
        .select(`
          *,
          conversations(id, phone_number, contact_name)
        `)
        .eq('sector_id', sectorId)
        .order('priority', { ascending: false })
        .order('entered_queue_at', { ascending: true })
        .limit(availableAgents.length);

      if (error) throw error;

      let assignedCount = 0;

      // Atribuir conversas aos atendentes disponíveis
      for (let i = 0; i < Math.min(queueItems.length, availableAgents.length); i++) {
        const queueItem = queueItems[i];
        const agent = availableAgents[i];

        try {
          // Atribuir conversa ao atendente
          await agentService.assignConversationToAgent(
            queueItem.conversation_id,
            agent.id,
            'auto'
          );

          // Remover da fila
          await this.removeFromQueue(queueItem.conversation_id);

          // Marcar como atribuído
          await supabase
            .from('chat_queues')
            .update({
              assigned_at: new Date().toISOString(),
              removed_from_queue_at: new Date().toISOString()
            })
            .eq('id', queueItem.id);

          assignedCount++;

        } catch (error) {
          console.error(`Erro ao atribuir conversa ${queueItem.conversation_id}:`, error);
        }
      }

      return { 
        assigned: assignedCount, 
        message: `${assignedCount} conversas atribuídas automaticamente` 
      };

    } catch (error) {
      console.error('Erro ao processar fila:', error);
      throw error;
    }
  }

  async autoAssignConversation(conversationId, sectorId) {
    try {
      // Tentar atribuição automática primeiro
      const availableAgents = await agentService.getAvailableAgents(sectorId);
      
      if (availableAgents.length > 0) {
        // Selecionar atendente com menos conversas ativas
        const selectedAgent = availableAgents.reduce((prev, current) => {
          const prevChats = prev.conversations?.[0]?.count || 0;
          const currentChats = current.conversations?.[0]?.count || 0;
          return currentChats < prevChats ? current : prev;
        });

        // Atribuir conversa
        await agentService.assignConversationToAgent(
          conversationId,
          selectedAgent.id,
          'auto'
        );

        return { 
          assigned: true, 
          agent: selectedAgent,
          message: 'Conversa atribuída automaticamente' 
        };
      } else {
        // Adicionar à fila se não há atendentes disponíveis
        await this.addToQueue(conversationId, sectorId);
        
        return { 
          assigned: false, 
          queued: true,
          message: 'Conversa adicionada à fila de espera' 
        };
      }

    } catch (error) {
      console.error('Erro na atribuição automática:', error);
      throw error;
    }
  }

  // Estatísticas da fila
  async getQueueStats(sectorId) {
    const { data: queueData, error } = await supabase
      .from('chat_queues')
      .select('priority, entered_queue_at, estimated_wait_time')
      .eq('sector_id', sectorId);

    if (error) throw error;

    const now = new Date();
    const stats = {
      totalInQueue: queueData.length,
      highPriority: queueData.filter(item => item.priority >= 3).length,
      mediumPriority: queueData.filter(item => item.priority === 2).length,
      lowPriority: queueData.filter(item => item.priority === 1).length,
      averageWaitTime: queueData.length > 0 
        ? queueData.reduce((sum, item) => sum + (item.estimated_wait_time || 0), 0) / queueData.length 
        : 0,
      longestWaitTime: queueData.length > 0 
        ? Math.max(...queueData.map(item => 
            Math.floor((now - new Date(item.entered_queue_at)) / 1000 / 60)
          )) 
        : 0
    };

    return stats;
  }

  async getQueueHistory(sectorId, startDate = null, endDate = null) {
    let query = supabase
      .from('chat_queues')
      .select(`
        *,
        conversations(phone_number, contact_name)
      `)
      .eq('sector_id', sectorId)
      .not('removed_from_queue_at', 'is', null);

    if (startDate) {
      query = query.gte('entered_queue_at', startDate);
    }
    if (endDate) {
      query = query.lte('entered_queue_at', endDate);
    }

    const { data, error } = await query.order('entered_queue_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Utilitários privados
  async calculateEstimatedWaitTime(sectorId, position) {
    try {
      // Buscar tempo médio de atendimento do setor
      const { data: conversations } = await supabase
        .from('conversations')
        .select('resolution_time')
        .eq('sector_id', sectorId)
        .not('resolution_time', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      let averageResolutionTime = 15; // Default: 15 minutos

      if (conversations && conversations.length > 0) {
        const totalTime = conversations.reduce((sum, conv) => sum + conv.resolution_time, 0);
        averageResolutionTime = totalTime / conversations.length;
      }

      // Buscar número de atendentes online
      const { data: onlineAgents } = await supabase
        .from('agents')
        .select('id')
        .eq('sector_id', sectorId)
        .eq('is_online', true);

      const agentCount = onlineAgents?.length || 1;

      // Calcular tempo estimado baseado na posição e capacidade
      const estimatedTime = Math.ceil((position * averageResolutionTime) / agentCount);

      return estimatedTime;

    } catch (error) {
      console.error('Erro ao calcular tempo de espera:', error);
      return 15; // Retornar valor padrão em caso de erro
    }
  }

  async reorganizeQueue(sectorId) {
    try {
      // Buscar todos os itens da fila ordenados por prioridade e tempo
      const { data: queueItems, error } = await supabase
        .from('chat_queues')
        .select('id')
        .eq('sector_id', sectorId)
        .order('priority', { ascending: false })
        .order('entered_queue_at', { ascending: true });

      if (error) throw error;

      // Atualizar posições
      for (let i = 0; i < queueItems.length; i++) {
        await supabase
          .from('chat_queues')
          .update({ 
            queue_position: i + 1,
            estimated_wait_time: await this.calculateEstimatedWaitTime(sectorId, i + 1)
          })
          .eq('id', queueItems[i].id);
      }

    } catch (error) {
      console.error('Erro ao reorganizar fila:', error);
    }
  }

  async reorganizeQueueByPriority(sectorId) {
    await this.reorganizeQueue(sectorId);
  }

  // Notificações e alertas
  async checkQueueAlerts(sectorId) {
    const stats = await this.getQueueStats(sectorId);
    const alerts = [];

    // Alerta para fila muito longa
    if (stats.totalInQueue > 10) {
      alerts.push({
        type: 'warning',
        message: `Fila com ${stats.totalInQueue} conversas aguardando`,
        priority: 'medium'
      });
    }

    // Alerta para tempo de espera muito longo
    if (stats.longestWaitTime > 30) {
      alerts.push({
        type: 'error',
        message: `Conversa aguardando há ${stats.longestWaitTime} minutos`,
        priority: 'high'
      });
    }

    // Alerta para muitas conversas de alta prioridade
    if (stats.highPriority > 5) {
      alerts.push({
        type: 'warning',
        message: `${stats.highPriority} conversas de alta prioridade na fila`,
        priority: 'high'
      });
    }

    return alerts;
  }

  // Transferência entre setores
  async transferToSector(conversationId, fromSectorId, toSectorId, reason = null) {
    try {
      // Remover da fila atual se estiver lá
      await this.removeFromQueue(conversationId);

      // Desatribuir atendente atual se houver
      await agentService.unassignConversation(conversationId);

      // Tentar atribuição automática no novo setor
      const result = await this.autoAssignConversation(conversationId, toSectorId);

      // Registrar transferência no histórico
      await supabase
        .from('audit_logs')
        .insert([{
          action: 'conversation_transfer',
          resource_type: 'conversation',
          resource_id: conversationId,
          details: {
            from_sector: fromSectorId,
            to_sector: toSectorId,
            reason: reason,
            result: result
          }
        }]);

      return result;

    } catch (error) {
      console.error('Erro ao transferir conversa:', error);
      throw error;
    }
  }

  // Métricas de performance
  async getQueuePerformanceMetrics(sectorId, startDate, endDate) {
    const { data: queueHistory, error } = await supabase
      .from('chat_queues')
      .select(`
        entered_queue_at,
        assigned_at,
        removed_from_queue_at,
        estimated_wait_time,
        priority
      `)
      .eq('sector_id', sectorId)
      .gte('entered_queue_at', startDate)
      .lte('entered_queue_at', endDate)
      .not('removed_from_queue_at', 'is', null);

    if (error) throw error;

    const metrics = {
      totalProcessed: queueHistory.length,
      averageWaitTime: 0,
      averageQueueTime: 0,
      assignmentRate: 0,
      priorityBreakdown: {
        high: 0,
        medium: 0,
        low: 0
      }
    };

    if (queueHistory.length > 0) {
      // Calcular tempo médio de espera
      const waitTimes = queueHistory
        .filter(item => item.assigned_at)
        .map(item => {
          const entered = new Date(item.entered_queue_at);
          const assigned = new Date(item.assigned_at);
          return Math.floor((assigned - entered) / 1000 / 60); // em minutos
        });

      metrics.averageWaitTime = waitTimes.length > 0 
        ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length 
        : 0;

      // Taxa de atribuição
      const assignedCount = queueHistory.filter(item => item.assigned_at).length;
      metrics.assignmentRate = (assignedCount / queueHistory.length) * 100;

      // Breakdown por prioridade
      metrics.priorityBreakdown.high = queueHistory.filter(item => item.priority >= 3).length;
      metrics.priorityBreakdown.medium = queueHistory.filter(item => item.priority === 2).length;
      metrics.priorityBreakdown.low = queueHistory.filter(item => item.priority === 1).length;
    }

    return metrics;
  }

  // Limpeza automática
  async cleanupExpiredQueueItems() {
    try {
      // Remover itens muito antigos da fila (mais de 2 horas)
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const { data: expiredItems, error } = await supabase
        .from('chat_queues')
        .select('conversation_id, sector_id')
        .lt('entered_queue_at', twoHoursAgo.toISOString());

      if (error) throw error;

      for (const item of expiredItems) {
        // Marcar conversa como não atendida
        await supabase
          .from('conversations')
          .update({
            tags: ['timeout', 'não_atendida'],
            updated_at: new Date().toISOString()
          })
          .eq('id', item.conversation_id);

        // Remover da fila
        await this.removeFromQueue(item.conversation_id);
      }

      return expiredItems.length;

    } catch (error) {
      console.error('Erro na limpeza da fila:', error);
      return 0;
    }
  }
}

export const queueService = new QueueService();
