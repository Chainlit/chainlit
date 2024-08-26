import React from 'react';
import { Button, Typography, IconButton, Box, Avatar } from '@mui/material';
import AttachmentIcon from '@mui/icons-material/Attachment';
import CloseIcon from '@mui/icons-material/Close';

export interface FileUploadInputProps {
  id: string;
  label: string;
  onFileSelect: (file: File | null) => void;
  value?: File;
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({ id, label, onFileSelect, value }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        id={id}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept="image/*"
      />
      <label htmlFor={id}>
        <Button variant="outlined" component="span" startIcon={<AttachmentIcon />}>
          {label}
        </Button>
      </label>
      {value && (
        <Box display="flex" alignItems="center" mt={1}>
          <Avatar src={URL.createObjectURL(value)} sx={{ width: 40, height: 40, mr: 1 }} />
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {value.name}
          </Typography>
          <IconButton onClick={handleRemoveFile} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </div>
  );
};