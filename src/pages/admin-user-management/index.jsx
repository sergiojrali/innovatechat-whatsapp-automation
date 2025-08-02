import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';

// Import components
import UserCard from './components/UserCard';
import UserTable from './components/UserTable';
import UserFilters from './components/UserFilters';
import UserDetailModal from './components/UserDetailModal';
import UserFormModal from './components/UserFormModal';
import BulkActionsModal from './components/BulkActionsModal';
import ConfirmationModal from './components/ConfirmationModal';

const AdminUserManagement = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortField, setSortField] = useState('dataRegistro');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Modal states
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Data states
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    plan: '',
    status: '',
    activity: '',
    dateFrom: '',
    dateTo: ''
  });

  // Mock user data
  const mockUsers = [
    {
      id: 1,
      nome: "Carlos Silva Santos",
      email: "carlos.silva@empresa.com.br",
      empresa: "Tech Solutions Ltda",
      telefone: "(11) 99999-1234",
      plano: "Premium",
      status: "ativo",
      dataRegistro: "2024-01-15T10:30:00Z",
      ultimoLogin: "2025-02-01T14:20:00Z",
      valorMensal: 199.90,
      proximoPagamento: "2025-02-15T00:00:00Z",
      statusPagamento: "em_dia",
      sessoesAtivas: 3,
      campanhasAtivas: 5,
      totalContatos: 850,
      mensagensEnviadas: 2340,
      atividadeRecente: [
        { acao: "Login realizado", data: "2025-02-01T14:20:00Z", icon: "LogIn" },
        { acao: "Campanha criada", data: "2025-01-31T16:45:00Z", icon: "Plus" },
        { acao: "Contatos importados", data: "2025-01-30T09:15:00Z", icon: "Upload" }
      ]
    },
    {
      id: 2,
      nome: "Maria Oliveira Costa",
      email: "maria.oliveira@marketing.com.br",
      empresa: "Digital Marketing Pro",
      telefone: "(21) 98888-5678",
      plano: "Pro",
      status: "ativo",
      dataRegistro: "2024-02-20T08:15:00Z",
      ultimoLogin: "2025-01-30T11:30:00Z",
      valorMensal: 99.90,
      proximoPagamento: "2025-02-20T00:00:00Z",
      statusPagamento: "em_dia",
      sessoesAtivas: 2,
      campanhasAtivas: 3,
      totalContatos: 450,
      mensagensEnviadas: 1200,
      atividadeRecente: [
        { acao: "Sessão WhatsApp conectada", data: "2025-01-30T11:30:00Z", icon: "Smartphone" },
        { acao: "Relatório exportado", data: "2025-01-29T15:20:00Z", icon: "Download" }
      ]
    },
    {
      id: 3,
      nome: "João Pedro Almeida",
      email: "joao.almeida@vendas.com.br",
      empresa: "Vendas & Cia",
      telefone: "(31) 97777-9012",
      plano: "Básico",
      status: "suspenso",
      dataRegistro: "2024-03-10T14:45:00Z",
      ultimoLogin: "2025-01-25T09:45:00Z",
      valorMensal: 49.90,
      proximoPagamento: "2025-02-10T00:00:00Z",
      statusPagamento: "pendente",
      sessoesAtivas: 0,
      campanhasAtivas: 1,
      totalContatos: 120,
      mensagensEnviadas: 340,
      atividadeRecente: [
        { acao: "Pagamento pendente", data: "2025-01-25T09:45:00Z", icon: "AlertCircle" }
      ]
    },
    {
      id: 4,
      nome: "Ana Carolina Ferreira",
      email: "ana.ferreira@consultoria.com.br",
      empresa: "Consultoria Estratégica",
      telefone: "(41) 96666-3456",
      plano: "Premium",
      status: "ativo",
      dataRegistro: "2023-12-05T16:20:00Z",
      ultimoLogin: "2025-02-01T08:10:00Z",
      valorMensal: 199.90,
      proximoPagamento: "2025-02-05T00:00:00Z",
      statusPagamento: "em_dia",
      sessoesAtivas: 5,
      campanhasAtivas: 8,
      totalContatos: 1200,
      mensagensEnviadas: 4500,
      atividadeRecente: [
        { acao: "Campanha finalizada", data: "2025-02-01T08:10:00Z", icon: "CheckCircle" },
        { acao: "Backup realizado", data: "2025-01-31T20:00:00Z", icon: "Database" }
      ]
    },
    {
      id: 5,
      nome: "Roberto Mendes Lima",
      email: "roberto.mendes@ecommerce.com.br",
      empresa: "E-commerce Solutions",
      telefone: "(51) 95555-7890",
      plano: "Pro",
      status: "inativo",
      dataRegistro: "2024-04-18T12:00:00Z",
      ultimoLogin: "2024-12-20T17:30:00Z",
      valorMensal: 99.90,
      proximoPagamento: "2025-01-18T00:00:00Z",
      statusPagamento: "pendente",
      sessoesAtivas: 0,
      campanhasAtivas: 0,
      totalContatos: 280,
      mensagensEnviadas: 150,
      atividadeRecente: []
    }
  ];

  // Mock notifications
  const mockNotifications = [
    {
      title: "Novo usuário registrado",
      message: "Carlos Silva Santos se registrou no sistema",
      time: "2 horas atrás",
      type: "success",
      read: false
    },
    {
      title: "Pagamento pendente",
      message: "João Pedro Almeida tem pagamento em atraso",
      time: "1 dia atrás",
      type: "warning",
      read: false
    }
  ];

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = mockUsers?.filter(user => {
      const matchesSearch = !filters?.search || 
        user?.nome?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        user?.email?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        user?.empresa?.toLowerCase()?.includes(filters?.search?.toLowerCase());
      
      const matchesPlan = !filters?.plan || user?.plano === filters?.plan;
      const matchesStatus = !filters?.status || user?.status === filters?.status;
      
      const matchesDateRange = (!filters?.dateFrom || new Date(user.dataRegistro) >= new Date(filters.dateFrom)) &&
                              (!filters?.dateTo || new Date(user.dataRegistro) <= new Date(filters.dateTo));
      
      let matchesActivity = true;
      if (filters?.activity) {
        const now = new Date();
        const lastLogin = user?.ultimoLogin ? new Date(user.ultimoLogin) : null;
        
        switch (filters?.activity) {
          case 'today':
            matchesActivity = lastLogin && lastLogin?.toDateString() === now?.toDateString();
            break;
          case 'week':
            matchesActivity = lastLogin && (now - lastLogin) <= 7 * 24 * 60 * 60 * 1000;
            break;
          case 'month':
            matchesActivity = lastLogin && (now - lastLogin) <= 30 * 24 * 60 * 60 * 1000;
            break;
          case 'inactive':
            matchesActivity = !lastLogin || (now - lastLogin) > 30 * 24 * 60 * 60 * 1000;
            break;
        }
      }
      
      return matchesSearch && matchesPlan && matchesStatus && matchesDateRange && matchesActivity;
    });

    // Sort users
    filtered?.sort((a, b) => {
      let aValue = a?.[sortField];
      let bValue = b?.[sortField];
      
      if (sortField === 'dataRegistro' || sortField === 'ultimoLogin') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase();
        bValue = bValue?.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [filters, sortField, sortDirection]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      plan: '',
      status: '',
      activity: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle user selection
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev?.includes(userId) 
        ? prev?.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = (checked) => {
    if (checked) {
      setSelectedUsers(filteredAndSortedUsers?.map(user => user?.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Modal handlers
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditingUser(true);
    setShowUserForm(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsEditingUser(false);
    setShowUserForm(true);
  };

  const handleSuspendUser = (user) => {
    const newStatus = user?.status === 'ativo' ? 'suspenso' : 'ativo';
    setConfirmationConfig({
      title: `${newStatus === 'suspenso' ? 'Suspender' : 'Ativar'} Usuário`,
      message: `Tem certeza que deseja ${newStatus === 'suspenso' ? 'suspender' : 'ativar'} este usuário?`,
      confirmText: newStatus === 'suspenso' ? 'Suspender' : 'Ativar',
      variant: newStatus === 'suspenso' ? 'warning' : 'success',
      user: user,
      onConfirm: () => {
        console.log(`${newStatus === 'suspenso' ? 'Suspendendo' : 'Ativando'} usuário:`, user?.id);
        setShowConfirmation(false);
      }
    });
    setShowConfirmation(true);
  };

  const handleDeleteUser = (user) => {
    setConfirmationConfig({
      title: 'Excluir Usuário',
      message: 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      variant: 'destructive',
      user: user,
      onConfirm: () => {
        console.log('Excluindo usuário:', user?.id);
        setShowConfirmation(false);
      }
    });
    setShowConfirmation(true);
  };

  const handleSaveUser = async (userData) => {
    console.log('Salvando usuário:', userData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleBulkAction = async (actionData) => {
    console.log('Executando ação em lote:', actionData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSelectedUsers([]);
  };

  const handleExport = () => {
    console.log('Exportando usuários:', filteredAndSortedUsers);
    // Simulate export
    const csvContent = "data:text/csv;charset=utf-8," + "Nome,Email,Empresa,Plano,Status,Data Registro\n" +
      filteredAndSortedUsers?.map(user => 
        `${user?.nome},${user?.email},${user?.empresa},${user?.plano},${user?.status},${new Date(user.dataRegistro)?.toLocaleDateString('pt-BR')}`
      )?.join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link?.setAttribute("href", encodedUri);
    link?.setAttribute("download", "usuarios.csv");
    document.body?.appendChild(link);
    link?.click();
    document.body?.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole="admin"
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-112'}`}>
        <Header 
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          notifications={mockNotifications}
          user={{ name: "Admin", email: "admin@innovatechat.com" }}
        />
        
        <main className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
                <p className="text-muted-foreground mt-2">
                  Administre contas de usuários, planos e configurações do sistema
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {selectedUsers?.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkActions(true)}
                    iconName="Settings"
                    iconPosition="left"
                    iconSize={16}
                  >
                    Ações em Lote ({selectedUsers?.length})
                  </Button>
                )}
                
                <Button
                  onClick={handleCreateUser}
                  iconName="Plus"
                  iconPosition="left"
                  iconSize={16}
                >
                  Novo Usuário
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Usuários</p>
                    <p className="text-2xl font-bold text-foreground">{mockUsers?.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name="Users" size={24} className="text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                    <p className="text-2xl font-bold text-success">
                      {mockUsers?.filter(u => u?.status === 'ativo')?.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                    <Icon name="UserCheck" size={24} className="text-success" />
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Planos Premium</p>
                    <p className="text-2xl font-bold text-accent">
                      {mockUsers?.filter(u => u?.plano === 'Premium')?.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <Icon name="Crown" size={24} className="text-accent" />
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Mensal</p>
                    <p className="text-2xl font-bold text-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })?.format(mockUsers?.reduce((sum, user) => sum + (user?.valorMensal || 0), 0))}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Icon name="DollarSign" size={24} className="text-secondary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <UserFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onExport={handleExport}
              totalUsers={mockUsers?.length}
              filteredUsers={filteredAndSortedUsers?.length}
            />

            {/* View Toggle and Bulk Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                {/* Bulk Selection */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedUsers?.length === filteredAndSortedUsers?.length && filteredAndSortedUsers?.length > 0}
                    onChange={(e) => handleSelectAllUsers(e?.target?.checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedUsers?.length > 0 
                      ? `${selectedUsers?.length} selecionado(s)`
                      : 'Selecionar todos'
                    }
                  </span>
                </div>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2 bg-muted/30 rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  iconName="Table"
                  iconSize={16}
                  className="h-8"
                >
                  Tabela
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  iconName="Grid3X3"
                  iconSize={16}
                  className="h-8"
                >
                  Cards
                </Button>
              </div>
            </div>

            {/* Users Display */}
            {filteredAndSortedUsers?.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <Icon name="Users" size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum usuário encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  {Object.values(filters)?.some(filter => filter) 
                    ? 'Tente ajustar os filtros para encontrar usuários.' :'Comece criando seu primeiro usuário.'
                  }
                </p>
                {!Object.values(filters)?.some(filter => filter) && (
                  <Button onClick={handleCreateUser} iconName="Plus" iconPosition="left">
                    Criar Primeiro Usuário
                  </Button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              <div className="space-y-4">
                {/* Selection Controls for Table */}
                <div className="flex items-center space-x-4 px-6 py-3 bg-muted/20 rounded-lg">
                  <Checkbox
                    checked={selectedUsers?.length === filteredAndSortedUsers?.length}
                    onChange={(e) => handleSelectAllUsers(e?.target?.checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    Selecionar todos os {filteredAndSortedUsers?.length} usuários
                  </span>
                </div>
                
                <UserTable
                  users={filteredAndSortedUsers?.map(user => ({
                    ...user,
                    selected: selectedUsers?.includes(user?.id)
                  }))}
                  onEdit={handleEditUser}
                  onSuspend={handleSuspendUser}
                  onDelete={handleDeleteUser}
                  onViewDetails={handleViewDetails}
                  onSort={handleSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedUsers?.map((user) => (
                  <div key={user?.id} className="relative">
                    <div className="absolute top-4 left-4 z-10">
                      <Checkbox
                        checked={selectedUsers?.includes(user?.id)}
                        onChange={() => handleSelectUser(user?.id)}
                      />
                    </div>
                    <UserCard
                      user={user}
                      onEdit={handleEditUser}
                      onSuspend={handleSuspendUser}
                      onDelete={handleDeleteUser}
                      onViewDetails={handleViewDetails}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      {/* Modals */}
      <UserDetailModal
        user={selectedUser}
        isOpen={showUserDetail}
        onClose={() => setShowUserDetail(false)}
        onEdit={handleEditUser}
        onSuspend={handleSuspendUser}
        onDelete={handleDeleteUser}
      />
      <UserFormModal
        user={selectedUser}
        isOpen={showUserForm}
        onClose={() => setShowUserForm(false)}
        onSave={handleSaveUser}
        isEditing={isEditingUser}
      />
      <BulkActionsModal
        selectedUsers={filteredAndSortedUsers?.filter(user => selectedUsers?.includes(user?.id))}
        isOpen={showBulkActions}
        onClose={() => setShowBulkActions(false)}
        onExecute={handleBulkAction}
      />
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmationConfig?.onConfirm}
        title={confirmationConfig?.title}
        message={confirmationConfig?.message}
        confirmText={confirmationConfig?.confirmText}
        variant={confirmationConfig?.variant}
        user={confirmationConfig?.user}
      />
    </div>
  );
};

export default AdminUserManagement;