import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import CampaignWizardSteps from './components/CampaignWizardSteps';
import CampaignBasicInfo from './components/CampaignBasicInfo';
import ContactSelection from './components/ContactSelection';
import MessageComposer from './components/MessageComposer';
import CampaignScheduling from './components/CampaignScheduling';
import CampaignReview from './components/CampaignReview';

const CampaignCreation = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Mock user data
  const user = {
    name: "Carlos Silva",
    email: "carlos@empresa.com",
    role: "admin"
  };

  // Mock notifications
  const notifications = [
    {
      title: "Campanha Concluída",
      message: "Sua campanha \'Promoção Janeiro\' foi finalizada com sucesso",
      time: "5 min atrás",
      type: "success",
      read: false
    },
    {
      title: "Sessão Desconectada",
      message: "A sessão WhatsApp Business foi desconectada",
      time: "15 min atrás",
      type: "warning",
      read: false
    }
  ];

  // Campaign form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    whatsappSessionId: '',
    selectedContactLists: [],
    message: {
      text: '',
      images: [],
      audio: [],
      documents: []
    },
    scheduleType: 'immediate',
    scheduledDate: '',
    scheduledTime: '',
    deliverySpeed: 'medium',
    avoidDuplicates: true,
    stopOnError: false,
    saveAsTemplate: false
  });

  // Mock WhatsApp sessions
  const whatsappSessions = [
    {
      id: 'session-1',
      name: 'Empresa Principal',
      phone: '+55 11 99999-1234',
      status: 'connected',
      lastActivity: '2025-02-02T01:00:00Z'
    },
    {
      id: 'session-2',
      name: 'Suporte Técnico',
      phone: '+55 11 99999-5678',
      status: 'connected',
      lastActivity: '2025-02-02T00:30:00Z'
    },
    {
      id: 'session-3',
      name: 'Vendas',
      phone: '+55 11 99999-9012',
      status: 'disconnected',
      lastActivity: '2025-02-01T18:00:00Z'
    }
  ];

  // Mock contact lists
  const contactLists = [
    {
      id: 'list-1',
      name: 'Clientes Premium',
      description: 'Lista de clientes com plano premium ativo',
      contactCount: 150,
      status: 'active',
      createdAt: '15/01/2025',
      updatedAt: '01/02/2025'
    },
    {
      id: 'list-2',
      name: 'Leads Qualificados',
      description: 'Prospects que demonstraram interesse nos produtos',
      contactCount: 320,
      status: 'active',
      createdAt: '10/01/2025',
      updatedAt: '31/01/2025'
    },
    {
      id: 'list-3',
      name: 'Clientes Inativos',
      description: 'Clientes que não fazem compras há mais de 6 meses',
      contactCount: 89,
      status: 'active',
      createdAt: '05/01/2025',
      updatedAt: '30/01/2025'
    },
    {
      id: 'list-4',
      name: 'Newsletter Subscribers',
      description: 'Usuários inscritos na newsletter mensal',
      contactCount: 450,
      status: 'active',
      createdAt: '20/12/2024',
      updatedAt: '28/01/2025'
    }
  ];

  // Wizard steps configuration
  const wizardSteps = [
    {
      id: 1,
      title: 'Informações Básicas',
      description: 'Nome e sessão WhatsApp'
    },
    {
      id: 2,
      title: 'Seleção de Contatos',
      description: 'Escolha as listas de destinatários'
    },
    {
      id: 3,
      title: 'Composição da Mensagem',
      description: 'Crie o conteúdo da campanha'
    },
    {
      id: 4,
      title: 'Agendamento',
      description: 'Configure quando enviar'
    },
    {
      id: 5,
      title: 'Revisão',
      description: 'Confirme todos os detalhes'
    }
  ];

  const handleFormChange = (field, value) => {
    if (field?.includes('.')) {
      const [parent, child] = field?.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev?.[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when field is updated
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData?.name?.trim()) {
          newErrors.name = 'Nome da campanha é obrigatório';
        }
        if (!formData?.whatsappSessionId) {
          newErrors.whatsappSessionId = 'Selecione uma sessão WhatsApp';
        }
        break;

      case 2:
        if (!formData?.selectedContactLists || formData?.selectedContactLists?.length === 0) {
          newErrors.selectedContactLists = 'Selecione pelo menos uma lista de contatos';
        }
        break;

      case 3:
        if (!formData?.message?.text?.trim()) {
          newErrors['message.text'] = 'Mensagem de texto é obrigatória';
        } else if (formData?.message?.text?.length > 1000) {
          newErrors['message.text'] = 'Mensagem deve ter no máximo 1000 caracteres';
        }
        break;

      case 4:
        if (!formData?.deliverySpeed) {
          newErrors.deliverySpeed = 'Selecione a velocidade de entrega';
        }
        if (formData?.scheduleType === 'scheduled') {
          if (!formData?.scheduledDate) {
            newErrors.scheduledDate = 'Data é obrigatória para agendamento';
          }
          if (!formData?.scheduledTime) {
            newErrors.scheduledTime = 'Hora é obrigatória para agendamento';
          }
          // Validate future date
          if (formData?.scheduledDate && formData?.scheduledTime) {
            const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
            const now = new Date();
            if (scheduledDateTime <= now) {
              newErrors.scheduledDate = 'Data e hora devem ser no futuro';
            }
          }
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, wizardSteps?.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepEdit = (step) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success - redirect to campaign monitoring
      navigate('/campaign-monitoring', {
        state: {
          message: 'Campanha criada com sucesso!',
          campaignName: formData?.name
        }
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: 'Erro ao criar campanha. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    // Save as draft logic
    console.log('Saving draft:', formData);
    alert('Rascunho salvo com sucesso!');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CampaignBasicInfo
            formData={formData}
            onFormChange={handleFormChange}
            whatsappSessions={whatsappSessions}
            errors={errors}
          />
        );
      case 2:
        return (
          <ContactSelection
            formData={formData}
            onFormChange={handleFormChange}
            contactLists={contactLists}
            errors={errors}
          />
        );
      case 3:
        return (
          <MessageComposer
            formData={formData}
            onFormChange={handleFormChange}
            errors={errors}
          />
        );
      case 4:
        return (
          <CampaignScheduling
            formData={formData}
            onFormChange={handleFormChange}
            errors={errors}
          />
        );
      case 5:
        return (
          <CampaignReview
            formData={formData}
            whatsappSessions={whatsappSessions}
            contactLists={contactLists}
            onEdit={handleStepEdit}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    // Auto-save draft every 30 seconds
    const interval = setInterval(() => {
      if (formData?.name || formData?.message?.text) {
        localStorage.setItem('campaignDraft', JSON.stringify(formData));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData]);

  useEffect(() => {
    // Load draft on component mount
    const savedDraft = localStorage.getItem('campaignDraft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setFormData(draftData);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={user?.role}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-112'}`}>
        <Header
          user={user}
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          notifications={notifications}
        />
        
        <main className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Criar Nova Campanha</h1>
                <p className="text-muted-foreground mt-2">
                  Configure sua campanha de WhatsApp marketing com mensagens personalizadas
                </p>
              </div>
              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  iconName="Save"
                  iconPosition="left"
                >
                  Salvar Rascunho
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/campaign-monitoring')}
                  iconName="X"
                  iconPosition="left"
                >
                  Cancelar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar - Steps */}
              <div className="lg:col-span-1">
                <CampaignWizardSteps
                  currentStep={currentStep}
                  steps={wizardSteps}
                />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-8 p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      iconName="ChevronLeft"
                      iconPosition="left"
                    >
                      Anterior
                    </Button>
                    
                    {currentStep < wizardSteps?.length ? (
                      <Button
                        onClick={handleNext}
                        iconName="ChevronRight"
                        iconPosition="right"
                      >
                        Próximo
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        iconName="Send"
                        iconPosition="left"
                        className="bg-success hover:bg-success/90"
                      >
                        {isSubmitting ? 'Criando Campanha...' : 'Criar Campanha'}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Etapa {currentStep} de {wizardSteps?.length}</span>
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / wizardSteps?.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {errors?.submit && (
                  <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Icon name="AlertCircle" size={20} className="text-error" />
                      <p className="text-error font-medium">{errors?.submit}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CampaignCreation;