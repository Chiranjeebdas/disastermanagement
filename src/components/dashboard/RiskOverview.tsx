import React from 'react';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ShieldAlert } from 'lucide-react';

export const RiskOverview: React.FC = () => {
  return (
    <Card 
      title="CURRENT LOCAL RISK" 
      className="risk-overview-card"
    >
      <EmptyState 
        title="No verified active hazards detected"
        description="Absence of verified data does not guarantee absence of hazards. Stay alert."
        icon={<ShieldAlert size={48} className="text-muted" />}
      />
    </Card>
  );
};
