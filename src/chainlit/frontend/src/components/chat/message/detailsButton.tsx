import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { INestedMessage } from 'state/chat';
import GreyButton from 'components/greyButton';
import { useRecoilValue } from 'recoil';
import CircularProgress from '@mui/material/CircularProgress';
import { settingsState } from 'state/settings';

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
  const { hideCot } = useRecoilValue(settingsState);

  const nestedCount = message.subMessages?.length;
  const nested = !!nestedCount;

  const tool = nested
    ? message.subMessages![nestedCount - 1].author
    : undefined;

  const isRunningEmptyStep = loading && !message.content;
  const isRunningUserMessage = loading && message.authorIsUser;

  const show = nested || isRunningEmptyStep || isRunningUserMessage;

  if (!show || hideCot) {
    return null;
  }

  // Don't count empty steps
  const stepCount = nestedCount
    ? message.subMessages!.filter((m) => !!m.content).length
    : 0;

  const text = loading
    ? tool
      ? `Using ${tool}`
      : 'Running'
    : `Took ${stepCount} step${stepCount <= 1 ? '' : 's'}`;

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
