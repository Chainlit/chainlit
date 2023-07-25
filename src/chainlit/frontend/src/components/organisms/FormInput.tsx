import Switch, { SwitchProps } from 'components/atoms/switch';

import { IInput } from 'types/Input';

import SelectInput, { SelectInputProps } from './inputs/selectInput';
import TagsInput, { TagsInputProps } from './inputs/tagsInput';
import TextInput, { TextInputProps } from './inputs/textInput';
import Slider, { SliderProps } from './slider';

export type FormInitial =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | undefined;

export interface IFormInput<T> extends IInput {
  type: T;
}

export type TFormInput =
  | (SwitchProps & IFormInput<'switch'>)
  | (SliderProps & IFormInput<'slider'>)
  | (SelectInputProps & IFormInput<'select'>)
  | (TextInputProps & IFormInput<'textinput'>)
  | (TagsInputProps & IFormInput<'tags'>);

const FormInput = ({ element }: { element: TFormInput }): JSX.Element => {
  switch (element.type) {
    case 'select':
      return <SelectInput {...element} />;
    case 'slider':
      return <Slider {...element} />;
    case 'tags':
      return <TagsInput {...element} />;
    case 'switch':
      return (
        <Switch
          {...element}
          inputProps={{
            id: element.id || undefined,
            name: element.id
          }}
        />
      );
    case 'textinput':
      return <TextInput {...element} placeholder={element.placeholder} />;
    default:
      return <></>;
  }
};

export default FormInput;
