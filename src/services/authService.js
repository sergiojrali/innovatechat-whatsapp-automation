import { supabase } from '../lib/supabase';

export const authService = {
  // Authentication
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase?.auth?.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData?.full_name || email?.split('@')?.[0],
          ...userData
        }
      }
    });
    
    return { data, error };
  },

  async signIn(email, password) {
    const { data, error } = await supabase?.auth?.signInWithPassword({
      email,
      password
    });
    
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase?.auth?.signOut();
    return { error };
  },

  async resetPassword(email) {
    const { data, error } = await supabase?.auth?.resetPasswordForEmail(email);
    return { data, error };
  },

  async updatePassword(password) {
    const { data, error } = await supabase?.auth?.updateUser({
      password
    });
    
    return { data, error };
  },

  // Session Management
  async getSession() {
    const { data, error } = await supabase?.auth?.getSession();
    return { data, error };
  },

  async refreshSession() {
    const { data, error } = await supabase?.auth?.refreshSession();
    return { data, error };
  },

  // User Profile
  async getUserProfile(userId) {
    const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single();
    
    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', userId)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  // User Management (Admin functions)
  async createUser(userData) {
    // This would typically be done via admin API
    // For now, we'll use the regular signup
    return await this.signUp(userData?.email, userData?.password, {
      full_name: userData?.full_name,
      role: userData?.role
    });
  },

  // Auth State Listeners
  onAuthStateChange(callback) {
    return supabase?.auth?.onAuthStateChange(callback);
  },

  // Utility functions
  async isAuthenticated() {
    const { data: { session } } = await supabase?.auth?.getSession();
    return !!session;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase?.auth?.getUser();
    return user;
  },

  async isAdmin() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) return false;
    
    try {
      const profile = await this.getUserProfile(user?.id);
      return profile?.role === 'admin';
    } catch (error) {
      return false;
    }
  }
};