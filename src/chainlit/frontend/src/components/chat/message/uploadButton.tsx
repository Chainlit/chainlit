import { useRecoilValue } from 'recoil';
import { IAsk, askUserState } from 'state/chat';
import { useCallback, useState } from 'react';
import {
  useDropzone,
  DropzoneOptions,
  FileRejection,
  FileWithPath
} from 'react-dropzone';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { toast } from 'react-hot-toast';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import { LoadingButton } from '@mui/lab';

interface Props {
  askUser: IAsk;
}

function _UploadButton({ askUser }: Props) {
  const [uploading, setUploading] = useState(false);

  const onDrop: DropzoneOptions['onDrop'] = useCallback(
    (acceptedFiles: FileWithPath[], fileRejections: FileRejection[]) => {
      const file = acceptedFiles[0];
      const rejection = fileRejections[0];

      if (rejection) {
        toast.error(rejection.errors[0].message);
      }
      if (file) {
        setUploading(true);
        const reader = new FileReader();

        reader.onload = function (e) {
          const rawData = e.target?.result;
          const payload = {
            path: file.path,
            name: file.name,
            size: file.size,
            type: file.type,
            content: rawData as ArrayBuffer
          };
          askUser?.callback(payload);
        };

        reader.onerror = function () {
          if (!reader.error) return;
          toast.error(reader.error.message);
          setUploading(false);
        };

        reader.readAsArrayBuffer(acceptedFiles[0]);
      }
    },
    [askUser]
  );

  if (!askUser.spec.accept || !askUser.spec.max_size_mb) return null;

  let dzAccept: Record<string, string[]> = {};
  const accept = askUser.spec.accept;
  if (Array.isArray(accept)) {
    accept.forEach((a) => {
      if (typeof a === 'string') {
        dzAccept[a] = [];
      }
    });
  } else if (typeof accept === 'object') {
    dzAccept = accept;
  }

  const maxSize = askUser.spec.max_size_mb;

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: dzAccept,
    maxSize: maxSize * 1000000
  });

  return (
    <Stack
      sx={{
        width: '100%',
        borderRadius: 1,
        backgroundColor: (theme) => theme.palette.divider,
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
          Limit {maxSize}mb.
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
}

export default function UploadButton() {
  const askUser = useRecoilValue(askUserState);

  if (askUser?.spec.type !== 'file') {
    return null;
  }

  return <_UploadButton askUser={askUser} />;
}
