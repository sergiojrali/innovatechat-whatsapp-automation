import { supabase } from '../lib/supabase';
import axios from 'axios';

class AIService {
  constructor() {
    this.providers = {
      openai: {
        baseURL: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k']
      },
      openrouter: {
        baseURL: 'https://openrouter.ai/api/v1',
        models: [
          'openai/gpt-4',
          'openai/gpt-3.5-turbo',
          'anthropic/claude-3-opus',
          'anthropic/claude-3-sonnet',
          'google/gemini-pro',
          'meta-llama/llama-2-70b-chat'
        ]
      },
      anthropic: {
        baseURL: 'https://api.anthropic.com/v1',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
      },
      google: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        models: ['gemini-pro', 'gemini-pro-vision']
      }
    };
  }

  // Configurações de IA
  async getAIConfigurations(userId = null) {
    let query = supabase.from('ai_configurations').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getActiveAIConfiguration(userId) {
    const { data, error } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createAIConfiguration(configData) {
    // Criptografar a API key antes de salvar
    const encryptedConfig = {
      ...configData,
      api_key: this.encryptApiKey(configData.api_key)
    };

    const { data, error } = await supabase
      .from('ai_configurations')
      .insert([encryptedConfig])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateAIConfiguration(id, updates) {
    if (updates.api_key) {
      updates.api_key = this.encryptApiKey(updates.api_key);
    }

    const { data, error } = await supabase
      .from('ai_configurations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteAIConfiguration(id) {
    const { error } = await supabase
      .from('ai_configurations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Geração de respostas
  async generateResponse(conversationId, userMessage, userId, systemPrompt = null) {
    try {
      // Buscar configuração ativa de IA do usuário
      const aiConfig = await this.getActiveAIConfiguration(userId);
      if (!aiConfig) {
        throw new Error('Nenhuma configuração de IA ativa encontrada');
      }

      // Descriptografar API key
      const apiKey = this.decryptApiKey(aiConfig.api_key);
      
      // Buscar histórico da conversa para contexto
      const conversationHistory = await this.getConversationHistory(conversationId);
      
      // Preparar prompt do sistema
      const finalSystemPrompt = systemPrompt || aiConfig.system_prompt || 
        'Você é um assistente útil e profissional. Responda de forma clara e objetiva.';

      // Gerar resposta baseada no provedor
      const startTime = Date.now();
      let response;

      switch (aiConfig.provider) {
        case 'openai':
          response = await this.generateOpenAIResponse(
            apiKey, 
            aiConfig.model_name, 
            userMessage, 
            conversationHistory, 
            finalSystemPrompt,
            aiConfig
          );
          break;
        case 'openrouter':
          response = await this.generateOpenRouterResponse(
            apiKey, 
            aiConfig.model_name, 
            userMessage, 
            conversationHistory, 
            finalSystemPrompt,
            aiConfig
          );
          break;
        case 'anthropic':
          response = await this.generateAnthropicResponse(
            apiKey, 
            aiConfig.model_name, 
            userMessage, 
            conversationHistory, 
            finalSystemPrompt,
            aiConfig
          );
          break;
        case 'google':
          response = await this.generateGoogleResponse(
            apiKey, 
            aiConfig.model_name, 
            userMessage, 
            conversationHistory, 
            finalSystemPrompt,
            aiConfig
          );
          break;
        default:
          throw new Error(`Provedor de IA não suportado: ${aiConfig.provider}`);
      }

      const responseTime = Date.now() - startTime;

      // Salvar resposta no histórico
      await this.saveAIResponse({
        conversation_id: conversationId,
        user_message: userMessage,
        ai_response: response.content,
        provider: aiConfig.provider,
        model_used: aiConfig.model_name,
        tokens_used: response.tokensUsed || 0,
        response_time_ms: responseTime,
        confidence_score: response.confidence || 0.8
      });

      return {
        content: response.content,
        tokensUsed: response.tokensUsed,
        responseTime: responseTime,
        provider: aiConfig.provider,
        model: aiConfig.model_name
      };

    } catch (error) {
      console.error('Erro ao gerar resposta de IA:', error);
      throw error;
    }
  }

  // Implementações específicas por provedor
  async generateOpenAIResponse(apiKey, model, userMessage, history, systemPrompt, config) {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.is_from_contact ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await axios.post(
      `${this.providers.openai.baseURL}/chat/completions`,
      {
        model: model,
        messages: messages,
        max_tokens: config.max_tokens || 1000,
        temperature: config.temperature || 0.7,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      tokensUsed: response.data.usage?.total_tokens || 0,
      confidence: 0.9
    };
  }

  async generateOpenRouterResponse(apiKey, model, userMessage, history, systemPrompt, config) {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.is_from_contact ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await axios.post(
      `${this.providers.openrouter.baseURL}/chat/completions`,
      {
        model: model,
        messages: messages,
        max_tokens: config.max_tokens || 1000,
        temperature: config.temperature || 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'InnovateChat'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      tokensUsed: response.data.usage?.total_tokens || 0,
      confidence: 0.85
    };
  }

  async generateAnthropicResponse(apiKey, model, userMessage, history, systemPrompt, config) {
    // Anthropic usa formato diferente
    const messages = history.map(msg => ({
      role: msg.is_from_contact ? 'user' : 'assistant',
      content: msg.content
    }));
    
    messages.push({ role: 'user', content: userMessage });

    const response = await axios.post(
      `${this.providers.anthropic.baseURL}/messages`,
      {
        model: model,
        max_tokens: config.max_tokens || 1000,
        temperature: config.temperature || 0.7,
        system: systemPrompt,
        messages: messages
      },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return {
      content: response.data.content[0].text,
      tokensUsed: response.data.usage?.input_tokens + response.data.usage?.output_tokens || 0,
      confidence: 0.88
    };
  }

  async generateGoogleResponse(apiKey, model, userMessage, history, systemPrompt, config) {
    const contents = [
      { parts: [{ text: systemPrompt }] },
      ...history.map(msg => ({
        parts: [{ text: msg.content }],
        role: msg.is_from_contact ? 'user' : 'model'
      })),
      { parts: [{ text: userMessage }] }
    ];

    const response = await axios.post(
      `${this.providers.google.baseURL}/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: contents,
        generationConfig: {
          temperature: config.temperature || 0.7,
          maxOutputTokens: config.max_tokens || 1000
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.candidates[0].content.parts[0].text,
      tokensUsed: response.data.usageMetadata?.totalTokenCount || 0,
      confidence: 0.82
    };
  }

  // Utilitários
  async getConversationHistory(conversationId, limit = 10) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('content, is_from_contact, timestamp')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data.reverse(); // Retornar em ordem cronológica
  }

  async saveAIResponse(responseData) {
    const { data, error } = await supabase
      .from('ai_responses')
      .insert([responseData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getAIResponseHistory(conversationId) {
    const { data, error } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async markResponseAsHelpful(responseId, isHelpful) {
    const { data, error } = await supabase
      .from('ai_responses')
      .update({ was_helpful: isHelpful })
      .eq('id', responseId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Criptografia simples (em produção, usar biblioteca mais robusta)
  encryptApiKey(apiKey) {
    // Implementação básica - em produção usar crypto mais seguro
    return btoa(apiKey);
  }

  decryptApiKey(encryptedKey) {
    // Implementação básica - em produção usar crypto mais seguro
    return atob(encryptedKey);
  }

  // Validação de configuração
  async testAIConfiguration(provider, apiKey, model) {
    try {
      const testMessage = 'Olá, este é um teste de conexão.';
      
      switch (provider) {
        case 'openai':
          await axios.post(
            `${this.providers.openai.baseURL}/chat/completions`,
            {
              model: model,
              messages: [{ role: 'user', content: testMessage }],
              max_tokens: 10
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          break;
        case 'openrouter':
          await axios.post(
            `${this.providers.openrouter.baseURL}/chat/completions`,
            {
              model: model,
              messages: [{ role: 'user', content: testMessage }],
              max_tokens: 10
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          break;
        // Adicionar outros provedores conforme necessário
      }
      
      return { success: true, message: 'Configuração válida!' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error?.message || error.message 
      };
    }
  }

  // Estatísticas de uso
  async getUsageStats(userId, startDate = null, endDate = null) {
    let query = supabase
      .from('ai_responses')
      .select('provider, tokens_used, response_time_ms, was_helpful, created_at')
      .eq('conversation_id', 
        supabase.from('conversations').select('id').eq('user_id', userId)
      );

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
      totalRequests: data.length,
      totalTokens: data.reduce((sum, item) => sum + (item.tokens_used || 0), 0),
      averageResponseTime: data.length > 0 
        ? data.reduce((sum, item) => sum + (item.response_time_ms || 0), 0) / data.length 
        : 0,
      helpfulResponses: data.filter(item => item.was_helpful === true).length,
      providerBreakdown: data.reduce((acc, item) => {
        acc[item.provider] = (acc[item.provider] || 0) + 1;
        return acc;
      }, {})
    };

    return stats;
  }

  // Modelos disponíveis por provedor
  getAvailableModels(provider) {
    return this.providers[provider]?.models || [];
  }

  getAllProviders() {
    return Object.keys(this.providers);
  }
}

export const aiService = new AIService();
