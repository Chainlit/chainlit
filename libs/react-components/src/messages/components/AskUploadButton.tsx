import { MessageContext } from 'contexts/MessageContext';
import { useContext, useState } from 'react';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useUpload } from 'hooks/useUpload';

import type { IAsk, IFileRef } from 'client-types/';

const AskUploadChildButton = ({
  askUser,
  uploadFile,
  onError
}: {
  askUser: IAsk;
  uploadFile: (
    file: File,
    onProgress: (progress: number) => void
  ) => { xhr: XMLHttpRequest; promise: Promise<IFileRef> };
  onError: (error: string) => void;
}) => {
  const [uploads, setUploads] = useState<
    {
      progress: number;
      uploaded: boolean;
      cancel: () => void;
      fileRef?: IFileRef;
    }[]
  >([]);

  const uploading = uploads.some((upload) => !upload.uploaded);
  const progress = uploads.reduce(
    (acc, upload) => acc + upload.progress / uploads.length,
    0
  );

  const onResolved = (files: File[]) => {
    if (uploading) return;

    const promises: Promise<IFileRef>[] = [];

    const uploads = files.map((file, index) => {
      const { xhr, promise } = uploadFile(file, (progress) => {
        setUploads((prev) =>
          prev.map((upload, i) => {
            if (i === index) {
              return { ...upload, progress };
            }
            return upload;
          })
        );
      });
      promises.push(promise);
      return { progress: 0, uploaded: false, cancel: () => xhr.abort() };
    });

    Promise.all(promises)
      .then((fileRefs) => askUser.callback(fileRefs))
      .catch((error) => {
        onError(`Failed to upload: ${error.message}`);
        setUploads((prev) => {
          prev.forEach((u) => u.cancel());
          return [];
        });
      });

    setUploads(uploads);
  };

  const upload = useUpload({
    spec: askUser.spec,
    onResolved: onResolved,
    onError: (error: string) => onError(error)
  });

  if (!upload) return null;
  const { getRootProps, getInputProps } = upload;

  return (
    <Stack
      sx={{
        width: '100%',
        borderRadius: 1,
        backgroundColor: (theme) => theme.palette.background.paper,
        boxSizing: 'border-box',
        mt: 1
      }}
      direction="row"
      alignItems="center"
      padding={2}
      {...getRootProps({ className: 'dropzone' })}
    >
      <input id="ask-button-input" {...getInputProps()} />
      <Stack>
        <Typography color="text.primary">Drag and drop files here</Typography>
        <Typography variant="caption" color="text.secondary">
          Limit {askUser.spec.max_size_mb}mb.
        </Typography>
      </Stack>
      <Button
        id={uploading ? 'ask-upload-button-loading' : 'ask-upload-button'}
        disabled={uploading}
        sx={{ ml: 'auto !important', textTransform: 'capitalize' }}
        variant="contained"
      >
        {uploading ? (
          <CircularProgress variant="determinate" value={progress} size={20} />
        ) : (
          'Browse Files'
        )}
      </Button>
    </Stack>
  );
};

const AskUploadButton = ({ onError }: { onError: (error: string) => void }) => {
  const messageContext = useContext(MessageContext);

  if (
    messageContext.askUser?.spec.type !== 'file' ||
    !messageContext?.uploadFile
  )
    return null;

  return (
    <AskUploadChildButton
      onError={onError}
      uploadFile={messageContext.uploadFile}
      askUser={messageContext.askUser}
    />
  );
};

export { AskUploadButton };
