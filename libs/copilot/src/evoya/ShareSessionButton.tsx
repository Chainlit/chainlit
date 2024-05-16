import Share from '@mui/icons-material/Share';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Language from '@mui/icons-material/Language';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';
import { useTranslation, Trans } from 'react-i18next';

import { Box, IconButton, Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, InputLabel, MenuItem, FormControl, Select, Alert, CircularProgress } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { SelectChangeEvent } from '@mui/material/Select';
import { Translator } from '@chainlit/app/src/components/i18n';
import { EvoyaShareLink } from './types';

import { WidgetContext } from 'context';
import { useContext, useState } from 'react';

const ShareLink = (props: any) => <a href={props.url} target='_blank'>{props.children}</a>;
const shareLinkExpires = (expires) => {
  switch(expires) {
    case 0:
      return <Trans i18nKey={`components.molecules.shareSession.expire.never`} />;
    case 1:
      return <Trans i18nKey="components.molecules.shareSession.expire.1Day" />;
    default:
      return <Trans
        i18nKey="components.molecules.shareSession.expire.xDays"
        components={{
          days: expires.toString()
        }}
      />
  }
}

interface Props {
  sessionUuid: string;
}

export default function ShareSessionButton({ sessionUuid }: Props) {
  const { t } = useTranslation();
  const { evoya, accessToken } = useContext(WidgetContext);
  const [expireTime, setExpireTime] = useState(7); // 7days, 30days, never
  const [expireTimeDynamic, setExpireTimeDynamic] = useState(7);
  const [shareLink, setShareLink] = useState<EvoyaShareLink>({});
  const [open, setOpen] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreatingStatic, setIsCreatingStatic] = useState<boolean>(false);
  const [isCreatingDynamic, setIsCreatingDynamic] = useState<boolean>(false);
  const [isOverlayError, setIsOverlayError] = useState<boolean>(false);

  const handleClickOpen = async() => {
    setOpen(true);
    setIsLoading(true);
    if (evoya?.api) {
      try {
        const shareDataResponse = await fetch(evoya.api.share.check.replace('{{uuid}}', sessionUuid), {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'same-origin'
        });
        if (!shareDataResponse.ok) {
          throw new Error(shareDataResponse.statusText);
        }
        const shareData = await shareDataResponse.json();
        if (shareData.error) {
          setShareLink({});
        } else if (shareData.success) {
          let dateDiff = 0;
          if (shareData.data.expires_at) {
            const expiresAt = new Date(shareData.data.expires_at);
            dateDiff = Math.round(Math.abs(new Date() - expiresAt) / 86400000);
          }
          const shareConfig: EvoyaShareLink = {
            expire: dateDiff,
            type: shareData.data.share_type,
            url: shareData.data.link
          };
          setShareLink(shareConfig);
        }
      } catch(e) {
        setIsOverlayError(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleRevokeShareLink = async (shareLinkConfig: EvoyaShareLink) => {
    if (evoya?.api?.share && accessToken) {
      try {
        const shareResponse = await fetch(evoya.api.share.remove.replace('{{uuid}}', sessionUuid), {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'X-CSRFTOKEN': evoya.api.csrf_token,
          },
          credentials: 'same-origin'
        });
        if (!shareResponse.ok) {
          throw new Error(shareResponse.statusText);
        }
        await shareResponse.json();

        toast.success(<Translator path="components.molecules.shareSession.messages.successRemove" />);
        setShareLink({});
      } catch(e) {
        console.error(e);
        toast.error(<Translator path="components.molecules.shareSession.messages.error" />);
      }
    }
  }

  const handleCopyShareLink = async (type: string, expireTime: number) => {
    const shareConfig: EvoyaShareLink = {
      expire: expireTime,
      type
    };
    if (evoya?.api?.share && accessToken) {
      if (type === 'STATIC') {
        setIsCreatingStatic(true);
      } else {
        setIsCreatingDynamic(true);
      }
      try {
        const shareResponse = await fetch(evoya.api.share.add.replace('{{uuid}}', sessionUuid), {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFTOKEN': evoya.api.csrf_token,
          },
          body: JSON.stringify({
            ...(expireTime > 0 ? {expires_in: expireTime}: {}),
            share_type: type
          }),
          credentials: 'same-origin'
        });
        if (!shareResponse.ok) {
          throw new Error(shareResponse.statusText);
        }
        const shareData = await shareResponse.json();
        if (shareData.success) {
          const shareUrl = shareData.data.link;

          await copyToClipboard(shareUrl);
          toast.success(<Translator path="components.molecules.shareSession.messages.success" />);
          shareConfig.url = shareUrl;
          setShareLink(shareConfig);
        } else {
          toast.error(<Translator path="components.molecules.shareSession.messages.error" />);
        }
      } catch(e) {
        console.error(e);
        toast.error(<Translator path="components.molecules.shareSession.messages.error" />);
      } finally {
        setIsCreatingStatic(false);
        setIsCreatingDynamic(false);
      }
    }
  };

  return (
    <Box>
      <Tooltip
        title={<Translator path="components.molecules.shareSession.openButton" />}
      >
        <IconButton edge="end" id="share-session-button" onClick={handleClickOpen}>
          <Share sx={{ width: 20, height: 20 }} />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="share-alert-dialog-title"
        aria-describedby="share-alert-dialog-description"
      >
        <DialogTitle id="share-alert-dialog-title">
          <Translator path="components.molecules.shareSession.openButton" />
        </DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: '300px' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DialogContentText id="share-alert-dialog-description">
              <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 1 }}>
                <ContentCopy sx={{ width: 20, height: 20 }} />
                <Box sx={{ flexGrow: '1', marginLeft: 1, marginRight: 2 }}>
                  <Translator path="components.molecules.shareSession.types.static" />
                </Box>
                <Box sx={{ marginRight: 2 }}>
                  <FormControl size="small" sx={{ width: '150px'}}>
                    <InputLabel id="expirein-label" sx={{ marginLeft: 0 }}>
                      <Translator path="components.molecules.shareSession.expire.expiresIn" />
                    </InputLabel>
                    <Select
                      labelId="expirein-label"
                      id="expirein-label-select"
                      value={expireTime}
                      label={t('components.molecules.shareSession.expire.expiresIn')}
                      onChange={(e: SelectChangeEvent) => setExpireTime(parseInt(e.target.value))}
                    >
                      <MenuItem value={7}>
                        <Translator path="components.molecules.shareSession.expire.7days" />
                      </MenuItem>
                      <MenuItem value={31}>
                        <Translator path="components.molecules.shareSession.expire.30days" />
                      </MenuItem>
                      <MenuItem value={0}>
                        <Translator path="components.molecules.shareSession.expire.never" />
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {shareLink.type === 'STATIC' ? (
                  <LoadingButton variant="contained" loading={isCreatingStatic} loadingPosition="center" onClick={() => handleCopyShareLink('STATIC', expireTime)}>
                    <Translator path="components.molecules.shareSession.copyUpdateButton" />
                  </LoadingButton>
                ) : (
                  <LoadingButton variant="contained" loading={isCreatingStatic} loadingPosition="center" onClick={() => handleCopyShareLink('STATIC', expireTime)}>
                    <Translator path="components.molecules.shareSession.copyButton" />
                  </LoadingButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 3 }}>
                <Language sx={{ width: 20, height: 20 }} />
                <Box sx={{ flexGrow: '1', marginLeft: 1, marginRight: 3 }}>
                  <Translator path="components.molecules.shareSession.types.dynamic" />
                </Box>
                <Box sx={{ marginRight: 2 }}>
                  <FormControl size="small" sx={{ width: '150px'}}>
                    <InputLabel id="expirein-label" sx={{ marginLeft: 0 }}>
                      <Translator path="components.molecules.shareSession.expire.expiresIn" />
                    </InputLabel>
                    <Select
                      labelId="expirein-label"
                      id="expirein-label-select"
                      value={expireTimeDynamic}
                      label={t('components.molecules.shareSession.expire.expiresIn')}
                      onChange={(e: SelectChangeEvent) => setExpireTimeDynamic(parseInt(e.target.value))}
                    >
                      <MenuItem value={7}>
                        <Translator path="components.molecules.shareSession.expire.7days" />
                      </MenuItem>
                      <MenuItem value={31}>
                        <Translator path="components.molecules.shareSession.expire.30days" />
                      </MenuItem>
                      <MenuItem value={0}>
                        <Translator path="components.molecules.shareSession.expire.never" />
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <LoadingButton variant="contained" loading={isCreatingDynamic} loadingPosition="center" onClick={() => handleCopyShareLink('DYNAMIC', expireTimeDynamic)}>
                  <Translator path="components.molecules.shareSession.copyButton" />
                </LoadingButton>
              </Box>
              {shareLink.url && (
                <Box sx={{ marginTop: 3 }}>
                  <Alert
                    severity="info"
                    sx={{ alignItems: 'center' }}
                    action={
                      <Button variant="outlined" size="small" onClick={() => handleRevokeShareLink(shareLink)}>
                        <Translator path="components.molecules.shareSession.revokeLinkButton" />
                      </Button>
                    }
                  >
                    <Trans
                      i18nKey="components.molecules.shareSession.messages.created"
                      components={{
                        shareLink: <ShareLink url={shareLink.url} />,
                        expires: shareLinkExpires(shareLink.expire),
                      }}
                    />
                  </Alert>
                </Box>
              )}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            <Translator path="components.molecules.shareSession.closeButton" />
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
