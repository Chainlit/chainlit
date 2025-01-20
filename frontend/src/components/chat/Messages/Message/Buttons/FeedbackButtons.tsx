'use client';

import { MessageContext } from '@/contexts/MessageContext';
import { MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useCallback, useContext, useState } from 'react';
import { useRecoilValue } from 'recoil';

import {
  IStep,
  firstUserInteraction,
  useChatSession
} from '@chainlit/react-client';

import Translator from '@/components/i18n/Translator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface FeedbackButtonsProps {
  message: IStep;
}

export function FeedbackButtons({ message }: FeedbackButtonsProps) {
  const { onFeedbackUpdated, onFeedbackDeleted, showFeedbackButtons } =
    useContext(MessageContext);

  const [feedback, setFeedback] = useState<number | undefined>(
    message.feedback?.value
  );
  const [comment, setComment] = useState<string | undefined>(
    message.feedback?.comment
  );
  const [showDialog, setShowDialog] = useState<number>();
  const [commentInput, setCommentInput] = useState<string>();
  const firstInteraction = useRecoilValue(firstUserInteraction);
  const { idToResume } = useChatSession();

  if (!showFeedbackButtons) {
    return null;
  }

  const handleFeedbackChange = useCallback(
    (newFeedback?: number, newComment?: string) => {
      if (newFeedback === undefined) {
        if (onFeedbackDeleted && message.feedback?.id) {
          onFeedbackDeleted(
            message,
            () => {
              setFeedback(undefined);
              setComment(undefined);
            },
            message.feedback.id
          );
        }
      } else if (onFeedbackUpdated) {
        onFeedbackUpdated(
          message,
          () => {
            setFeedback(newFeedback);
            setComment(newComment);
          },
          {
            ...(message.feedback || {}),
            forId: message.id,
            threadId: message.threadId,
            value: newFeedback,
            comment: newComment
          }
        );
      }
    },
    [message, onFeedbackDeleted, onFeedbackUpdated]
  );

  const handleFeedbackClick = useCallback(
    (nextValue: number) => {
      if (feedback === nextValue) {
        handleFeedbackChange(undefined);
      } else {
        setShowDialog(nextValue);
      }
    },
    [feedback, handleFeedbackChange]
  );

  const isDisabled = message.streaming || !(firstInteraction || idToResume);

  return (
    <div className="flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isDisabled}
              onClick={() => handleFeedbackClick(1)}
              className={
                feedback === 1
                  ? 'text-green-600 positive-feedback-on'
                  : 'text-muted-foreground positive-feedback-off'
              }
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <Translator path="chat.messages.feedback.positive" />
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isDisabled}
              onClick={() => handleFeedbackClick(0)}
              className={
                feedback === 0
                  ? 'text-red-600 negative-feedback-on'
                  : 'text-muted-foreground negative-feedback-off'
              }
            >
              <ThumbsDown />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <Translator path="chat.messages.feedback.negative" />
          </TooltipContent>
        </Tooltip>

        {comment && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isDisabled}
                onClick={() => {
                  setShowDialog(feedback);
                  setCommentInput(comment);
                }}
              >
                <MessageCircle />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <Translator path="chat.messages.feedback.edit" />
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>

      <Dialog
        open={showDialog !== undefined}
        onOpenChange={() => setShowDialog(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showDialog === 0 ? <ThumbsDown /> : <ThumbsUp />}
              <Translator path="chat.messages.feedback.dialog.title" />
            </DialogTitle>
          </DialogHeader>

          <Textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value || undefined)}
            placeholder="Your feedback..."
            className="min-h-[100px]"
          />

          <DialogFooter>
            <Button
              id="submit-feedback"
              onClick={() => {
                if (showDialog !== undefined) {
                  handleFeedbackChange(showDialog, commentInput);
                }
                setShowDialog(undefined);
                setCommentInput(undefined);
              }}
            >
              <Translator path="chat.messages.feedback.dialog.submit" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
