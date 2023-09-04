import { useCallback, useState } from 'react';
import {
  DropzoneOptions,
  FileRejection,
  FileWithPath,
  useDropzone
} from 'react-dropzone';
import toast from 'react-hot-toast';

import { FileSpec, IFileResponse } from 'types/chat';

interface useUploadProps {
  onResolved: (payloads: IFileResponse[]) => void;
  spec: FileSpec;
}

const useUpload = ({ onResolved, spec }: useUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const onDrop: DropzoneOptions['onDrop'] = useCallback(
    (acceptedFiles: FileWithPath[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        toast.error(fileRejections[0].errors[0].message);
        return;
      }

      if (!acceptedFiles.length) return;
      setUploading(true);

      const promises = acceptedFiles.map((file) => {
        return new Promise<IFileResponse>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = function (e) {
            const rawData = e.target?.result;
            const payload: IFileResponse = {
              path: file.path,
              name: file.name,
              size: file.size,
              type: file.type,
              content: rawData as ArrayBuffer
            };
            resolve(payload);
          };
          reader.onerror = function () {
            if (!reader.error) return;
            reject(reader.error.message);
          };
          reader.readAsArrayBuffer(file);
        });
      });

      Promise.all(promises)
        .then((payloads) => {
          onResolved(payloads);
          setUploading(false);
        })
        .catch((err) => {
          toast.error(err);
          setUploading(false);
        });
    },
    [spec]
  );

  if (!spec.accept || !spec.max_size_mb) return null;

  let dzAccept: Record<string, string[]> = {};
  const accept = spec.accept;

  if (Array.isArray(accept)) {
    accept.forEach((a) => {
      if (typeof a === 'string') {
        dzAccept[a] = [];
      }
    });
  } else if (typeof accept === 'object') {
    dzAccept = accept;
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: spec.max_files || 1,
    accept: dzAccept,
    maxSize: spec.max_size_mb * 1000000
  });

  return { getRootProps, getInputProps, uploading };
};

export default useUpload;
