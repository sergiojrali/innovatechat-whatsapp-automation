import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionCard = ({ title, description, icon, route, color = 'primary' }) => {
  const navigate = useNavigate();

  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 border-primary/20',
    success: 'from-success/20 to-success/5 border-success/20',
    warning: 'from-warning/20 to-warning/5 border-warning/20',
    secondary: 'from-secondary/20 to-secondary/5 border-secondary/20'
  };

  const iconColors = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    secondary: 'text-secondary'
  };

  const handleAction = () => {
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses?.[color]} border rounded-lg p-6 transition-all duration-200 hover:shadow-elevation-2`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-card flex items-center justify-center ${iconColors?.[color]}`}>
          <Icon name={icon} size={24} />
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleAction}
        className="w-full"
      >
        Acessar
      </Button>
    </div>
  );
};

export default QuickActionCard;