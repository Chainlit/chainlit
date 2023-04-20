import { useRecoilValue, useSetRecoilState } from "recoil";
import { IAsk, askUserState } from "state/chat";
import { useCallback, useState } from "react";
import { useDropzone, DropzoneOptions, FileRejection } from "react-dropzone";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-hot-toast";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import { LoadingButton } from "@mui/lab";

interface Props {
  askUser: IAsk;
}

function _UploadButton({ askUser }: Props) {
  const setAskUser = useSetRecoilState(askUserState);
  const [uploading, setUploading] = useState(false);

  const onDrop: DropzoneOptions["onDrop"] = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const file = acceptedFiles[0];
      const rejection = fileRejections[0];

      if (rejection) {
        toast.error(rejection.errors[0].message);
      }
      if (file) {
        setUploading(true);
        var reader = new FileReader();

        reader.onload = function (e) {
          const rawData = e.target?.result;
          const payload = {
            //@ts-ignore
            path: file.path,
            name: file.name,
            size: file.size,
            type: file.type,
            content: rawData as ArrayBuffer,
          };
          askUser?.callback(payload);
          setUploading(false);
          setAskUser(undefined);
        };

        reader.onerror = function (e) {
          toast.error(reader.error!.message);
          setUploading(false);
        };

        reader.readAsArrayBuffer(acceptedFiles[0]);
      }
    },
    [askUser]
  );

  const dzAccept: Record<string, string[]> = {};
  const accept = askUser.spec.accept!;
  accept.forEach((a) => (dzAccept[a] = []));
  const maxSize = askUser.spec.max_size_mb!;

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: dzAccept,
    maxSize: maxSize * 1000000,
  });

  const supported =
    accept.length > 1
      ? `${accept.slice(0, accept.length - 1).join(", ")} or ${
          accept[accept.length - 1]
        }.`
      : `${accept[0]}.`;

  return (
    <Stack
      sx={{
        width: "100%",
        borderRadius: 1,
        backgroundColor: (theme) => theme.palette.background.paper,
        boxSizing: "border-box",
      }}
      direction="row"
      alignItems="center"
      padding={2}
      {...getRootProps({ className: "dropzone" })}
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
        loading={uploading}
        sx={{ ml: "auto !important" }}
        variant="contained"
      >
        Browse Files
      </LoadingButton>
    </Stack>
  );
}

export default function UploadButton() {
  const askUser = useRecoilValue(askUserState);

  if (askUser?.spec.type !== "file") {
    return null;
  }

  return <_UploadButton askUser={askUser} />;
}
