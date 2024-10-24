import { useUpload } from 'hooks';

import { IconButton, Theme, Tooltip, useMediaQuery } from '@mui/material';

import { FileSpec, useConfig } from '@chainlit/react-client';

import { Translator } from 'components/i18n';

import AttachmentIcon from 'assets/attachment';

type Props = {
  disabled?: boolean;
  fileSpec: FileSpec;
  onFileUpload: (files: File[]) => void;
  onFileUploadError: (error: string) => void;
};

const UploadButton = ({
  disabled,
  fileSpec,
  onFileUpload,
  onFileUploadError
}: Props) => {
  const { config } = useConfig();
  const upload = useUpload({
    spec: fileSpec,
    onResolved: (payloads: File[]) => onFileUpload(payloads),
    onError: onFileUploadError,
    options: { noDrag: true }
  });

  const size = useMediaQuery<Theme>((theme) => theme.breakpoints.down('sm'))
    ? 'small'
    : 'medium';

  if (!upload || !config?.features?.spontaneous_file_upload?.enabled)
    return null;
  const { getRootProps, getInputProps } = upload;

  return (
    <Tooltip
      title={
        <Translator path="components.organisms.chat.inputBox.UploadButton.attachFiles" />
      }
    >
      <span>
        <input id="upload-button-input" {...getInputProps()} />
        <IconButton
          id={disabled ? 'upload-button-loading' : 'upload-button'}
          disabled={disabled}
          color="inherit"
          size={size}
          {...getRootProps({ className: 'dropzone' })}
        >
          <AttachmentIcon fontSize={size} />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default UploadButton;
