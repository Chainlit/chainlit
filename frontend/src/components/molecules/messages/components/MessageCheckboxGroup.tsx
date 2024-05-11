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
  onSave?: (selected: ICheckboxGroup) => void;
}

const MessageCheckboxGroup = ({ message, checkboxGroup }: Props) => {
  const { askUser } = useContext(MessageContext);

  if (checkboxGroup.forId !== message.id) {
    return null;
  }

  const [checkboxState, setCheckboxState] = useState<ICheckboxGroup>({
    ...checkboxGroup,
    selected: []
  });

  const handleChange = (option: ICheckboxGroupOption) => {
    setCheckboxState((prevState: ICheckboxGroup) => ({
      ...prevState,
      selected: prevState.selected.some(
        (selectedOption: ICheckboxGroupOption) =>
          selectedOption.value === option.value
      )
        ? prevState.selected.filter(
            (selectedOption: ICheckboxGroupOption) =>
              selectedOption.value !== option.value
          )
        : [...prevState.selected, option]
    }));
  };

  const handleSave = () => {
    askUser?.callback(checkboxState);
  };

  return (
    <Stack spacing={1} width="auto">
      <Box className="checkbox-group">
        <FormGroup>
          {checkboxGroup.options.map((option: ICheckboxGroupOption) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  onChange={() => handleChange(option)}
                  checked={checkboxState.selected.some(
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
        size="large"
        onClick={handleSave}
        disabled={checkboxState.selected.length === 0}
      >
        Save
      </Button>
    </Stack>
  );
};

export { MessageCheckboxGroup };
