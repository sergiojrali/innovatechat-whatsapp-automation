import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ContactFilters = ({ isOpen, onClose, onApplyFilters, totalContacts }) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    empresa: '',
    cidade: '',
    estado: '',
    dataImportacao: '',
    status: '',
    temEmail: false,
    temTelefone: false,
    temEmpresa: false
  });

  const empresaOptions = [
    { value: '', label: 'Todas as empresas' },
    { value: 'Tech Corp', label: 'Tech Corp' },
    { value: 'StartupXYZ', label: 'StartupXYZ' },
    { value: 'Consultoria ABC', label: 'Consultoria ABC' },
    { value: 'Inovação Digital', label: 'Inovação Digital' },
    { value: 'Marketing Pro', label: 'Marketing Pro' }
  ];

  const cidadeOptions = [
    { value: '', label: 'Todas as cidades' },
    { value: 'São Paulo', label: 'São Paulo' },
    { value: 'Rio de Janeiro', label: 'Rio de Janeiro' },
    { value: 'Belo Horizonte', label: 'Belo Horizonte' },
    { value: 'Brasília', label: 'Brasília' },
    { value: 'Porto Alegre', label: 'Porto Alegre' }
  ];

  const estadoOptions = [
    { value: '', label: 'Todos os estados' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'RS', label: 'Rio Grande do Sul' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'Ativo', label: 'Ativo' },
    { value: 'Inativo', label: 'Inativo' },
    { value: 'Bloqueado', label: 'Bloqueado' }
  ];

  const dataImportacaoOptions = [
    { value: '', label: 'Qualquer data' },
    { value: 'hoje', label: 'Hoje' },
    { value: 'semana', label: 'Última semana' },
    { value: 'mes', label: 'Último mês' },
    { value: 'trimestre', label: 'Último trimestre' }
  ];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      searchTerm: '',
      empresa: '',
      cidade: '',
      estado: '',
      dataImportacao: '',
      status: '',
      temEmail: false,
      temTelefone: false,
      temEmpresa: false
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters?.searchTerm) count++;
    if (filters?.empresa) count++;
    if (filters?.cidade) count++;
    if (filters?.estado) count++;
    if (filters?.dataImportacao) count++;
    if (filters?.status) count++;
    if (filters?.temEmail) count++;
    if (filters?.temTelefone) count++;
    if (filters?.temEmpresa) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      {/* Filter Panel */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-card border-l border-border z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
            <p className="text-sm text-muted-foreground">
              {totalContacts} contatos encontrados
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Search */}
          <div>
            <Input
              label="Buscar contatos"
              type="search"
              placeholder="Nome, email ou telefone..."
              value={filters?.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e?.target?.value)}
            />
          </div>

          {/* Company Filter */}
          <div>
            <Select
              label="Empresa"
              options={empresaOptions}
              value={filters?.empresa}
              onChange={(value) => handleFilterChange('empresa', value)}
              searchable
            />
          </div>

          {/* Location Filters */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Localização</h4>
            <Select
              label="Cidade"
              options={cidadeOptions}
              value={filters?.cidade}
              onChange={(value) => handleFilterChange('cidade', value)}
              searchable
            />
            <Select
              label="Estado"
              options={estadoOptions}
              value={filters?.estado}
              onChange={(value) => handleFilterChange('estado', value)}
            />
          </div>

          {/* Import Date Filter */}
          <div>
            <Select
              label="Data de Importação"
              options={dataImportacaoOptions}
              value={filters?.dataImportacao}
              onChange={(value) => handleFilterChange('dataImportacao', value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              label="Status"
              options={statusOptions}
              value={filters?.status}
              onChange={(value) => handleFilterChange('status', value)}
            />
          </div>

          {/* Data Completeness Filters */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Dados Disponíveis</h4>
            <Checkbox
              label="Possui email"
              checked={filters?.temEmail}
              onChange={(e) => handleFilterChange('temEmail', e?.target?.checked)}
            />
            <Checkbox
              label="Possui telefone"
              checked={filters?.temTelefone}
              onChange={(e) => handleFilterChange('temTelefone', e?.target?.checked)}
            />
            <Checkbox
              label="Possui empresa"
              checked={filters?.temEmpresa}
              onChange={(e) => handleFilterChange('temEmpresa', e?.target?.checked)}
            />
          </div>

          {/* Quick Filters */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Filtros Rápidos</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleFilterChange('dataImportacao', 'hoje')}
              >
                Hoje
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleFilterChange('dataImportacao', 'semana')}
              >
                Esta Semana
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  handleFilterChange('temEmail', true);
                  handleFilterChange('temTelefone', true);
                }}
              >
                Completos
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleFilterChange('status', 'Ativo')}
              >
                Ativos
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Filtros ativos: {getActiveFiltersCount()}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFilters}
              disabled={getActiveFiltersCount() === 0}
            >
              Limpar tudo
            </Button>
          </div>
          <Button 
            onClick={handleApplyFilters}
            fullWidth
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </>
  );
};

export default ContactFilters;