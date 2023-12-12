import { IThread } from 'src/types';

export const groupByDate = (data: IThread[]) => {
  const groupedData: { [key: string]: IThread[] } = {};

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  data.forEach((item) => {
    const createdAt = new Date(item.createdAt);
    const isToday = createdAt.toDateString() === today.toDateString();
    const isYesterday = createdAt.toDateString() === yesterday.toDateString();
    const isLast7Days = createdAt >= sevenDaysAgo;
    const isLast30Days = createdAt >= thirtyDaysAgo;

    let category: string;

    if (isToday) {
      category = 'Today';
    } else if (isYesterday) {
      category = 'Yesterday';
    } else if (isLast7Days) {
      category = 'Previous 7 days';
    } else if (isLast30Days) {
      category = 'Previous 30 days';
    } else {
      const monthYear = createdAt.toLocaleString('default', {
        month: 'long',
        year: 'numeric'
      });

      category = monthYear.split(' ').slice(0, 1).join(' ');
    }

    if (!groupedData[category]) {
      groupedData[category] = [];
    }

    groupedData[category].push(item);
  });

  return groupedData;
};
