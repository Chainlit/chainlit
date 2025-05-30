import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input'; // Adjust import if necessary
import { Textarea } from '@/components/ui/textarea'; // For multiline
import { useChatSession } from '@chainlit/react-client';
import { IInputWidget } from 'types/Input';
import { Button } from '@/components/ui/button'; // Optional: for a submit button

interface WidgetTextInputProps extends IInputWidget {
  // type: 'textinput' is implied
  multiline?: boolean;
  placeholder?: string;
}

const WidgetTextInput = (widget: WidgetTextInputProps) => {
  const { session } = useChatSession();
  const [value, setValue] = useState<string>(widget.initial || '');

  useEffect(() => {
    setValue(widget.initial || '');
  }, [widget.initial]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  const handleSubmit = () => {
    if (session?.socket) {
      console.log(`Emitting input_widget_change for ${widget.id}: ${value}`);
      session.socket.emit('input_widget_change', { id: widget.id, value: value });
    }
  };
  
  // Debounce emit or emit on blur/enter? For now, using a submit button or on blur.
  const handleBlur = () => { // Removed _side_effects from here
    // Emit on blur
     if (session?.socket) {
      console.log(`Emitting input_widget_change (on blur) for ${widget.id}: ${value}`);
      session.socket.emit('input_widget_change', { id: widget.id, value: value });
    }
  }

  const commonProps = {
    id: widget.id,
    name: widget.id,
    value: value,
    onChange: handleChange,
    onBlur: handleBlur, // Emit on blur
    placeholder: widget.placeholder || widget.label,
    className: "text-xs h-7 px-2 py-0 min-w-[80px] max-w-[120px]",
    "aria-label": widget.label,
  };

  return widget.multiline ? (
    <Textarea {...commonProps} rows={2} className="text-xs p-2 min-w-[100px] max-w-[140px] h-14 resize-none" />
  ) : (
    <Input {...commonProps} type="text" />
  );
};

export default WidgetTextInput;
