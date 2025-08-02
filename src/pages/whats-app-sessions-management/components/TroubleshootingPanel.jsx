import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TroubleshootingPanel = ({ isOpen, onClose }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const troubleshootingSteps = [
    {
      id: 'connection-failed',
      title: 'Falha na Conexão',
      icon: 'WifiOff',
      color: 'text-error',
      steps: [
        'Verifique se o WhatsApp está instalado e atualizado no seu celular',
        'Certifique-se de que o celular está conectado à internet',
        'Tente gerar um novo QR Code clicando em "Atualizar"',
        'Verifique se não há outros dispositivos conectados (máximo 4)',
        'Reinicie o aplicativo WhatsApp no celular'
      ]
    },
    {
      id: 'qr-expired',
      title: 'QR Code Expirado',
      icon: 'Clock',
      color: 'text-warning',
      steps: [
        'O QR Code expira em 2 minutos por segurança',
        'Clique em "Gerar Novo QR Code" para obter um código atualizado',
        'Escaneie o código rapidamente após a geração',
        'Mantenha a tela do computador ligada durante o processo'
      ]
    },
    {
      id: 'disconnected',
      title: 'Sessão Desconectada',
      icon: 'Unplug',
      color: 'text-error',
      steps: [
        'Verifique a conexão de internet do celular e computador',
        'Certifique-se de que o WhatsApp não foi deslogado no celular',
        'Verifique se o celular não ficou muito tempo offline',
        'Tente reconectar clicando em "Conectar" na sessão',
        'Se persistir, remova o dispositivo no WhatsApp e reconecte'
      ]
    },
    {
      id: 'messages-not-sending',
      title: 'Mensagens Não Enviadas',
      icon: 'MessageSquareX',
      color: 'text-warning',
      steps: [
        'Verifique se a sessão está conectada (status verde)',
        'Confirme se o bot automático está ativado',
        'Verifique se não atingiu o limite diário de mensagens',
        'Certifique-se de que está dentro do horário comercial configurado',
        'Verifique se o número de destino está correto e ativo'
      ]
    },
    {
      id: 'slow-performance',
      title: 'Performance Lenta',
      icon: 'Zap',
      color: 'text-accent',
      steps: [
        'Feche outras abas do navegador para liberar memória',
        'Verifique a velocidade da sua conexão de internet',
        'Limpe o cache do navegador',
        'Desconecte sessões não utilizadas',
        'Reinicie o navegador se necessário'
      ]
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="HelpCircle" size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Central de Ajuda</h2>
                <p className="text-sm text-muted-foreground">Soluções para problemas comuns</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Quick Tips */}
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="font-semibold text-primary mb-2 flex items-center">
              <Icon name="Lightbulb" size={16} className="mr-2" />
              Dicas Rápidas
            </h3>
            <ul className="text-sm text-foreground space-y-1">
              <li>• Mantenha o WhatsApp sempre atualizado no celular</li>
              <li>• Use uma conexão de internet estável</li>
              <li>• Não deslogue do WhatsApp no celular enquanto usar o bot</li>
              <li>• Monitore os limites diários de mensagens</li>
            </ul>
          </div>

          {/* Troubleshooting Sections */}
          <div className="space-y-4">
            {troubleshootingSteps?.map((section) => (
              <div key={section?.id} className="border border-border rounded-lg">
                <button
                  onClick={() => toggleSection(section?.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Icon name={section?.icon} size={20} className={section?.color} />
                    <span className="font-medium text-foreground">{section?.title}</span>
                  </div>
                  <Icon 
                    name={expandedSection === section?.id ? "ChevronUp" : "ChevronDown"} 
                    size={16} 
                    className="text-muted-foreground" 
                  />
                </button>

                {expandedSection === section?.id && (
                  <div className="px-4 pb-4">
                    <div className="pl-8">
                      <h4 className="font-medium text-foreground mb-3">Passos para resolver:</h4>
                      <ol className="space-y-2">
                        {section?.steps?.map((step, index) => (
                          <li key={index} className="flex items-start space-x-3 text-sm text-muted-foreground">
                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">Ainda precisa de ajuda?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Se o problema persistir, entre em contato com nosso suporte técnico.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" iconName="Mail" iconPosition="left">
                Enviar Email
              </Button>
              <Button variant="outline" size="sm" iconName="MessageCircle" iconPosition="left">
                Chat Online
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingPanel;