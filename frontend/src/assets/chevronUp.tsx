import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

const ChevronUpIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon>
      <svg
        {...props}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m17 11-5-5-5 5" />
        <path d="m17 18-5-5-5 5" />
      </svg>
    </SvgIcon>
  );
};

export default ChevronUpIcon;
