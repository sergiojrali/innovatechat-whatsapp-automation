import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const CampaignCharts = ({ deliveryData, performanceData, statusDistribution }) => {
  const COLORS = {
    primary: '#1E40AF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    secondary: '#6366F1',
    accent: '#F59E0B'
  };

  const statusColors = {
    'Ativas': COLORS?.success,
    'Pausadas': COLORS?.warning,
    'Concluídas': COLORS?.primary,
    'Com Erro': COLORS?.error
  };

  const formatTooltipValue = (value, name) => {
    if (name.includes('Taxa') || name.includes('%')) {
      return [`${value}%`, name];
    }
    return [new Intl.NumberFormat('pt-BR')?.format(value), name];
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date?.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Delivery Rate Over Time */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Taxa de Entrega ao Longo do Tempo
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Entregues</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-muted-foreground">Lidas</span>
            </div>
          </div>
        </div>
        
        <div className="h-64" aria-label="Gráfico de Taxa de Entrega">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deliveryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="data" 
                tickFormatter={formatDate}
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                labelFormatter={(label) => `Data: ${formatDate(label)}`}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="entregues" 
                stroke={COLORS?.primary} 
                strokeWidth={2}
                dot={{ fill: COLORS?.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS?.primary, strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="lidas" 
                stroke={COLORS?.success} 
                strokeWidth={2}
                dot={{ fill: COLORS?.success, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS?.success, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Campaign Performance */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Performance por Campanha
          </h3>
          <div className="text-sm text-muted-foreground">
            Top 10 campanhas
          </div>
        </div>
        
        <div className="h-64" aria-label="Gráfico de Performance por Campanha">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                type="number" 
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                type="category" 
                dataKey="nome" 
                stroke="#6B7280"
                fontSize={12}
                width={120}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}
              />
              <Bar 
                dataKey="taxaEntrega" 
                fill={COLORS?.secondary}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Status Distribution */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Distribuição por Status
          </h3>
          <div className="text-sm text-muted-foreground">
            Total: {statusDistribution?.reduce((sum, item) => sum + item?.value, 0)} campanhas
          </div>
        </div>
        
        <div className="h-64" aria-label="Gráfico de Distribuição por Status">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {statusDistribution?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={statusColors?.[entry?.name] || COLORS?.primary} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [
                  `${value} campanhas`,
                  name
                ]}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          {statusDistribution?.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusColors?.[item?.name] || COLORS?.primary }}
              ></div>
              <span className="text-sm text-muted-foreground">{item?.name}</span>
              <span className="text-sm font-medium text-foreground ml-auto">
                {item?.value}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Response Analytics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Análise de Respostas
          </h3>
          <div className="text-sm text-muted-foreground">
            Últimos 7 dias
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <span className="text-success font-semibold">✓</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Respostas Positivas</p>
                <p className="text-sm text-muted-foreground">Interesse demonstrado</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-success">1,247</p>
              <p className="text-sm text-muted-foreground">68.5%</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <span className="text-warning font-semibold">?</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Dúvidas</p>
                <p className="text-sm text-muted-foreground">Solicitações de informação</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-warning">423</p>
              <p className="text-sm text-muted-foreground">23.2%</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                <span className="text-error font-semibold">✗</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Respostas Negativas</p>
                <p className="text-sm text-muted-foreground">Desinteresse ou reclamações</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-error">151</p>
              <p className="text-sm text-muted-foreground">8.3%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCharts;