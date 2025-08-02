import { supabase } from '../lib/supabase';

class TemplateService {
  // Templates de negócios
  async getBusinessTemplates(segment = null, isActive = true) {
    let query = supabase.from('business_templates').select('*');
    
    if (segment) {
      query = query.eq('segment', segment);
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getTemplateById(id) {
    const { data, error } = await supabase
      .from('business_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getTemplateBySegment(segment) {
    const { data, error } = await supabase
      .from('business_templates')
      .select('*')
      .eq('segment', segment)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createTemplate(templateData) {
    const { data, error } = await supabase
      .from('business_templates')
      .insert([templateData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateTemplate(id, updates) {
    const { data, error } = await supabase
      .from('business_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteTemplate(id) {
    const { error } = await supabase
      .from('business_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Aplicar template a um setor
  async applyTemplateToSector(templateId, sectorId) {
    try {
      // Buscar template
      const template = await this.getTemplateById(templateId);
      
      // Buscar setor
      const { data: sector, error: sectorError } = await supabase
        .from('sectors')
        .select('*')
        .eq('id', sectorId)
        .single();

      if (sectorError) throw sectorError;

      // Aplicar configurações do template ao setor
      const sectorUpdates = {
        welcome_message: template.welcome_message,
        away_message: template.away_message,
        business_hours: template.business_hours,
        updated_at: new Date().toISOString()
      };

      const { data: updatedSector, error: updateError } = await supabase
        .from('sectors')
        .update(sectorUpdates)
        .eq('id', sectorId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Registrar aplicação do template
      await supabase
        .from('audit_logs')
        .insert([{
          action: 'template_applied',
          resource_type: 'sector',
          resource_id: sectorId,
          details: {
            template_id: templateId,
            template_name: template.name,
            template_segment: template.segment
          }
        }]);

      return {
        sector: updatedSector,
        template: template,
        message: 'Template aplicado com sucesso'
      };

    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      throw error;
    }
  }

  // Aplicar template a uma sessão WhatsApp
  async applyTemplateToSession(templateId, sessionId) {
    try {
      // Buscar template
      const template = await this.getTemplateById(templateId);
      
      // Aplicar configurações do template à sessão
      const sessionConfig = {
        welcome_message: template.welcome_message,
        away_message: template.away_message,
        business_hours: template.business_hours,
        auto_reply: true,
        segment: template.segment
      };

      const { data: updatedSession, error } = await supabase
        .from('whatsapp_sessions')
        .update({
          session_config: sessionConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      return {
        session: updatedSession,
        template: template,
        message: 'Template aplicado à sessão com sucesso'
      };

    } catch (error) {
      console.error('Erro ao aplicar template à sessão:', error);
      throw error;
    }
  }

  // Gerar respostas baseadas no template
  async generateTemplateResponse(templateId, userMessage, context = {}) {
    try {
      const template = await this.getTemplateById(templateId);
      
      // Verificar se há FAQ que corresponde à mensagem
      const faqResponse = this.findFAQResponse(template.faq_data, userMessage);
      if (faqResponse) {
        return {
          type: 'faq',
          content: faqResponse.answer,
          confidence: 0.9
        };
      }

      // Verificar respostas rápidas
      const quickReply = this.findQuickReply(template.quick_replies, userMessage);
      if (quickReply) {
        return {
          type: 'quick_reply',
          content: quickReply,
          confidence: 0.8
        };
      }

      // Resposta padrão baseada no horário
      if (this.isOutsideBusinessHours(template.business_hours)) {
        return {
          type: 'away_message',
          content: template.away_message || 'No momento estamos fora do horário de atendimento.',
          confidence: 1.0
        };
      }

      // Resposta de boas-vindas para primeira mensagem
      if (context.isFirstMessage) {
        return {
          type: 'welcome_message',
          content: template.welcome_message,
          confidence: 1.0
        };
      }

      return null; // Nenhuma resposta automática encontrada

    } catch (error) {
      console.error('Erro ao gerar resposta do template:', error);
      return null;
    }
  }

  // Personalizar template para usuário
  async customizeTemplate(templateId, userId, customizations) {
    try {
      // Buscar template original
      const originalTemplate = await this.getTemplateById(templateId);
      
      // Criar template personalizado
      const customTemplate = {
        ...originalTemplate,
        ...customizations,
        name: `${originalTemplate.name} - Personalizado`,
        created_by: userId,
        is_active: true,
        created_at: new Date().toISOString()
      };

      delete customTemplate.id; // Remover ID para criar novo

      const { data, error } = await supabase
        .from('business_templates')
        .insert([customTemplate])
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Erro ao personalizar template:', error);
      throw error;
    }
  }

  // Estatísticas de uso de templates
  async getTemplateUsageStats(templateId = null, startDate = null, endDate = null) {
    let query = supabase
      .from('audit_logs')
      .select('details, created_at')
      .eq('action', 'template_applied');

    if (templateId) {
      query = query.eq('details->template_id', templateId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calcular estatísticas
    const stats = {
      totalApplications: data.length,
      templateBreakdown: data.reduce((acc, log) => {
        const templateName = log.details.template_name;
        acc[templateName] = (acc[templateName] || 0) + 1;
        return acc;
      }, {}),
      segmentBreakdown: data.reduce((acc, log) => {
        const segment = log.details.template_segment;
        acc[segment] = (acc[segment] || 0) + 1;
        return acc;
      }, {}),
      dailyUsage: this.groupByDate(data)
    };

    return stats;
  }

  // Validar template
  async validateTemplate(templateData) {
    const errors = [];

    // Validações obrigatórias
    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('Nome do template é obrigatório');
    }

    if (!templateData.segment) {
      errors.push('Segmento é obrigatório');
    }

    if (!templateData.welcome_message || templateData.welcome_message.trim().length === 0) {
      errors.push('Mensagem de boas-vindas é obrigatória');
    }

    // Validar JSON dos quick_replies
    if (templateData.quick_replies) {
      try {
        const quickReplies = typeof templateData.quick_replies === 'string' 
          ? JSON.parse(templateData.quick_replies) 
          : templateData.quick_replies;
        
        if (!Array.isArray(quickReplies)) {
          errors.push('Respostas rápidas devem ser um array');
        }
      } catch (e) {
        errors.push('Formato inválido para respostas rápidas');
      }
    }

    // Validar JSON do faq_data
    if (templateData.faq_data) {
      try {
        const faqData = typeof templateData.faq_data === 'string' 
          ? JSON.parse(templateData.faq_data) 
          : templateData.faq_data;
        
        if (!Array.isArray(faqData)) {
          errors.push('FAQ deve ser um array');
        } else {
          faqData.forEach((item, index) => {
            if (!item.question || !item.answer) {
              errors.push(`Item ${index + 1} do FAQ deve ter pergunta e resposta`);
            }
          });
        }
      } catch (e) {
        errors.push('Formato inválido para FAQ');
      }
    }

    // Validar horário comercial
    if (templateData.business_hours) {
      try {
        const hours = typeof templateData.business_hours === 'string' 
          ? JSON.parse(templateData.business_hours) 
          : templateData.business_hours;
        
        if (hours.enabled && (!hours.start || !hours.end)) {
          errors.push('Horário de início e fim são obrigatórios quando horário comercial está habilitado');
        }
      } catch (e) {
        errors.push('Formato inválido para horário comercial');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Duplicar template
  async duplicateTemplate(templateId, newName = null) {
    try {
      const originalTemplate = await this.getTemplateById(templateId);
      
      const duplicatedTemplate = {
        ...originalTemplate,
        name: newName || `${originalTemplate.name} - Cópia`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      delete duplicatedTemplate.id; // Remover ID para criar novo

      const { data, error } = await supabase
        .from('business_templates')
        .insert([duplicatedTemplate])
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      throw error;
    }
  }

  // Exportar template
  async exportTemplate(templateId) {
    try {
      const template = await this.getTemplateById(templateId);
      
      const exportData = {
        ...template,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      delete exportData.id;
      delete exportData.created_by;
      delete exportData.created_at;
      delete exportData.updated_at;

      return exportData;

    } catch (error) {
      console.error('Erro ao exportar template:', error);
      throw error;
    }
  }

  // Importar template
  async importTemplate(templateData, userId) {
    try {
      // Validar dados importados
      const validation = await this.validateTemplate(templateData);
      if (!validation.isValid) {
        throw new Error(`Template inválido: ${validation.errors.join(', ')}`);
      }

      const importedTemplate = {
        ...templateData,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('business_templates')
        .insert([importedTemplate])
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Erro ao importar template:', error);
      throw error;
    }
  }

  // Métodos utilitários privados
  findFAQResponse(faqData, userMessage) {
    if (!faqData || !Array.isArray(faqData)) return null;

    const normalizedMessage = userMessage.toLowerCase().trim();
    
    return faqData.find(item => {
      const normalizedQuestion = item.question.toLowerCase();
      return normalizedMessage.includes(normalizedQuestion) || 
             normalizedQuestion.includes(normalizedMessage) ||
             this.calculateSimilarity(normalizedMessage, normalizedQuestion) > 0.7;
    });
  }

  findQuickReply(quickReplies, userMessage) {
    if (!quickReplies || !Array.isArray(quickReplies)) return null;

    const normalizedMessage = userMessage.toLowerCase().trim();
    
    return quickReplies.find(reply => {
      const normalizedReply = reply.toLowerCase();
      return normalizedMessage.includes(normalizedReply) || 
             normalizedReply.includes(normalizedMessage);
    });
  }

  isOutsideBusinessHours(businessHours) {
    if (!businessHours || !businessHours.enabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = businessHours.start.split(':').map(Number);
    const [endHour, endMinute] = businessHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    return currentTime < startTime || currentTime > endTime;
  }

  calculateSimilarity(str1, str2) {
    // Implementação simples de similaridade de strings
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  groupByDate(data) {
    return data.reduce((acc, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  }

  // Segmentos disponíveis
  getAvailableSegments() {
    return [
      { value: 'solar_energy', label: 'Energia Solar', icon: '☀️' },
      { value: 'internet_provider', label: 'Provedor de Internet', icon: '🌐' },
      { value: 'retail', label: 'Varejo', icon: '🛍️' },
      { value: 'healthcare', label: 'Saúde', icon: '🏥' },
      { value: 'education', label: 'Educação', icon: '📚' },
      { value: 'real_estate', label: 'Imobiliário', icon: '🏠' },
      { value: 'automotive', label: 'Automotivo', icon: '🚗' },
      { value: 'finance', label: 'Financeiro', icon: '💰' },
      { value: 'food_service', label: 'Alimentação', icon: '🍕' },
      { value: 'technology', label: 'Tecnologia', icon: '💻' }
    ];
  }

  // Buscar templates por categoria
  async getTemplatesByCategory() {
    const { data, error } = await supabase
      .from('business_templates')
      .select('*')
      .eq('is_active', true)
      .order('segment', { ascending: true });

    if (error) throw error;

    // Agrupar por segmento
    const grouped = data.reduce((acc, template) => {
      if (!acc[template.segment]) {
        acc[template.segment] = [];
      }
      acc[template.segment].push(template);
      return acc;
    }, {});

    return grouped;
  }
}

export const templateService = new TemplateService();
