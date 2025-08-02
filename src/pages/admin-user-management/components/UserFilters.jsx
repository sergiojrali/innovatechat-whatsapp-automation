import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';


const UserFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  onExport,
  totalUsers,
  filteredUsers 
}) => {
  const planOptions = [
    { value: '', label: 'Todos os Planos' },
    { value: 'Básico', label: 'Básico' },
    { value: 'Pro', label: 'Pro' },
    { value: 'Premium', label: 'Premium' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'ativo', label: 'Ativo' },
    { value: 'suspenso', label: 'Suspenso' },
    { value: 'inativo', label: 'Inativo' }
  ];

  const activityOptions = [
    { value: '', label: 'Toda Atividade' },
    { value: 'today', label: 'Ativo Hoje' },
    { value: 'week', label: 'Ativo esta Semana' },
    { value: 'month', label: 'Ativo este Mês' },
    { value: 'inactive', label: 'Inativo há 30+ dias' }
  ];

  const hasActiveFilters = filters?.search || filters?.plan || filters?.status || filters?.activity || filters?.dateFrom || filters?.dateTo;

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      {/* Search and Actions Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Buscar por nome, email ou empresa..."
            value={filters?.search}
            onChange={(e) => onFilterChange('search', e?.target?.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-muted-foreground">
            {filteredUsers} de {totalUsers} usuários
          </div>
          <Button
            variant="outline"
            onClick={onExport}
            iconName="Download"
            iconPosition="left"
            iconSize={16}
          >
            Exportar
          </Button>
        </div>
      </div>
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
        <Select
          label="Plano"
          options={planOptions}
          value={filters?.plan}
          onChange={(value) => onFilterChange('plan', value)}
          className="w-full"
        />
        
        <Select
          label="Status"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
          className="w-full"
        />
        
        <Select
          label="Atividade"
          options={activityOptions}
          value={filters?.activity}
          onChange={(value) => onFilterChange('activity', value)}
          className="w-full"
        />
        
        <Input
          type="date"
          label="Data Inicial"
          value={filters?.dateFrom}
          onChange={(e) => onFilterChange('dateFrom', e?.target?.value)}
          className="w-full"
        />
        
        <Input
          type="date"
          label="Data Final"
          value={filters?.dateTo}
          onChange={(e) => onFilterChange('dateTo', e?.target?.value)}
          className="w-full"
        />
        
        <div className="flex items-end">
          <Button
            variant={hasActiveFilters ? "outline" : "ghost"}
            onClick={onClearFilters}
            iconName="X"
            iconPosition="left"
            iconSize={16}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            Limpar
          </Button>
        </div>
      </div>
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {filters?.search && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
              Busca: "{filters?.search}"
            </span>
          )}
          {filters?.plan && (
            <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full border border-secondary/20">
              Plano: {filters?.plan}
            </span>
          )}
          {filters?.status && (
            <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full border border-accent/20">
              Status: {filters?.status}
            </span>
          )}
          {filters?.activity && (
            <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full border border-success/20">
              Atividade: {activityOptions?.find(opt => opt?.value === filters?.activity)?.label}
            </span>
          )}
          {(filters?.dateFrom || filters?.dateTo) && (
            <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full border border-warning/20">
              Período: {filters?.dateFrom || '...'} - {filters?.dateTo || '...'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserFilters;