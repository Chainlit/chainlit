import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import DropdownWidget from './DropdownWidget'; // Adjust path as necessary
import { IDropdownWidgetProps } from '@/types/widgets'; // Adjust path as necessary

// Mock ShadCN UI components used by DropdownWidget
// Vitest automatically mocks CSS module imports, but actual components might need manual mocks
// if they cause issues in the JSDOM environment or are complex.
// For basic rendering tests, often direct imports work if components are simple enough.
// If using Radix primitives directly, they might need specific test setups.

// Mock Label and Select components
vi.mock('@/components/ui/label', () => ({
  Label: ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <label htmlFor={htmlFor}>{children}</label>
  )
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode, value?: string, onValueChange?: (value: string) => void }) => (
    <select data-testid="select-trigger" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children, id }: { children: React.ReactNode, id: string }) => <div data-testid={id}>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span data-testid="select-value">{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option data-testid={`select-item-${value}`} value={value}>{children}</option>
  )
}));


const mockDropdownWidgetProps: IDropdownWidgetProps = {
  widgetType: 'dropdown',
  label: 'Test Model',
  options: [
    { value: 'gpt-3.5', label: 'GPT-3.5' },
    { value: 'gpt-4', label: 'GPT-4' },
  ],
  initialValue: 'gpt-3.5',
  id: 'test-model-dropdown',
};

describe('DropdownWidget', () => {
  it('renders correctly with given props', () => {
    const handleChange = vi.fn();
    render(
      <DropdownWidget
        widget={mockDropdownWidgetProps}
        value={mockDropdownWidgetProps.initialValue}
        onChange={handleChange}
      />
    );

    // Check if the label is rendered
    expect(screen.getByText('Test Model')).toBeInTheDocument();

    // Check if the SelectTrigger (mocked as a div with test-id) is rendered
    // It contains the SelectValue, so we can check for its placeholder or initial value text
    const trigger = screen.getByTestId('test-model-dropdown');
    expect(trigger).toBeInTheDocument();
    
    // Check if the SelectValue (mocked as a span) displays the correct initial value or placeholder
    // Our mock for SelectValue uses its placeholder prop as its content.
    // The DropdownWidget passes widget.label or 'Select an option' to placeholder.
    // Let's check for the label as placeholder.
    expect(screen.getByTestId('select-value')).toHaveTextContent('Test Model');


    // To check options, we would typically need to "open" the dropdown.
    // In this mocked setup, SelectItems are rendered as <option> directly inside <select>.
    // So we can query for them directly.
    expect(screen.getByTestId('select-item-gpt-3.5')).toBeInTheDocument();
    expect(screen.getByTestId('select-item-gpt-3.5')).toHaveTextContent('GPT-3.5');
    expect(screen.getByTestId('select-item-gpt-4')).toBeInTheDocument();
    expect(screen.getByTestId('select-item-gpt-4')).toHaveTextContent('GPT-4');
  });

  it('calls onChange with the correct value when an option is selected', () => {
    const handleChange = vi.fn();
    render(
      <DropdownWidget
        widget={mockDropdownWidgetProps}
        value={mockDropdownWidgetProps.initialValue}
        onChange={handleChange}
      />
    );

    const selectTrigger = screen.getByTestId('select-trigger'); // Our mock Select is a <select>

    // Simulate changing the value of the select element
    fireEvent.change(selectTrigger, { target: { value: 'gpt-4' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('gpt-4');
  });

  it('renders with initialValue if provided and no current value', () => {
    const handleChange = vi.fn();
    render(
      <DropdownWidget
        widget={mockDropdownWidgetProps}
        // value is undefined, so initialValue should be used
        onChange={handleChange}
      />
    );
    const selectTrigger = screen.getByTestId('select-trigger') as HTMLSelectElement;
    expect(selectTrigger.value).toBe(mockDropdownWidgetProps.initialValue);
  });

  it('renders with current value even if initialValue is different', () => {
    const handleChange = vi.fn();
    render(
      <DropdownWidget
        widget={mockDropdownWidgetProps}
        value="gpt-4" // current value overrides initialValue
        onChange={handleChange}
      />
    );
    const selectTrigger = screen.getByTestId('select-trigger') as HTMLSelectElement;
    expect(selectTrigger.value).toBe('gpt-4');
  });
});
