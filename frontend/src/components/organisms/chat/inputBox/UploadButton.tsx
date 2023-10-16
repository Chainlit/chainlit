import { useRecoilValue } from 'recoil';

import Add from '@mui/icons-material/Add';
import { IconButton, Tooltip } from '@mui/material';

import { FileSpec, IFileResponse } from '@chainlit/components';
import { useUpload } from '@chainlit/components';

import { projectSettingsState } from 'state/project';

type Props = {
  disabled?: boolean;
  fileSpec: FileSpec;
  onFileUpload: (files: IFileResponse[]) => void;
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
    onResolved: (payloads: IFileResponse[]) => onFileUpload(payloads),
    onError: onFileUploadError,
    options: { noDrag: true }
  });

  if (!upload || !pSettings?.features?.multi_modal) return null;
  const { getRootProps, getInputProps, uploading } = upload;

  return (
    <Tooltip title="Upload files">
      <IconButton
        id={uploading ? 'upload-button-loading' : 'upload-button'}
        disabled={uploading || disabled}
        color="inherit"
        {...getRootProps({ className: 'dropzone' })}
      >
        <input id="upload-button-input" {...getInputProps()} />
        <Add />
      </IconButton>
    </Tooltip>
  );
};

export default UploadButton;
