import { supabase } from '../lib/supabase';

export const contactService = {
  // Contact Lists
  async getContactLists() {
    const { data, error } = await supabase?.from('contact_lists')?.select('*')?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createContactList(listData) {
    const { data, error } = await supabase?.from('contact_lists')?.insert([listData])?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async updateContactList(id, updates) {
    const { data, error } = await supabase?.from('contact_lists')?.update(updates)?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async deleteContactList(id) {
    const { error } = await supabase?.from('contact_lists')?.delete()?.eq('id', id);
    
    if (error) throw error;
  },

  // Contacts
  async getContacts(listId = null) {
    let query = supabase?.from('contacts')?.select(`
        *,
        contact_lists(name)
      `);
    
    if (listId) {
      query = query?.eq('list_id', listId);
    }
    
    const { data, error } = await query?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createContact(contactData) {
    const { data, error } = await supabase?.from('contacts')?.insert([contactData])?.select()?.single();
    
    if (error) throw error;
    
    // Update contact count in list
    if (contactData?.list_id) {
      await this.updateContactListCount(contactData?.list_id);
    }
    
    return data;
  },

  async updateContact(id, updates) {
    const { data, error } = await supabase?.from('contacts')?.update(updates)?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async deleteContact(id) {
    // Get contact to update list count
    const { data: contact } = await supabase?.from('contacts')?.select('list_id')?.eq('id', id)?.single();

    const { error } = await supabase?.from('contacts')?.delete()?.eq('id', id);
    
    if (error) throw error;
    
    // Update contact count in list
    if (contact?.list_id) {
      await this.updateContactListCount(contact?.list_id);
    }
  },

  async bulkCreateContacts(contacts) {
    const { data, error } = await supabase?.from('contacts')?.insert(contacts)?.select();
    
    if (error) throw error;
    
    // Update contact counts for affected lists
    const listIds = [...new Set(contacts.map(c => c.list_id).filter(Boolean))];
    for (const listId of listIds) {
      await this.updateContactListCount(listId);
    }
    
    return data;
  },

  async updateContactListCount(listId) {
    const { count } = await supabase?.from('contacts')?.select('*', { count: 'exact', head: true })?.eq('list_id', listId);

    await supabase?.from('contact_lists')?.update({ total_contacts: count })?.eq('id', listId);
  },

  // Contact Imports
  async createContactImport(importData) {
    const { data, error } = await supabase?.from('contact_imports')?.insert([importData])?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  async getContactImports() {
    const { data, error } = await supabase?.from('contact_imports')?.select(`
        *,
        contact_lists(name)
      `)?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateContactImport(id, updates) {
    const { data, error } = await supabase?.from('contact_imports')?.update(updates)?.eq('id', id)?.select()?.single();
    
    if (error) throw error;
    return data;
  },

  // Search contacts
  async searchContacts(searchTerm) {
    const { data, error } = await supabase?.from('contacts')?.select(`
        *,
        contact_lists(name)
      `)?.or(`name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)?.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Subscribe to contact changes
  subscribeToContactChanges(callback) {
    const channel = supabase?.channel('contacts')?.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        callback
      )?.subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }
};