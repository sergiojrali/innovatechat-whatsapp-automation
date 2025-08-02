import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PerformanceChart = () => {
  const [chartType, setChartType] = useState('bar');
  const [timeRange, setTimeRange] = useState('7days');

  // Mock data for different time ranges
  const chartData = {
    '7days': [
      { name: '26/01', mensagens: 120, campanhas: 3, entregas: 115 },
      { name: '27/01', mensagens: 98, campanhas: 2, entregas: 95 },
      { name: '28/01', mensagens: 156, campanhas: 4, entregas: 148 },
      { name: '29/01', mensagens: 203, campanhas: 5, entregas: 195 },
      { name: '30/01', mensagens: 89, campanhas: 2, entregas: 87 },
      { name: '31/01', mensagens: 167, campanhas: 3, entregas: 159 },
      { name: '01/02', mensagens: 234, campanhas: 6, entregas: 228 }
    ],
    '30days': [
      { name: 'Sem 1', mensagens: 850, campanhas: 12, entregas: 820 },
      { name: 'Sem 2', mensagens: 920, campanhas: 15, entregas: 895 },
      { name: 'Sem 3', mensagens: 780, campanhas: 10, entregas: 765 },
      { name: 'Sem 4', mensagens: 1100, campanhas: 18, entregas: 1075 }
    ],
    '90days': [
      { name: 'Jan', mensagens: 3200, campanhas: 45, entregas: 3100 },
      { name: 'Fev', mensagens: 2800, campanhas: 38, entregas: 2750 },
      { name: 'Mar', mensagens: 3600, campanhas: 52, entregas: 3520 }
    ]
  };

  const currentData = chartData?.[timeRange];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-2">
          <p className="font-medium text-popover-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry?.color }}>
              {entry?.name === 'mensagens' ? 'Mensagens' :
               entry?.name === 'campanhas' ? 'Campanhas' : 'Entregas'}: {entry?.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Performance</h3>
        
        <div className="flex items-center space-x-2">
          {/* Time Range Selector */}
          <div className="flex bg-muted/30 rounded-lg p-1">
            {[
              { key: '7days', label: '7d' },
              { key: '30days', label: '30d' },
              { key: '90days', label: '90d' }
            ]?.map((range) => (
              <Button
                key={range?.key}
                variant={timeRange === range?.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range?.key)}
                className="px-3 py-1 text-xs"
              >
                {range?.label}
              </Button>
            ))}
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex bg-muted/30 rounded-lg p-1">
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setChartType('bar')}
              className="w-8 h-8"
            >
              <Icon name="BarChart3" size={16} />
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setChartType('line')}
              className="w-8 h-8"
            >
              <Icon name="TrendingUp" size={16} />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full h-80" aria-label="Performance Chart">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="mensagens" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="mensagens"
              />
              <Bar 
                dataKey="entregas" 
                fill="hsl(var(--success))" 
                radius={[4, 4, 0, 0]}
                name="entregas"
              />
            </BarChart>
          ) : (
            <LineChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="mensagens" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                name="mensagens"
              />
              <Line 
                type="monotone" 
                dataKey="entregas" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                name="entregas"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      {/* Chart Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-sm text-muted-foreground">Mensagens Enviadas</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-success rounded-full"></div>
          <span className="text-sm text-muted-foreground">Mensagens Entregues</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;