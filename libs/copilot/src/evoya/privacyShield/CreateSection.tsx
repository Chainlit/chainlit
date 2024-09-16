import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  TextField,
  InputLabel,
  FormControl,
  MenuItem,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

import { useEffect, useState } from 'react';
import { TextSection } from 'evoya/types';

interface Props {
  textSelection: string;
  editSection: TextSection|null;
  open: boolean;
  showTextField: boolean;
  closeDialog: () => void;
  dialogClosed: () => void;
  createSection: (type: string, text: string|null) => void;
}

const CreateSection = ({ open, closeDialog, dialogClosed, createSection, showTextField, editSection, textSelection }: Props) => {
  const [sectionType, setSectionType] = useState<string>(editSection?.type ?? 'other');
  const [sectionText, setSectionText] = useState<string>('');

  useEffect(() => {
    if (editSection && editSection.type) {
      setSectionType(editSection.type);
    }
  }, [editSection]);
  
  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      aria-labelledby="create-privacy-dialog-title"
      aria-describedby="create-privacy-dialog-description"
      maxWidth="sm"
      fullWidth
      onTransitionExited={dialogClosed}
    >
      <DialogTitle id="create-privacy-dialog-title">
        {editSection ? 'Edit Privacy Section' : 'Create Privacy Section'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ paddingY: 1}}>
          {showTextField ? (
            <TextField
              id="privacy-text"
              label="Text"
              variant="outlined"
              value={sectionText}
              onChange={(e) => setSectionText(e.target.value)}
              sx={{ width: '100%', marginBottom: 4}}
            />
          ) : (
            <TextField
              id="privacy-text"
              label="Text"
              variant="outlined"
              value={editSection ? editSection.string : textSelection}
              sx={{ width: '100%', marginBottom: 4}}
              disabled
            />
          )}
          <FormControl sx={{ width: '100%'}}>
            <InputLabel id="privacy-type-label" sx={{ marginLeft: 0 }}>
              Type
            </InputLabel>
            <Select
              labelId="privacy-type-label"
              id="privacy-type-select"
              value={sectionType}
              label="Type"
              onChange={(e: SelectChangeEvent) => setSectionType(e.target.value)}
            >
              <MenuItem value="name">
                Name
              </MenuItem>
              <MenuItem value="location">
                Location
              </MenuItem>
              <MenuItem value="phone">
                Phone number
              </MenuItem>
              <MenuItem value="email">
                Email address
              </MenuItem>
              <MenuItem value="other">
                Other
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>
          Close
        </Button>
        <Button variant="contained" onClick={() => createSection(sectionType, showTextField ? sectionText : null)}>
          {editSection ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateSection;