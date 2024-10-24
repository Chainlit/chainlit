import {
  Box,
  Tooltip
} from '@mui/material';

// import { TextSection } from 'evoya/types';
import { usePrivacyShield } from './usePrivacyShield';
import { useMemo } from 'react';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTranslation } from 'react-i18next';

interface Props {
  sectionId: string;
}

const ResponseTextItem = ({ sectionId }: Props): JSX.Element => {
  const {
    categories,
    enabledVisual,
  } = usePrivacyShield();
  const { t } = useTranslation();

  const sectionItem = useMemo(() => Object.values(categories).flatMap((cat) => cat).find((sec) => sec.id === sectionId), [categories, sectionId]);

  if (!sectionItem?.isAnon) {
    return (
      <Box
        sx={{
          display: 'inline',
          cursor: 'help',
          color: (theme: any) => theme.palette.error.main
        }}
      >
        <Tooltip
          title={t("components.organisms.privacyShield.word.notAnon")}
        >
          <>{sectionItem?.string ?? ''}</>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'inline',
        cursor: 'help',
        color: (theme: any) => sectionItem?.isAnon ? theme.palette.success.main : theme.palette.error.main
      }}
    >
      <Tooltip
        title={enabledVisual ? t("components.organisms.privacyShield.word.anon") : sectionItem.string}
      >
        <span>
          {enabledVisual ? sectionItem?.string : sectionItem.anonString}
          {enabledVisual && <LockOutlinedIcon sx={{ fontSize: "16px", marginLeft: .5 }} />}
        </span>
      </Tooltip>
    </Box>
  );
}

export default ResponseTextItem;