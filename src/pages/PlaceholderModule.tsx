import React from 'react';
import { useLocation } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { HardHat } from 'lucide-react';

const PlaceholderModule: React.FC = () => {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPath = pathParts.length > 1 ? pathParts[1] : 'Module';
  
  const titleName = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);
  
  return (
    <div style={{ height: '100%', padding: 'var(--spacing-xl)' }}>
      <EmptyState 
        title={`${titleName} coming in next development phase`}
        description="This module is currently under construction and will be deployed in Phase 2."
        icon={<HardHat size={48} className="text-muted" />}
      />
    </div>
  );
};

export default PlaceholderModule;
