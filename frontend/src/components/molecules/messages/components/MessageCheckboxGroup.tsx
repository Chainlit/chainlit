import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';

import type { ICheckboxGroup, ICheckboxOption, IStep } from 'client-types/';

interface Props {
  message: IStep;
  checkboxGroup: ICheckboxGroup;
  onSave?: (selectedOptions: ICheckboxGroup) => void;
}

const MessageCheckboxGroup = ({ message, checkboxGroup, onSave }: Props) => {
  console.log('MessageCheckboxGroup', message, checkboxGroup, onSave);

  const [selectedOptions, setSelectedOptions] = useState<ICheckboxGroup>({
    ...checkboxGroup,
    options: []
  });

  const handleChange = (option: ICheckboxOption) => {
    const isSelected = selectedOptions.options.some(
      (selectedOption: ICheckboxOption) => selectedOption.value === option.value
    );
    if (isSelected) {
      setSelectedOptions({
        ...selectedOptions,
        options: selectedOptions.options.filter(
          (selectedOption: ICheckboxOption) =>
            selectedOption.value !== option.value
        )
      });
    } else {
      setSelectedOptions({
        ...selectedOptions,
        options: [...selectedOptions.options, option]
      });
    }
  };

  const handleSave = () => {
    console.log('handleSave');
    // if (onSave) {
    //   onSave(selectedOptions);
    // }
    // setSelectedOptions({
    //   ...checkboxGroup,
    //   checkboxes: [],
    // });
  };

  return (
    <Stack spacing={1} width="100%">
      HEY!!! CHECKBOX GROUP!!!!!
      <Box id="checkboxes-list">
        <FormGroup>
          {checkboxGroup.options.map((option: ICheckboxOption) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={checkboxGroup.options.some(
                    (selectedOption: ICheckboxOption) =>
                      selectedOption.value === option.value
                  )}
                  onChange={() => handleChange(option)}
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
        disabled={selectedOptions.options.length === 0}
      >
        Save
      </Button>
    </Stack>
  );
};

export { MessageCheckboxGroup };
