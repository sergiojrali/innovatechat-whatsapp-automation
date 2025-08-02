import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressIndicator = ({ currentStep, totalSteps = 3 }) => {
  const steps = [
    { number: 1, title: 'Dados da Conta', description: 'Informações pessoais' },
    { number: 2, title: 'Dados da Empresa', description: 'Informações do negócio' },
    { number: 3, title: 'Verificação', description: 'Termos e condições' }
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps?.map((step, index) => (
          <div key={step?.number} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step?.number < currentStep
                  ? 'bg-success border-success text-success-foreground'
                  : step?.number === currentStep
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-background border-border text-muted-foreground'
              }`}>
                {step?.number < currentStep ? (
                  <Icon name="Check" size={16} />
                ) : (
                  <span className="text-sm font-semibold">{step?.number}</span>
                )}
              </div>
              
              {/* Step Labels - Hidden on mobile */}
              <div className="hidden sm:block text-center mt-2">
                <p className={`text-xs font-medium ${
                  step?.number <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step?.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step?.description}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps?.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                step?.number < currentStep ? 'bg-success' : 'bg-border'
              }`} />
            )}
          </div>
        ))}
      </div>
      {/* Mobile Step Labels */}
      <div className="sm:hidden mt-4 text-center">
        <p className="text-sm font-medium text-foreground">
          {steps?.[currentStep - 1]?.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {steps?.[currentStep - 1]?.description}
        </p>
      </div>
      {/* Progress Bar */}
      <div className="mt-6 w-full bg-border rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      {/* Step Counter */}
      <div className="text-center mt-3">
        <span className="text-sm text-muted-foreground">
          Passo {currentStep} de {totalSteps}
        </span>
      </div>
    </div>
  );
};

export default ProgressIndicator;