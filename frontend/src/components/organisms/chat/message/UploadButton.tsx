import Add from '@mui/icons-material/Add';
import { LoadingButton } from '@mui/lab';
import { Tooltip } from '@mui/material';

import { FileSpec, IFileResponse, useChat } from '@chainlit/components';
import { useUpload } from '@chainlit/components';

type UploadChildProps = {
  fileSpec: FileSpec;
  uploadFiles: (files: IFileResponse[]) => void;
};

const UploadChildButton = ({ fileSpec, uploadFiles }: UploadChildProps) => {
  const upload = useUpload({
    spec: fileSpec,
    onResolved: (payloads: IFileResponse[]) => uploadFiles(payloads)
  });

  if (!upload) return null;
  const { getRootProps, getInputProps, uploading } = upload;

  return (
    <Tooltip title="Upload files">
      <LoadingButton
        id={uploading ? 'upload-button-loading' : 'upload-button'}
        loading={uploading}
        sx={{
          minWidth: 0,
          borderRadius: '50%'
        }}
        color="inherit"
        {...getRootProps({ className: 'dropzone' })}
      >
        <input {...getInputProps()} />
        <Add />
      </LoadingButton>
    </Tooltip>
  );
};

export default function UploadButton() {
  const { fileSpec, uploadFiles } = useChat();

  if (!fileSpec) return null;

  return <UploadChildButton fileSpec={fileSpec} uploadFiles={uploadFiles} />;
}
