import toast from 'react-hot-toast';
import ContentCopy from '@mui/icons-material/ContentCopy';
import { IconButton, Tooltip } from '@mui/material';

import { IMessage } from 'state/chat';

const size = '16px';

interface Props {
    message: IMessage;
}

export default function CopyButton({ message }: Props) {
    const onCopyClick = async () => {
        try {
            if (message.content) {
                await navigator.clipboard.writeText(message.content); // Copy message content
                toast.success('Message copied!'); // Show success toast
            }
        } catch (err) {
            console.error('Failed to copy text:', err);
            toast.error('Failed to copy text.'); // Show error toast
        }
    };

    return (
        <Tooltip title="Copy message">
            <IconButton
                className="copy-message"
                onClick={onCopyClick}
                size="small"
            >
                <ContentCopy sx={{ width: size, height: size }} />
            </IconButton>
        </Tooltip>
    );
}
