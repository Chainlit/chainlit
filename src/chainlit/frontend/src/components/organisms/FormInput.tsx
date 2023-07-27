import Switch, { SwitchProps } from 'components/atoms/switch';

import { IInput } from 'types/Input';

import SelectInput, {
  SelectInputProps,
  SelectItem
} from './inputs/selectInput';
import TagsInput, { TagsInputProps } from './inputs/tagsInput';
import TextInput, { TextInputProps } from './inputs/textInput';
import Slider, { SliderProps } from './slider';

interface IFormInput<T, I> extends IInput {
  type: T;
  initial: I;
}

export type TFormInput =
  | (SwitchProps & IFormInput<'switch', boolean>)
  | (SliderProps & IFormInput<'slider', number>)
  | (SelectInputProps & IFormInput<'select', string>)
  | (TextInputProps & IFormInput<'textinput', string>)
  | (TagsInputProps & IFormInput<'tags', string[]>);

const FormInput = ({ element }: { element: TFormInput }): JSX.Element => {
  switch (element.type) {
    case 'select':
      return (
        <SelectInput
          {...element}
          items={element.items?.map((option: SelectItem) => ({
            label: option.label,
            value: option.value
          }))}
        />
      );
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
