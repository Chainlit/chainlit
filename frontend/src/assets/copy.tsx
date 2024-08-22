import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

const CopyIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon
      {...props}
      style={{
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 2,
        fill: 'none',
        stroke: 'currentColor'
      }}
      viewBox="0 0 24 24"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </SvgIcon>
  );
};

export default CopyIcon;
