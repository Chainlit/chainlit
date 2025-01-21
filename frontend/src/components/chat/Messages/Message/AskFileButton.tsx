import { MessageContext } from 'contexts/MessageContext';
import { Upload } from 'lucide-react';
import { useContext, useState } from 'react';

import { IAsk, IFileRef } from '@chainlit/react-client';

import { Translator } from '@/components/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { useUpload } from 'hooks/useUpload';

interface UploadState {
  progress: number;
  uploaded: boolean;
  cancel: () => void;
  fileRef?: IFileRef;
}

interface _AskFileButtonProps {
  askUser: IAsk;
  uploadFile: (
    file: File,
    onProgress: (progress: number) => void
  ) => {
    xhr: XMLHttpRequest;
    promise: Promise<IFileRef>;
  };
  onError: (error: string) => void;
}

const CircularProgress = ({ value }: { value: number }) => {
  const size = 24;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="absolute"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="text-muted-foreground/20"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
        />
        <circle
          className="text-primary transition-all duration-300 ease-in-out"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </div>
  );
};

const _AskFileButton = ({
  askUser,
  uploadFile,
  onError
}: _AskFileButtonProps) => {
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const uploading = uploads.some((upload) => !upload.uploaded);
  const progress = uploads.reduce(
    (acc, upload) => acc + upload.progress / uploads.length,
    0
  );

  const onResolved = (files: File[]) => {
    if (uploading) return;

    const promises: Promise<IFileRef>[] = [];

    const newUploads = files.map((file, index) => {
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

    setUploads(newUploads);
  };

  const upload = useUpload({
    spec: askUser.spec,
    onResolved: onResolved,
    onError: (error: string) => onError(error)
  });

  if (!upload) return null;
  const { getRootProps, getInputProps } = upload;

  return (
    <Card className="w-full mt-2">
      <div
        {...getRootProps({ className: 'dropzone' })}
        className="flex items-center p-4"
      >
        <input id="ask-button-input" {...getInputProps()} />
        <div className="flex flex-col">
          <p className="text-sm font-medium">
            <Translator path="chat.fileUpload.dragDrop" />
          </p>
          <p className="text-sm text-muted-foreground">
            <Translator path="chat.fileUpload.sizeLimit" />{' '}
            {askUser.spec.max_size_mb}mb
          </p>
        </div>
        <Button
          id={uploading ? 'ask-upload-button-loading' : 'ask-upload-button'}
          disabled={uploading}
          className="ml-auto"
          variant={uploading ? 'ghost' : 'default'}
        >
          {uploading ? (
            <CircularProgress value={progress} />
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              <Translator path="chat.fileUpload.browse" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

interface AskFileButtonProps {
  onError: (error: string) => void;
}

const AskFileButton = ({ onError }: AskFileButtonProps) => {
  const messageContext = useContext(MessageContext);

  if (
    messageContext.askUser?.spec.type !== 'file' ||
    !messageContext?.uploadFile
  )
    return null;

  return (
    <_AskFileButton
      onError={onError}
      uploadFile={messageContext.uploadFile}
      askUser={messageContext.askUser}
    />
  );
};

export { AskFileButton };
