import { MessageContext } from 'contexts/MessageContext';
import { useContext, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';

import type {
  ICheckboxGroup,
  ICheckboxGroupOption,
  IStep
} from 'client-types/';

interface Props {
  message: IStep;
  checkboxGroup: ICheckboxGroup;
  onSave?: (selectedOptions: ICheckboxGroup) => void;
}

const MessageCheckboxGroup = ({ message, checkboxGroup }: Props) => {
  const { askUser } = useContext(MessageContext);

  if (checkboxGroup.forId !== message.id) {
    return null;
  }

  const [checkboxState, setCheckboxState] = useState<ICheckboxGroup>({
    ...checkboxGroup,
    selectedOptions: []
  });

  const handleChange = (option: ICheckboxGroupOption) => {
    setCheckboxState((prevState: ICheckboxGroup) => ({
      ...prevState,
      selectedOptions: prevState.selectedOptions.some(
        (selectedOption: ICheckboxGroupOption) =>
          selectedOption.value === option.value
      )
        ? prevState.selectedOptions.filter(
            (selectedOption: ICheckboxGroupOption) =>
              selectedOption.value !== option.value
          )
        : [...prevState.selectedOptions, option]
    }));
  };

  const handleSave = () => {
    console.log('handleSave', checkboxState.selectedOptions);
    askUser?.callback(checkboxState);
  };

  return (
    <Stack spacing={1} width="100%">
      <Box id="checkboxes-list">
        <FormGroup>
          {checkboxGroup.options.map((option: ICheckboxGroupOption) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  onChange={() => handleChange(option)}
                  checked={checkboxState.selectedOptions.some(
                    (selectedOption) => selectedOption.value === option.value
                  )}
                />
              }
              label={option.label || option.name}
            />
          ))}
        </FormGroup>
      </Box>
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={checkboxState.selectedOptions.length === 0}
      >
        Save
      </Button>
    </Stack>
  );
};

export { MessageCheckboxGroup };
