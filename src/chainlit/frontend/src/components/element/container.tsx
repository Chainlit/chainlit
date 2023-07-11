import { Box } from '@mui/material';

import { IContainerElement, IElementContainer } from 'state/element';

import Checkbox from './inputWidget/checkbox';
import NumberInput from './inputWidget/numberInput';
import Radio from './inputWidget/radio';
import SelectBox from './inputWidget/selectBox';
import Slider from './inputWidget/slider';
import TextInput from './inputWidget/textInput';
import { renderElement } from './view';

interface Props {
  element: IElementContainer;
}

export default function Container({ element }: Props) {
  const renderContainerElement = (
    element: IContainerElement
  ): JSX.Element | null => {
    switch (element.type) {
      case 'checkbox':
        return <Checkbox element={element} />;
      case 'radio':
        return <Radio element={element} />;
      case 'slider':
        return <Slider element={element} />;
      case 'selectbox':
        return <SelectBox element={element} />;
      case 'numberinput':
        return <NumberInput element={element} />;
      case 'textinput':
        return <TextInput element={element} />;
      default:
        return renderElement(element);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {element.content?.map(renderContainerElement)}
    </Box>
  );
}
