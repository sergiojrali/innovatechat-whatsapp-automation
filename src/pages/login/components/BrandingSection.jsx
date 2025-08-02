import React from 'react';
import Icon from '../../../components/AppIcon';


const BrandingSection = () => {
  const features = [
    {
      icon: 'MessageSquare',
      title: 'Automação WhatsApp',
      description: 'Gerencie múltiplas sessões WhatsApp com bots inteligentes'
    },
    {
      icon: 'Users',
      title: 'Gestão de Contatos',
      description: 'Importe e organize seus contatos com facilidade'
    },
    {
      icon: 'BarChart3',
      title: 'Campanhas Eficazes',
      description: 'Crie e monitore campanhas de marketing personalizadas'
    },
    {
      icon: 'MessageCircle',
      title: 'Chat em Tempo Real',
      description: 'Monitore e responda conversas instantaneamente'
    }
  ];

  const trustSignals = [
    {
      icon: 'Shield',
      text: 'Certificado LGPD'
    },
    {
      icon: 'Lock',
      text: 'Segurança SSL'
    },
    {
      icon: 'Award',
      text: 'ISO 27001'
    }
  ];

  return (
    <div className="relative h-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 border border-current rounded-full"></div>
        <div className="absolute top-40 right-16 w-24 h-24 border border-current rounded-lg rotate-45"></div>
        <div className="absolute bottom-32 left-16 w-20 h-20 border border-current rounded-full"></div>
        <div className="absolute bottom-20 right-32 w-16 h-16 border border-current rounded-lg"></div>
      </div>
      <div className="relative z-10 h-full flex flex-col justify-between p-8 lg:p-12">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
              <Icon name="MessageSquare" size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">InnovateChat</h1>
              <p className="text-primary-foreground/80 text-sm">WhatsApp Automation Platform</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              Automatize seu WhatsApp Business
            </h2>
            <p className="text-primary-foreground/90 text-lg leading-relaxed">
              Plataforma completa para automação, campanhas e monitoramento de conversas WhatsApp para empresas brasileiras.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold mb-4">Por que escolher o InnovateChat?</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {features?.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name={feature?.icon} size={20} className="text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{feature?.title}</h4>
                  <p className="text-primary-foreground/80 text-xs leading-relaxed">
                    {feature?.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Signals */}
        <div>
          <div className="flex items-center space-x-6 mb-6">
            {trustSignals?.map((signal, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Icon name={signal?.icon} size={16} className="text-primary-foreground/80" />
                <span className="text-xs text-primary-foreground/80">{signal?.text}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-primary-foreground/20 pt-6">
            <p className="text-xs text-primary-foreground/70">
              © {new Date()?.getFullYear()} InnovateChat. Todos os direitos reservados.
            </p>
            <p className="text-xs text-primary-foreground/70 mt-1">
              Desenvolvido no Brasil para empresas brasileiras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingSection;