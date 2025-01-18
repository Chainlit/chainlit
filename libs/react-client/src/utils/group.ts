import { IThread } from 'src/types';

export const groupByDate = (data: IThread[]) => {
  const groupedData: { [key: string]: IThread[] } = {};
  
  const today = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );
  
  [...data].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).forEach((item) => {
    const date = new Date(item.createdAt);
    const threadDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    
    const daysDiff = Math.floor((today.getTime() - threadDate.getTime()) / 86400000);
    
    let category: string;
    if (daysDiff < 0) {  // 添加这个判断
      category = 'Today';
    } else if (daysDiff === 0) {
      category = 'Today';
    } else if (daysDiff === 1) {
      category = 'Yesterday';
    } else if (daysDiff <= 7) {
      category = 'Previous 7 days';
    } else if (daysDiff <= 30) {
      category = 'Previous 30 days';
    } else {
      category = threadDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric'
      });
    }
    
    groupedData[category] ??= [];
    groupedData[category].push(item);
  });

  return groupedData;
};
