import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const ContactSelection = ({ formData, onFormChange, contactLists, errors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredLists = contactLists?.filter(list =>
    list?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    list?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

  const handleListToggle = (listId) => {
    const currentLists = formData?.selectedContactLists || [];
    const updatedLists = currentLists?.includes(listId)
      ? currentLists?.filter(id => id !== listId)
      : [...currentLists, listId];
    
    onFormChange('selectedContactLists', updatedLists);
  };

  const handleSelectAll = () => {
    const allListIds = filteredLists?.map(list => list?.id);
    onFormChange('selectedContactLists', allListIds);
  };

  const handleDeselectAll = () => {
    onFormChange('selectedContactLists', []);
  };

  const getTotalContacts = () => {
    const selectedLists = formData?.selectedContactLists || [];
    return contactLists?.filter(list => selectedLists?.includes(list?.id))?.reduce((total, list) => total + list?.contactCount, 0);
  };

  const getEstimatedCost = () => {
    const totalContacts = getTotalContacts();
    const costPerMessage = 0.05; // R$ 0,05 por mensagem
    return (totalContacts * costPerMessage)?.toFixed(2);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-primary font-semibold">2</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Seleção de Contatos</h3>
          <p className="text-sm text-muted-foreground">Escolha as listas de contatos para sua campanha</p>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Buscar listas de contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target?.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            iconName="Filter"
            iconPosition="left"
          >
            Filtros
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            iconName="CheckSquare"
            iconPosition="left"
          >
            Selecionar Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            iconName="Square"
            iconPosition="left"
          >
            Desmarcar Todos
          </Button>
        </div>
      </div>
      {/* Contact Lists */}
      <div className="space-y-3 mb-6">
        {filteredLists?.length > 0 ? (
          filteredLists?.map((list) => {
            const isSelected = (formData?.selectedContactLists || [])?.includes(list?.id);
            
            return (
              <div
                key={list?.id}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                }`}
                onClick={() => handleListToggle(list?.id)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleListToggle(list?.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{list?.name}</h4>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">
                          {list?.contactCount} contatos
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          list?.status === 'active' ? 'bg-success' : 'bg-warning'
                        }`}></div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{list?.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>Criada em: {list?.createdAt}</span>
                      <span>Última atualização: {list?.updatedAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Icon name="Users" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium text-foreground mb-2">Nenhuma lista encontrada</h4>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Tente ajustar os termos de busca' : 'Você ainda não possui listas de contatos'}
            </p>
          </div>
        )}
      </div>
      {/* Selection Summary */}
      {(formData?.selectedContactLists || [])?.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-3">Resumo da Seleção</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{(formData?.selectedContactLists || [])?.length}</div>
              <div className="text-sm text-muted-foreground">Listas Selecionadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{getTotalContacts()}</div>
              <div className="text-sm text-muted-foreground">Total de Contatos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">R$ {getEstimatedCost()}</div>
              <div className="text-sm text-muted-foreground">Custo Estimado</div>
            </div>
          </div>
        </div>
      )}
      {errors?.selectedContactLists && (
        <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm text-error">{errors?.selectedContactLists}</p>
        </div>
      )}
    </div>
  );
};

export default ContactSelection;