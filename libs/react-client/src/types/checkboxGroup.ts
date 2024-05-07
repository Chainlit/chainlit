export interface ICheckboxOption {
  label: string;
  name: string;
  value: string;
}

export interface ICheckboxGroup {
  description?: string;
  forId: string;
  // onClick: () => void;
  value: string;
  options: ICheckboxOption[];
}