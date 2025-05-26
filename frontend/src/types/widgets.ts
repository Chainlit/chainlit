export interface IDropdownOption {
  value: string;
  label: string;
}

export interface IDropdownWidgetProps {
  widgetType: 'dropdown'; // Literal type
  label: string;
  options: IDropdownOption[];
  initialValue?: string;
  id: string; // HTML element ID
}

// Interface for the CustomElement props that will hold our widget data
// We might need a more generic way if there are many widget types,
// but for now, a union type can work.
export type CustomWidgetProps = IDropdownWidgetProps; // Add other types like | ITextInputWidgetProps later

// Interface for the CustomElement as received from backend, with typed props
// This should align with what `CustomElement.to_dict()` produces plus our typed props.
// Refer to `frontend/src/types/index.ts` for `IElement` or similar existing types.
// We need to ensure the 'props' field of the incoming element data is correctly typed.
export interface ICustomWidgetElement {
   id: string; // This is the main element ID (UUID)
   type: 'custom';
   name: string;
   display: 'inline' | 'side' | 'page'; // Adjust as per actual ElementDisplay type
   forId?: string; // Should be "COMPOSER_WIDGET"
   props: CustomWidgetProps;
   // Add any other relevant fields from the base ElementDict/IElement type
   // Based on IElement in frontend/src/types/index.ts:
   language?: string;
   url?: string; // If applicable for some custom elements
   size?: 'small' | 'medium' | 'large'; // If applicable
   isLoading?: boolean; // If custom widgets can have loading states
}
