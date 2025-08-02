import { supabase } from '../lib/supabase';

export const adminService = {
  // User Management
  async getAllUsers() {
    const { data, error } = await supabase?.from('user_profiles')?.select('*')?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getUserById(id) {
    const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', id)?.single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(id, updates) {
    const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async deactivateUser(id) {
    const { data, error } = await supabase?.from('user_profiles')?.update({ is_active: false })?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async activateUser(id) {
    const { data, error } = await supabase?.from('user_profiles')?.update({ is_active: true })?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  // All Campaigns (Admin View)
  async getAllCampaigns() {
    const { data, error } = await supabase?.from('campaigns')?.select(`
        *,
        user_profiles(email, full_name),
        whatsapp_sessions(session_name, phone_number),
        contact_lists(name)
      `)?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // All Sessions (Admin View)
  async getAllSessions() {
    const { data, error } = await supabase?.from('whatsapp_sessions')?.select(`
        *,
        user_profiles(email, full_name)
      `)?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // All Conversations (Admin View)
  async getAllConversations() {
    const { data, error } = await supabase?.from('conversations')?.select(`
        *,
        user_profiles(email, full_name),
        whatsapp_sessions(session_name)
      `)?.order('last_message_at', { ascending: false, nullsFirst: false });
    
    if (error) throw error;
    return data;
  },

  // System Configuration
  async getSystemConfig() {
    const { data, error } = await supabase?.from('system_config')?.select('*')?.order('key');
    
    if (error) throw error;
    return data;
  },

  async updateSystemConfig(key, value, description = null) {
    const { data, error } = await supabase?.from('system_config')?.upsert([{
        key,
        value,
        description,
        updated_by: (await supabase?.auth?.getUser())?.data?.user?.id
      }])?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async deleteSystemConfig(key) {
    const { error } = await supabase?.from('system_config')?.delete()?.eq('key', key);
    
    if (error) throw error;
  },

  // Audit Logs
  async getAuditLogs(limit = 100, offset = 0) {
    const { data, error } = await supabase?.from('audit_logs')?.select(`
        *,
        user_profiles(email, full_name)
      `)?.order('created_at', { ascending: false })?.range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  },

  async createAuditLog(action, resourceType, resourceId = null, details = {}) {
    const { data: user } = await supabase?.auth?.getUser();
    
    const { data, error } = await supabase?.from('audit_logs')?.insert([{
        user_id: user?.user?.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details
      }])?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  // Dashboard Statistics
  async getDashboardStats() {
    // Get user count
    const { count: userCount } = await supabase?.from('user_profiles')?.select('*', { count: 'exact', head: true });

    // Get active sessions count
    const { count: activeSessionsCount } = await supabase?.from('whatsapp_sessions')?.select('*', { count: 'exact', head: true })?.eq('status', 'connected');

    // Get total sessions count
    const { count: totalSessionsCount } = await supabase?.from('whatsapp_sessions')?.select('*', { count: 'exact', head: true });

    // Get campaigns count
    const { count: campaignsCount } = await supabase?.from('campaigns')?.select('*', { count: 'exact', head: true });

    // Get today's messages count
    const today = new Date()?.toISOString()?.split('T')?.[0];
    const { count: todayMessagesCount } = await supabase?.from('campaign_messages')?.select('*', { count: 'exact', head: true })?.gte('created_at', `${today}T00:00:00.000Z`)?.lt('created_at', `${today}T23:59:59.999Z`);

    // Get conversations count
    const { count: conversationsCount } = await supabase?.from('conversations')?.select('*', { count: 'exact', head: true });

    return {
      totalUsers: userCount || 0,
      activeSessions: activeSessionsCount || 0,
      totalSessions: totalSessionsCount || 0,
      totalCampaigns: campaignsCount || 0,
      todayMessages: todayMessagesCount || 0,
      totalConversations: conversationsCount || 0
    };
  },

  // Campaign statistics by status
  async getCampaignStatusStats() {
    const { data, error } = await supabase?.from('campaigns')?.select('status');
    
    if (error) throw error;
    
    const stats = {
      draft: data?.filter(c => c?.status === 'draft')?.length,
      scheduled: data?.filter(c => c?.status === 'scheduled')?.length,
      sending: data?.filter(c => c?.status === 'sending')?.length,
      completed: data?.filter(c => c?.status === 'completed')?.length,
      failed: data?.filter(c => c?.status === 'failed')?.length,
      paused: data?.filter(c => c?.status === 'paused')?.length,
    };
    
    return stats;
  },

  // Message statistics
  async getMessageStats(days = 7) {
    const startDate = new Date();
    startDate?.setDate(startDate?.getDate() - days);
    
    const { data, error } = await supabase?.from('campaign_messages')?.select('status, created_at')?.gte('created_at', startDate?.toISOString());
    
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
  }
};