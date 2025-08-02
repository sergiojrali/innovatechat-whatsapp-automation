import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const CampaignFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  onExportData 
}) => {
  const statusOptions = [
    { value: 'todas', label: 'Todas as campanhas' },
    { value: 'ativa', label: 'Ativas' },
    { value: 'pausada', label: 'Pausadas' },
    { value: 'concluída', label: 'Concluídas' },
    { value: 'erro', label: 'Com erro' }
  ];

  const sortOptions = [
    { value: 'criadaEm_desc', label: 'Mais recentes primeiro' },
    { value: 'criadaEm_asc', label: 'Mais antigas primeiro' },
    { value: 'nome_asc', label: 'Nome (A-Z)' },
    { value: 'nome_desc', label: 'Nome (Z-A)' },
    { value: 'progresso_desc', label: 'Maior progresso' },
    { value: 'progresso_asc', label: 'Menor progresso' },
    { value: 'taxaEntrega_desc', label: 'Maior taxa de entrega' },
    { value: 'taxaEntrega_asc', label: 'Menor taxa de entrega' }
  ];

  const performanceOptions = [
    { value: 'todas', label: 'Todas as performances' },
    { value: 'excelente', label: 'Excelente (&gt;90%)' },
    { value: 'boa', label: 'Boa (70-90%)' },
    { value: 'regular', label: 'Regular (50-70%)' },
    { value: 'baixa', label: 'Baixa (&lt;50%)' }
  ];

  const hasActiveFilters = () => {
    return filters?.status !== 'todas' || 
           filters?.performance !== 'todas' || 
           filters?.search !== '' ||
           filters?.dateFrom !== '' ||
           filters?.dateTo !== '';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-4 lg:mb-0">
          Filtros de Campanha
        </h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              iconName="X"
              iconPosition="left"
            >
              Limpar Filtros
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportData}
            iconName="Download"
            iconPosition="left"
          >
            Exportar
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <Input
            type="search"
            placeholder="Buscar campanhas..."
            value={filters?.search}
            onChange={(e) => onFilterChange('search', e?.target?.value)}
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <Select
          placeholder="Status"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
        />

        {/* Performance Filter */}
        <Select
          placeholder="Performance"
          options={performanceOptions}
          value={filters?.performance}
          onChange={(value) => onFilterChange('performance', value)}
        />

        {/* Date From */}
        <Input
          type="date"
          placeholder="Data inicial"
          value={filters?.dateFrom}
          onChange={(e) => onFilterChange('dateFrom', e?.target?.value)}
        />

        {/* Date To */}
        <Input
          type="date"
          placeholder="Data final"
          value={filters?.dateTo}
          onChange={(e) => onFilterChange('dateTo', e?.target?.value)}
        />
      </div>
      {/* Sort Options */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <Select
            options={sortOptions}
            value={filters?.sortBy}
            onChange={(value) => onFilterChange('sortBy', value)}
            className="w-48"
          />
        </div>

        {hasActiveFilters() && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Icon name="Filter" size={16} />
            <span>Filtros ativos aplicados</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignFilters;