"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/actions/notifications";
import { useRouter } from "next/navigation";

type NotificationType = Awaited<ReturnType<typeof getNotifications>>[number];

const TYPE_COLORS: Record<string, string> = {
  renewal_due: "bg-amber-500",
  member_joined: "bg-green-500",
  payment_received: "bg-emerald-500",
  member_lapsed: "bg-red-500",
  automation_completed: "bg-blue-500",
  campaign_sent: "bg-purple-500",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [, startAction] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load unread count on mount and periodically
  useEffect(() => {
    getUnreadCount().then(setUnreadCount);
    const interval = setInterval(() => {
      getUnreadCount().then(setUnreadCount);
    }, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Load notifications when panel opens
  useEffect(() => {
    if (open) {
      getNotifications().then(setNotifications);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleMarkRead(id: string) {
    startAction(async () => {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  }

  function handleMarkAllRead() {
    startAction(async () => {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });
  }

  function handleDelete(id: string) {
    startAction(async () => {
      await deleteNotification(id);
      const wasUnread = notifications.find((n) => n.id === id && !n.read);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    });
  }

  function handleClick(notification: NotificationType) {
    if (!notification.read) handleMarkRead(notification.id);
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  }

  function timeAgo(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg dark:bg-[var(--card)] sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-7 text-xs">
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </Button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
                <p className="text-sm text-[var(--muted-foreground)]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`group flex cursor-pointer gap-3 border-b border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--muted)] ${!n.read ? "bg-[var(--primary)]/5" : ""}`}
                  onClick={() => handleClick(n)}
                >
                  <div
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? TYPE_COLORS[n.type] || "bg-[var(--primary)]" : "bg-transparent"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-medium" : "text-[var(--muted-foreground)]"}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)] line-clamp-2">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.id);
                        }}
                        className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--border)]"
                        title="Mark read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n.id);
                      }}
                      className="rounded p-1 text-[var(--muted-foreground)] hover:bg-red-100 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
