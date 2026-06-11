import { useEffect, useState, useCallback, useRef, useContext } from "react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { ChainlitContext } from "@chainlit/react-client";

export interface Notification {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
  timestamp: number;
}

export function useNotifications() {
  // Use Chainlit's native auth token instead of Clerk
  const chainlit = useContext(ChainlitContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    if (socketRef.current?.connected) {
      socketRef.current.emit("clear_notifications");
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const initSocket = async () => {
      // Get token from Chainlit's native session
      const token = chainlit?.authConfig?.token;
      const backendUrl = chainlit?.httpEndpoint ?? window.location.origin;
      if (!isActive) return;

      const socket = io(backendUrl, {
        auth: token ? { token } : undefined,
        transports: ['websocket'],
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Socket.io connected successfully");
      });

      socket.on("new_notification", (notif: Notification) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev].slice(0, 19);
        });

        setUnreadCount((n) => n + 1);

        if (notif.type === "success") {
          toast.success(notif.title, { description: notif.message, duration: 6000 });
        } else if (notif.type === "error") {
          toast.error(notif.title, { description: notif.message, duration: 8000 });
        } else {
          toast.info(notif.title, { description: notif.message, duration: 5000 });
        }
      });

      socket.on("connect_error", (err) => {
        console.error("Socket.io connection error:", err.message);
      });
    };

    initSocket();

    return () => {
      isActive = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chainlit]);

  return { notifications, unreadCount, markAllRead };
}
