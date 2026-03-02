import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { Priority } from '../types';

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: Priority | '';
  onPriorityFilterChange: (value: Priority | '') => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export function SearchBar({ search, onSearchChange, priorityFilter, onPriorityFilterChange, expanded, onExpandedChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  const handleCollapse = () => {
    if (!search) {
      onExpandedChange(false);
    }
  };

  return (
    <div className={`search-bar ${expanded ? 'expanded' : ''}`}>
      <button
        className={`search-toggle has-tooltip ${search || priorityFilter ? 'has-filter' : ''} ${expanded ? 'search-toggle-hidden' : ''}`}
        onClick={() => onExpandedChange(true)}
        aria-label="Open search"
        data-tooltip="Search"
        tabIndex={expanded ? -1 : 0}
      >
        <Search size={16} />
      </button>
      <div className={`search-input-wrap ${expanded ? 'search-input-visible' : ''}`}>
        <Search size={15} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onBlur={handleCollapse}
          placeholder="Search tasks..."
          className="search-input"
          tabIndex={expanded ? 0 : -1}
        />
        <button
          className="search-clear"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onSearchChange(''); onExpandedChange(false); }}
          aria-label="Close search"
          tabIndex={expanded ? 0 : -1}
        >
          <X size={14} />
        </button>
      </div>
      <div className="filter-pills">
        {(['', 'high', 'medium', 'low'] as const).map((p) => (
          <button
            key={p}
            className={`filter-pill ${priorityFilter === p ? 'active' : ''}`}
            onClick={() => onPriorityFilterChange(p)}
          >
            {p === '' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
