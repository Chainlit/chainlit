import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

const ChevronUpIcon = (props: SvgIconProps) => {
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
        <path d="m18 15-6-6-6 6" />
      </svg>
    </SvgIcon>
  );
};

export default ChevronUpIcon;
