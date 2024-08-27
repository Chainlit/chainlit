import React, { useEffect, useState } from 'react';
import { Button, Typography, IconButton, Box, Avatar } from '@mui/material';
import AttachmentIcon from '@mui/icons-material/Attachment';
import CloseIcon from '@mui/icons-material/Close';

export interface FileUploadInputProps {
  id: string;
  label: string;
  onFileSelect: (file: File | null) => void;
  value?: File | string;
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({ id, label, onFileSelect, value }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (typeof value === 'string') {
      setPreview(value);
    } else if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    setPreview(null);
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
      {preview && (
        <Box display="flex" alignItems="center" mt={1}>
          <Avatar src={preview} sx={{ width: 40, height: 40, mr: 1 }} />
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {value instanceof File ? value.name : 'Current Icon'}
          </Typography>
          <IconButton onClick={handleRemoveFile} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </div>
  );
};