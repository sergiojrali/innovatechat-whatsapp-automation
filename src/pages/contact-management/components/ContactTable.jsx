import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const ContactTable = ({ 
  contacts, 
  selectedContacts, 
  onSelectContact, 
  onSelectAll, 
  onContactClick, 
  sortField, 
  sortDirection, 
  onSort 
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field, newDirection);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return 'ArrowUpDown';
    return sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    // Format Brazilian phone number
    const cleaned = phone?.replace(/\D/g, '');
    if (cleaned?.length === 11) {
      return `(${cleaned?.slice(0, 2)}) ${cleaned?.slice(2, 7)}-${cleaned?.slice(7)}`;
    }
    return phone;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ativo':
        return 'bg-success/10 text-success';
      case 'Inativo':
        return 'bg-warning/10 text-warning';
      case 'Bloqueado':
        return 'bg-error/10 text-error';
      default:
        return 'bg-muted/50 text-muted-foreground';
    }
  };

  if (contacts?.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-12 text-center">
          <Icon name="Users" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum contato encontrado
          </h3>
          <p className="text-muted-foreground mb-6">
            Não há contatos que correspondam aos filtros aplicados.
          </p>
          <Button variant="outline">
            <Icon name="Plus" size={16} className="mr-2" />
            Importar Contatos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={selectedContacts?.length === contacts?.length && contacts?.length > 0}
                  onChange={(e) => onSelectAll(e?.target?.checked)}
                />
              </th>
              {[
                { field: 'nome', label: 'Nome' },
                { field: 'empresa', label: 'Empresa' },
                { field: 'telefone', label: 'Telefone' },
                { field: 'email', label: 'Email' },
                { field: 'dataImportacao', label: 'Data Importação' },
                { field: 'status', label: 'Status' }
              ]?.map(({ field, label }) => (
                <th key={field} className="px-4 py-3 text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort(field)}
                    className="h-auto p-0 font-medium text-foreground hover:text-primary"
                  >
                    {label}
                    <Icon 
                      name={getSortIcon(field)} 
                      size={16} 
                      className="ml-2" 
                    />
                  </Button>
                </th>
              ))}
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {contacts?.map((contact) => (
              <tr
                key={contact?.id}
                className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${
                  selectedContacts?.includes(contact?.id) ? 'bg-primary/5' : ''
                }`}
                onMouseEnter={() => setHoveredRow(contact?.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onContactClick(contact)}
              >
                <td className="px-4 py-3" onClick={(e) => e?.stopPropagation()}>
                  <Checkbox
                    checked={selectedContacts?.includes(contact?.id)}
                    onChange={(e) => onSelectContact(contact?.id, e?.target?.checked)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium text-sm">
                      {contact?.nome?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{contact?.nome}</div>
                      {contact?.cargo && (
                        <div className="text-sm text-muted-foreground">{contact?.cargo}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground">
                  {contact?.empresa || '-'}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatPhone(contact?.telefone)}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {contact?.email || '-'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {contact?.dataImportacao}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact?.status)}`}>
                    {contact?.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {hoveredRow === contact?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e?.stopPropagation();
                        onContactClick(contact);
                      }}
                    >
                      <Icon name="MoreHorizontal" size={16} />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="lg:hidden">
        {contacts?.map((contact) => (
          <div
            key={contact?.id}
            className={`p-4 border-b border-border last:border-b-0 ${
              selectedContacts?.includes(contact?.id) ? 'bg-primary/5' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={selectedContacts?.includes(contact?.id)}
                onChange={(e) => onSelectContact(contact?.id, e?.target?.checked)}
              />
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                {contact?.nome?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-foreground truncate">
                    {contact?.nome}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact?.status)}`}>
                    {contact?.status}
                  </span>
                </div>
                {contact?.empresa && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {contact?.cargo ? `${contact?.cargo} • ${contact?.empresa}` : contact?.empresa}
                  </p>
                )}
                <div className="space-y-1">
                  {contact?.telefone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Icon name="Phone" size={14} className="mr-2" />
                      {formatPhone(contact?.telefone)}
                    </div>
                  )}
                  {contact?.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Icon name="Mail" size={14} className="mr-2" />
                      {contact?.email}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    Importado em {contact?.dataImportacao}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onContactClick(contact)}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactTable;