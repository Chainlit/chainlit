import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

const SquarePenIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon sx={{ 
      width: '20px',
      height: '20px',
      padding: 0,
      '& svg': {
        width: '20px',
        height: '20px'
      }
    }}>
      <svg
        {...props}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
      </svg>
    </SvgIcon>
  );
};

export default SquarePenIcon;
