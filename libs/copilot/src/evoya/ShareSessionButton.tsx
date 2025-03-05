import { MdContentCopy } from "react-icons/md";
// import Language from '@mui/icons-material/Language';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';
import { useTranslation, Trans } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle
} from '@chainlit/app/src/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';
import LoadingButton from '@mui/lab/LoadingButton';
import { Translator } from '@chainlit/app/src/components/i18n';
import { EvoyaShareLink } from './types';
import { useContext, useState, useRef } from 'react';

import { Share2 } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';

import { Button } from '@chainlit/app/src/components/ui/button';
import { Loader2, ChevronDown } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@chainlit/app/src/components/Alert"
import { ChainlitContext } from '@chainlit/react-client';
import { WidgetContext } from "@/context";


const ShareLink = (props: any) => <a href={props.url} target='_blank' className='underline'>{props.children}</a>;

const shareLinkExpires = (expires) => {
  switch (expires) {
    case 0:
      return <Trans i18nKey={`components.molecules.shareSession.expire.never`} />;
    case 1:
      return <Trans i18nKey="components.molecules.shareSession.expire.1Day" />;
    default:
      // return <Translator path="components.molecules.shareSession.expire.xDays" />;
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

export const Select = ({
  value,
  onChange,
  options,
  label,
  className = "",
  ...props
}) => {
  const selectRef = useRef(null);

  const handleIconClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
      selectRef.current.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    }
  };
  return (
    <div className={`relative ${className}`}>
      <select
        ref={selectRef}
        value={value}
        onChange={onChange}
        className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
        placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50 appearance-none`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div
        onClick={handleIconClick}
        className="absolute right-3 top-3 h-4 w-4 cursor-pointer"
      >
        <ChevronDown className="opacity-50" />
      </div>
    </div>
  );
};

export default function ShareSessionButton({ sessionUuid }: Props) {
  const { t } = useTranslation();
  const [expireTime, setExpireTime] = useState(7); // 7days, 30days, never
  const [expireTimeDynamic, setExpireTimeDynamic] = useState(7);
  const [shareLink, setShareLink] = useState<EvoyaShareLink>({});
  const [open, setOpen] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreatingStatic, setIsCreatingStatic] = useState<boolean>(false);
  const [isCreatingDynamic, setIsCreatingDynamic] = useState<boolean>(false);
  const [isOverlayError, setIsOverlayError] = useState<boolean>(false);
  const { accessToken, evoya } = useContext(WidgetContext);

  const options = [
    { value: "7", label: "7 days" },
    { value: "31", label: "31 days" },
    { value: "0", label: "Never" }
  ];


  const handleClickOpen = async () => {
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
      } catch (e) {
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
      } catch (e) {
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
          // body: formData,
          body: JSON.stringify({
            ...(expireTime > 0 ? { expires_in: expireTime } : {}),
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
      } catch (e) {
        console.error(e);
        toast.error(<Translator path="components.molecules.shareSession.messages.error" />);

      } finally {
        setIsCreatingStatic(false);
        setIsCreatingDynamic(false);
      }
    }
  };

  return (
    <div>
      <Button
        id="share-session-button"
        size="icon"
        variant="ghost"
        onClick={handleClickOpen}
      >
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Share2 fill='#5c5c5c' className="!size-5 text-muted-foreground" strokeWidth={1.25} />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                <Translator path="components.molecules.shareSession.openButton" />
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Button>
      <Dialog open={open} onOpenChange={handleClose} aria-labelledby="share-alert-dialog-title" aria-describedby="share-alert-dialog-description">
        <DialogContent className="z-[999] sm:max-w-[425px] lg:max-w-[960px]">
          <DialogHeader>
            <DialogTitle id="share-alert-dialog-title">
              <Translator path="components.molecules.shareSession.openButton" />
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className='flex justify-center'>
              <Loader2 className='animate-spin text-primary' />
            </div>
          ) : (
            <>
              <div className='flex items-center justify-between flex-wrap'>
                <div className='flex gap-3'>
                  <MdContentCopy className="!size-5 text-muted-foreground " />
                  <Translator path="components.molecules.shareSession.types.static" />
                </div>
                <div className='flex gap-3'>
                  <Select
                    value={expireTime}
                    onChange={(e) => setExpireTime(parseInt(e.target.value))}
                    options={options}
                    label={t('components.molecules.shareSession.expire.expiresIn')}
                    className="w-[min(200px)]"
                  />
                  {shareLink.type === 'STATIC' ? (
                    <Button variant="default" disabled={isCreatingStatic} onClick={() => handleCopyShareLink('STATIC', expireTime)}>
                      {isCreatingStatic && <Loader2 className="animate-spin" />}
                      <Translator path="components.molecules.shareSession.copyUpdateButton" />
                    </Button>
                  ) : (
                    <Button variant="default" disabled={isCreatingStatic} onClick={() => handleCopyShareLink('STATIC', expireTime)}>
                      {isCreatingStatic && <Loader2 className="animate-spin" />}
                      <Translator path="components.molecules.shareSession.copyButton" />
                    </Button>
                  )}
                </div>

              </div>
              <div className='flex items-center justify-between flex-wrap' >
                <div className='flex gap-3'>
                  <MdContentCopy className="!size-5 text-muted-foreground " />
                  <Translator path="components.molecules.shareSession.types.dynamic" />
                </div>
                <div className='flex gap-3'>
                  <Select
                    value={expireTimeDynamic}
                    onChange={(e) => setExpireTimeDynamic(parseInt(e.target.value))}
                    options={options}
                    label={t('components.molecules.shareSession.expire.expiresIn')}
                    className="w-[min(200px)]"
                  />
                  <Button variant="default" onClick={() => handleCopyShareLink('DYNAMIC', expireTimeDynamic)}>
                    {isCreatingDynamic && <Loader2 className="animate-spin" />}
                    <Translator path="components.molecules.shareSession.copyButton" />
                  </Button>
                </div>
              </div>
              {shareLink.url && (
                <div>
                  <Alert
                    severity="info"
                  >
                    <Trans
                      i18nKey="components.molecules.shareSession.messages.created"
                      components={{
                        shareLink: <ShareLink url={shareLink.url} />,
                        expires: shareLinkExpires(shareLink.expire),
                        // expires: <>{t(`components.molecules.shareSession.expire.${shareLink.expire}`)}</>
                      }}
                    />
                    <Button variant="outline" size="small" className='ml-2 p-1 px-2 text-red-500 border-red-500 hover:bg-red-500 hover:text-white' onClick={() => handleRevokeShareLink(shareLink)}>
                      <Translator path="components.molecules.shareSession.revokeLinkButton" />
                    </Button>
                  </Alert>
                </div>
              )}
            </>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outlined" onClick={handleClose}>
              <Translator path="components.molecules.shareSession.closeButton" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}