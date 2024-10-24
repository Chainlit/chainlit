import Avatar from '@mui/material/Avatar';

interface Props {
  author: string;
  bgColor?: string;
  avatarUrl?: string;
  classes?: string;
}

const AvatarElement = ({ avatarUrl, author, bgColor, classes }: Props) => {
  let avatar: JSX.Element;
  const sx = (theme: any) => ({
    width: 26,
    height: 26,
    // fontSize: '0.75rem',
    fontSize: theme.typography.caption.fontSize,
    mt: '-2px',
    bgcolor: avatarUrl ? 'transparent' : bgColor
  });
  if (avatarUrl) {
    avatar = <Avatar sx={sx} src={avatarUrl} />;
  } else {
    avatar = <Avatar sx={sx}>{author[0]?.toUpperCase()}</Avatar>;
  }
  return <span className={`message-avatar ddd ${classes}`}>{avatar}</span>;
};

export { AvatarElement };
