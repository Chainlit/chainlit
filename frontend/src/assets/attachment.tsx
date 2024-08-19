import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

const AttachmentIcon = (props: SvgIconProps) => {
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
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </SvgIcon>
  );
};

export default AttachmentIcon;
