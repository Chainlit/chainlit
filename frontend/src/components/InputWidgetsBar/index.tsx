import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { useChatSession } from '@chainlit/react-client';
import { inputWidgetsState } from 'state/inputWidgets';
import { IInputWidget } from 'types/Input';
import WidgetSlider from './WidgetSlider';
import WidgetSelect from './WidgetSelect';
import WidgetSwitch from './WidgetSwitch';
import WidgetTextInput from './WidgetTextInput';
import WidgetNumberInput from './WidgetNumberInput';
// Import other widget components as they are created

const InputWidgetsBar = () => {
  const [widgets, setWidgets] = useRecoilState(inputWidgetsState);
  const { session } = useChatSession();

  useEffect(() => {
    if (!session?.socket) return;

    const handleSetInputWidgets = (receivedWidgets: IInputWidget[]) => {
      console.log('Received set_input_widgets event with:', receivedWidgets);
      setWidgets(receivedWidgets);
    };

    session.socket.on('set_input_widgets', handleSetInputWidgets);

    return () => {
      session.socket.off('set_input_widgets', handleSetInputWidgets);
    };
  }, [session?.socket, setWidgets]);

  if (!widgets.length) {
    return null;
  }

  return (
    <div
      id="input-widgets-bar"
      className="input-widgets-bar flex items-center gap-1 overflow-x-auto flex-shrink-0"
    >
      {widgets.map((widget) => (
        <div key={widget.id} className="input-widget-item flex items-center flex-shrink-0 gap-1">
          <label htmlFor={widget.id} title={widget.tooltip || widget.label} className="text-xs whitespace-nowrap cursor-default font-medium text-muted-foreground">
            {widget.label}
          </label>
          {widget.type === 'slider' && <WidgetSlider {...widget} />}
          {widget.type === 'select' && <WidgetSelect {...widget} items={widget.items || []} />}
          {widget.type === 'switch' && <WidgetSwitch {...widget} />}
          {widget.type === 'textinput' && <WidgetTextInput {...widget} />}
          {widget.type === 'numberinput' && <WidgetNumberInput {...widget} />}
          
          {/* Fallback for unsupported types */}
          {!['slider', 'select', 'switch', 'textinput', 'numberinput'].includes(widget.type) && (
            <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 p-1 rounded">
              (Unsupported type: {widget.type})
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default InputWidgetsBar;
