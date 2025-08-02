import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ContactInfo = ({ 
  contact = null, 
  isVisible = false, 
  onClose = () => {},
  onUpdateContact = () => {},
  onViewCampaignHistory = () => {}
}) => {
  const [notes, setNotes] = useState(contact?.notes || '');
  const [tags, setTags] = useState(contact?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (!contact || !isVisible) return null;

  const handleSaveNotes = () => {
    onUpdateContact({ ...contact, notes });
    setIsEditingNotes(false);
  };

  const handleAddTag = () => {
    if (newTag?.trim() && !tags?.includes(newTag?.trim())) {
      const updatedTags = [...tags, newTag?.trim()];
      setTags(updatedTags);
      onUpdateContact({ ...contact, tags: updatedTags });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = tags?.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    onUpdateContact({ ...contact, tags: updatedTags });
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <div className="w-80 bg-card border-l border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Informações do Contato</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>
      </div>
      {/* Contact Details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Section */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center overflow-hidden">
            {contact?.avatar ? (
              <Image
                src={contact?.avatar}
                alt={contact?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon name="User" size={32} className="text-muted-foreground" />
            )}
          </div>
          <h4 className="text-xl font-semibold text-foreground">{contact?.name}</h4>
          <p className="text-muted-foreground">{contact?.phone}</p>
          <div className="flex items-center justify-center mt-2">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              contact?.isOnline ? 'bg-success' : 'bg-muted-foreground'
            }`}></div>
            <span className="text-sm text-muted-foreground">
              {contact?.isOnline ? 'Online' : `Visto há ${contact?.lastSeen}`}
            </span>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2">Informações de Contato</h5>
            <div className="space-y-3">
              {contact?.email && (
                <div className="flex items-center space-x-3">
                  <Icon name="Mail" size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{contact?.email}</span>
                </div>
              )}
              {contact?.company && (
                <div className="flex items-center space-x-3">
                  <Icon name="Building" size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{contact?.company}</span>
                </div>
              )}
              {contact?.location && (
                <div className="flex items-center space-x-3">
                  <Icon name="MapPin" size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{contact?.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2">Tags</h5>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-primary/70"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Adicionar tag"
                value={newTag}
                onChange={(e) => setNewTag(e?.target?.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddTag} disabled={!newTag?.trim()}>
                <Icon name="Plus" size={16} />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium text-foreground">Anotações</h5>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingNotes(!isEditingNotes)}
              >
                <Icon name={isEditingNotes ? "X" : "Edit"} size={16} />
              </Button>
            </div>
            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e?.target?.value)}
                  placeholder="Adicione suas anotações sobre este contato..."
                  className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows="4"
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSaveNotes}>
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNotes(contact?.notes || '');
                      setIsEditingNotes(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-muted/30 rounded-lg min-h-[80px]">
                {notes ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhuma anotação adicionada
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Statistics */}
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2">Estatísticas</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-lg font-semibold text-foreground">{contact?.totalMessages || 0}</div>
                <div className="text-xs text-muted-foreground">Mensagens</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-lg font-semibold text-foreground">{contact?.campaignsReceived || 0}</div>
                <div className="text-xs text-muted-foreground">Campanhas</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2">Atividade Recente</h5>
            <div className="space-y-2">
              {contact?.recentActivity?.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-2 bg-muted/30 rounded-lg">
                  <Icon name={activity?.icon} size={16} className="text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity?.description}</p>
                    <p className="text-xs text-muted-foreground">{activity?.timestamp}</p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onViewCampaignHistory(contact?.id)}
        >
          <Icon name="BarChart3" size={16} className="mr-2" />
          Histórico de Campanhas
        </Button>
        <Button variant="outline" className="w-full">
          <Icon name="MessageSquare" size={16} className="mr-2" />
          Iniciar Nova Conversa
        </Button>
      </div>
    </div>
  );
};

export default ContactInfo;