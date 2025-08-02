import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActionsBar = ({ 
  selectedCount, 
  onClearSelection, 
  onBulkDelete, 
  onBulkExport, 
  onBulkAddToCampaign 
}) => {
  const [showCampaignSelect, setShowCampaignSelect] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState('');

  const mockCampaigns = [
    { value: '1', label: 'Campanha Black Friday 2024' },
    { value: '2', label: 'Newsletter Dezembro' },
    { value: '3', label: 'Pesquisa de Satisfação' },
    { value: '4', label: 'Promoção Natal' }
  ];

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selectedCount} contato(s) selecionado(s)?`)) {
      onBulkDelete();
    }
  };

  const handleAddToCampaign = () => {
    if (selectedCampaign) {
      const campaign = mockCampaigns?.find?.(c => c?.value === selectedCampaign) || mockCampaigns?.filter(c => c?.value === selectedCampaign)?.[0];
      onBulkAddToCampaign(selectedCampaign, campaign?.label);
      setSelectedCampaign('');
      setShowCampaignSelect(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        {/* Selection Info */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={20} className="text-primary" />
            <span className="font-medium text-foreground">
              {selectedCount} contato{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-muted-foreground hover:text-foreground"
          >
            Limpar seleção
          </Button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkExport}
          >
            <Icon name="Download" size={16} className="mr-2" />
            Exportar
          </Button>

          {/* Add to Campaign */}
          {!showCampaignSelect ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCampaignSelect(true)}
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Adicionar à Campanha
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-48">
                <Select
                  options={mockCampaigns}
                  value={selectedCampaign}
                  onChange={setSelectedCampaign}
                  placeholder="Selecionar campanha"
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddToCampaign}
                disabled={!selectedCampaign}
              >
                Adicionar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCampaignSelect(false);
                  setSelectedCampaign('');
                }}
              >
                Cancelar
              </Button>
            </div>
          )}

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Icon name="Trash2" size={16} className="mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Campaign Selection Mobile */}
      {showCampaignSelect && (
        <div className="sm:hidden mt-3 pt-3 border-t border-primary/20">
          <div className="space-y-3">
            <Select
              label="Selecionar Campanha"
              options={mockCampaigns}
              value={selectedCampaign}
              onChange={setSelectedCampaign}
              placeholder="Escolha uma campanha"
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleAddToCampaign}
                disabled={!selectedCampaign}
                fullWidth
              >
                Adicionar à Campanha
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCampaignSelect(false);
                  setSelectedCampaign('');
                }}
                fullWidth
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionsBar;