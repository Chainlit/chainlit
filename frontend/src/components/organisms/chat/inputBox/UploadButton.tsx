import { useRecoilValue } from 'recoil';

import AttachFile from '@mui/icons-material/AttachFile';
import { IconButton, Theme, Tooltip, useMediaQuery } from '@mui/material';

import { FileSpec } from '@chainlit/react-client';
import { useUpload } from '@chainlit/react-components';

import { Translator } from 'components/i18n';

import { projectSettingsState } from 'state/project';

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
  const pSettings = useRecoilValue(projectSettingsState);

  const upload = useUpload({
    spec: fileSpec,
    onResolved: (payloads: File[]) => onFileUpload(payloads),
    onError: onFileUploadError,
    options: { noDrag: true }
  });

  const size = useMediaQuery<Theme>((theme) => theme.breakpoints.down('sm'))
    ? 'small'
    : 'medium';

  if (!upload || !pSettings?.features?.multi_modal) return null;
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
          <AttachFile fontSize={size} />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default UploadButton;
