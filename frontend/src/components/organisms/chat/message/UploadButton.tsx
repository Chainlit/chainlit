import { useRecoilValue } from 'recoil';

import Add from '@mui/icons-material/Add';
import { LoadingButton } from '@mui/lab';
import { Tooltip } from '@mui/material';

import { FileSpec, IFileResponse } from '@chainlit/components';
import { useUpload } from '@chainlit/components/hooks';

import { fileSpecState, sessionState } from 'state/chat';

import { ISession } from 'types/chat';

type UploadChildProps = {
  fileSpec: FileSpec;
  session: ISession;
};

const UploadChildButton = ({ fileSpec, session }: UploadChildProps) => {
  const upload = useUpload({
    spec: fileSpec,
    onResolved: (payloads: IFileResponse[]) =>
      session?.socket.emit('file_upload', payloads)
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
  const fileSpec = useRecoilValue(fileSpecState);
  const session = useRecoilValue(sessionState);

  if (!fileSpec || !session) return null;

  return <UploadChildButton fileSpec={fileSpec} session={session} />;
}
