import { useEffect, useState } from 'react';
import { SidebarContent } from '@/components/ui/sidebar';

interface InfoPanelData {
  [key: string]: string;
}

interface InfoPanelPayload {
  data: InfoPanelData;
  title: string;
}

// 本地存储键名
const INFO_PANEL_STORAGE_KEY = 'chainlit_info_panel_data';
const INFO_PANEL_TITLE_STORAGE_KEY = 'chainlit_info_panel_title';
// 会话标志键，用于标记当前会话是否已收到数据
const INFO_PANEL_SESSION_KEY = 'chainlit_info_panel_session';

// 从本地存储获取数据的辅助函数
const getStoredInfoData = (): InfoPanelData | null => {
  try {
    // 检查当前会话是否已收到数据
    const sessionReceived = localStorage.getItem(INFO_PANEL_SESSION_KEY);
    if (!sessionReceived) {
      return null; // 新会话，不读取旧数据
    }
    
    const storedData = localStorage.getItem(INFO_PANEL_STORAGE_KEY);
    if (!storedData) return null;
    const parsedData = JSON.parse(storedData);
    return Object.keys(parsedData).length > 0 ? parsedData : null;
  } catch (error) {
    console.error("Error parsing stored info panel data:", error);
    return null;
  }
};

// 从本地存储获取标题的辅助函数
const getStoredTitle = (): string => {
  try {
    // 检查当前会话是否已收到数据
    const sessionReceived = localStorage.getItem(INFO_PANEL_SESSION_KEY);
    if (!sessionReceived) {
      return "信息面板"; // 新会话，使用默认标题
    }
    
    return localStorage.getItem(INFO_PANEL_TITLE_STORAGE_KEY) || "信息面板";
  } catch (error) {
    console.error("Error reading stored info panel title:", error);
    return "信息面板";
  }
};

// 重置会话标志，在每次页面加载时调用
const resetSessionFlag = () => {
  localStorage.removeItem(INFO_PANEL_SESSION_KEY);
};

export default function InfoPanel() {
  const [infoData, setInfoData] = useState<InfoPanelData | null>(getStoredInfoData);
  const [title, setTitle] = useState<string>(getStoredTitle);

  // 在组件加载时重置会话标志
  useEffect(() => {
    resetSessionFlag();
  }, []);

  console.log("InfoPanel component rendered");

  useEffect(() => {
    console.log("InfoPanel: Setting up window event listener");

    const handleInfoUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<InfoPanelPayload>;
      console.log("InfoPanel: Received info data from window event:", customEvent.detail);
      
      // 标记当前会话已收到数据
      localStorage.setItem(INFO_PANEL_SESSION_KEY, 'true');
      
      // 更新状态并保存到本地存储
      const newData = customEvent.detail.data;
      const newTitle = customEvent.detail.title;
      
      // 只在数据或标题变化时更新
      if (JSON.stringify(infoData) !== JSON.stringify(newData)) {
        setInfoData(newData);
      }
      
      if (title !== newTitle) {
        setTitle(newTitle);
      }
      
      // 存储到localStorage
      if (newData && Object.keys(newData).length > 0) {
        localStorage.setItem(INFO_PANEL_STORAGE_KEY, JSON.stringify(newData));
        localStorage.setItem(INFO_PANEL_TITLE_STORAGE_KEY, newTitle);
      } else {
        // 如果数据为空，清除存储
        localStorage.removeItem(INFO_PANEL_STORAGE_KEY);
        localStorage.removeItem(INFO_PANEL_TITLE_STORAGE_KEY);
        localStorage.removeItem(INFO_PANEL_SESSION_KEY);
      }
    };

    // 监听自定义事件
    window.addEventListener('info_panel_update', handleInfoUpdate);
    
    // 在页面可见性变化时，如从隐藏到可见，尝试重新从存储获取数据
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const storedData = getStoredInfoData();
        const storedTitle = getStoredTitle();
        
        if (storedData && JSON.stringify(infoData) !== JSON.stringify(storedData)) {
          setInfoData(storedData);
        }
        
        if (title !== storedTitle) {
          setTitle(storedTitle);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log("InfoPanel: Cleaning up window event listener");
      window.removeEventListener('info_panel_update', handleInfoUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [infoData, title]);

  // If there's no info data, don't render anything
  if (!infoData || Object.keys(infoData).length === 0) {
    console.log("InfoPanel: No info data to display");
    return null;
  }

  console.log("InfoPanel: Rendering with data:", infoData);
  return (
    <div className="px-3 mb-1 mt-0 pt-0 pb-0 flex-shrink-0">
      <div className="rounded-lg border bg-background shadow-sm">
        <div className="bg-muted px-3 py-2 rounded-t-lg">
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span className="text-sm font-medium">{title}</span>
          </div>
        </div>
        <div className="p-3">
          {Object.entries(infoData).map(([key, value]) => (
            <div key={key} className="flex items-start justify-between pb-1 last:pb-0">
              <span className="text-sm font-medium text-gray-500">{key}:</span>
              <span className="text-sm text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 