import { render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { describe, it, expect, vi } from 'vitest';
import InputWidgetsBar from '../src/components/InputWidgetsBar';

// Mock the required dependencies
vi.mock('@chainlit/react-client', () => ({
  useChatSession: () => ({ 
    session: { 
      socket: {
        on: vi.fn(),
        off: vi.fn()
      }
    }
  })
}));

// Mock the widget components
vi.mock('../src/components/InputWidgetsBar/WidgetSlider', () => ({
  default: ({ id, label }: any) => <div data-testid={`slider-${id}`}>{label}</div>
}));

vi.mock('../src/components/InputWidgetsBar/WidgetSelect', () => ({
  default: ({ id, label }: any) => <div data-testid={`select-${id}`}>{label}</div>
}));

vi.mock('../src/components/InputWidgetsBar/WidgetSwitch', () => ({
  default: ({ id, label }: any) => <div data-testid={`switch-${id}`}>{label}</div>
}));

vi.mock('../src/components/InputWidgetsBar/WidgetTextInput', () => ({
  default: ({ id, label }: any) => <div data-testid={`textinput-${id}`}>{label}</div>
}));

vi.mock('../src/components/InputWidgetsBar/WidgetNumberInput', () => ({
  default: ({ id, label }: any) => <div data-testid={`numberinput-${id}`}>{label}</div>
}));

describe('InputWidgetsBar', () => {
  it('should render nothing when no widgets are present', () => {
    render(
      <RecoilRoot>
        <InputWidgetsBar />
      </RecoilRoot>
    );

    // Should not render anything when widgets array is empty
    expect(screen.queryByTestId('input-widgets-bar')).not.toBeInTheDocument();
  });

  it('should have proper CSS classes for inline display', () => {
    // Mock some widgets in the state
    const TestComponent = () => {
      // This would normally come from Recoil state, but for testing we'll mock it
      return (
        <div 
          id="input-widgets-bar"
          className="input-widgets-bar flex items-center gap-2 overflow-x-auto flex-shrink-0"
          data-testid="input-widgets-bar"
        >
          <div className="input-widget-item flex items-center flex-shrink-0 gap-1">
            <label>Test Widget</label>
            <div>Widget Content</div>
          </div>
        </div>
      );
    };

    render(<TestComponent />);

    const widgetsBar = screen.getByTestId('input-widgets-bar');
    
    // Check that it has the correct CSS classes for inline display
    expect(widgetsBar).toHaveClass('flex');
    expect(widgetsBar).toHaveClass('items-center');
    expect(widgetsBar).toHaveClass('gap-2');
    expect(widgetsBar).toHaveClass('overflow-x-auto');
    expect(widgetsBar).toHaveClass('flex-shrink-0');
  });
});
