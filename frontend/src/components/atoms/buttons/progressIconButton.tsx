import CircularProgress from '@mui/material/CircularProgress';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';

interface Props extends IconButtonProps {
  progress: number;
  children: React.ReactNode;
}

export default function CircularProgressIconButton({
  progress,
  children,
  ...iconButtonProps
}: Props) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <IconButton {...iconButtonProps}>{children}</IconButton>
      {progress < 100 && (
        <CircularProgress
          variant="determinate"
          value={progress}
          size={30} // Adjust the size to match the IconButton
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
}
