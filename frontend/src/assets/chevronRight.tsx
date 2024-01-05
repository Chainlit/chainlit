import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

const ChevronRightIcon = (props: SvgIconProps) => {
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
        <path d="m6 17 5-5-5-5" />
        <path d="m13 17 5-5-5-5" />
      </svg>
    </SvgIcon>
  );
};

export default ChevronRightIcon;
