// frontend/src/components/widgets/CustomWidgetRenderer.tsx
import React from 'react';
import { ICustomWidgetElement, CustomWidgetProps } from '@/types/widgets'; // Adjust import path
import DropdownWidget from './DropdownWidget';
// Import other specific widget components here as they are created

interface CustomWidgetRendererProps {
  element: ICustomWidgetElement; // The full element data
  value?: string | number | boolean | string[]; // Current value for this widget
  onChange: (widgetId: string, value: any) => void; // Callback to update value in MessageComposer
}

const CustomWidgetRenderer: React.FC<CustomWidgetRendererProps> = ({ element, value, onChange }) => {
  const widgetProps = element.props;

  // Determine which specific widget component to render based on widgetProps.widgetType
  switch (widgetProps.widgetType) {
    case 'dropdown':
      return (
        <DropdownWidget
          widget={widgetProps}
          value={value as string | undefined} // Cast value appropriately
          onChange={(newValue) => onChange(widgetProps.id, newValue)}
        />
      );
    // Add cases for other widget types here
    // case 'textinput':
    //   return <TextInputWidget ... />;
    default:
      console.warn('Unknown widget type:', widgetProps.widgetType);
      return null; // Or some fallback UI
  }
};

export default CustomWidgetRenderer;
