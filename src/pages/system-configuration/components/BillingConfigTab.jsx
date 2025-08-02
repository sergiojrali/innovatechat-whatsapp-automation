import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const BillingConfigTab = ({ settings, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    currency: settings?.currency || 'BRL',
    basicPlanPrice: settings?.basicPlanPrice || 49.90,
    proPlanPrice: settings?.proPlanPrice || 99.90,
    enterprisePlanPrice: settings?.enterprisePlanPrice || 199.90,
    enableFreeTrial: settings?.enableFreeTrial || true,
    freeTrialDays: settings?.freeTrialDays || 14,
    paymentMethods: settings?.paymentMethods || ['credit_card', 'pix', 'bank_slip'],
    enableAutoRenewal: settings?.enableAutoRenewal || true,
    gracePeriodDays: settings?.gracePeriodDays || 7,
    enableProration: settings?.enableProration || true,
    taxRate: settings?.taxRate || 0,
    enableDiscounts: settings?.enableDiscounts || true,
    maxDiscountPercent: settings?.maxDiscountPercent || 50,
    billingCycle: settings?.billingCycle || 'monthly',
    enableInvoiceGeneration: settings?.enableInvoiceGeneration || true
  });

  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const currencyOptions = [
    { value: 'BRL', label: 'Real Brasileiro (R$)' },
    { value: 'USD', label: 'Dólar Americano ($)' },
    { value: 'EUR', label: 'Euro (€)' }
  ];

  const paymentMethodOptions = [
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' },
    { value: 'pix', label: 'PIX' },
    { value: 'bank_slip', label: 'Boleto Bancário' },
    { value: 'bank_transfer', label: 'Transferência Bancária' }
  ];

  const billingCycleOptions = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'semiannual', label: 'Semestral' },
    { value: 'annual', label: 'Anual' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData?.basicPlanPrice < 0 || formData?.basicPlanPrice > 10000) {
      newErrors.basicPlanPrice = 'Preço deve estar entre R$ 0,00 e R$ 10.000,00';
    }

    if (formData?.proPlanPrice < 0 || formData?.proPlanPrice > 10000) {
      newErrors.proPlanPrice = 'Preço deve estar entre R$ 0,00 e R$ 10.000,00';
    }

    if (formData?.enterprisePlanPrice < 0 || formData?.enterprisePlanPrice > 10000) {
      newErrors.enterprisePlanPrice = 'Preço deve estar entre R$ 0,00 e R$ 10.000,00';
    }

    if (formData?.basicPlanPrice >= formData?.proPlanPrice) {
      newErrors.proPlanPrice = 'Plano Pro deve ser mais caro que o Básico';
    }

    if (formData?.proPlanPrice >= formData?.enterprisePlanPrice) {
      newErrors.enterprisePlanPrice = 'Plano Enterprise deve ser mais caro que o Pro';
    }

    if (formData?.enableFreeTrial && (formData?.freeTrialDays < 1 || formData?.freeTrialDays > 90)) {
      newErrors.freeTrialDays = 'Período deve estar entre 1 e 90 dias';
    }

    if (formData?.gracePeriodDays < 0 || formData?.gracePeriodDays > 30) {
      newErrors.gracePeriodDays = 'Período deve estar entre 0 e 30 dias';
    }

    if (formData?.taxRate < 0 || formData?.taxRate > 100) {
      newErrors.taxRate = 'Taxa deve estar entre 0% e 100%';
    }

    if (formData?.enableDiscounts && (formData?.maxDiscountPercent < 0 || formData?.maxDiscountPercent > 100)) {
      newErrors.maxDiscountPercent = 'Desconto deve estar entre 0% e 100%';
    }

    if (formData?.paymentMethods?.length === 0) {
      newErrors.paymentMethods = 'Selecione pelo menos um método de pagamento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave('billingConfig', formData);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setFormData({
      currency: settings?.currency || 'BRL',
      basicPlanPrice: settings?.basicPlanPrice || 49.90,
      proPlanPrice: settings?.proPlanPrice || 99.90,
      enterprisePlanPrice: settings?.enterprisePlanPrice || 199.90,
      enableFreeTrial: settings?.enableFreeTrial || true,
      freeTrialDays: settings?.freeTrialDays || 14,
      paymentMethods: settings?.paymentMethods || ['credit_card', 'pix', 'bank_slip'],
      enableAutoRenewal: settings?.enableAutoRenewal || true,
      gracePeriodDays: settings?.gracePeriodDays || 7,
      enableProration: settings?.enableProration || true,
      taxRate: settings?.taxRate || 0,
      enableDiscounts: settings?.enableDiscounts || true,
      maxDiscountPercent: settings?.maxDiscountPercent || 50,
      billingCycle: settings?.billingCycle || 'monthly',
      enableInvoiceGeneration: settings?.enableInvoiceGeneration || true
    });
    setErrors({});
    setHasChanges(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: formData.currency
    })?.format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Configuração de Cobrança</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure preços, métodos de pagamento e políticas de cobrança
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Moeda:</p>
          <p className="text-lg font-semibold text-foreground">{formData?.currency}</p>
        </div>
      </div>
      {/* Currency Selection */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-foreground mb-3 flex items-center">
          <Icon name="DollarSign" size={18} className="mr-2 text-primary" />
          Moeda e Localização
        </h4>
        <Select
          label="Moeda do sistema"
          options={currencyOptions}
          value={formData?.currency}
          onChange={(value) => handleInputChange('currency', value)}
          description="Moeda utilizada para todos os preços e cobranças"
        />
      </div>
      {/* Plan Pricing */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-foreground mb-4 flex items-center">
          <Icon name="CreditCard" size={18} className="mr-2 text-secondary" />
          Preços dos Planos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-border rounded-lg">
            <h5 className="font-medium text-foreground mb-2">Plano Básico</h5>
            <Input
              label="Preço mensal"
              type="number"
              step="0.01"
              value={formData?.basicPlanPrice}
              onChange={(e) => handleInputChange('basicPlanPrice', parseFloat(e?.target?.value) || 0)}
              error={errors?.basicPlanPrice}
              description={`Atual: ${formatCurrency(formData?.basicPlanPrice)}`}
            />
            <div className="mt-3 text-sm text-muted-foreground">
              <p>• Até 2 sessões WhatsApp</p>
              <p>• 1.000 contatos</p>
              <p>• 5 campanhas/dia</p>
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <h5 className="font-medium text-foreground mb-2">Plano Pro</h5>
            <Input
              label="Preço mensal"
              type="number"
              step="0.01"
              value={formData?.proPlanPrice}
              onChange={(e) => handleInputChange('proPlanPrice', parseFloat(e?.target?.value) || 0)}
              error={errors?.proPlanPrice}
              description={`Atual: ${formatCurrency(formData?.proPlanPrice)}`}
            />
            <div className="mt-3 text-sm text-muted-foreground">
              <p>• Até 5 sessões WhatsApp</p>
              <p>• 5.000 contatos</p>
              <p>• 20 campanhas/dia</p>
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <h5 className="font-medium text-foreground mb-2">Plano Enterprise</h5>
            <Input
              label="Preço mensal"
              type="number"
              step="0.01"
              value={formData?.enterprisePlanPrice}
              onChange={(e) => handleInputChange('enterprisePlanPrice', parseFloat(e?.target?.value) || 0)}
              error={errors?.enterprisePlanPrice}
              description={`Atual: ${formatCurrency(formData?.enterprisePlanPrice)}`}
            />
            <div className="mt-3 text-sm text-muted-foreground">
              <p>• Sessões ilimitadas</p>
              <p>• Contatos ilimitados</p>
              <p>• Campanhas ilimitadas</p>
            </div>
          </div>
        </div>
      </div>
      {/* Free Trial */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-foreground flex items-center">
            <Icon name="Gift" size={18} className="mr-2 text-accent" />
            Período Gratuito
          </h4>
          <Checkbox
            label="Habilitar"
            checked={formData?.enableFreeTrial}
            onChange={(e) => handleInputChange('enableFreeTrial', e?.target?.checked)}
          />
        </div>
        
        {formData?.enableFreeTrial && (
          <Input
            label="Duração do período gratuito (dias)"
            type="number"
            value={formData?.freeTrialDays}
            onChange={(e) => handleInputChange('freeTrialDays', parseInt(e?.target?.value) || 0)}
            error={errors?.freeTrialDays}
            description="Período de teste gratuito para novos usuários"
            min="1"
            max="90"
          />
        )}
      </div>
      {/* Payment Methods */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-foreground mb-3 flex items-center">
          <Icon name="Wallet" size={18} className="mr-2 text-success" />
          Métodos de Pagamento
        </h4>
        <Select
          label="Métodos aceitos"
          options={paymentMethodOptions}
          value={formData?.paymentMethods}
          onChange={(value) => handleInputChange('paymentMethods', value)}
          multiple
          error={errors?.paymentMethods}
          description="Selecione os métodos de pagamento disponíveis"
        />
      </div>
      {/* Billing Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Icon name="Calendar" size={18} className="mr-2 text-warning" />
            Ciclo de Cobrança
          </h4>
          <Select
            label="Ciclo padrão"
            options={billingCycleOptions}
            value={formData?.billingCycle}
            onChange={(value) => handleInputChange('billingCycle', value)}
            description="Frequência de cobrança padrão"
          />
          <div className="mt-4 space-y-3">
            <Checkbox
              label="Renovação automática"
              description="Renovar assinaturas automaticamente"
              checked={formData?.enableAutoRenewal}
              onChange={(e) => handleInputChange('enableAutoRenewal', e?.target?.checked)}
            />
            <Checkbox
              label="Cobrança proporcional"
              description="Cobrar proporcionalmente em mudanças de plano"
              checked={formData?.enableProration}
              onChange={(e) => handleInputChange('enableProration', e?.target?.checked)}
            />
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Icon name="Clock" size={18} className="mr-2 text-error" />
            Políticas de Cobrança
          </h4>
          <Input
            label="Período de carência (dias)"
            type="number"
            value={formData?.gracePeriodDays}
            onChange={(e) => handleInputChange('gracePeriodDays', parseInt(e?.target?.value) || 0)}
            error={errors?.gracePeriodDays}
            description="Dias após vencimento antes de suspender conta"
            min="0"
            max="30"
          />
          <Input
            label="Taxa de impostos (%)"
            type="number"
            step="0.01"
            value={formData?.taxRate}
            onChange={(e) => handleInputChange('taxRate', parseFloat(e?.target?.value) || 0)}
            error={errors?.taxRate}
            description="Taxa de impostos aplicada às cobranças"
            min="0"
            max="100"
            className="mt-4"
          />
        </div>
      </div>
      {/* Discounts */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-foreground flex items-center">
            <Icon name="Percent" size={18} className="mr-2 text-primary" />
            Sistema de Descontos
          </h4>
          <Checkbox
            label="Habilitar"
            checked={formData?.enableDiscounts}
            onChange={(e) => handleInputChange('enableDiscounts', e?.target?.checked)}
          />
        </div>
        
        {formData?.enableDiscounts && (
          <Input
            label="Desconto máximo permitido (%)"
            type="number"
            value={formData?.maxDiscountPercent}
            onChange={(e) => handleInputChange('maxDiscountPercent', parseInt(e?.target?.value) || 0)}
            error={errors?.maxDiscountPercent}
            description="Percentual máximo de desconto que pode ser aplicado"
            min="0"
            max="100"
          />
        )}
      </div>
      {/* Invoice Generation */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground flex items-center">
            <Icon name="FileText" size={18} className="mr-2 text-secondary" />
            Geração de Faturas
          </h4>
          <Checkbox
            label="Habilitar"
            checked={formData?.enableInvoiceGeneration}
            onChange={(e) => handleInputChange('enableInvoiceGeneration', e?.target?.checked)}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Gerar automaticamente faturas em PDF para todas as cobranças
        </p>
      </div>
      {/* Billing Summary */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <h4 className="font-medium text-foreground mb-3 flex items-center">
          <Icon name="BarChart3" size={18} className="mr-2 text-primary" />
          Resumo da Configuração
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Plano Básico</p>
            <p className="font-semibold">{formatCurrency(formData?.basicPlanPrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Plano Pro</p>
            <p className="font-semibold">{formatCurrency(formData?.proPlanPrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Plano Enterprise</p>
            <p className="font-semibold">{formatCurrency(formData?.enterprisePlanPrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Período Gratuito</p>
            <p className="font-semibold">
              {formData?.enableFreeTrial ? `${formData?.freeTrialDays} dias` : 'Desabilitado'}
            </p>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || isLoading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          loading={isLoading}
          iconName="Save"
          iconPosition="left"
        >
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default BillingConfigTab;