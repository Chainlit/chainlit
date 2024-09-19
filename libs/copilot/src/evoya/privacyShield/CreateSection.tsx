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

import { Translator } from '@chainlit/app/src/components/i18n';

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
        {editSection ? <Translator path="components.organisms.privacyShield.createSection.title.edit" /> : <Translator path="components.organisms.privacyShield.createSection.title.create" />}
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
              <Translator path="components.organisms.privacyShield.createSection.typefield.label" />
            </InputLabel>
            <Select
              labelId="privacy-type-label"
              id="privacy-type-select"
              value={sectionType}
              label="Type"
              onChange={(e: SelectChangeEvent) => setSectionType(e.target.value)}
            >
              <MenuItem value="name">
                <Translator path="components.organisms.privacyShield.createSection.typefield.options.name" />
              </MenuItem>
              <MenuItem value="location">
                <Translator path="components.organisms.privacyShield.createSection.typefield.options.location" />
              </MenuItem>
              <MenuItem value="phone">
                <Translator path="components.organisms.privacyShield.createSection.typefield.options.phone" />
              </MenuItem>
              <MenuItem value="email">
                <Translator path="components.organisms.privacyShield.createSection.typefield.options.email" />
              </MenuItem>
              <MenuItem value="other">
                <Translator path="components.organisms.privacyShield.createSection.typefield.options.other" />
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>
          <Translator path="components.organisms.privacyShield.createSection.actions.close" />
        </Button>
        <Button variant="contained" onClick={() => createSection(sectionType, showTextField ? sectionText : null)}>
          {editSection ? <Translator path="components.organisms.privacyShield.createSection.actions.save" /> : <Translator path="components.organisms.privacyShield.createSection.actions.create" />}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateSection;