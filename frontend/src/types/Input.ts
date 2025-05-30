export type InputWidgetType =
  | 'switch'
  | 'slider'
  | 'select'
  | 'textinput'
  | 'numberinput'
  | 'tags';

export interface IInputItem {
  label: string;
  value: string;
}

export interface IInputWidget {
  type: InputWidgetType;
  id: string;
  label: string;
  initial?: any;
  tooltip?: string;
  description?: string;
  // Slider specific
  min?: number;
  max?: number;
  step?: number;
  // Select specific
  items?: IInputItem[];
  // TextInput specific
  placeholder?: string;
  multiline?: boolean;
  // Tags specific
  // initial?: string[]; // Already covered by initial?: any;
}
