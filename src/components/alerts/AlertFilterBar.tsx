import React from 'react';
import { Search } from 'lucide-react';
import type { AlertSeverity, AlertType } from '../../types/alert';

export type TimeFilter = 'All' | 'Last hour' | 'Last 24 hours' | 'Last 7 days';
export type SortOption = 'Latest' | 'Highest Severity' | 'Nearest';

interface AlertFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  severityFilter: AlertSeverity | 'All';
  setSeverityFilter: (severity: AlertSeverity | 'All') => void;
  typeFilter: AlertType | 'All';
  setTypeFilter: (type: AlertType | 'All') => void;
  timeFilter: TimeFilter;
  setTimeFilter: (time: TimeFilter) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  onReset: () => void;
}

export const AlertFilterBar: React.FC<AlertFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  severityFilter,
  setSeverityFilter,
  typeFilter,
  setTypeFilter,
  timeFilter,
  setTimeFilter,
  sortOption,
  setSortOption,
  onReset
}) => {
  return (
    <div className="alert-filter-bar">
      {/* Search */}
      <div className="filter-search-container">
        <Search size={16} className="filter-search-icon" />
        <input 
          type="text" 
          placeholder="Search alerts by location or hazard..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="filter-search-input"
        />
      </div>

      <div className="filter-selects">
        {/* Severity */}
        <select 
          value={severityFilter} 
          onChange={(e) => setSeverityFilter(e.target.value as any)}
          className="filter-select"
        >
          <option value="All">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="Warning">Warning</option>
          <option value="Advisory">Advisory</option>
          <option value="Resolved">Resolved</option>
        </select>

        {/* Hazard Type */}
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="filter-select"
        >
          <option value="All">All Disaster Types</option>
          <option value="Flood">Flood</option>
          <option value="Earthquake">Earthquake</option>
          <option value="Extreme Weather">Extreme Weather</option>
          <option value="Cyclone">Cyclone</option>
        </select>

        {/* Time Filter */}
        <select 
          value={timeFilter} 
          onChange={(e) => setTimeFilter(e.target.value as any)}
          className="filter-select"
        >
          <option value="All">All Time</option>
          <option value="Last hour">Last hour</option>
          <option value="Last 24 hours">Last 24 hours</option>
          <option value="Last 7 days">Last 7 days</option>
        </select>

        {/* Sort */}
        <select 
          value={sortOption} 
          onChange={(e) => setSortOption(e.target.value as any)}
          className="filter-select"
        >
          <option value="Latest">Latest</option>
          <option value="Highest Severity">Highest Severity</option>
          <option value="Nearest">Nearest</option>
        </select>

        {/* Clear */}
        <button 
          onClick={onReset}
          className="filter-clear-btn"
          aria-label="Clear all filters"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
