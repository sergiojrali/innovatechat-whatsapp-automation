import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const ChatSearch = ({ 
  isVisible = false, 
  onClose = () => {},
  onSearchResults = () => {},
  conversations = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    if (searchQuery?.trim()?.length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const results = [];
    
    conversations?.forEach(conversation => {
      // Search in contact name
      if (conversation?.contact?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase())) {
        results?.push({
          id: `contact-${conversation?.id}`,
          type: 'contact',
          conversationId: conversation?.id,
          title: conversation?.contact?.name,
          subtitle: 'Nome do contato',
          timestamp: null
        });
      }
      
      // Search in messages (mock messages for each conversation)
      const mockMessages = [
        { content: `Olá, meu nome é ${conversation?.contact?.name}`, timestamp: new Date(Date.now() - 3600000) },
        { content: "Gostaria de saber mais sobre seus produtos", timestamp: new Date(Date.now() - 1800000) },
        { content: "Obrigado pelo atendimento!", timestamp: new Date(Date.now() - 900000) }
      ];
      
      mockMessages?.forEach((message, index) => {
        if (message?.content?.toLowerCase()?.includes(searchQuery?.toLowerCase())) {
          results?.push({
            id: `message-${conversation?.id}-${index}`,
            type: 'message',
            conversationId: conversation?.id,
            title: conversation?.contact?.name,
            subtitle: message?.content,
            timestamp: message?.timestamp,
            messageIndex: index
          });
        }
      });
    });
    
    setSearchResults(results?.slice(0, 20)); // Limit to 20 results
    setIsSearching(false);
  };

  const handleResultClick = (result) => {
    setSelectedResult(result);
    onSearchResults({
      conversationId: result?.conversationId,
      messageIndex: result?.messageIndex,
      searchQuery: searchQuery
    });
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text?.split(regex);
    
    return parts?.map((part, index) => 
      regex?.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
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
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date?.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="w-full max-w-2xl mx-4 bg-card border border-border rounded-lg shadow-elevation-3">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Search" size={20} className="text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar em todas as conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e?.target?.value)}
              className="flex-1 border-0 focus:ring-0 text-lg"
              autoFocus
            />
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center">
              <Icon name="Loader2" size={32} className="text-muted-foreground animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Buscando...</p>
            </div>
          ) : searchQuery?.trim()?.length <= 2 ? (
            <div className="p-8 text-center">
              <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Buscar Conversas</h3>
              <p className="text-muted-foreground">
                Digite pelo menos 3 caracteres para buscar em todas as conversas
              </p>
            </div>
          ) : searchResults?.length > 0 ? (
            <div className="py-2">
              {searchResults?.map((result) => (
                <button
                  key={result?.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-l-4 ${
                    selectedResult?.id === result?.id 
                      ? 'border-l-primary bg-primary/5' :'border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon 
                          name={result?.type === 'contact' ? 'User' : 'MessageSquare'} 
                          size={16} 
                          className="text-muted-foreground flex-shrink-0" 
                        />
                        <h4 className="font-medium text-foreground truncate">
                          {highlightText(result?.title, searchQuery)}
                        </h4>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {highlightText(result?.subtitle, searchQuery)}
                      </p>
                    </div>
                    {result?.timestamp && (
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatTime(result?.timestamp)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Icon name="SearchX" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground">
                Não encontramos nada para "{searchQuery}". Tente usar outras palavras-chave.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {searchResults?.length > 0 && (
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{searchResults?.length} resultado{searchResults?.length !== 1 ? 's' : ''} encontrado{searchResults?.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center space-x-2">
                <span>Use ↑↓ para navegar</span>
                <span>Enter para selecionar</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSearch;