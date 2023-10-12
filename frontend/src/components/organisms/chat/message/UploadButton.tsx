import Add from '@mui/icons-material/Add';
import { LoadingButton } from '@mui/lab';
import { Tooltip } from '@mui/material';

import { FileSpec, IFileResponse, useChat } from '@chainlit/components';
import { useUpload } from '@chainlit/components';

type UploadButtonProps = {
  disabled?: boolean;
  onError: (error: string) => void;
  onResolved: (payloads: IFileResponse[]) => void;
};

type UploadChildProps = UploadButtonProps & {
  fileSpec: FileSpec;
};

const UploadChildButton = ({
  disabled,
  fileSpec,
  onError,
  onResolved
}: UploadChildProps) => {
  const upload = useUpload({
    spec: fileSpec,
    onResolved: onResolved,
    onError: onError,
    options: { noDrag: true }
  });

  return (
    <Tooltip title="Upload files">
      <LoadingButton
        disabled={disabled}
        id={upload?.uploading ? 'upload-button-loading' : 'upload-button'}
        loading={upload?.uploading}
        sx={{
          minWidth: 0,
          borderRadius: '50%'
        }}
        color="inherit"
        {...upload?.getRootProps({ className: 'dropzone' })}
      >
        <input {...upload?.getInputProps()} />
        <Add />
      </LoadingButton>
    </Tooltip>
  );
};

export default function UploadButton({
  disabled,
  onError,
  onResolved
}: UploadButtonProps) {
  const { fileSpec } = useChat();

  if (!fileSpec) return null;

  return (
    <UploadChildButton
      disabled={disabled}
      fileSpec={fileSpec}
      onError={onError}
      onResolved={onResolved}
    />
  );
}
