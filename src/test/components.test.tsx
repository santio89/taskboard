import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { ColumnModal } from '../components/ColumnModal';

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={false}
        title="Delete"
        message="Sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message when open', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Task"
        message="Are you sure you want to delete?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Delete Task')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Sure?"
        confirmLabel="Yes, Delete"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByText('Yes, Delete'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Sure?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe('SearchBar', () => {
  it('renders search toggle when collapsed', () => {
    render(
      <SearchBar
        search=""
        onSearchChange={() => {}}
        priorityFilter=""
        onPriorityFilterChange={() => {}}
        expanded={false}
        onExpandedChange={() => {}}
      />
    );
    expect(screen.getByLabelText('Open search')).toBeInTheDocument();
  });

  it('renders input when expanded', () => {
    render(
      <SearchBar
        search=""
        onSearchChange={() => {}}
        priorityFilter=""
        onPriorityFilterChange={() => {}}
        expanded={true}
        onExpandedChange={() => {}}
      />
    );
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
  });

  it('renders filter pills', () => {
    render(
      <SearchBar
        search=""
        onSearchChange={() => {}}
        priorityFilter=""
        onPriorityFilterChange={() => {}}
        expanded={false}
        onExpandedChange={() => {}}
      />
    );
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('calls onPriorityFilterChange when pill is clicked', () => {
    const onChange = vi.fn();
    render(
      <SearchBar
        search=""
        onSearchChange={() => {}}
        priorityFilter=""
        onPriorityFilterChange={onChange}
        expanded={false}
        onExpandedChange={() => {}}
      />
    );
    fireEvent.click(screen.getByText('High'));
    expect(onChange).toHaveBeenCalledWith('high');
  });

  it('calls onExpandedChange when toggle is clicked', () => {
    const onExpand = vi.fn();
    render(
      <SearchBar
        search=""
        onSearchChange={() => {}}
        priorityFilter=""
        onPriorityFilterChange={() => {}}
        expanded={false}
        onExpandedChange={onExpand}
      />
    );
    fireEvent.click(screen.getByLabelText('Open search'));
    expect(onExpand).toHaveBeenCalledWith(true);
  });
});

describe('ColumnModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ColumnModal
        isOpen={false}
        column={null}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders form when open', () => {
    render(
      <ColumnModal
        isOpen={true}
        column={null}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('New Column')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('shows "Edit Column" when editing', () => {
    render(
      <ColumnModal
        isOpen={true}
        column={{ id: '1', title: 'Existing', color: '#ff0000' }}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Edit Column')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing')).toBeInTheDocument();
  });

  it('shows validation error for empty title', () => {
    render(
      <ColumnModal
        isOpen={true}
        column={null}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByText('Add Column'));
    expect(screen.getByText('Column name is required')).toBeInTheDocument();
  });

  it('calls onSave with title and color', () => {
    const onSave = vi.fn();
    render(
      <ColumnModal
        isOpen={true}
        column={null}
        onSave={onSave}
        onClose={() => {}}
      />
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Column' } });
    fireEvent.click(screen.getByText('Add Column'));
    expect(onSave).toHaveBeenCalledWith('My Column', expect.any(String));
  });
});
