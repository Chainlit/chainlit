import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

const ChevronDownIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon>
      <svg
        {...props}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </SvgIcon>
  );
};

export default ChevronDownIcon;
