import ExpandCircleDown from '@mui/icons-material/ExpandCircleDown';
import IconButton from '@mui/material/IconButton';

interface Props {
  onClick?: () => void;
}

export default function ScrollDownButton({ onClick }: Props) {
  return (
    <IconButton
      sx={{
        width: 'fit-content',
        margin: 'auto',
        position: 'absolute',
        zIndex: 1,
        transform: 'translateY(-100%)',
        top: 0,
        left: 0,
        right: 0
      }}
      onClick={onClick}
    >
      <ExpandCircleDown fontSize="large" />
    </IconButton>
  );
}
