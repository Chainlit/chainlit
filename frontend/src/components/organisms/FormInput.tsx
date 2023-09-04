import omit from 'lodash/omit';

import { IInput, TextInput, TextInputProps } from '@chainlit/components';

import Switch, { SwitchProps } from 'components/atoms/switch';

import SelectInput, { SelectInputProps } from './inputs/selectInput';
import TagsInput, { TagsInputProps } from './inputs/tagsInput';
import Slider, { SliderProps } from './slider';

export type TFormInputValue = string | number | boolean | string[] | undefined;

export interface IFormInput<T, V extends TFormInputValue> extends IInput {
  type: T;
  value?: V;
  initial?: V;
  setField?(field: string, value: V, shouldValidate?: boolean): void;
}

export type TFormInput =
  | (Omit<SwitchProps, 'checked'> & IFormInput<'switch', boolean>)
  | (Omit<SliderProps, 'value'> & IFormInput<'slider', number>)
  | (Omit<SelectInputProps, 'value'> & IFormInput<'select', string>)
  | (Omit<TextInputProps, 'value'> & IFormInput<'textinput', string>)
  | (Omit<TextInputProps, 'value'> & IFormInput<'numberinput', number>)
  | (Omit<TagsInputProps, 'value'> & IFormInput<'tags', string[]>);

const FormInput = ({ element }: { element: TFormInput }): JSX.Element => {
  switch (element.type) {
    case 'select':
      // We omit the 'setField' prop to avoid React warnings and ensure it's available for <Tags/>.
      return (
        <SelectInput
          {...omit(element, 'setField')}
          value={element.value ?? ''}
        />
      );
    case 'slider':
      return <Slider {...element} value={element.value ?? 0} />;
    case 'tags':
      return <TagsInput {...element} value={element.value ?? []} />;
    case 'switch':
      return (
        <Switch
          {...omit(element, 'setField')}
          checked={!!element.value}
          inputProps={{
            id: element.id,
            name: element.id
          }}
        />
      );
    case 'textinput':
      return (
        <TextInput {...omit(element, 'setField')} value={element.value ?? ''} />
      );
    case 'numberinput':
      return (
        <TextInput
          {...omit(element, 'setField')}
          type="number"
          value={element.value?.toString() ?? '0'}
        />
      );
    default:
      // If the element type is not recognized, we indicate an unimplemented type.
      // This code path should not normally occur and serves as a fallback.
      element satisfies never;
      return <></>;
  }
};

export default FormInput;
