import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

const ExpandIcon = (props: SvgIconProps) => {
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
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" x2="14" y1="3" y2="10" />
      <line x1="3" x2="10" y1="21" y2="14" />
    </SvgIcon>
  );
};

export default ExpandIcon;
