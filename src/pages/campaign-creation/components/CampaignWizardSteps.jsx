import React from 'react';
import Icon from '../../../components/AppIcon';

const CampaignWizardSteps = ({ currentStep, steps }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Progresso da Campanha</h3>
      <div className="space-y-4">
        {steps?.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          const isAccessible = currentStep >= stepNumber;

          return (
            <div
              key={step?.id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-primary/10 border border-primary/20' 
                  : isCompleted 
                    ? 'bg-success/10 border border-success/20' :'bg-muted/30'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                isCompleted 
                  ? 'bg-success text-success-foreground' 
                  : isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? (
                  <Icon name="Check" size={16} />
                ) : (
                  stepNumber
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${
                  isAccessible ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step?.title}
                </h4>
                <p className={`text-sm ${
                  isAccessible ? 'text-muted-foreground' : 'text-muted-foreground/60'
                }`}>
                  {step?.description}
                </p>
              </div>
              {isActive && (
                <Icon name="ChevronRight" size={16} className="text-primary" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignWizardSteps;