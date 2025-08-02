import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const ConversationList = ({ 
  conversations = [], 
  selectedConversation = null, 
  onSelectConversation = () => {},
  searchQuery = '',
  onSearchChange = () => {},
  filterSession = '',
  onFilterSessionChange = () => {},
  filterStatus = '',
  onFilterStatusChange = () => {}
}) => {
  const [sessions] = useState([
    { value: '', label: 'Todas as Sessões' },
    { value: 'session-1', label: 'Sessão Principal' },
    { value: 'session-2', label: 'Sessão Vendas' },
    { value: 'session-3', label: 'Sessão Suporte' }
  ]);

  const [statusOptions] = useState([
    { value: '', label: 'Todos os Status' },
    { value: 'unread', label: 'Não Lidas' },
    { value: 'read', label: 'Lidas' },
    { value: 'archived', label: 'Arquivadas' }
  ]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date?.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return date?.toLocaleDateString('pt-BR', { 
        weekday: 'short' 
      });
    } else {
      return date?.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getSessionBadgeColor = (sessionId) => {
    const colors = {
      'session-1': 'bg-primary/10 text-primary',
      'session-2': 'bg-success/10 text-success',
      'session-3': 'bg-warning/10 text-warning'
    };
    return colors?.[sessionId] || 'bg-muted text-muted-foreground';
  };

  const filteredConversations = conversations?.filter(conv => {
    const matchesSearch = conv?.contact?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                         conv?.lastMessage?.content?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    const matchesSession = !filterSession || conv?.sessionId === filterSession;
    const matchesStatus = !filterStatus || conv?.status === filterStatus;
    
    return matchesSearch && matchesSession && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Conversas</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm text-success font-medium">Online</span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-3">
          <Input
            type="search"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e?.target?.value)}
            className="w-full"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-2">
          <Select
            placeholder="Filtrar por sessão"
            options={sessions}
            value={filterSession}
            onChange={onFilterSessionChange}
          />
          <Select
            placeholder="Filtrar por status"
            options={statusOptions}
            value={filterStatus}
            onChange={onFilterStatusChange}
          />
        </div>
      </div>
      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations?.length > 0 ? (
          <div className="space-y-1 p-2">
            {filteredConversations?.map((conversation) => (
              <div
                key={conversation?.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 ${
                  selectedConversation?.id === conversation?.id 
                    ? 'bg-primary/10 border border-primary/20' :'bg-transparent'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                      {conversation?.contact?.avatar ? (
                        <Image
                          src={conversation?.contact?.avatar}
                          alt={conversation?.contact?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon name="User" size={20} className="text-muted-foreground" />
                      )}
                    </div>
                    {conversation?.contact?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-2 border-card rounded-full"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {conversation?.contact?.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {conversation?.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                            {conversation?.unreadCount > 99 ? '99+' : conversation?.unreadCount}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation?.lastMessage?.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Last Message */}
                    <div className="flex items-center space-x-2 mb-2">
                      {conversation?.lastMessage?.type === 'image' && (
                        <Icon name="Image" size={14} className="text-muted-foreground flex-shrink-0" />
                      )}
                      {conversation?.lastMessage?.type === 'audio' && (
                        <Icon name="Mic" size={14} className="text-muted-foreground flex-shrink-0" />
                      )}
                      {conversation?.lastMessage?.type === 'document' && (
                        <Icon name="FileText" size={14} className="text-muted-foreground flex-shrink-0" />
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation?.lastMessage?.content}
                      </p>
                    </div>

                    {/* Session Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSessionBadgeColor(conversation?.sessionId)}`}>
                        {sessions?.find(s => s?.value === conversation?.sessionId)?.label || 'Sessão'}
                      </span>
                      
                      {/* Status Indicators */}
                      <div className="flex items-center space-x-1">
                        {conversation?.isTyping && (
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        )}
                        {conversation?.botEnabled && (
                          <Icon name="Bot" size={14} className="text-secondary" />
                        )}
                        {conversation?.status === 'archived' && (
                          <Icon name="Archive" size={14} className="text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <Icon name="MessageSquare" size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma conversa encontrada</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || filterSession || filterStatus 
                ? 'Tente ajustar os filtros de busca' :'As conversas aparecerão aqui quando chegarem mensagens'
              }
            </p>
          </div>
        )}
      </div>
      {/* Quick Actions */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredConversations?.length} conversas</span>
          <Button variant="ghost" size="sm">
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationList;