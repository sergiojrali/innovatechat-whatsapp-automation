import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const MessageComposer = ({ formData, onFormChange, errors }) => {
  const [showVariables, setShowVariables] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const availableVariables = [
    { key: '{{nome}}', description: 'Nome do contato' },
    { key: '{{empresa}}', description: 'Nome da empresa' },
    { key: '{{telefone}}', description: 'Número de telefone' },
    { key: '{{email}}', description: 'Endereço de email' },
    { key: '{{cidade}}', description: 'Cidade do contato' },
    { key: '{{cargo}}', description: 'Cargo/Função' }
  ];

  const handleTextChange = (value) => {
    onFormChange('message.text', value);
  };

  const insertVariable = (variable) => {
    const textarea = textareaRef?.current;
    const start = textarea?.selectionStart;
    const end = textarea?.selectionEnd;
    const currentText = formData?.message?.text || '';
    
    const newText = currentText?.substring(0, start) + variable + currentText?.substring(end);
    handleTextChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + variable?.length, start + variable?.length);
    }, 0);
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    // Validate file size (10MB limit)
    if (file?.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Limite de 10MB.');
      return;
    }

    // Validate file type
    const validTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    if (!validTypes?.[type]?.includes(file?.type)) {
      alert(`Tipo de arquivo não suportado para ${type}.`);
      return;
    }

    // Simulate upload progress
    const fileId = Date.now()?.toString();
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const currentProgress = prev?.[fileId] || 0;
        if (currentProgress >= 100) {
          clearInterval(interval);
          // Simulate successful upload
          setTimeout(() => {
            const fileUrl = URL.createObjectURL(file);
            const fileData = {
              id: fileId,
              name: file?.name,
              size: file?.size,
              type: file?.type,
              url: fileUrl
            };

            const currentFiles = formData?.message?.[type] || [];
            onFormChange(`message.${type}`, [...currentFiles, fileData]);
            
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress?.[fileId];
              return newProgress;
            });
          }, 500);
          return prev;
        }
        return { ...prev, [fileId]: currentProgress + 10 };
      });
    }, 100);
  };

  const removeFile = (type, fileId) => {
    const currentFiles = formData?.message?.[type] || [];
    const updatedFiles = currentFiles?.filter(file => file?.id !== fileId);
    onFormChange(`message.${type}`, updatedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const getPreviewText = () => {
    let text = formData?.message?.text || '';
    availableVariables?.forEach(variable => {
      const sampleValue = variable?.key === '{{nome}}' ? 'João Silva' :
                         variable?.key === '{{empresa}}' ? 'Empresa ABC' :
                         variable?.key === '{{telefone}}' ? '(11) 99999-9999' :
                         variable?.key === '{{email}}' ? 'joao@empresa.com' :
                         variable?.key === '{{cidade}}' ? 'São Paulo' :
                         variable?.key === '{{cargo}}' ? 'Gerente' : 'Valor';
      text = text?.replace(new RegExp(variable.key.replace(/[{}]/g, '\\$&'), 'g'), sampleValue);
    });
    return text;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-primary font-semibold">3</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Composição da Mensagem</h3>
          <p className="text-sm text-muted-foreground">Crie sua mensagem com texto, imagens, áudios e documentos</p>
        </div>
      </div>
      <div className="space-y-6">
        {/* Text Message */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">Mensagem de Texto</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVariables(!showVariables)}
              iconName="Code"
              iconPosition="left"
            >
              Variáveis
            </Button>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              className="w-full min-h-32 p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Digite sua mensagem aqui... Use variáveis como {{nome}} para personalizar"
              value={formData?.message?.text || ''}
              onChange={(e) => handleTextChange(e?.target?.value)}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {(formData?.message?.text || '')?.length}/1000
            </div>
          </div>

          {errors?.['message.text'] && (
            <p className="text-sm text-error mt-1">{errors?.['message.text']}</p>
          )}

          {/* Variables Panel */}
          {showVariables && (
            <div className="mt-3 p-4 bg-muted/30 border border-border rounded-lg">
              <h4 className="font-medium text-foreground mb-3">Variáveis Disponíveis</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableVariables?.map((variable) => (
                  <button
                    key={variable?.key}
                    onClick={() => insertVariable(variable?.key)}
                    className="flex items-center justify-between p-2 text-left hover:bg-muted/50 rounded transition-colors"
                  >
                    <div>
                      <code className="text-sm font-mono text-primary">{variable?.key}</code>
                      <p className="text-xs text-muted-foreground">{variable?.description}</p>
                    </div>
                    <Icon name="Plus" size={16} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Media Upload Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Images */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Imagens</label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  Array.from(e?.target?.files)?.forEach(file => {
                    handleFileUpload(file, 'images');
                  });
                }}
              />
              <Button
                variant="ghost"
                onClick={() => fileInputRef?.current?.click()}
                iconName="Upload"
                iconPosition="left"
                className="w-full"
              >
                Adicionar Imagens
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, GIF até 10MB
              </p>
            </div>

            {/* Image Preview */}
            {(formData?.message?.images || [])?.map((image) => (
              <div key={image?.id} className="mt-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={image?.url}
                      alt={image?.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{image?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(image?.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile('images', image?.id)}
                  >
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Audio */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Áudios</label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={(e) => {
                  if (e?.target?.files?.[0]) {
                    handleFileUpload(e?.target?.files?.[0], 'audio');
                  }
                }}
                id="audio-upload"
              />
              <Button
                variant="ghost"
                onClick={() => document.getElementById('audio-upload')?.click()}
                iconName="Mic"
                iconPosition="left"
                className="w-full"
              >
                Adicionar Áudio
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                MP3, WAV, OGG até 10MB
              </p>
            </div>

            {/* Audio Preview */}
            {(formData?.message?.audio || [])?.map((audio) => (
              <div key={audio?.id} className="mt-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-secondary/20 rounded flex items-center justify-center">
                      <Icon name="Music" size={20} className="text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{audio?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(audio?.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile('audio', audio?.id)}
                  >
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Documents */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Documentos</label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e?.target?.files?.[0]) {
                    handleFileUpload(e?.target?.files?.[0], 'documents');
                  }
                }}
                id="document-upload"
              />
              <Button
                variant="ghost"
                onClick={() => document.getElementById('document-upload')?.click()}
                iconName="FileText"
                iconPosition="left"
                className="w-full"
              >
                Adicionar Documento
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, DOC, DOCX até 10MB
              </p>
            </div>

            {/* Document Preview */}
            {(formData?.message?.documents || [])?.map((doc) => (
              <div key={doc?.id} className="mt-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-accent/20 rounded flex items-center justify-center">
                      <Icon name="FileText" size={20} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(doc?.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile('documents', doc?.id)}
                  >
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress)?.length > 0 && (
          <div className="space-y-2">
            {Object.entries(uploadProgress)?.map(([fileId, progress]) => (
              <div key={fileId} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">Enviando arquivo...</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message Preview */}
        {formData?.message?.text && (
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Pré-visualização da Mensagem</h4>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{getPreviewText()}</p>
              {(formData?.message?.images?.length > 0 || formData?.message?.audio?.length > 0 || formData?.message?.documents?.length > 0) && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    + {(formData?.message?.images?.length || 0)} imagem(ns), {(formData?.message?.audio?.length || 0)} áudio(s), {(formData?.message?.documents?.length || 0)} documento(s)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageComposer;