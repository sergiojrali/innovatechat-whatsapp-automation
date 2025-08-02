import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const BenefitsSidebar = () => {
  const benefits = [
    {
      icon: 'MessageSquare',
      title: 'Automação WhatsApp',
      description: 'Gerencie múltiplas sessões e automatize conversas'
    },
    {
      icon: 'Users',
      title: 'Gestão de Contatos',
      description: 'Importe e organize seus contatos facilmente'
    },
    {
      icon: 'BarChart3',
      title: 'Campanhas Inteligentes',
      description: 'Crie campanhas personalizadas com variáveis'
    },
    {
      icon: 'MessageCircle',
      title: 'Chat ao Vivo',
      description: 'Monitore e responda conversas em tempo real'
    }
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      company: 'Silva & Associados',
      location: 'São Paulo, SP',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
      text: `O InnovateChat revolucionou nossa comunicação com clientes. Aumentamos nossa conversão em 40% no primeiro mês.`
    },
    {
      name: 'João Santos',
      company: 'TechBrasil Ltda',
      location: 'Rio de Janeiro, RJ',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
      text: `A automação do WhatsApp nos permitiu atender 3x mais clientes com a mesma equipe. Excelente plataforma!`
    }
  ];

  const pricingFeatures = [
    'Até 5 sessões WhatsApp simultâneas',
    '10.000 mensagens por mês',
    'Importação ilimitada de contatos',
    'Campanhas personalizadas',
    'Chat ao vivo integrado',
    'Relatórios detalhados',
    'Suporte técnico brasileiro'
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-8 h-fit">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
          <Icon name="MessageSquare" size={32} className="text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">InnovateChat</h2>
        <p className="text-muted-foreground">Automação WhatsApp para empresas</p>
      </div>
      {/* Benefits */}
      <div className="space-y-6 mb-8">
        <h3 className="font-semibold text-foreground">Por que escolher nossa plataforma?</h3>
        <div className="space-y-4">
          {benefits?.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name={benefit?.icon} size={16} className="text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm">{benefit?.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{benefit?.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Pricing */}
      <div className="bg-primary/5 rounded-lg p-6 mb-8">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-foreground mb-2">Plano Empresarial</h3>
          <div className="flex items-baseline justify-center">
            <span className="text-3xl font-bold text-primary">R$ 297</span>
            <span className="text-muted-foreground ml-1">/mês</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Primeiro mês grátis para novos usuários
          </p>
        </div>
        
        <div className="space-y-2">
          {pricingFeatures?.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Icon name="Check" size={14} className="text-success flex-shrink-0" />
              <span className="text-xs text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Testimonials */}
      <div className="space-y-6">
        <h3 className="font-semibold text-foreground">O que nossos clientes dizem</h3>
        <div className="space-y-4">
          {testimonials?.map((testimonial, index) => (
            <div key={index} className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <Image
                  src={testimonial?.avatar}
                  alt={testimonial?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm">{testimonial?.name}</h4>
                  <p className="text-xs text-muted-foreground">{testimonial?.company}</p>
                  <p className="text-xs text-muted-foreground">{testimonial?.location}</p>
                </div>
              </div>
              <p className="text-xs text-foreground italic">"{testimonial?.text}"</p>
            </div>
          ))}
        </div>
      </div>
      {/* Trust Signals */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="Shield" size={14} className="text-success" />
            <span>SSL Seguro</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Award" size={14} className="text-success" />
            <span>LGPD</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="MapPin" size={14} className="text-success" />
            <span>Brasil</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenefitsSidebar;