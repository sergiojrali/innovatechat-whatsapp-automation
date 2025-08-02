import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ChatArea = ({ 
  conversation = null, 
  messages = [], 
  onSendMessage = () => {},
  onMarkAsRead = () => {},
  onArchiveConversation = () => {},
  onToggleBot = () => {}
}) => {
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const commonEmojis = ['😊', '👍', '❤️', '😂', '🙏', '👏', '🔥', '💯', '🎉', '✅'];
  const messageVariables = [
    { key: '{{nome}}', label: 'Nome do contato' },
    { key: '{{empresa}}', label: 'Empresa' },
    { key: '{{telefone}}', label: 'Telefone' },
    { key: '{{email}}', label: 'Email' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (messageText?.trim()) {
      onSendMessage({
        type: 'text',
        content: messageText?.trim(),
        timestamp: new Date()
      });
      setMessageText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter' && !e?.shiftKey) {
      e?.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target?.files?.[0];
    if (file) {
      const fileType = file?.type?.startsWith('image/') ? 'image' : 
                      file?.type?.startsWith('audio/') ? 'audio' : 'document';
      
      onSendMessage({
        type: fileType,
        content: file?.name,
        file: file,
        timestamp: new Date()
      });
    }
  };

  const insertVariable = (variable) => {
    setMessageText(prev => prev + variable?.key);
    setShowVariables(false);
  };

  const insertEmoji = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp)?.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDeliveryStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Icon name="Check" size={14} className="text-muted-foreground" />;
      case 'delivered':
        return <Icon name="CheckCheck" size={14} className="text-muted-foreground" />;
      case 'read':
        return <Icon name="CheckCheck" size={14} className="text-primary" />;
      default:
        return <Icon name="Clock" size={14} className="text-muted-foreground" />;
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Icon name="MessageSquare" size={64} className="text-muted-foreground mb-4 mx-auto" />
          <h3 className="text-xl font-medium text-foreground mb-2">Selecione uma conversa</h3>
          <p className="text-muted-foreground">
            Escolha uma conversa da lista para começar a responder mensagens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
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
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success border-2 border-card rounded-full"></div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground">{conversation?.contact?.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{conversation?.contact?.phone}</span>
                {conversation?.contact?.isOnline ? (
                  <span className="text-success">• Online</span>
                ) : (
                  <span>• Visto por último há {conversation?.contact?.lastSeen}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={conversation?.botEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleBot(!conversation?.botEnabled)}
            >
              <Icon name="Bot" size={16} className="mr-2" />
              {conversation?.botEnabled ? 'Bot Ativo' : 'Bot Inativo'}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => onMarkAsRead(conversation?.id)}>
              <Icon name="CheckCheck" size={20} />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => onArchiveConversation(conversation?.id)}>
              <Icon name="Archive" size={20} />
            </Button>
          </div>
        </div>
      </div>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message, index) => (
          <div
            key={index}
            className={`flex ${message?.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
              message?.sender === 'user' ? 'order-2' : 'order-1'
            }`}>
              <div className={`rounded-lg p-3 ${
                message?.sender === 'user' ?'bg-primary text-primary-foreground' :'bg-card border border-border text-foreground'
              }`}>
                {message?.type === 'text' && (
                  <p className="text-sm whitespace-pre-wrap">{message?.content}</p>
                )}
                
                {message?.type === 'image' && (
                  <div className="space-y-2">
                    <div className="w-48 h-32 bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={message?.imageUrl || '/assets/images/no_image.png'}
                        alt="Imagem enviada"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {message?.caption && (
                      <p className="text-sm">{message?.caption}</p>
                    )}
                  </div>
                )}
                
                {message?.type === 'audio' && (
                  <div className="flex items-center space-x-3 p-2">
                    <Button variant="ghost" size="icon">
                      <Icon name="Play" size={16} />
                    </Button>
                    <div className="flex-1 h-1 bg-muted rounded-full">
                      <div className="h-full w-1/3 bg-primary rounded-full"></div>
                    </div>
                    <span className="text-xs">0:15</span>
                  </div>
                )}
                
                {message?.type === 'document' && (
                  <div className="flex items-center space-x-3 p-2">
                    <Icon name="FileText" size={20} />
                    <div>
                      <p className="text-sm font-medium">{message?.fileName}</p>
                      <p className="text-xs opacity-70">{message?.fileSize}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`flex items-center mt-1 space-x-1 ${
                message?.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message?.timestamp)}
                </span>
                {message?.sender === 'user' && getDeliveryStatusIcon(message?.status)}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-end space-x-2">
          {/* Attachment Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef?.current?.click()}
            >
              <Icon name="Paperclip" size={20} />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,audio/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e?.target?.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full p-3 pr-20 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            {/* Input Actions */}
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              {/* Variables */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowVariables(!showVariables)}
                >
                  <Icon name="AtSign" size={16} />
                </Button>
                
                {showVariables && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-popover border border-border rounded-lg shadow-elevation-3 z-50">
                    <div className="p-2">
                      <h4 className="text-sm font-medium text-foreground mb-2">Variáveis</h4>
                      {messageVariables?.map((variable, index) => (
                        <button
                          key={index}
                          onClick={() => insertVariable(variable)}
                          className="w-full text-left p-2 text-sm hover:bg-muted rounded transition-colors"
                        >
                          <div className="font-mono text-primary">{variable?.key}</div>
                          <div className="text-xs text-muted-foreground">{variable?.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Emoji */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Icon name="Smile" size={16} />
                </Button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-popover border border-border rounded-lg shadow-elevation-3 z-50">
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-foreground mb-3">Emojis</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {commonEmojis?.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => insertEmoji(emoji)}
                            className="p-2 text-lg hover:bg-muted rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={!messageText?.trim()}
            size="icon"
          >
            <Icon name="Send" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;