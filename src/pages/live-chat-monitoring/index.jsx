import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import { whatsappService } from '../../services/whatsappService';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';

import ConversationList from './components/ConversationList';
import ChatArea from './components/ChatArea';
import ContactInfo from './components/ContactInfo';
import ChatSearch from './components/ChatSearch';

const LiveChatMonitoring = () => {
  const location = useLocation();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState('all');

  // Load initial data
  useEffect(() => {
    if (!user || authLoading) return;
    
    loadChatData();
  }, [user, authLoading, selectedSession]);

  // Handle opening specific chat from navigation state
  useEffect(() => {
    if (location?.state?.openChat && conversations?.length > 0) {
      const phoneNumber = location?.state?.openChat;
      const conversation = conversations?.find(c => c?.phone_number === phoneNumber);
      if (conversation) {
        handleSelectConversation(conversation);
      }
    }
  }, [location?.state, conversations]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load conversations and sessions in parallel
      const [conversationsData, sessionsData] = await Promise.all([
        chatService?.getConversations(selectedSession !== 'all' ? selectedSession : null),
        whatsappService?.getSessions()
      ]);

      setConversations(conversationsData || []);
      setSessions(sessionsData || []);
      
    } catch (err) {
      setError('Erro ao carregar conversas: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const messagesData = await chatService?.getChatMessages(conversationId, 50);
      setMessages(messagesData || []);
      
      // Mark conversation as read
      await chatService?.markConversationAsRead(conversationId);
      
      // Refresh conversations to update unread count
      loadChatData();
    } catch (err) {
      setError('Erro ao carregar mensagens: ' + err?.message);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to conversation changes
    const unsubscribeConversations = chatService?.subscribeToConversationChanges(() => {
      loadChatData();
    });

    // Subscribe to message changes for selected conversation
    let unsubscribeMessages = null;
    if (selectedConversation) {
      unsubscribeMessages = chatService?.subscribeToMessageChanges(
        selectedConversation?.id,
        () => {
          loadMessages(selectedConversation?.id);
        }
      );
    }

    return () => {
      unsubscribeConversations?.();
      unsubscribeMessages?.();
    };
  }, [user, selectedConversation]);

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation?.id);
  };

  const handleSendMessage = async (content, messageType = 'text', mediaUrl = null) => {
    if (!selectedConversation || !content?.trim()) return;
    
    try {
      await chatService?.sendMessage(
        selectedConversation?.id,
        content,
        messageType,
        mediaUrl
      );
      
      // Messages will be updated via real-time subscription
    } catch (err) {
      setError('Erro ao enviar mensagem: ' + err?.message);
    }
  };

  const handleArchiveConversation = async (conversationId, isArchived = true) => {
    try {
      await chatService?.archiveConversation(conversationId, isArchived);
      
      if (selectedConversation?.id === conversationId && isArchived) {
        setSelectedConversation(null);
        setMessages([]);
      }
      
      loadChatData();
    } catch (err) {
      setError('Erro ao arquivar conversa: ' + err?.message);
    }
  };

  const handleSearchConversations = async (term) => {
    setSearchTerm(term);
    
    if (term?.trim()) {
      try {
        const searchResults = await chatService?.searchConversations(term);
        setConversations(searchResults || []);
      } catch (err) {
        setError('Erro na busca: ' + err?.message);
      }
    } else {
      loadChatData();
    }
  };

  // Filter conversations based on search
  const filteredConversations = searchTerm ? 
    conversations : 
    conversations?.filter(conv => !conv?.is_archived);

  // Get conversation statistics
  const conversationStats = {
    total: conversations?.length || 0,
    unread: conversations?.filter(c => c?.unread_count > 0)?.length || 0,
    archived: conversations?.filter(c => c?.is_archived)?.length || 0,
    active: conversations?.filter(c => !c?.is_archived)?.length || 0
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando conversas...</p>
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
        
        <main className="pt-16">
          <div className="h-[calc(100vh-4rem)] flex">
            {/* Left Sidebar - Conversations */}
            <div className="w-80 border-r bg-card flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Chat ao Vivo
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span>Online</span>
                  </div>
                </div>
                
                {/* Session Filter */}
                <select 
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e?.target?.value)}
                  className="w-full p-2 border rounded-md text-sm mb-3"
                >
                  <option value="all">Todas as sessões</option>
                  {sessions?.map(session => (
                    <option key={session?.id} value={session?.id}>
                      {session?.session_name} ({session?.phone_number})
                    </option>
                  ))}
                </select>

                {/* Search */}
                <ChatSearch
                  value={searchTerm}
                  onChange={handleSearchConversations}
                  placeholder="Buscar conversas..."
                />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-sm font-semibold text-foreground">
                      {conversationStats?.unread}
                    </div>
                    <div className="text-xs text-muted-foreground">Não lidas</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-sm font-semibold text-foreground">
                      {conversationStats?.active}
                    </div>
                    <div className="text-xs text-muted-foreground">Ativas</div>
                  </div>
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                <ConversationList
                  conversations={filteredConversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleSelectConversation}
                  onArchiveConversation={handleArchiveConversation}
                  loading={loading}
                />
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <ChatArea
                  conversation={selectedConversation}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  currentUser={user}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-muted/20">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Selecione uma conversa
                    </h3>
                    <p className="text-muted-foreground max-w-sm">
                      Escolha uma conversa da lista ao lado para começar a visualizar e responder mensagens
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Contact Info */}
            {selectedConversation && (
              <div className="w-80 border-l bg-card">
                <ContactInfo
                  conversation={selectedConversation}
                  onArchive={() => handleArchiveConversation(selectedConversation?.id, true)}
                  onUnarchive={() => handleArchiveConversation(selectedConversation?.id, false)}
                />
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg max-w-sm">
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => setError('')}
                className="mt-2 text-xs underline"
              >
                Fechar
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LiveChatMonitoring;