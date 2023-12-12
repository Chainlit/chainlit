import { useRecoilValue } from 'recoil';

import AttachFile from '@mui/icons-material/AttachFile';
import { IconButton, Tooltip } from '@mui/material';

import { FileSpec } from '@chainlit/react-client';
import { useUpload } from '@chainlit/react-components';

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

  if (!upload || !pSettings?.features?.multi_modal) return null;
  const { getRootProps, getInputProps } = upload;

  return (
    <Tooltip title="Attach files">
      <span>
        <input id="upload-button-input" {...getInputProps()} />
        <IconButton
          id={disabled ? 'upload-button-loading' : 'upload-button'}
          disabled={disabled}
          color="inherit"
          {...getRootProps({ className: 'dropzone' })}
        >
          <AttachFile />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default UploadButton;
