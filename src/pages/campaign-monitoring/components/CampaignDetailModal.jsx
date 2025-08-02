import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const CampaignDetailModal = ({ campaign, isOpen, onClose, onNavigateToChat, nome, empresa }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  if (!isOpen || !campaign) return null;

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('pt-BR')?.format(num);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enviada':return 'text-success';
      case 'entregue':return 'text-primary';
      case 'lida':return 'text-secondary';
      case 'falhou':return 'text-error';
      default:return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'enviada':return 'Send';
      case 'entregue':return 'Check';
      case 'lida':return 'Eye';
      case 'falhou':return 'X';
      default:return 'Clock';
    }
  };

  const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: 'BarChart3' },
  { id: 'recipients', label: 'Destinatários', icon: 'Users' },
  { id: 'messages', label: 'Mensagens', icon: 'MessageSquare' },
  { id: 'analytics', label: 'Análises', icon: 'TrendingUp' }];


  const mockRecipients = [
  {
    id: 1,
    nome: "João Silva",
    telefone: "+55 11 99999-1234",
    status: "lida",
    entregueEm: "2025-02-01T14:30:00",
    lidaEm: "2025-02-01T14:32:00",
    respondeu: true,
    ultimaResposta: "Tenho interesse no produto!"
  },
  {
    id: 2,
    nome: "Maria Santos",
    telefone: "+55 11 99999-5678",
    status: "entregue",
    entregueEm: "2025-02-01T14:28:00",
    lidaEm: null,
    respondeu: false,
    ultimaResposta: null
  },
  {
    id: 3,
    nome: "Pedro Costa",
    telefone: "+55 11 99999-9012",
    status: "falhou",
    entregueEm: null,
    lidaEm: null,
    respondeu: false,
    ultimaResposta: null,
    erro: "Número inválido"
  }];


  const handleSelectRecipient = (recipientId) => {
    setSelectedRecipients((prev) =>
    prev?.includes(recipientId) ?
    prev?.filter((id) => id !== recipientId) :
    [...prev, recipientId]
    );
  };

  const handleSelectAllRecipients = () => {
    if (selectedRecipients?.length === mockRecipients?.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(mockRecipients?.map((r) => r?.id));
    }
  };

  const renderOverviewTab = () =>
  <div className="space-y-6">
      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">Informações da Campanha</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="text-foreground font-medium">{campaign?.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="text-foreground">{campaign?.tipo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium ${getStatusColor(campaign?.status)}`}>
                  {campaign?.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criada em:</span>
                <span className="text-foreground">{formatDate(campaign?.criadaEm)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">Estatísticas</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de destinatários:</span>
                <span className="text-foreground font-medium">{formatNumber(campaign?.totalDestinatarios)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mensagens enviadas:</span>
                <span className="text-success font-medium">{formatNumber(campaign?.enviadas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de entrega:</span>
                <span className="text-primary font-medium">{campaign?.taxaEntrega}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de leitura:</span>
                <span className="text-secondary font-medium">{campaign?.taxaLeitura}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div>
        <h4 className="font-medium text-foreground mb-4">Progresso da Campanha</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso geral</span>
            <span className="font-medium text-foreground">{campaign?.progresso}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${campaign?.progresso}%` }} />

          </div>
        </div>
      </div>
    </div>;


  const renderRecipientsTab = () =>
  <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">
          Destinatários ({mockRecipients?.length})
        </h4>
        <div className="flex items-center space-x-2">
          <Checkbox
          checked={selectedRecipients?.length === mockRecipients?.length}
          onChange={handleSelectAllRecipients}
          indeterminate={selectedRecipients?.length > 0 && selectedRecipients?.length < mockRecipients?.length}
          label="Selecionar todos" />

        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {mockRecipients?.map((recipient) =>
      <div key={recipient?.id} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
            <Checkbox
          checked={selectedRecipients?.includes(recipient?.id)}
          onChange={() => handleSelectRecipient(recipient?.id)} />

            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{recipient?.nome}</p>
                  <p className="text-sm text-muted-foreground">{recipient?.telefone}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Icon
                name={getStatusIcon(recipient?.status)}
                size={16}
                className={getStatusColor(recipient?.status)} />

                  <span className={`text-sm font-medium ${getStatusColor(recipient?.status)}`}>
                    {recipient?.status}
                  </span>
                </div>
              </div>
              
              {recipient?.entregueEm &&
          <p className="text-xs text-muted-foreground mt-1">
                  Entregue em: {formatDate(recipient?.entregueEm)}
                </p>
          }
              
              {recipient?.respondeu && recipient?.ultimaResposta &&
          <div className="mt-2 p-2 bg-success/10 rounded border-l-2 border-success">
                  <p className="text-sm text-foreground">{recipient?.ultimaResposta}</p>
                  <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToChat(recipient?.telefone)}
              className="mt-1 h-6 px-2 text-xs">

                    Ver conversa
                  </Button>
                </div>
          }
              
              {recipient?.erro &&
          <div className="mt-2 p-2 bg-error/10 rounded border-l-2 border-error">
                  <p className="text-sm text-error">{recipient?.erro}</p>
                </div>
          }
            </div>
          </div>
      )}
      </div>
    </div>;


  const renderMessagesTab = () =>
  <div className="space-y-4">
      <h4 className="font-medium text-foreground">Conteúdo da Mensagem</h4>
      
      <div className="bg-muted/20 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Icon name="MessageSquare" size={20} className="text-primary" />
          <span className="font-medium text-foreground">Mensagem Principal</span>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-foreground whitespace-pre-wrap">
            {`Olá {{nome}}! 🎉

Temos uma oferta especial para você da {{empresa}}!

✨ Desconto de 30% em todos os produtos
📅 Válido até 15/02/2025
🚚 Frete grátis para todo o Brasil

Não perca essa oportunidade única!

Para mais informações, responda esta mensagem ou acesse nosso site.

Atenciosamente,
Equipe {{empresa}}`}
          </p>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Variáveis utilizadas: {{ nome }}, {{ empresa }}</p>
          <p>Tipo: Mensagem de texto</p>
          <p>Caracteres: 287</p>
        </div>
      </div>
    </div>;


  const renderAnalyticsTab = () =>
  <div className="space-y-6">
      <h4 className="font-medium text-foreground">Análises Detalhadas</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted/20 rounded-lg p-4">
          <h5 className="font-medium text-foreground mb-3">Horários de Maior Engajamento</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">09:00 - 12:00</span>
              <span className="text-foreground font-medium">45% das leituras</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">14:00 - 17:00</span>
              <span className="text-foreground font-medium">32% das leituras</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">19:00 - 22:00</span>
              <span className="text-foreground font-medium">23% das leituras</span>
            </div>
          </div>
        </div>
        
        <div className="bg-muted/20 rounded-lg p-4">
          <h5 className="font-medium text-foreground mb-3">Tipos de Resposta</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interesse</span>
              <span className="text-success font-medium">68%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dúvidas</span>
              <span className="text-warning font-medium">23%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Não interessado</span>
              <span className="text-error font-medium">9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>;


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{campaign?.nome}</h2>
            <p className="text-sm text-muted-foreground">Detalhes da campanha</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}>

            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex space-x-0 px-6">
            {tabs?.map((tab) =>
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab?.id ?
              'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`
              }>

                <Icon name={tab?.icon} size={16} />
                <span>{tab?.label}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'recipients' && renderRecipientsTab()}
          {activeTab === 'messages' && renderMessagesTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Última atualização: {formatDate(campaign?.ultimaAtividade)}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="default"
              onClick={() => onNavigateToChat()}
              iconName="MessageCircle"
              iconPosition="left">

              Ir para Chat
            </Button>
          </div>
        </div>
      </div>
    </div>);

};

export default CampaignDetailModal;