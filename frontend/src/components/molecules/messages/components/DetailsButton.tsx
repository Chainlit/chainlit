import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { GreyButton } from 'components/atoms/buttons/GreyButton';
import { Translator } from 'components/i18n';

import type { IStep } from 'client-types/';

interface Props {
  message: IStep;
  opened: boolean;
  loading?: boolean;
  onClick: () => void;
}

const DetailsButton = ({ message, opened, onClick, loading }: Props) => {
  const messageContext = useContext(MessageContext);
  const nestedCount = message.steps?.length;
  const nested = !!nestedCount && !messageContext.hideCot;

  const lastStep = nested ? message.steps![nestedCount - 1] : undefined;

  const tool = lastStep ? lastStep.name : undefined;

  if (!tool) {
    return null;
  }

  // Don't count empty steps
  const stepCount = nestedCount
    ? message.steps!.filter((m) => !!m.output || m.steps?.length).length
    : 0;

  const text = (
    <span>
      {loading ? (
        <>
          <Translator path="components.molecules.detailsButton.using" /> {tool}
        </>
      ) : (
        <>
          <Translator
            path="components.molecules.detailsButton.took"
            options={{
              count: stepCount
            }}
          />
        </>
      )}
    </span>
  );

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
      size="small"
      id={id}
      sx={{ marginTop: 1, mr: 'auto' }}
      color="primary"
      variant="contained"
      endIcon={
        nested && tool ? opened ? <ExpandLess /> : <ExpandMore /> : undefined
      }
      onClick={tool ? onClick : undefined}
    >
      {text}
    </GreyButton>
  );
};

export { DetailsButton };
