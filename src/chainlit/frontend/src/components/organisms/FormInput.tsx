import Switch, { SwitchProps } from 'components/atoms/switch';

import { IInput } from 'types/Input';

import SelectInput, { SelectInputProps } from './inputs/selectInput';
import TagsInput, { TagsInputProps } from './inputs/tagsInput';
import TextInput, { TextInputProps } from './inputs/textInput';
import Slider, { SliderProps } from './slider';

export type TFormInputValue = string | number | boolean | string[] | undefined;

export interface IFormInput<T, V extends TFormInputValue> extends IInput {
  type: T;
  value?: V;
  setField?(field: string, value: V, shouldValidate?: boolean): void;
}

export type TFormInput =
  | (Omit<SwitchProps, 'checked'> & IFormInput<'switch', boolean>)
  | (Omit<SliderProps, 'value'> & IFormInput<'slider', number>)
  | (Omit<SelectInputProps, 'value'> & IFormInput<'select', string>)
  | (Omit<TextInputProps, 'value'> & IFormInput<'textinput', string>)
  | (Omit<TagsInputProps, 'value'> & IFormInput<'tags', string[]>);

const FormInput = ({ element }: { element: TFormInput }): JSX.Element => {
  switch (element.type) {
    case 'select':
      return <SelectInput {...element} value={element.value ?? ''} />;
    case 'slider':
      return <Slider {...element} value={element.value ?? 0} />;
    case 'tags':
      return <TagsInput {...element} value={element.value ?? []} />;
    case 'switch':
      return (
        <Switch
          {...element}
          checked={!!element.value}
          inputProps={{
            id: element.id,
            name: element.id
          }}
        />
      );
    case 'textinput':
      return <TextInput {...element} value={element.value ?? ''} />;
    default:
      // Unimplemented element type if this errors
      element satisfies never;
      return <></>;
  }
};

export default FormInput;
