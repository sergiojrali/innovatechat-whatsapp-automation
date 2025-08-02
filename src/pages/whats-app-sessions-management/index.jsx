import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { whatsappService } from '../../services/whatsappService';
import { adminService } from '../../services/adminService';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';
import SessionCard from './components/SessionCard';
import SessionConfigModal from './components/SessionConfigModal';
import QRCodeModal from './components/QRCodeModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import TroubleshootingPanel from './components/TroubleshootingPanel';
import Icon from '../../components/AppIcon';


const WhatsAppSessionsManagement = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSessions, setSelectedSessions] = useState([]);
  
  // Modal states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  
  // Current session being edited/viewed
  const [currentSession, setCurrentSession] = useState(null);

  // Load sessions data with enhanced error handling
  const loadSessions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load sessions based on user role
      const sessionsData = userProfile?.role === 'admin' ? 
        await adminService?.getAllSessions() :
        await whatsappService?.getSessions();

      setSessions(sessionsData || []);
      
    } catch (err) {
      const errorMessage = err?.message || 'Erro desconhecido ao carregar sessões';
      
      // Enhanced error handling for common Supabase issues
      if (errorMessage?.includes('Failed to fetch') || 
          errorMessage?.includes('NetworkError') ||
          errorMessage?.includes('fetch')) {
        setError('Não foi possível conectar ao servidor Supabase. Verifique se seu projeto está ativo na dashboard do Supabase e tente novamente.');
      } else if (errorMessage?.includes('JWT expired') ||
                errorMessage?.includes('Invalid JWT') ||
                errorMessage?.includes('row level security')) {
        setError('Sessão expirada ou permissões insuficientes. Faça login novamente.');
      } else if (errorMessage?.includes('permission denied') ||
                errorMessage?.includes('insufficient privileges')) {
        setError('Você não tem permissão para visualizar as sessões. Entre em contato com o administrador.');
      } else {
        setError('Erro ao carregar sessões: ' + errorMessage);
      }
      
      console.error('Error loading sessions:', err);
      
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading effect
  useEffect(() => {
    let isMounted = true;
    
    // Only load sessions when authentication is complete and we have user data
    if (!authLoading && user && userProfile) {
      loadSessions()?.then(() => {
        if (isMounted) {
          // Data loaded successfully or with error
        }
      });
    } else if (!authLoading && !user) {
      // User is not authenticated
      setLoading(false);
      setError('Você precisa estar logado para visualizar as sessões.');
    } else if (!authLoading && user && !userProfile) {
      // User is authenticated but profile is missing
      setLoading(false);
      setError('Perfil de usuário não encontrado. Tente fazer login novamente.');
    }
    
    return () => {
      isMounted = false;
    };
  }, [authLoading, user, userProfile]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !userProfile) return;

    const unsubscribe = whatsappService?.subscribeToSessionChanges?.(() => {
      loadSessions();
    });

    return () => {
      unsubscribe?.();
    };
  }, [user, userProfile]);

  // Enhanced session actions with proper error handling
  const handleCreateSession = () => {
    setCurrentSession(null);
    setShowConfigModal(true);
  };

  const handleEditSession = (session) => {
    setCurrentSession(session);
    setShowConfigModal(true);
  };

  const handleDeleteSession = (session) => {
    setCurrentSession(session);
    setShowDeleteModal(true);
  };

  const handleConnectSession = async (sessionId) => {
    try {
      setError(''); // Clear any previous errors
      
      // Find the session
      const session = sessions?.find(s => s?.id === sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      // Connect using the enhanced WhatsApp service
      const result = await whatsappService?.connectSession(sessionId);
      
      if (result?.qrCode) {
        // Show QR modal for scanning
        setCurrentSession({ ...session, qr_code: result?.qrCode });
        setShowQRModal(true);
      }
      
      // Reload sessions to get updated status
      await loadSessions();
    } catch (err) {
      const errorMsg = err?.message || 'Erro desconhecido';
      setError('Erro ao conectar sessão: ' + errorMsg);
    }
  };

  const handleDisconnectSession = async (sessionId) => {
    try {
      setError(''); // Clear any previous errors
      await whatsappService?.disconnectSession(sessionId);
      await loadSessions();
    } catch (err) {
      const errorMsg = err?.message || 'Erro desconhecido';
      setError('Erro ao desconectar sessão: ' + errorMsg);
    }
  };

  const handleSaveSession = async (sessionData) => {
    try {
      setError(''); // Clear any previous errors
      
      if (currentSession) {
        // Update existing session
        await whatsappService?.updateSession(currentSession?.id, {
          ...sessionData,
          user_id: user?.id
        });
      } else {
        // Create new session
        await whatsappService?.createSession({
          ...sessionData,
          user_id: user?.id
        });
      }
      
      setShowConfigModal(false);
      setCurrentSession(null);
      await loadSessions();
    } catch (err) {
      const errorMsg = err?.message || 'Erro desconhecido';
      setError('Erro ao salvar sessão: ' + errorMsg);
      // Don't close modal on error so user can see the error and try again
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentSession) return;
    
    try {
      setError(''); // Clear any previous errors
      await whatsappService?.deleteSession(currentSession?.id);
      setShowDeleteModal(false);
      setCurrentSession(null);
      await loadSessions();
    } catch (err) {
      const errorMsg = err?.message || 'Erro desconhecido';
      setError('Erro ao excluir sessão: ' + errorMsg);
      // Close modal even on error since delete operation might have partially succeeded
      setShowDeleteModal(false);
      setCurrentSession(null);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedSessions?.length === 0) return;
    
    try {
      setError(''); // Clear any previous errors
      
      switch (action) {
        case 'connect':
          await whatsappService?.bulkConnect?.(selectedSessions);
          break;
        case 'disconnect':
          await whatsappService?.bulkDisconnect?.(selectedSessions);
          break;
        case 'delete':
          if (window.confirm(`Tem certeza que deseja excluir ${selectedSessions?.length} sessão(ões)?`)) {
            await whatsappService?.bulkDelete?.(selectedSessions);
          }
          break;
        default:
          throw new Error('Ação desconhecida');
      }
      
      setSelectedSessions([]);
      await loadSessions();
    } catch (err) {
      const errorMsg = err?.message || 'Erro desconhecido';
      setError('Erro na ação em lote: ' + errorMsg);
      // Don't clear selection on error so user can retry
    }
  };

  const handleSelectSession = (sessionId) => {
    setSelectedSessions(prev => 
      prev?.includes(sessionId) ? 
      prev?.filter(id => id !== sessionId) : 
      [...(prev || []), sessionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSessions?.length === sessions?.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions?.map(s => s?.id) || []);
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando sessões...</p>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Lock" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Você precisa estar logado para visualizar as sessões.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Enhanced statistics with real-time updates
  const sessionStats = {
    connected: sessions?.filter(s => s?.status === 'connected')?.length || 0,
    connecting: sessions?.filter(s => s?.status === 'connecting')?.length || 0,
    disconnected: sessions?.filter(s => s?.status === 'disconnected')?.length || 0,
    error: sessions?.filter(s => s?.status === 'error')?.length || 0
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        userRole={userProfile?.role}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-112'}`}>
        <Header 
          user={{
            name: userProfile?.full_name || user?.email,
            email: user?.email,
            role: userProfile?.role
          }}
          onMenuToggle={handleSidebarToggle}
          notifications={[]}
        />
        
        <main className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            
            {/* Enhanced Error Display */}
            {error && (
              <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Icon name="AlertTriangle" size={20} className="text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-destructive text-sm font-medium">Erro</p>
                    <p className="text-destructive text-sm">{error}</p>
                    <div className="mt-3 flex space-x-2">
                      <button 
                        onClick={() => setError('')}
                        className="text-xs text-destructive underline hover:no-underline"
                      >
                        Fechar
                      </button>
                      <button 
                        onClick={() => loadSessions()}
                        className="text-xs text-destructive underline hover:no-underline"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Gerenciamento de Sessões WhatsApp
                </h1>
                <p className="text-muted-foreground">
                  Configure e monitore suas conexões WhatsApp Business
                </p>
              </div>

              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <Button
                  variant="outline"
                  onClick={() => setShowTroubleshooting(true)}
                  iconName="HelpCircle"
                >
                  Suporte
                </Button>
                <Button
                  variant="default"
                  onClick={handleCreateSession}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Nova Sessão
                </Button>
              </div>
            </div>

            {/* Enhanced Session Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                      <Icon name="CheckCircle" size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Conectadas</p>
                    <p className="text-2xl font-bold text-foreground">{sessionStats?.connected}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <div className="w-6 h-6 bg-warning rounded-full flex items-center justify-center">
                      <Icon name="Loader" size={14} className="text-white animate-spin" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Conectando</p>
                    <p className="text-2xl font-bold text-foreground">{sessionStats?.connecting}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                      <Icon name="Circle" size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Desconectadas</p>
                    <p className="text-2xl font-bold text-foreground">{sessionStats?.disconnected}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                      <Icon name="AlertTriangle" size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Com Erro</p>
                    <p className="text-2xl font-bold text-foreground">{sessionStats?.error}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedSessions?.length > 0 && (
              <BulkActionsToolbar
                selectedCount={selectedSessions?.length}
                onConnect={() => handleBulkAction('connect')}
                onDisconnect={() => handleBulkAction('disconnect')}
                onDelete={() => handleBulkAction('delete')}
                onClear={() => setSelectedSessions([])}
              />
            )}

            {/* Enhanced Sessions Grid */}
            {sessions?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Icon name="Smartphone" size={48} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma sessão criada</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Crie sua primeira sessão WhatsApp para começar a enviar mensagens automatizadas
                </p>
                <Button onClick={handleCreateSession} iconName="Plus" iconPosition="left">
                  Criar primeira sessão
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions?.map((session) => (
                  <SessionCard
                    key={session?.id}
                    session={session}
                    isSelected={selectedSessions?.includes(session?.id)}
                    onSelect={() => handleSelectSession(session?.id)}
                    onEdit={() => handleEditSession(session)}
                    onDelete={() => handleDeleteSession(session)}
                    onConnect={() => handleConnectSession(session?.id)}
                    onDisconnect={() => handleDisconnectSession(session?.id)}
                    showUserInfo={userProfile?.role === 'admin'}
                  />
                ))}
              </div>
            )}

            {/* Enhanced Real-time Status */}
            <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Status atualizado em tempo real via Supabase</span>
              <span>•</span>
              <span>WhatsApp Web.js v1.31.0</span>
              <span>•</span>
              <span>Última verificação: {new Date()?.toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </main>
      </div>
      {/* Enhanced Modals */}
      <SessionConfigModal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
          setCurrentSession(null);
        }}
        onSave={handleSaveSession}
        session={currentSession}
      />
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setCurrentSession(null);
        }}
        session={currentSession}
        onConnected={() => {
          setShowQRModal(false);
          setCurrentSession(null);
          loadSessions();
        }}
      />
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCurrentSession(null);
        }}
        onConfirm={handleConfirmDelete}
        sessionName={currentSession?.session_name}
      />
      <TroubleshootingPanel
        isOpen={showTroubleshooting}
        onClose={() => setShowTroubleshooting(false)}
      />
    </div>
  );
};

export default WhatsAppSessionsManagement;