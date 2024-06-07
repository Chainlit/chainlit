import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

const MinimizeIcon = (props: SvgIconProps) => {
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
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" x2="21" y1="10" y2="3" />
      <line x1="3" x2="10" y1="21" y2="14" />
    </SvgIcon>
  );
};

export default MinimizeIcon;
