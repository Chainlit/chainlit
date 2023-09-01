import { useRecoilValue } from 'recoil';

import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import { LoadingButton } from '@mui/lab';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { grey } from '@chainlit/components/theme';

import useUpload from 'hooks/useUpload';

import { askUserState } from 'state/chat';

import { IAsk, IFileResponse } from 'types/chat';

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
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? grey[800] : grey[200],
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

export default function AskUploadButton() {
  const askUser = useRecoilValue(askUserState);

  if (askUser?.spec.type !== 'file') return null;

  return <AskUploadChildButton askUser={askUser} />;
}
