import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CustomWidgetRenderer from './CustomWidgetRenderer'; // Adjust path as necessary
import { ICustomWidgetElement, IDropdownWidgetProps } from '@/types/widgets'; // Adjust path

// Mock specific widget components that CustomWidgetRenderer might render
vi.mock('./DropdownWidget', () => ({
  // Default export: the DropdownWidget component
  default: vi.fn(({ widget, value, onChange }) => (
    <div data-testid="dropdown-widget-mock">
      <span data-testid="dropdown-widget-id-prop">{widget.id}</span>
      <span data-testid="dropdown-widget-value-prop">{value}</span>
      <button onClick={() => onChange('new-value-from-dropdown')}>Change</button>
    </div>
  ))
}));

// Mock for another potential widget type for future-proofing tests
// vi.mock('./TextInputWidget', () => ({
//   default: vi.fn(({ widget, value, onChange }) => (
//     <div data-testid="textinput-widget-mock">
//       <span>{widget.label}</span>
//       <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
//     </div>
//   ))
// }));

const mockDropdownElement: ICustomWidgetElement = {
  id: 'element-uuid-1', // Main element ID
  type: 'custom',
  name: 'model_selection_dropdown_element',
  display: 'inline',
  forId: 'COMPOSER_WIDGET',
  props: {
    widgetType: 'dropdown',
    label: 'Select Model',
    id: 'model_dropdown_widget', // HTML ID for the widget itself
    options: [{ value: 'gpt-4', label: 'GPT-4' }],
    initialValue: 'gpt-4',
  } as IDropdownWidgetProps,
};

// Example for a different widget type, if it existed
// const mockTextInputElement: ICustomWidgetElement = {
//   id: 'element-uuid-2',
//   type: 'custom',
//   name: 'user_name_input_element',
//   display: 'inline',
//   forId: 'COMPOSER_WIDGET',
//   props: {
//     widgetType: 'textinput', // Assuming a text input type
//     label: 'Enter Name',
//     id: 'name_text_input_widget',
//     initialValue: 'Test User',
//   } // as ITextInputWidgetProps, (if defined)
// };

describe('CustomWidgetRenderer', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mock call counts before each test
  });

  it('renders DropdownWidget for widgetType "dropdown"', () => {
    render(
      <CustomWidgetRenderer
        element={mockDropdownElement}
        value="gpt-4"
        onChange={mockOnChange}
      />
    );

    const dropdownMock = screen.getByTestId('dropdown-widget-mock');
    expect(dropdownMock).toBeInTheDocument();

    // Verify props passed to the mocked DropdownWidget
    // Access the mocked component itself to check its props
    const DropdownWidgetMock = await vi.importActual('./DropdownWidget').then(mod => mod.default) as any;

    expect(DropdownWidgetMock).toHaveBeenCalledTimes(1);
    const callArgs = DropdownWidgetMock.mock.calls[0][0];
    expect(callArgs.widget).toEqual(mockDropdownElement.props); // Check if the 'widget' prop (which is element.props) is correct
    expect(callArgs.value).toBe('gpt-4'); // Check if the 'value' prop is correct
    expect(callArgs.onChange).toBeInstanceOf(Function); // Check if 'onChange' is a function

    // Simulate the onChange call from the mocked DropdownWidget
    const changeButton = screen.getByRole('button', { name: 'Change' });
    fireEvent.click(changeButton);
    expect(mockOnChange).toHaveBeenCalledWith(mockDropdownElement.props.id, 'new-value-from-dropdown');
  });

  it('renders nothing and warns for unknown widgetType', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn output

    const unknownWidgetElement: ICustomWidgetElement = {
      ...mockDropdownElement,
      props: {
        ...mockDropdownElement.props,
        widgetType: 'unknownwidget' as any, // Force an unknown type
      },
    };

    const { container } = render(
      <CustomWidgetRenderer
        element={unknownWidgetElement}
        value="test"
        onChange={mockOnChange}
      />
    );

    expect(container.firstChild).toBeNull(); // Should render nothing
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown widget type:', 'unknownwidget');
    
    consoleWarnSpy.mockRestore();
  });

  // Add more tests if other widget types are implemented
  // it('renders TextInputWidget for widgetType "textinput"', () => {
  //   render(
  //     <CustomWidgetRenderer
  //       element={mockTextInputElement}
  //       value="Test User"
  //       onChange={mockOnChange}
  //     />
  //   );
  //   expect(screen.getByTestId('textinput-widget-mock')).toBeInTheDocument();
  //   // ... further assertions for TextInputWidget props
  // });
});
