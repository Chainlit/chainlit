import omit from 'utils/omit';

import { IInput } from 'src/types/Input';

import { SliderInput, SliderInputProps } from './SliderInput';
import { SwitchInput, SwitchInputProps } from './SwitchInput';
import { TagsInput, TagsInputProps } from './TagsInput';
import { TextInput, TextInputProps } from './TextInput';
import { SelectInput, SelectInputProps } from './selects/SelectInput';

type TFormInputValue = string | number | boolean | string[] | undefined;

interface IFormInput<T, V extends TFormInputValue> extends IInput {
  type: T;
  value?: V;
  initial?: V;
  setField?(field: string, value: V, shouldValidate?: boolean): void;
}

type TFormInput =
  | (Omit<SwitchInputProps, 'checked'> & IFormInput<'switch', boolean>)
  | (Omit<SliderInputProps, 'value'> & IFormInput<'slider', number>)
  | (Omit<TagsInputProps, 'value'> & IFormInput<'tags', string[]>)
  | (Omit<SelectInputProps, 'value'> & IFormInput<'select', string>)
  | (Omit<TextInputProps, 'value'> & IFormInput<'textinput', string>)
  | (Omit<TextInputProps, 'value'> & IFormInput<'numberinput', number>);

const FormInput = ({ element }: { element: TFormInput }): JSX.Element => {
  switch (element?.type) {
    case 'select':
      // We omit the 'setField' prop to avoid React warnings and ensure it's available for <Tags/>.
      return (
        <SelectInput
          {...omit(element, 'setField')}
          value={element.value ?? ''}
        />
      );
    case 'slider':
      return <SliderInput {...element} value={element.value ?? 0} />;
    case 'tags':
      return <TagsInput {...element} value={element.value ?? []} />;
    case 'switch':
      return (
        <SwitchInput
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

export { FormInput };
export type { IFormInput, TFormInput, TFormInputValue };
