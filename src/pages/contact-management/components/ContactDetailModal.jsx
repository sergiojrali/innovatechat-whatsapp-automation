import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ContactDetailModal = ({ isOpen, onClose, contact, onSave, onDelete }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    cargo: '',
    cidade: '',
    estado: '',
    observacoes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        nome: contact?.nome || '',
        email: contact?.email || '',
        telefone: contact?.telefone || '',
        empresa: contact?.empresa || '',
        cargo: contact?.cargo || '',
        cidade: contact?.cidade || '',
        estado: contact?.estado || '',
        observacoes: contact?.observacoes || ''
      });
    }
  }, [contact]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Mock save operation
    setTimeout(() => {
      const updatedContact = {
        ...contact,
        ...formData,
        dataAtualizacao: new Date()?.toLocaleDateString('pt-BR')
      };
      
      onSave(updatedContact);
      setEditMode(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      onDelete(contact?.id);
      onClose();
    }
  };

  const mockCampaignHistory = [
    {
      id: 1,
      nome: 'Campanha Black Friday 2024',
      dataEnvio: '15/11/2024',
      status: 'Entregue',
      tipo: 'Promocional'
    },
    {
      id: 2,
      nome: 'Newsletter Dezembro',
      dataEnvio: '01/12/2024',
      status: 'Lida',
      tipo: 'Informativo'
    },
    {
      id: 3,
      nome: 'Pesquisa de Satisfação',
      dataEnvio: '10/01/2025',
      status: 'Pendente',
      tipo: 'Pesquisa'
    }
  ];

  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-elevation-3 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-lg">
              {contact?.nome?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {editMode ? 'Editar Contato' : contact?.nome}
              </h2>
              <p className="text-sm text-muted-foreground">
                {contact?.empresa} • Adicionado em {contact?.dataImportacao}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!editMode && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  <Icon name="Edit" size={16} className="mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Excluir
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-140px)]">
          {/* Left Panel - Contact Info */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-border">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome Completo"
                    type="text"
                    value={formData?.nome}
                    onChange={(e) => handleInputChange('nome', e?.target?.value)}
                    disabled={!editMode}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData?.email}
                    onChange={(e) => handleInputChange('email', e?.target?.value)}
                    disabled={!editMode}
                  />
                  <Input
                    label="Telefone"
                    type="tel"
                    value={formData?.telefone}
                    onChange={(e) => handleInputChange('telefone', e?.target?.value)}
                    disabled={!editMode}
                    required
                  />
                  <Input
                    label="Empresa"
                    type="text"
                    value={formData?.empresa}
                    onChange={(e) => handleInputChange('empresa', e?.target?.value)}
                    disabled={!editMode}
                  />
                  <Input
                    label="Cargo"
                    type="text"
                    value={formData?.cargo}
                    onChange={(e) => handleInputChange('cargo', e?.target?.value)}
                    disabled={!editMode}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Cidade"
                      type="text"
                      value={formData?.cidade}
                      onChange={(e) => handleInputChange('cidade', e?.target?.value)}
                      disabled={!editMode}
                    />
                    <Input
                      label="Estado"
                      type="text"
                      value={formData?.estado}
                      onChange={(e) => handleInputChange('estado', e?.target?.value)}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Informações Adicionais
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Observações
                    </label>
                    <textarea
                      value={formData?.observacoes}
                      onChange={(e) => handleInputChange('observacoes', e?.target?.value)}
                      disabled={!editMode}
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Adicione observações sobre este contato..."
                    />
                  </div>
                </div>
              </div>

              {/* Contact Statistics */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Estatísticas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">12</div>
                    <div className="text-sm text-muted-foreground">Campanhas Recebidas</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-success">8</div>
                    <div className="text-sm text-muted-foreground">Mensagens Lidas</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-warning">3</div>
                    <div className="text-sm text-muted-foreground">Respostas</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-accent">67%</div>
                    <div className="text-sm text-muted-foreground">Taxa de Engajamento</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Campaign History */}
          <div className="w-96 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Histórico de Campanhas
            </h3>
            <div className="space-y-3">
              {mockCampaignHistory?.map((campaign) => (
                <div key={campaign?.id} className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground text-sm">
                      {campaign?.nome}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      campaign?.status === 'Entregue' ? 'bg-success/10 text-success' :
                      campaign?.status === 'Lida'? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                    }`}>
                      {campaign?.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{campaign?.tipo}</span>
                    <span>{campaign?.dataEnvio}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-medium text-foreground mb-3">Ações Rápidas</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" fullWidth>
                  <Icon name="MessageSquare" size={16} className="mr-2" />
                  Enviar Mensagem
                </Button>
                <Button variant="outline" size="sm" fullWidth>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Adicionar à Campanha
                </Button>
                <Button variant="outline" size="sm" fullWidth>
                  <Icon name="Download" size={16} className="mr-2" />
                  Exportar Dados
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {editMode && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditMode(false);
                setFormData({
                  nome: contact?.nome || '',
                  email: contact?.email || '',
                  telefone: contact?.telefone || '',
                  empresa: contact?.empresa || '',
                  cargo: contact?.cargo || '',
                  cidade: contact?.cidade || '',
                  estado: contact?.estado || '',
                  observacoes: contact?.observacoes || ''
                });
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              loading={isLoading}
            >
              Salvar Alterações
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactDetailModal;