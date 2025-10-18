import { cn } from '@/lib/utils';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { useRecoilValue } from 'recoil';

import { ICommand, commandsState, useChatData } from '@chainlit/react-client';

import AutoResizeTextarea from '@/components/AutoResizeTextarea';
import Icon from '@/components/Icon';
import {
  Command,
  CommandGroup,
  CommandItemAnimated,
  CommandListScrollable
} from '@/components/ui/command';

import { useCommandNavigation } from '@/hooks/useCommandNavigation';

interface Props {
  id?: string;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  selectedCommand?: ICommand;
  setSelectedCommand: (command: ICommand | undefined) => void;
  selectedSetting?: any;
  setSelectedSetting: (setting: any | undefined) => void;
  onChange: (value: string) => void;
  onPaste?: (event: any) => void;
  onEnter?: () => void;
}

export interface InputMethods {
  reset: () => void;
}

const Input = forwardRef<InputMethods, Props>(
  (
    {
      placeholder,
      id,
      className,
      autoFocus,
      selectedCommand,
      setSelectedCommand,
      setSelectedSetting,
      onChange,
      onEnter,
      onPaste
    },
    ref
  ) => {
    const commands = useRecoilValue(commandsState);
    const { chatSettingsInputs } = useChatData();
    const [isComposing, setIsComposing] = useState(false);
    const [showCommands, setShowCommands] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSettingValues, setShowSettingValues] = useState(false);
    const [commandInput, setCommandInput] = useState('');
    const [settingInput, setSettingInput] = useState('');
    const [settingValueInput, setSettingValueInput] = useState('');
    const [tempSelectedSetting, setTempSelectedSetting] =
      useState<any>(undefined);
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const normalizedInput = commandInput.toLowerCase().slice(1);

    const filteredCommands = commands
      .filter((command) => command.id.toLowerCase().includes(normalizedInput))
      .sort((a, b) => {
        const indexA = a.id.toLowerCase().indexOf(normalizedInput);
        const indexB = b.id.toLowerCase().indexOf(normalizedInput);
        return indexA - indexB;
      });

    const normalizedSettingInput = settingInput.toLowerCase().slice(1);

    const filteredSettings = chatSettingsInputs
      .filter((setting: any) => {
        // Only show settings that have items/values (like Select)
        const hasValues = setting.items && setting.items.length > 0;
        const matchesSearch = setting.id
          .toLowerCase()
          .includes(normalizedSettingInput);

        return hasValues && matchesSearch;
      })
      .sort((a: any, b: any) => {
        const indexA = a.id.toLowerCase().indexOf(normalizedSettingInput);
        const indexB = b.id.toLowerCase().indexOf(normalizedSettingInput);
        return indexA - indexB;
      });

    const normalizedSettingValueInput = settingValueInput
      .toLowerCase()
      .slice(1);

    const filteredSettingValues = tempSelectedSetting?.items
      ? tempSelectedSetting.items
          .filter(
            (item: any) =>
              item.label.toLowerCase().includes(normalizedSettingValueInput) ||
              item.value.toLowerCase().includes(normalizedSettingValueInput)
          )
          .sort((a: any, b: any) => {
            const indexA = a.label
              .toLowerCase()
              .indexOf(normalizedSettingValueInput);
            const indexB = b.label
              .toLowerCase()
              .indexOf(normalizedSettingValueInput);
            return indexA - indexB;
          })
      : [];

    const {
      selectedIndex: commandSelectedIndex,
      handleMouseMove: commandHandleMouseMove,
      handleMouseLeave: commandHandleMouseLeave,
      handleKeyDown: commandNavigationKeyDown
    } = useCommandNavigation({
      items: filteredCommands,
      isOpen: showCommands,
      onSelect: (command) => {
        handleCommandSelect(command);
      },
      onClose: () => {
        setShowCommands(false);
        setCommandInput('');
      }
    });

    const {
      selectedIndex: settingSelectedIndex,
      handleMouseMove: settingHandleMouseMove,
      handleMouseLeave: settingHandleMouseLeave,
      handleKeyDown: settingNavigationKeyDown
    } = useCommandNavigation({
      items: filteredSettings,
      isOpen: showSettings,
      onSelect: (setting) => {
        handleSettingSelect(setting);
      },
      onClose: () => {
        setShowSettings(false);
        setSettingInput('');
      }
    });

    const {
      selectedIndex: settingValueSelectedIndex,
      handleMouseMove: settingValueHandleMouseMove,
      handleMouseLeave: settingValueHandleMouseLeave,
      handleKeyDown: settingValueNavigationKeyDown
    } = useCommandNavigation({
      items: filteredSettingValues,
      isOpen: showSettingValues,
      onSelect: (valueItem) => {
        handleSettingValueSelect(valueItem);
      },
      onClose: () => {
        setShowSettingValues(false);
        setSettingValueInput('');
        setTempSelectedSetting(undefined);
      }
    });

    const reset = () => {
      setValue('');
      if (!selectedCommand?.persistent) {
        setSelectedCommand(undefined);
      }
      setSelectedSetting(undefined);
      setTempSelectedSetting(undefined);
      setCommandInput('');
      setSettingInput('');
      setSettingValueInput('');
      setShowCommands(false);
      setShowSettings(false);
      setShowSettingValues(false);
      onChange('');
    };

    useImperativeHandle(ref, () => ({
      reset
    }));

    useEffect(() => {
      if (textareaRef.current && autoFocus) {
        textareaRef.current.focus();
      }
    }, [autoFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onChange(newValue);

      // Command detection for dropdown
      const words = newValue.split(' ');
      const firstWord = words[0];

      if (words.length === 1 && firstWord.startsWith('/')) {
        setShowCommands(true);
        setShowSettings(false);
        setShowSettingValues(false);
        setCommandInput(firstWord);
        setSettingInput('');
        setSettingValueInput('');
      } else if (words.length === 1 && firstWord.startsWith('@')) {
        // Check if it's @setting/value pattern
        const parts = firstWord.split('/');

        if (parts.length === 1) {
          // Just @setting - check how many settings have values
          const settingsWithValues = chatSettingsInputs.filter(
            (setting: any) => setting.items && setting.items.length > 0
          );

          if (settingsWithValues.length === 1) {
            // Only one setting with values - skip to showing values directly
            const singleSetting = settingsWithValues[0];
            setTempSelectedSetting(singleSetting);
            setShowSettingValues(true);
            setShowSettings(false);
            setShowCommands(false);
            setSettingInput('');
            setCommandInput('');
            setSettingValueInput(firstWord);
          } else {
            // Multiple settings - show settings dropdown
            setShowSettings(true);
            setShowCommands(false);
            setShowSettingValues(false);
            setSettingInput(firstWord);
            setCommandInput('');
            setSettingValueInput('');
            setTempSelectedSetting(undefined);
          }
        } else if (parts.length === 2) {
          // @setting/value - show values dropdown
          const settingPart = parts[0];
          const valuePart = parts[1];
          const setting = chatSettingsInputs.find(
            (s: any) =>
              s.id.toLowerCase() === settingPart.slice(1).toLowerCase()
          );

          if (setting && setting.items && setting.items.length > 0) {
            setTempSelectedSetting(setting);
            setShowSettingValues(true);
            setShowSettings(false);
            setShowCommands(false);
            setSettingInput('');
            setCommandInput('');
            setSettingValueInput('/' + valuePart);
          }
        }
      } else {
        setShowCommands(false);
        setShowSettings(false);
        setShowSettingValues(false);
        setCommandInput('');
        setSettingInput('');
        setSettingValueInput('');
      }
    };

    const handleCommandSelect = (command: ICommand) => {
      setShowCommands(false);
      setSelectedCommand(command);

      // Remove the command text from the input
      const newValue = value.replace(commandInput, '').trimStart();
      setValue(newValue);
      onChange(newValue);

      setCommandInput('');

      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    };

    const handleSettingSelect = (setting: any) => {
      setShowSettings(false);

      // Check if setting has values/items to select from
      if (setting.items && setting.items.length > 0) {
        // Setting has values - show value selection by adding /
        setTempSelectedSetting(setting);
        const newValue = `@${setting.id}/`;
        setValue(newValue);
        onChange(newValue);
        setSettingInput('');
        setSettingValueInput('/');
        setShowSettingValues(true);

        // Focus back on textarea
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      } else {
        // Setting has no values - use default/initial value
        setSelectedSetting({
          ...setting,
          selectedValue: setting.initial
        });

        // Remove the setting text from the input
        const newValue = value.replace(settingInput, '').trimStart();
        setValue(newValue);
        onChange(newValue);

        setSettingInput('');

        // Focus back on textarea
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    };

    const handleSettingValueSelect = (valueItem: any) => {
      if (!tempSelectedSetting) return;

      setShowSettingValues(false);
      setSelectedSetting({
        ...tempSelectedSetting,
        selectedValue: valueItem.value,
        selectedLabel: valueItem.label
      });

      setValue('');
      onChange('');

      setSettingValueInput('');
      setTempSelectedSetting(undefined);

      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle command selection - check this FIRST before other key handling
      if (showCommands && filteredCommands.length > 0) {
        commandNavigationKeyDown(e);
        // If the navigation handled the key, don't process further
        if (e.defaultPrevented) {
          return;
        }
      }

      // Handle setting selection
      if (showSettings && filteredSettings.length > 0) {
        settingNavigationKeyDown(e);
        if (e.defaultPrevented) {
          return;
        }
      }

      // Handle setting value selection
      if (showSettingValues && filteredSettingValues.length > 0) {
        settingValueNavigationKeyDown(e);
        if (e.defaultPrevented) {
          return;
        }
      }

      // Handle regular enter only if no menu is showing
      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        onEnter &&
        !isComposing &&
        !showCommands &&
        !showSettings &&
        !showSettingValues
      ) {
        e.preventDefault();
        onEnter();
      }
    };

    return (
      <div className="relative w-full">
        <AutoResizeTextarea
          ref={textareaRef}
          id={id}
          autoFocus={autoFocus}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={onPaste}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          className={cn(
            'w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none',
            className
          )}
          maxHeight={250}
        />

        {showCommands && filteredCommands.length > 0 && (
          <div
            className="absolute z-50 left-0 bottom-full mb-3 animate-slide-up"
            onMouseLeave={commandHandleMouseLeave}
          >
            <Command className="rounded-lg border shadow-md bg-background">
              <CommandListScrollable maxItems={5} className="custom-scrollbar">
                <CommandGroup className="p-2">
                  {filteredCommands.map((command, index) => (
                    <CommandItemAnimated
                      key={command.id}
                      index={index}
                      isSelected={index === commandSelectedIndex}
                      onMouseMove={() => commandHandleMouseMove(index)}
                      onSelect={() => handleCommandSelect(command)}
                      className="command-item space-x-2"
                    >
                      <Icon
                        name={command.icon}
                        className={cn(
                          '!size-5 text-muted-foreground transition-transform duration-150',
                          index === commandSelectedIndex && 'scale-110'
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{command.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {command.description}
                        </div>
                      </div>
                    </CommandItemAnimated>
                  ))}
                </CommandGroup>
              </CommandListScrollable>
            </Command>
          </div>
        )}

        {showSettings && filteredSettings.length > 0 && (
          <div
            className="absolute z-50 left-0 bottom-full mb-3 animate-slide-up"
            onMouseLeave={settingHandleMouseLeave}
          >
            <Command className="rounded-lg border shadow-md bg-background">
              <CommandListScrollable maxItems={5} className="custom-scrollbar">
                <CommandGroup className="p-2">
                  {filteredSettings.map((setting: any, index: number) => (
                    <CommandItemAnimated
                      key={setting.id}
                      index={index}
                      isSelected={index === settingSelectedIndex}
                      onMouseMove={() => settingHandleMouseMove(index)}
                      onSelect={() => handleSettingSelect(setting)}
                      className="command-item space-x-2"
                    >
                      <Icon
                        name="settings"
                        className={cn(
                          '!size-5 text-muted-foreground transition-transform duration-150',
                          index === settingSelectedIndex && 'scale-110'
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {setting.label || setting.id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {setting.description ||
                            setting.tooltip ||
                            'Chat setting'}
                          {setting.items && setting.items.length > 0 && (
                            <span className="ml-1 text-xs">
                              ({setting.items.length} values)
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItemAnimated>
                  ))}
                </CommandGroup>
              </CommandListScrollable>
            </Command>
          </div>
        )}

        {showSettingValues && filteredSettingValues.length > 0 && (
          <div
            className="absolute z-50 left-0 bottom-full mb-3 animate-slide-up"
            onMouseLeave={settingValueHandleMouseLeave}
          >
            <Command className="rounded-lg border shadow-md bg-background">
              <CommandListScrollable maxItems={5} className="custom-scrollbar">
                <CommandGroup className="p-2">
                  <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
                    Select value for:{' '}
                    <span className="font-medium">
                      {tempSelectedSetting?.label || tempSelectedSetting?.id}
                    </span>
                  </div>
                  {filteredSettingValues.map((item: any, index: number) => (
                    <CommandItemAnimated
                      key={item.value}
                      index={index}
                      isSelected={index === settingValueSelectedIndex}
                      onMouseMove={() => settingValueHandleMouseMove(index)}
                      onSelect={() => handleSettingValueSelect(item)}
                      className="command-item space-x-2"
                    >
                      <Icon
                        name="chevron-right"
                        className={cn(
                          '!size-4 text-muted-foreground transition-transform duration-150',
                          index === settingValueSelectedIndex && 'scale-110'
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.label !== item.value && (
                          <div className="text-xs text-muted-foreground">
                            {item.value}
                          </div>
                        )}
                      </div>
                    </CommandItemAnimated>
                  ))}
                </CommandGroup>
              </CommandListScrollable>
            </Command>
          </div>
        )}
      </div>
    );
  }
);

export default Input;
