import { Box } from '@mui/material';

import { FileSpec, IFileElement, IFileResponse } from '@chainlit/components';

import StopButton from '../stopButton';
import Input from './input';
import WaterMark from './waterMark';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: IFileResponse[]) => void;
  onFileUploadError: (error: string) => void;
  onSubmit: (message: string, files?: IFileElement[]) => void;
  onReply: (message: string) => void;
}

export default function InputBox({
  fileSpec,
  onFileUpload,
  onFileUploadError,
  onSubmit,
  onReply
}: Props) {
  // const tokenCount = useRecoilValue(tokenCountState);

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={1}
      py={2}
      sx={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '60rem',
        px: 2,
        m: 'auto',
        justifyContent: 'center'
      }}
    >
      <StopButton />
      <Box>
        <Input
          fileSpec={fileSpec}
          onFileUpload={onFileUpload}
          onFileUploadError={onFileUploadError}
          onSubmit={onSubmit}
          onReply={onReply}
        />
        {/* {tokenCount > 0 && ( */}
        {/* <Stack flexDirection="row" alignItems="center">
          <Typography
            sx={{ ml: 'auto' }}
            color="text.secondary"
            variant="caption"
          >
            Token usage: {tokenCount}
          </Typography>
        </Stack> */}
        {/* )} */}
      </Box>
      <WaterMark />
    </Box>
  );
}
