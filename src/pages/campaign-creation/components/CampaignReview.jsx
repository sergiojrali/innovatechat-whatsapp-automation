import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CampaignReview = ({ formData, whatsappSessions, contactLists, onEdit }) => {
  const getSelectedSession = () => {
    return whatsappSessions?.find(session => session?.id === formData?.whatsappSessionId);
  };

  const getSelectedLists = () => {
    return contactLists?.filter(list => 
      (formData?.selectedContactLists || [])?.includes(list?.id)
    );
  };

  const getTotalContacts = () => {
    return getSelectedLists()?.reduce((total, list) => total + list?.contactCount, 0);
  };

  const getEstimatedCost = () => {
    const totalContacts = getTotalContacts();
    const costPerMessage = 0.05;
    return (totalContacts * costPerMessage)?.toFixed(2);
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return '';
    const [year, month, day] = date?.split('-');
    return `${day}/${month}/${year} ${time}`;
  };

  const getDeliverySpeedLabel = (speed) => {
    const speeds = {
      slow: 'Lenta (1 msg/min)',
      medium: 'Média (5 msgs/min)',
      fast: 'Rápida (10 msgs/min)'
    };
    return speeds?.[speed] || speed;
  };

  const selectedSession = getSelectedSession();
  const selectedLists = getSelectedLists();
  const totalContacts = getTotalContacts();

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-primary font-semibold">5</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revisão e Confirmação</h3>
          <p className="text-sm text-muted-foreground">Revise todos os detalhes antes de criar sua campanha</p>
        </div>
      </div>
      <div className="space-y-6">
        {/* Campaign Basic Info */}
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Informações Básicas</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(1)}
              iconName="Edit"
              iconPosition="left"
            >
              Editar
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Nome da Campanha</label>
              <p className="font-medium text-foreground">{formData?.name || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Descrição</label>
              <p className="font-medium text-foreground">{formData?.description || 'Não informado'}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">Sessão WhatsApp</label>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <p className="font-medium text-foreground">
                  {selectedSession ? `${selectedSession?.name} - ${selectedSession?.phone}` : 'Não selecionado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Lists */}
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Listas de Contatos</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(2)}
              iconName="Edit"
              iconPosition="left"
            >
              Editar
            </Button>
          </div>
          <div className="space-y-3">
            {selectedLists?.length > 0 ? (
              selectedLists?.map((list) => (
                <div key={list?.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{list?.name}</p>
                    <p className="text-sm text-muted-foreground">{list?.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{list?.contactCount}</p>
                    <p className="text-sm text-muted-foreground">contatos</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Nenhuma lista selecionada</p>
            )}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Total de Destinatários:</span>
                <span className="text-xl font-bold text-primary">{totalContacts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Conteúdo da Mensagem</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(3)}
              iconName="Edit"
              iconPosition="left"
            >
              Editar
            </Button>
          </div>
          <div className="space-y-4">
            {formData?.message?.text && (
              <div>
                <label className="text-sm text-muted-foreground">Texto da Mensagem</label>
                <div className="mt-1 p-3 bg-card border border-border rounded-lg">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {formData?.message?.text}
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {(formData?.message?.images || [])?.length}
                </div>
                <div className="text-sm text-muted-foreground">Imagens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {(formData?.message?.audio || [])?.length}
                </div>
                <div className="text-sm text-muted-foreground">Áudios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {(formData?.message?.documents || [])?.length}
                </div>
                <div className="text-sm text-muted-foreground">Documentos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule and Settings */}
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Agendamento e Configurações</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(4)}
              iconName="Edit"
              iconPosition="left"
            >
              Editar
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Tipo de Envio</label>
              <p className="font-medium text-foreground">
                {formData?.scheduleType === 'immediate' ? 'Enviar Agora' : 'Agendado'}
              </p>
            </div>
            {formData?.scheduleType === 'scheduled' && (
              <div>
                <label className="text-sm text-muted-foreground">Data e Hora</label>
                <p className="font-medium text-foreground">
                  {formatDateTime(formData?.scheduledDate, formData?.scheduledTime)} (GMT-3)
                </p>
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground">Velocidade de Entrega</label>
              <p className="font-medium text-foreground">
                {getDeliverySpeedLabel(formData?.deliverySpeed)}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Configurações</label>
              <div className="space-y-1">
                {formData?.avoidDuplicates && (
                  <div className="flex items-center space-x-2">
                    <Icon name="Check" size={14} className="text-success" />
                    <span className="text-sm text-foreground">Evitar duplicatas</span>
                  </div>
                )}
                {formData?.stopOnError && (
                  <div className="flex items-center space-x-2">
                    <Icon name="Check" size={14} className="text-success" />
                    <span className="text-sm text-foreground">Parar em caso de erro</span>
                  </div>
                )}
                {formData?.saveAsTemplate && (
                  <div className="flex items-center space-x-2">
                    <Icon name="Check" size={14} className="text-success" />
                    <span className="text-sm text-foreground">Salvar como modelo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Final Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <h4 className="font-medium text-foreground mb-4">Resumo Final</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalContacts}</div>
              <div className="text-sm text-muted-foreground">Destinatários</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">
                {formData?.scheduleType === 'immediate' ? '0min' : '30min'}
              </div>
              <div className="text-sm text-muted-foreground">Tempo até início</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">2h 30min</div>
              <div className="text-sm text-muted-foreground">Duração estimada</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success">R$ {getEstimatedCost()}</div>
              <div className="text-sm text-muted-foreground">Custo total</div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-start space-x-3">
              <Icon name="AlertCircle" size={20} className="text-warning mt-0.5" />
              <div>
                <h5 className="font-medium text-foreground mb-1">Importante</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Certifique-se de que sua sessão WhatsApp está conectada</li>
                  <li>• Verifique se o conteúdo está de acordo com as políticas do WhatsApp</li>
                  <li>• Uma vez iniciada, a campanha não poderá ser modificada</li>
                  <li>• Você receberá relatórios em tempo real sobre o progresso</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignReview;