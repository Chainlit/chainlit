export interface ICheckboxGroupOption {
  label: string;
  name: string;
  value: string;
}

export interface ICheckboxGroup {
  description?: string;
  forId: string;
  value: string;
  options: ICheckboxGroupOption[];
  selected: ICheckboxGroupOption[];
}
