import Add from '@mui/icons-material/Add';
import { IconButton, Tooltip } from '@mui/material';

import { FileSpec, IFileResponse } from '@chainlit/components';
import { useUpload } from '@chainlit/components';

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
  const upload = useUpload({
    spec: fileSpec,
    onResolved: (payloads: IFileResponse[]) => onFileUpload(payloads),
    onError: onFileUploadError,
    options: { noDrag: true }
  });

  if (!upload) return null;
  const { getRootProps, getInputProps, uploading } = upload;

  return (
    <Tooltip title="Upload files">
      <IconButton
        id={uploading ? 'upload-button-loading' : 'upload-button'}
        disabled={uploading || disabled}
        color="inherit"
        {...getRootProps({ className: 'dropzone' })}
      >
        <input {...getInputProps()} />
        <Add />
      </IconButton>
    </Tooltip>
  );
};

export default UploadButton;
