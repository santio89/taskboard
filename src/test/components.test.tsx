import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { ColumnModal } from '../components/ColumnModal';
import { SettingsPopup } from '../components/SettingsPopup';
import { DatePickerPopover } from '../components/DatePickerPopover';
import { setLanguage } from '../utils/i18n';

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
        taskCount={0}
      />
    );
    expect(screen.getByLabelText('Search & filter')).toBeInTheDocument();
  });

  it('renders input and filter pills when expanded', () => {
    render(
      <SearchBar
        search=""
        onSearchChange={() => {}}
        priorityFilter=""
        onPriorityFilterChange={() => {}}
        expanded={true}
        onExpandedChange={() => {}}
        taskCount={0}
      />
    );
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Result: 0 tasks')).toBeInTheDocument();
  });

  it('calls onPriorityFilterChange when pill is clicked', () => {
    const onChange = vi.fn();
    render(
      <SearchBar
        search=""
        onSearchChange={() => {}}
        priorityFilter=""
        onPriorityFilterChange={onChange}
        expanded={true}
        onExpandedChange={() => {}}
        taskCount={0}
      />
    );
    fireEvent.click(screen.getByText('High'));
    expect(onChange).toHaveBeenCalledWith('high');
  });

  it('toggles expanded when toggle is clicked', () => {
    const onExpand = vi.fn();
    render(
      <SearchBar
        search=""
        onSearchChange={() => {}}
        priorityFilter=""
        onPriorityFilterChange={() => {}}
        expanded={false}
        onExpandedChange={onExpand}
        taskCount={0}
      />
    );
    fireEvent.click(screen.getByLabelText('Search & filter'));
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

describe('SettingsPopup', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  const defaultProps = {
    settings: { language: 'en' as const, animationsEnabled: true },
    theme: 'dark' as const,
    onUpdate: vi.fn(),
    onThemeChange: vi.fn(),
  };

  it('renders all setting rows', () => {
    render(<SettingsPopup {...defaultProps} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Animations')).toBeInTheDocument();
  });

  it('shows Dark as active when theme is dark', () => {
    render(<SettingsPopup {...defaultProps} />);
    const darkBtn = screen.getByText('Dark');
    expect(darkBtn.className).toContain('active');
    const lightBtn = screen.getByText('Light');
    expect(lightBtn.className).not.toContain('active');
  });

  it('shows Light as active when theme is light', () => {
    render(<SettingsPopup {...defaultProps} theme="light" />);
    const lightBtn = screen.getByText('Light');
    expect(lightBtn.className).toContain('active');
  });

  it('calls onThemeChange when theme button is clicked', () => {
    const onThemeChange = vi.fn();
    render(<SettingsPopup {...defaultProps} onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByText('Light'));
    expect(onThemeChange).toHaveBeenCalledWith('light');
  });

  it('shows English as active by default', () => {
    render(<SettingsPopup {...defaultProps} />);
    const enBtn = screen.getByText('English');
    expect(enBtn.className).toContain('active');
  });

  it('calls onUpdate when language button is clicked', () => {
    const onUpdate = vi.fn();
    render(<SettingsPopup {...defaultProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText('Español'));
    expect(onUpdate).toHaveBeenCalledWith({ language: 'es' });
  });

  it('shows Enabled as active when animations are on', () => {
    render(<SettingsPopup {...defaultProps} />);
    const enabledBtn = screen.getByText('Enabled');
    expect(enabledBtn.className).toContain('active');
  });

  it('calls onUpdate when Disabled is clicked', () => {
    const onUpdate = vi.fn();
    render(<SettingsPopup {...defaultProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText('Disabled'));
    expect(onUpdate).toHaveBeenCalledWith({ animationsEnabled: false });
  });

  it('shows Disabled as active when animations are off', () => {
    render(
      <SettingsPopup
        {...defaultProps}
        settings={{ language: 'en', animationsEnabled: false }}
      />
    );
    const disabledBtn = screen.getByText('Disabled');
    expect(disabledBtn.className).toContain('active');
  });
});

describe('DatePickerPopover', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  it('renders trigger with placeholder when value is empty', () => {
    render(
      <DatePickerPopover value="" onChange={() => {}} placeholder="Pick date" />
    );
    expect(screen.getByText('Pick date')).toBeInTheDocument();
  });

  it('renders trigger with formatted date when value is set', () => {
    render(
      <DatePickerPopover value="2026-03-15" onChange={() => {}} />
    );
    expect(screen.getByText(/Mar 15, 2026/)).toBeInTheDocument();
  });

  it('opens popover when trigger is clicked', async () => {
    render(
      <DatePickerPopover value="" onChange={() => {}} />
    );
    const trigger = screen.getByRole('button', { name: /pick a date/i });
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('shows title in popover when title prop is provided', async () => {
    render(
      <DatePickerPopover value="" onChange={() => {}} title="Start date" />
    );
    fireEvent.click(screen.getByRole('button', { name: /pick a date/i }));
    await waitFor(() => {
      expect(screen.getByText('Start date')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('calls onChange with empty string when Clear is clicked', async () => {
    const onChange = vi.fn();
    render(
      <DatePickerPopover value="2026-03-15" onChange={onChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /mar 15, 2026/i }));
    await waitFor(() => expect(screen.getByText('Clear')).toBeInTheDocument(), { timeout: 500 });
    fireEvent.click(screen.getByText('Clear'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('calls onChange with today date when Today is clicked', async () => {
    const onChange = vi.fn();
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    render(
      <DatePickerPopover value="" onChange={onChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /pick a date/i }));
    await waitFor(() => expect(screen.getByText('Today')).toBeInTheDocument(), { timeout: 500 });
    fireEvent.click(screen.getByText('Today'));
    expect(onChange).toHaveBeenCalledWith(expected);
  });
});
