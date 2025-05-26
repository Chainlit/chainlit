// frontend/src/components/widgets/DropdownWidget.tsx
import React from 'react';
import { IDropdownWidgetProps } from '@/types/widgets'; // Adjust import path if needed
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming these are ShadCN UI components
import { Label } from '@/components/ui/label'; // Assuming ShadCN UI

interface DropdownWidgetComponentProps {
  widget: IDropdownWidgetProps;
  value?: string;
  onChange: (value: string) => void;
}

const DropdownWidget: React.FC<DropdownWidgetComponentProps> = ({ widget, value, onChange }) => {
  return (
    <div className="flex flex-col space-y-1.5" id={`container-${widget.id}`}>
      {widget.label && <Label htmlFor={widget.id}>{widget.label}</Label>}
      <Select value={value || widget.initialValue} onValueChange={onChange}>
        <SelectTrigger id={widget.id}>
          <SelectValue placeholder={widget.label || 'Select an option'} />
        </SelectTrigger>
        <SelectContent>
          {widget.options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DropdownWidget;
