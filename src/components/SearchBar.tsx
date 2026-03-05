import { useRef, useEffect, useCallback } from 'react';
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
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (expanded) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [expanded]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
      triggerRef.current && !triggerRef.current.contains(e.target as Node)
    ) {
      onExpandedChange(false);
    }
  }, [onExpandedChange]);

  useEffect(() => {
    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [expanded, handleClickOutside]);

  const hasActiveFilter = !!(search || priorityFilter);

  return (
    <div className="search-popover-anchor">
      <button
        ref={triggerRef}
        className={`search-toggle has-tooltip ${hasActiveFilter ? 'has-filter' : ''}`}
        onClick={() => onExpandedChange(!expanded)}
        aria-label="Search & filter"
        data-tooltip="Search"
      >
        <Search size={16} />
      </button>

      {expanded && (
        <div ref={popoverRef} className="search-popover">
          <div className="search-popover-input-wrap">
            <Search size={15} className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="search-input"
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="search-popover-filters">
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
      )}
    </div>
  );
}
