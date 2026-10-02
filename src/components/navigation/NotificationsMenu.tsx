import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'Compliance' | 'Requests' | 'Assets' | 'Master' | 'Governance';
  tone: 'warning' | 'info' | 'success';
  timestamp: string;
  read: boolean;
  linkPath?: string;
  actionLabel?: string;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Vehicle Inspection Due',
    message: 'Annual SASO safety and emissions compliance certification for Fleet Vehicle AST-002 expires in 5 days.',
    category: 'Compliance',
    tone: 'warning',
    timestamp: '12m ago',
    read: false,
    linkPath: '/assets/compliance',
    actionLabel: 'View Compliance',
  },
  {
    id: 'notif-2',
    title: 'Asset Request REQ-2024-042 Approved',
    message: 'Requisition for 5x Engineering Laptops has been approved by IT Governance. Pending custodian allocation.',
    category: 'Requests',
    tone: 'success',
    timestamp: '45m ago',
    read: false,
    linkPath: '/assets/requests',
    actionLabel: 'Review Request',
  },
  {
    id: 'notif-3',
    title: 'Server Hardware Warranty Notice',
    message: 'OEM hardware maintenance warranty for Dell PowerEdge (SRV-04) expires within 30 days in Riyadh DC.',
    category: 'Assets',
    tone: 'warning',
    timestamp: '2h ago',
    read: false,
    linkPath: '/assets/registry',
    actionLabel: 'Inspect Asset',
  },
  {
    id: 'notif-4',
    title: 'Custody Handover Completed',
    message: 'MacBook Pro 16" (AST-DEV-008) custody transfer was confirmed and signed by Sarah Al-Otaibi.',
    category: 'Assets',
    tone: 'info',
    timestamp: 'Yesterday',
    read: true,
    linkPath: '/assets/registry',
    actionLabel: 'View Record',
  },
  {
    id: 'notif-5',
    title: 'Master Category Updated',
    message: 'New master classification taxonomy updated for Cloud Infrastructure equipment.',
    category: 'Master',
    tone: 'info',
    timestamp: '2 days ago',
    read: true,
    linkPath: '/assets/master/categories',
    actionLabel: 'View Master',
  },
];

export interface NotificationsMenuProps {
  onNavigate: (path: string) => void;
}

export function NotificationsMenu({ onNavigate }: NotificationsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    return true;
  });

  // Handle outside click & Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: !item.read } : item))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item: AppNotification) => {
    handleMarkAsRead(item.id);
    if (item.linkPath) {
      onNavigate(item.linkPath);
      setIsOpen(false);
    }
  };

  const renderToneIcon = (tone: AppNotification['tone']) => {
    switch (tone) {
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        );
      case 'success':
        return (
          <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-8 h-8 rounded-md bg-awn-primary-soft border border-awn-border text-awn-primary flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Header Notification Trigger Button */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : 'Notifications'
        }
        title={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : 'Notifications'
        }
        className={`relative p-2 rounded-md transition-colors cursor-pointer ${
          isOpen
            ? 'bg-awn-surface-alt text-awn-text-primary border border-awn-border'
            : 'text-awn-text-secondary hover:text-awn-text-primary hover:bg-awn-surface-alt border border-transparent'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-awn-gold text-awn-text-primary font-bold text-[10px] rounded-full flex items-center justify-center shadow-xs border-2 border-awn-surface leading-none tabular-nums animate-in fade-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-awn-surface border border-awn-border rounded-lg shadow-xl z-50 overflow-hidden flex flex-col text-awn-text-primary"
        >
          {/* Popover Header */}
          <div className="px-4 py-3 border-b border-awn-border flex items-center justify-between gap-3 bg-awn-surface">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-awn-text-primary">
                Notifications
              </span>
              {unreadCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-awn-gold-soft text-awn-text-primary border border-awn-gold/30 tabular-nums">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-awn-surface-alt text-awn-text-muted">
                  All caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-awn-text-secondary hover:text-awn-primary px-2 py-1 rounded hover:bg-awn-surface-alt transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications panel"
                className="p-1 rounded text-awn-text-muted hover:text-awn-text-primary hover:bg-awn-surface-alt cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subheader Filter Tabs */}
          <div className="px-4 py-2 border-b border-awn-border bg-awn-surface-alt/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-awn-surface text-awn-primary font-semibold shadow-xs border border-awn-border'
                    : 'text-awn-text-secondary hover:text-awn-text-primary'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-awn-surface text-awn-primary font-semibold shadow-xs border border-awn-border'
                    : 'text-awn-text-secondary hover:text-awn-text-primary'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-awn-text-muted hover:text-rose-500 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-awn-border">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-awn-surface-alt border border-awn-border flex items-center justify-center text-awn-text-muted mb-2">
                  <BellOff className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-awn-text-primary">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
                <p className="text-[11px] text-awn-text-muted mt-0.5 max-w-[220px]">
                  {filter === 'unread'
                    ? 'You are all caught up with your enterprise asset alerts.'
                    : 'All notifications have been cleared.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex gap-3 text-left transition-colors cursor-pointer relative group ${
                    !item.read
                      ? 'bg-awn-surface-alt/60 hover:bg-awn-surface-alt'
                      : 'bg-awn-surface hover:bg-awn-surface-alt/40'
                  }`}
                >
                  {/* Category / Tone Icon */}
                  {renderToneIcon(item.tone)}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-awn-text-muted">
                        {item.category}
                      </span>
                      <span className="text-awn-text-muted text-[10px]">·</span>
                      <span className="text-[11px] text-awn-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>

                    <h4
                      className={`text-xs mt-0.5 leading-snug truncate ${
                        !item.read
                          ? 'font-semibold text-awn-text-primary'
                          : 'font-medium text-awn-text-secondary'
                      }`}
                    >
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-awn-text-secondary mt-1 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>

                    {item.linkPath && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-awn-primary hover:underline">
                        <span>{item.actionLabel || 'View Details'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Actions & Unread Indicator */}
                  <div className="absolute right-3 top-3.5 flex flex-col items-end gap-2">
                    {!item.read && (
                      <span
                        className="w-2 h-2 rounded-full bg-awn-gold ring-2 ring-awn-surface"
                        title="Unread notification"
                      />
                    )}

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleToggleRead(item.id, e)}
                        title={item.read ? 'Mark as unread' : 'Mark as read'}
                        className="p-1 rounded text-awn-text-muted hover:text-awn-text-primary hover:bg-awn-surface cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDismiss(item.id, e)}
                        title="Dismiss notification"
                        className="p-1 rounded text-awn-text-muted hover:text-rose-500 hover:bg-awn-surface cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Popover Footer */}
          <div className="p-2.5 bg-awn-surface-alt/70 border-t border-awn-border flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onNavigate('/assets/requests');
                setIsOpen(false);
              }}
              className="text-[11px] font-medium text-awn-text-secondary hover:text-awn-primary transition-colors cursor-pointer"
            >
              View Requests Queue
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('/assets/audit-trails');
                setIsOpen(false);
              }}
              className="text-[11px] font-medium text-awn-text-secondary hover:text-awn-primary transition-colors cursor-pointer"
            >
              Audit Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
