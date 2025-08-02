import React, { useState } from 'react';

import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActionsToolbar = ({ 
  selectedSessions, 
  onSelectAll, 
  onDeselectAll, 
  onBulkDisconnect, 
  onBulkRefresh, 
  onExportData,
  totalSessions,
  onFilterChange,
  currentFilter
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkAction, setIsBulkAction] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'Todas as Sessões' },
    { value: 'connected', label: 'Conectadas' },
    { value: 'disconnected', label: 'Desconectadas' },
    { value: 'connecting', label: 'Conectando' },
    { value: 'recent', label: 'Ativas Recentemente' },
    { value: 'inactive', label: 'Inativas' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Nome' },
    { value: 'status', label: 'Status' },
    { value: 'lastActivity', label: 'Última Atividade' },
    { value: 'messageCount', label: 'Mensagens' },
    { value: 'createdAt', label: 'Data de Criação' }
  ];

  const handleBulkDisconnect = async () => {
    setIsBulkAction(true);
    try {
      await onBulkDisconnect(selectedSessions);
    } finally {
      setIsBulkAction(false);
    }
  };

  const handleBulkRefresh = async () => {
    setIsBulkAction(true);
    try {
      await onBulkRefresh(selectedSessions);
    } finally {
      setIsBulkAction(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportData(selectedSessions?.length > 0 ? selectedSessions : 'all');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      {/* Top Row - Filters and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <Select
            options={filterOptions}
            value={currentFilter?.status}
            onChange={(value) => onFilterChange({ ...currentFilter, status: value })}
            placeholder="Filtrar por status"
            className="sm:w-48"
          />
          
          <Select
            options={sortOptions}
            value={currentFilter?.sortBy}
            onChange={(value) => onFilterChange({ ...currentFilter, sortBy: value })}
            placeholder="Ordenar por"
            className="sm:w-48"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            loading={isExporting}
            iconName="Download"
            iconPosition="left"
          >
            Exportar
          </Button>
        </div>
      </div>
      {/* Bottom Row - Selection and Bulk Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedSessions?.length > 0 
                ? `${selectedSessions?.length} de ${totalSessions} selecionadas`
                : `${totalSessions} sessões encontradas`
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              disabled={selectedSessions?.length === totalSessions}
            >
              Selecionar Todas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              disabled={selectedSessions?.length === 0}
            >
              Desmarcar Todas
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSessions?.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="h-6 w-px bg-border"></div>
            <span className="text-sm font-medium text-foreground">Ações em lote:</span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRefresh}
              loading={isBulkAction}
              iconName="RefreshCw"
              iconPosition="left"
            >
              Atualizar
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDisconnect}
              loading={isBulkAction}
              iconName="Unplug"
              iconPosition="left"
            >
              Desconectar
            </Button>
          </div>
        )}
      </div>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-success">12</p>
          <p className="text-xs text-muted-foreground">Conectadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-error">3</p>
          <p className="text-xs text-muted-foreground">Desconectadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warning">1</p>
          <p className="text-xs text-muted-foreground">Conectando</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">847</p>
          <p className="text-xs text-muted-foreground">Mensagens hoje</p>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;