import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { contactService } from '../../services/contactService';

import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';
import ContactTable from './components/ContactTable';
import ContactFilters from './components/ContactFilters';
import ContactStats from './components/ContactStats';
import ContactDetailModal from './components/ContactDetailModal';
import ContactImportModal from './components/ContactImportModal';
import BulkActionsBar from './components/BulkActionsBar';

const ContactManagement = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    listId: '',
    status: 'todos',
    sortBy: 'created_at_desc'
  });

  // Load contacts data
  useEffect(() => {
    if (!user || authLoading) return;
    
    loadContactsData();
  }, [user, authLoading, filters?.listId]);

  const loadContactsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load contacts and contact lists in parallel
      const [contactsData, listsData] = await Promise.all([
        contactService?.getContacts(filters?.listId || null),
        contactService?.getContactLists()
      ]);

      setContacts(contactsData || []);
      setContactLists(listsData || []);
      
    } catch (err) {
      setError('Erro ao carregar contatos: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const unsubscribe = contactService?.subscribeToContactChanges(() => {
      loadContactsData();
    });

    return () => {
      unsubscribe?.();
    };
  }, [user]);

  // Filter and sort contacts
  const filteredContacts = contacts?.filter(contact => {
    if (filters?.search) {
      const searchTerm = filters?.search?.toLowerCase();
      return contact?.name?.toLowerCase()?.includes(searchTerm) ||
             contact?.phone_number?.includes(searchTerm);
    }
    if (filters?.status === 'ativos' && !contact?.is_active) return false;
    if (filters?.status === 'inativos' && contact?.is_active) return false;
    return true;
  }) || [];

  const sortedContacts = [...filteredContacts]?.sort((a, b) => {
    const [field, direction] = filters?.sortBy?.split('_');
    const multiplier = direction === 'desc' ? -1 : 1;
    
    if (field === 'created_at') {
      return multiplier * (new Date(a?.created_at) - new Date(b?.created_at));
    }
    if (field === 'name') {
      return multiplier * (a?.name || '')?.localeCompare(b?.name || '');
    }
    if (field === 'phone_number') {
      return multiplier * (a?.phone_number || '')?.localeCompare(b?.phone_number || '');
    }
    return 0;
  });

  // Calculate statistics
  const stats = {
    totalContacts: contacts?.length || 0,
    activeContacts: contacts?.filter(c => c?.is_active)?.length || 0,
    totalLists: contactLists?.length || 0,
    recentImports: 0, // Would need import history
    contactsChange: 0,
    activeChange: 0,
    listsChange: 0,
    importsChange: 0
  };

  // Contact actions
  const handleCreateContact = () => {
    setCurrentContact(null);
    setShowDetailModal(true);
  };

  const handleEditContact = (contact) => {
    setCurrentContact(contact);
    setShowDetailModal(true);
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Tem certeza que deseja excluir este contato?')) return;
    
    try {
      await contactService?.deleteContact(contactId);
      loadContactsData();
    } catch (err) {
      setError('Erro ao excluir contato: ' + err?.message);
    }
  };

  const handleSaveContact = async (contactData) => {
    try {
      if (currentContact) {
        // Update existing contact
        await contactService?.updateContact(currentContact?.id, {
          ...contactData,
          user_id: user?.id
        });
      } else {
        // Create new contact
        await contactService?.createContact({
          ...contactData,
          user_id: user?.id,
          is_active: true
        });
      }
      
      setShowDetailModal(false);
      setCurrentContact(null);
      loadContactsData();
    } catch (err) {
      setError('Erro ao salvar contato: ' + err?.message);
    }
  };

  const handleImportContacts = async (importData) => {
    try {
      // Create contact import record
      const importRecord = await contactService?.createContactImport({
        ...importData,
        user_id: user?.id,
        status: 'processing'
      });
      
      // Process contacts (simplified - in real app, this would be done in background)
      const contactsToCreate = importData?.contacts?.map(contact => ({
        ...contact,
        user_id: user?.id,
        list_id: importData?.list_id,
        is_active: true
      }));
      
      await contactService?.bulkCreateContacts(contactsToCreate);
      
      // Update import status
      await contactService?.updateContactImport(importRecord?.id, {
        status: 'completed',
        processed_count: contactsToCreate?.length,
        success_count: contactsToCreate?.length
      });
      
      setShowImportModal(false);
      loadContactsData();
    } catch (err) {
      setError('Erro ao importar contatos: ' + err?.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedContacts?.length === 0) return;
    
    try {
      switch (action) {
        case 'activate':
          await Promise.all(selectedContacts?.map(id => 
            contactService?.updateContact(id, { is_active: true })
          ));
          break;
        case 'deactivate':
          await Promise.all(selectedContacts?.map(id => 
            contactService?.updateContact(id, { is_active: false })
          ));
          break;
        case 'delete':
          if (window.confirm(`Tem certeza que deseja excluir ${selectedContacts?.length} contato(s)?`)) {
            await Promise.all(selectedContacts?.map(id => 
              contactService?.deleteContact(id)
            ));
          }
          break;
        case 'move':
          // This would open a modal to select target list
          console.log('Move contacts to different list');
          break;
      }
      setSelectedContacts([]);
      loadContactsData();
    } catch (err) {
      setError('Erro na ação em lote: ' + err?.message);
    }
  };

  const handleSelectContact = (contactId) => {
    setSelectedContacts(prev => 
      prev?.includes(contactId) ? 
      prev?.filter(id => id !== contactId) : 
      [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts?.length === sortedContacts?.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(sortedContacts?.map(c => c?.id));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      listId: '',
      status: 'todos',
      sortBy: 'created_at_desc'
    });
  };

  const handleExportContacts = () => {
    // Export functionality would be implemented here
    console.log('Export contacts feature would be implemented');
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando contatos...</p>
        </div>
      </div>
    );
  }

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        userRole={userProfile?.role}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-112'}`}>
        <Header 
          user={{
            name: userProfile?.full_name || user?.email,
            email: user?.email,
            role: userProfile?.role
          }}
          onMenuToggle={handleSidebarToggle}
          notifications={[]}
        />
        
        <main className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-destructive text-sm">{error}</p>
                <button 
                  onClick={() => setError('')}
                  className="mt-2 text-xs text-destructive underline"
                >
                  Fechar
                </button>
              </div>
            )}
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Gerenciamento de Contatos
                </h1>
                <p className="text-muted-foreground">
                  Organize e gerencie sua base de contatos WhatsApp
                </p>
              </div>

              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <Button
                  variant="outline"
                  onClick={() => setShowImportModal(true)}
                  iconName="Upload"
                  iconPosition="left"
                >
                  Importar
                </Button>
                <Button
                  variant="default"
                  onClick={handleCreateContact}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Novo Contato
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <ContactStats stats={stats} />

            {/* Bulk Actions */}
            {selectedContacts?.length > 0 && (
              <BulkActionsBar
                selectedCount={selectedContacts?.length}
                onAction={handleBulkAction}
                onClear={() => setSelectedContacts([])}
              />
            )}

            {/* Filters */}
            <ContactFilters
              filters={filters}
              contactLists={contactLists}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onExport={handleExportContacts}
            />

            {/* Contacts Table */}
            <ContactTable
              contacts={sortedContacts}
              contactLists={contactLists}
              selectedContacts={selectedContacts}
              onSelectContact={handleSelectContact}
              onSelectAll={handleSelectAll}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
            />

            {/* Real-time Status */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Dados sincronizados em tempo real via Supabase</span>
              <span>•</span>
              <span>Total: {sortedContacts?.length} contato(s)</span>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <ContactDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setCurrentContact(null);
        }}
        onSave={handleSaveContact}
        contact={currentContact}
        contactLists={contactLists}
      />

      <ContactImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportContacts}
        contactLists={contactLists}
      />
    </div>
  );
};

export default ContactManagement;