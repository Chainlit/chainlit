import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch'; // Adjust import if necessary
import { useChatSession } from '@chainlit/react-client';
import { IInputWidget } from 'types/Input';

interface WidgetSwitchProps extends IInputWidget {
  // type: 'switch' is implied
}

const WidgetSwitch = (widget: WidgetSwitchProps) => {
  const { session } = useChatSession();
  const [checked, setChecked] = useState<boolean>(!!widget.initial);

  useEffect(() => {
    setChecked(!!widget.initial);
  }, [widget.initial]);

  const handleCheckedChange = (newChecked: boolean) => {
    setChecked(newChecked);
    if (session?.socket) {
      console.log(`Emitting input_widget_change for ${widget.id}: ${newChecked}`);
      session.socket.emit('input_widget_change', { id: widget.id, value: newChecked });
    }
  };

  return (
    <Switch
      id={widget.id}
      name={widget.id}
      checked={checked}
      onCheckedChange={handleCheckedChange}
      aria-label={widget.label}
      className="scale-90"
    />
  );
};

export default WidgetSwitch;
