import { IInput } from 'types/Input';

import { SelectInput, SelectInputProps } from './SelectInput';
import { SliderInput, SliderInputProps } from './SliderInput';
import { SwitchInput, SwitchInputProps } from './SwitchInput';
import { TagsInput, TagsInputProps } from './TagsInput';
import { TextInput, TextInputProps } from './TextInput';

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
      return <SelectInput {...element} value={element.value ?? ''} />;
    case 'slider':
      return <SliderInput {...element} value={element.value ?? 0} />;
    case 'tags':
      return <TagsInput {...element} value={element.value ?? []} />;
    case 'switch':
      return <SwitchInput {...element} checked={!!element.value} />;
    case 'textinput':
      return <TextInput {...element} value={element.value ?? ''} />;
    case 'numberinput':
      return (
        <TextInput
          {...element}
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
