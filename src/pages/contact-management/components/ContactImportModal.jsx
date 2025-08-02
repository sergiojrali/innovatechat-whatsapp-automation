import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

import Select from '../../../components/ui/Select';

const ContactImportModal = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const fileInputRef = useRef(null);

  const fieldOptions = [
    { value: 'nome', label: 'Nome' },
    { value: 'empresa', label: 'Empresa' },
    { value: 'telefone', label: 'Telefone' },
    { value: 'email', label: 'Email' },
    { value: 'cargo', label: 'Cargo' },
    { value: 'cidade', label: 'Cidade' },
    { value: 'estado', label: 'Estado' },
    { value: 'ignore', label: 'Ignorar Coluna' }
  ];

  const handleDragOver = (e) => {
    e?.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragOver(false);
    const droppedFile = e?.dataTransfer?.files?.[0];
    if (droppedFile && (droppedFile?.type === 'text/csv' || droppedFile?.name?.endsWith('.xlsx'))) {
      processFile(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e?.target?.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    setIsProcessing(true);

    // Mock file processing
    setTimeout(() => {
      const mockColumns = ['Nome', 'Email', 'Telefone', 'Empresa', 'Cargo'];
      const mockPreview = [
        ['João Silva', 'joao@empresa.com', '(11) 99999-9999', 'Tech Corp', 'Gerente'],
        ['Maria Santos', 'maria@startup.com', '(21) 88888-8888', 'StartupXYZ', 'CEO'],
        ['Pedro Costa', 'pedro@consultoria.com', '(31) 77777-7777', 'Consultoria ABC', 'Consultor']
      ];

      setColumns(mockColumns);
      setPreviewData(mockPreview);
      setIsProcessing(false);
      setStep(2);
    }, 2000);
  };

  const handleMappingChange = (column, field) => {
    setMapping(prev => ({
      ...prev,
      [column]: field
    }));
  };

  const handleImport = () => {
    setIsProcessing(true);
    
    // Mock import process
    setTimeout(() => {
      const importedContacts = previewData?.map((row, index) => ({
        id: Date.now() + index,
        nome: row?.[columns?.findIndex(col => mapping?.[col] === 'nome')] || '',
        email: row?.[columns?.findIndex(col => mapping?.[col] === 'email')] || '',
        telefone: row?.[columns?.findIndex(col => mapping?.[col] === 'telefone')] || '',
        empresa: row?.[columns?.findIndex(col => mapping?.[col] === 'empresa')] || '',
        cargo: row?.[columns?.findIndex(col => mapping?.[col] === 'cargo')] || '',
        dataImportacao: new Date()?.toLocaleDateString('pt-BR'),
        status: 'Ativo'
      }));

      onImport(importedContacts);
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setColumns([]);
    setMapping({});
    setPreviewData([]);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-elevation-3 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Importar Contatos
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {step === 1 ? 'Selecione um arquivo CSV ou Excel' : 'Configure o mapeamento das colunas'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Mapeamento</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Icon name="Upload" size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Arraste e solte seu arquivo aqui
                </h3>
                <p className="text-muted-foreground mb-4">
                  Ou clique para selecionar um arquivo CSV ou Excel
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef?.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* File Info */}
              {file && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Icon name="FileText" size={20} className="text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{file?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file?.size / 1024)?.toFixed(1)} KB
                      </p>
                    </div>
                    {isProcessing && (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">Processando...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Formatos aceitos: CSV, Excel (.xlsx, .xls)</li>
                  <li>• Primeira linha deve conter os cabeçalhos das colunas</li>
                  <li>• Telefones devem estar no formato brasileiro</li>
                  <li>• Emails devem ser válidos</li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Column Mapping */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Mapeamento de Colunas
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure como cada coluna do arquivo deve ser interpretada
                </p>

                <div className="space-y-4">
                  {columns?.map((column, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{column}</p>
                        <p className="text-sm text-muted-foreground">
                          Exemplo: {previewData?.[0]?.[index] || 'N/A'}
                        </p>
                      </div>
                      <div className="w-48">
                        <Select
                          options={fieldOptions}
                          value={mapping?.[column] || ''}
                          onChange={(value) => handleMappingChange(column, value)}
                          placeholder="Selecionar campo"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <h4 className="font-medium text-foreground mb-3">Prévia dos Dados</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          {columns?.map((column, index) => (
                            <th key={index} className="px-4 py-3 text-left text-sm font-medium text-foreground">
                              {column}
                              {mapping?.[column] && (
                                <span className="ml-2 text-xs text-primary">
                                  → {fieldOptions?.find(f => f?.value === mapping?.[column])?.label}
                                </span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData?.slice(0, 3)?.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-t border-border">
                            {row?.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-3 text-sm text-foreground">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Mostrando 3 de {previewData?.length} registros
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {step === 2 && `${previewData?.length} contatos serão importados`}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            {step === 2 && (
              <Button 
                onClick={handleImport}
                loading={isProcessing}
                disabled={Object.keys(mapping)?.length === 0}
              >
                {isProcessing ? 'Importando...' : 'Importar Contatos'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactImportModal;