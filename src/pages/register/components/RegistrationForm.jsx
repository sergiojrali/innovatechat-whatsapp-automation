import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';


const RegistrationForm = ({ currentStep, onStepChange, onSubmit }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    emailEmpresarial: '',
    senha: '',
    confirmarSenha: '',
    nomeEmpresa: '',
    telefone: '',
    termsAccepted: false,
    privacyAccepted: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatPhoneNumber = (value) => {
    const numbers = value?.replace(/\D/g, '');
    if (numbers?.length <= 2) return `+55 ${numbers}`;
    if (numbers?.length <= 4) return `+55 (${numbers?.slice(2)})`;
    if (numbers?.length <= 9) return `+55 (${numbers?.slice(2, 4)}) ${numbers?.slice(4)}`;
    return `+55 (${numbers?.slice(2, 4)}) ${numbers?.slice(4, 9)}-${numbers?.slice(9, 13)}`;
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData?.nomeCompleto?.trim()) {
        newErrors.nomeCompleto = 'Nome completo é obrigatório';
      }
      if (!formData?.emailEmpresarial?.trim()) {
        newErrors.emailEmpresarial = 'Email empresarial é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.emailEmpresarial)) {
        newErrors.emailEmpresarial = 'Formato de email inválido';
      }
      if (!formData?.senha) {
        newErrors.senha = 'Senha é obrigatória';
      } else if (formData?.senha?.length < 8) {
        newErrors.senha = 'Senha deve ter pelo menos 8 caracteres';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/?.test(formData?.senha)) {
        newErrors.senha = 'Senha deve conter ao menos uma letra maiúscula, minúscula e um número';
      }
      if (!formData?.confirmarSenha) {
        newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
      } else if (formData?.senha !== formData?.confirmarSenha) {
        newErrors.confirmarSenha = 'Senhas não coincidem';
      }
    }

    if (step === 2) {
      if (!formData?.nomeEmpresa?.trim()) {
        newErrors.nomeEmpresa = 'Nome da empresa é obrigatório';
      }
      if (!formData?.telefone?.trim()) {
        newErrors.telefone = 'Telefone é obrigatório';
      } else if (formData?.telefone?.replace(/\D/g, '')?.length < 12) {
        newErrors.telefone = 'Telefone deve ter formato válido (+55 XX XXXXX-XXXX)';
      }
    }

    if (step === 3) {
      if (!formData?.termsAccepted) {
        newErrors.termsAccepted = 'Você deve aceitar os termos de serviço';
      }
      if (!formData?.privacyAccepted) {
        newErrors.privacyAccepted = 'Você deve aceitar a política de privacidade';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    onStepChange(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({ submit: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Dados da Conta</h2>
        <p className="text-muted-foreground">Crie sua conta empresarial</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nome Completo"
          type="text"
          placeholder="Digite seu nome completo"
          value={formData?.nomeCompleto}
          onChange={(e) => handleInputChange('nomeCompleto', e?.target?.value)}
          error={errors?.nomeCompleto}
          required
        />

        <Input
          label="Email Empresarial"
          type="email"
          placeholder="seu.email@empresa.com.br"
          value={formData?.emailEmpresarial}
          onChange={(e) => handleInputChange('emailEmpresarial', e?.target?.value)}
          error={errors?.emailEmpresarial}
          required
        />

        <Input
          label="Senha"
          type="password"
          placeholder="Mínimo 8 caracteres"
          description="Deve conter ao menos uma letra maiúscula, minúscula e um número"
          value={formData?.senha}
          onChange={(e) => handleInputChange('senha', e?.target?.value)}
          error={errors?.senha}
          required
        />

        <Input
          label="Confirmar Senha"
          type="password"
          placeholder="Digite a senha novamente"
          value={formData?.confirmarSenha}
          onChange={(e) => handleInputChange('confirmarSenha', e?.target?.value)}
          error={errors?.confirmarSenha}
          required
        />
      </div>

      <Button
        variant="default"
        fullWidth
        onClick={handleNext}
        iconName="ArrowRight"
        iconPosition="right"
      >
        Próximo
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Dados da Empresa</h2>
        <p className="text-muted-foreground">Informações do seu negócio</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nome da Empresa"
          type="text"
          placeholder="Digite o nome da sua empresa"
          value={formData?.nomeEmpresa}
          onChange={(e) => handleInputChange('nomeEmpresa', e?.target?.value)}
          error={errors?.nomeEmpresa}
          required
        />

        <Input
          label="Telefone Empresarial"
          type="tel"
          placeholder="+55 (11) 99999-9999"
          value={formData?.telefone}
          onChange={(e) => handleInputChange('telefone', formatPhoneNumber(e?.target?.value))}
          error={errors?.telefone}
          required
        />
      </div>

      <div className="flex space-x-4">
        <Button
          variant="outline"
          fullWidth
          onClick={handlePrevious}
          iconName="ArrowLeft"
          iconPosition="left"
        >
          Anterior
        </Button>
        <Button
          variant="default"
          fullWidth
          onClick={handleNext}
          iconName="ArrowRight"
          iconPosition="right"
        >
          Próximo
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Termos e Condições</h2>
        <p className="text-muted-foreground">Aceite os termos para finalizar</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Resumo da Conta</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Nome:</strong> {formData?.nomeCompleto}</p>
            <p><strong>Email:</strong> {formData?.emailEmpresarial}</p>
            <p><strong>Empresa:</strong> {formData?.nomeEmpresa}</p>
            <p><strong>Telefone:</strong> {formData?.telefone}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Checkbox
            label="Aceito os Termos de Serviço"
            description="Li e concordo com os termos de uso da plataforma"
            checked={formData?.termsAccepted}
            onChange={(e) => handleInputChange('termsAccepted', e?.target?.checked)}
            error={errors?.termsAccepted}
            required
          />

          <Checkbox
            label="Aceito a Política de Privacidade"
            description="Concordo com o tratamento dos meus dados conforme LGPD"
            checked={formData?.privacyAccepted}
            onChange={(e) => handleInputChange('privacyAccepted', e?.target?.checked)}
            error={errors?.privacyAccepted}
            required
          />
        </div>

        {errors?.submit && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-error text-sm">{errors?.submit}</p>
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <Button
          variant="outline"
          fullWidth
          onClick={handlePrevious}
          iconName="ArrowLeft"
          iconPosition="left"
          disabled={isSubmitting}
        >
          Anterior
        </Button>
        <Button
          variant="default"
          fullWidth
          onClick={handleSubmit}
          loading={isSubmitting}
          iconName="Check"
          iconPosition="right"
        >
          Criar Conta
        </Button>
      </div>
    </div>
  );

  return (
    <form className="w-full max-w-md mx-auto">
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Fazer login
          </button>
        </p>
      </div>
    </form>
  );
};

export default RegistrationForm;