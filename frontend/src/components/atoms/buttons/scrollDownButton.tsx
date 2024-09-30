import IconButton from '@mui/material/IconButton';

import ChevronDownIcon from 'assets/chevronDown';

interface Props {
  onClick?: () => void;
}

export default function ScrollDownButton({ onClick }: Props) {
  return (
    <IconButton
      size="small"
      sx={{
        width: 'fit-content',
        margin: 'auto',
        position: 'absolute',
        backgroundColor: 'text.primary',
        color: 'background.paper',
        zIndex: 1,
        transform: 'translateY(-100%)',
        top: -20,
        left: 0,
        right: 0,
        '&:hover': {
          backgroundColor: 'text.primary'
        }
      }}
      onClick={onClick}
    >
      <ChevronDownIcon fontSize="large" />
    </IconButton>
  );
}
