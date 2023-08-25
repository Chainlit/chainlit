export enum FeedbackStatus {
  DISLIKED = -1,
  DEFAULT = 0,
  LIKED = 1
}

export type Feedback = {
  status: FeedbackStatus;
  comment?: string;
};
