import { IAction, IThread } from '@chainlit/react-client';

interface IActionParams {
  name: string;
  forId: string;
  value: any;
  label?: string;
  description?: string;
}

const createAction = (params: IActionParams): IAction => {
  const { name, forId, value, label, description } = params;

  return {
    name,
    forId,
    id: `action_${name}_${forId}`,
    value: typeof value === 'string' ? value : JSON.stringify(value),
    onClick: () => {},
    collapsed: false,
    label,
    description
  };
};

export const createResumeChatMessage = (thread: IThread): IAction => {
  return createAction({
    name: 'on_chat_resume',
    forId: thread.id,
    value: thread
  });
};

export const createAnalyticsDataMessage = (
  threadId: string,
  pageData: { url: string; name: string }
): IAction => {
  return createAction({
    name: 'on_analytics_data_receive',
    forId: threadId,
    value: pageData
  });
};
