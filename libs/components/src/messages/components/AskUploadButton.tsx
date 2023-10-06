import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useUpload } from 'hooks/useUpload';

import { IAsk, IFileResponse } from 'src/types/file';

const AskUploadChildButton = ({ askUser }: { askUser: IAsk }) => {
  const upload = useUpload({
    spec: askUser.spec,
    onResolved: (payloads: IFileResponse[]) => askUser?.callback(payloads)
  });

  if (!upload) return null;
  const { getRootProps, getInputProps, uploading } = upload;

  return (
    <Stack
      sx={{
        width: '100%',
        borderRadius: 1,
        backgroundColor: (theme) => theme.palette.background.paper,
        boxSizing: 'border-box'
      }}
      direction="row"
      alignItems="center"
      padding={2}
      {...getRootProps({ className: 'dropzone' })}
    >
      <input {...getInputProps()} />
      <CloudUploadOutlined fontSize="large" />
      <Stack ml={2}>
        <Typography color="text.primary">Drag and drop files here</Typography>
        <Typography variant="caption" color="text.secondary">
          Limit {askUser.spec.max_size_mb}mb.
        </Typography>
      </Stack>
      <LoadingButton
        id={uploading ? 'upload-button-loading' : 'upload-button'}
        loading={uploading}
        sx={{ ml: 'auto !important' }}
        variant="contained"
      >
        Browse Files
      </LoadingButton>
    </Stack>
  );
};

const AskUploadButton = () => {
  const messageContext = useContext(MessageContext);

  if (messageContext.askUser?.spec.type !== 'file') return null;

  return <AskUploadChildButton askUser={messageContext.askUser} />;
};

export { AskUploadButton };
