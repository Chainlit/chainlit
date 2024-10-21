import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

const MicrophoneIcon = (props: SvgIconProps) => {
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
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </SvgIcon>
  );
};

export default MicrophoneIcon;
