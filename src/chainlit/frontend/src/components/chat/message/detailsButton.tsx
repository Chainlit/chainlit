import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { INestedMessage } from 'state/chat';
import GreyButton from 'components/greyButton';
import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';
import CircularProgress from '@mui/material/CircularProgress';

interface Props {
  message: INestedMessage;
  opened: boolean;
  loading?: boolean;
  onClick: () => void;
}

export default function DetailsButton({
  message,
  opened,
  onClick,
  loading
}: Props) {
  const pSettings = useRecoilValue(projectSettingsState);

  const nested = !!message.subMessages?.length;

  const tool = nested ? message.subMessages![0].author : undefined;

  const show =
    nested || (loading && (!message.content || message.authorIsUser));

  if (!show || pSettings?.hideCot) {
    return null;
  }

  const text = loading ? (tool ? `Using ${tool}` : 'Running') : `Used ${tool}`;

  let id = '';
  if (tool) {
    id = tool.trim().toLowerCase().replaceAll(' ', '-');
  }
  if (loading) {
    id += '-loading';
  } else {
    id += '-done';
  }

  return (
    <GreyButton
      id={id}
      disableElevation
      disableRipple
      sx={{
        textTransform: 'none'
      }}
      color="primary"
      startIcon={
        loading ? <CircularProgress color="inherit" size={16} /> : undefined
      }
      variant="contained"
      endIcon={
        nested && tool ? (
          opened ? (
            <ExpandLessIcon />
          ) : (
            <ExpandMoreIcon />
          )
        ) : undefined
      }
      onClick={tool ? onClick : undefined}
    >
      {text}
    </GreyButton>
  );
}
