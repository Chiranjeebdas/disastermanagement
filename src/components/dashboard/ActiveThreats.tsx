import React from 'react';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { AlertTriangle } from 'lucide-react';

export const ActiveThreats: React.FC = () => {
  return (
    <Card 
      title="ACTIVE THREATS" 
      className="active-threats-card"
    >
      <EmptyState 
        title="No verified active threats currently assessed."
        description=""
        icon={<AlertTriangle size={48} className="text-muted" />}
      />
    </Card>
  );
};
