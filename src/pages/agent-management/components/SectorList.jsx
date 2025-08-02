import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SectorList = ({ 
  sectors, 
  templates, 
  onEdit, 
  onDelete, 
  onApplyTemplate, 
  loading 
}) => {
  const [selectedSector, setSelectedSector] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Ativo' : 'Inativo';
  };

  const handleApplyTemplate = async (templateId) => {
    if (selectedSector && templateId) {
      await onApplyTemplate(selectedSector.id, templateId);
      setTemplateModalOpen(false);
      setSelectedSector(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sectors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Icon name="Building2" size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum setor encontrado
        </h3>
        <p className="text-muted-foreground mb-4">
          Crie seu primeiro setor para começar a organizar seus atendentes
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectors.map((sector) => (
          <div key={sector.id} className="bg-background border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Cabeçalho do setor */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: sector.color }}
                ></div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {sector.name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sector.is_active)}`}>
                    {getStatusText(sector.is_active)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(sector)}
                  iconName="Edit"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSector(sector);
                    setTemplateModalOpen(true);
                  }}
                  iconName="Template"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(sector.id)}
                  iconName="Trash2"
                  className="text-destructive hover:text-destructive"
                />
              </div>
            </div>

            {/* Descrição */}
            {sector.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {sector.description}
              </p>
            )}

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold text-foreground">
                  {sector.agents?.[0]?.count || 0}
                </div>
                <div className="text-xs text-muted-foreground">Atendentes</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold text-foreground">
                  {sector.max_agents}
                </div>
                <div className="text-xs text-muted-foreground">Máximo</div>
              </div>
            </div>

            {/* Horário de funcionamento */}
            {sector.business_hours?.enabled && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Icon name="Clock" size={16} />
                  <span>
                    {sector.business_hours.start} - {sector.business_hours.end}
                  </span>
                </div>
              </div>
            )}

            {/* Mensagens configuradas */}
            <div className="space-y-2">
              {sector.welcome_message && (
                <div className="flex items-start space-x-2">
                  <Icon name="MessageCircle" size={16} className="text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground">Boas-vindas</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {sector.welcome_message.substring(0, 50)}...
                    </div>
                  </div>
                </div>
              )}
              
              {sector.away_message && (
                <div className="flex items-start space-x-2">
                  <Icon name="MessageSquare" size={16} className="text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground">Ausência</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {sector.away_message.substring(0, 50)}...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Atribuição automática */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Atribuição automática</span>
                <span className={`font-medium ${sector.auto_assignment ? 'text-green-600' : 'text-red-600'}`}>
                  {sector.auto_assignment ? 'Ativada' : 'Desativada'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de aplicação de template */}
      {templateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Aplicar Template
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTemplateModalOpen(false);
                  setSelectedSector(null);
                }}
                iconName="X"
              />
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Selecione um template para aplicar ao setor <strong>{selectedSector?.name}</strong>:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleApplyTemplate(template.id)}
                  className="w-full text-left p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">
                        {template.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {template.segment.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                  </div>
                  {template.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setTemplateModalOpen(false);
                  setSelectedSector(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SectorList;
