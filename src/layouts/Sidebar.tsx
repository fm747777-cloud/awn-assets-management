import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { NAVIGATION_TREE } from '../data/navigationData.ts';
import { RouteIcon } from '../utils/iconMap.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';

export interface SidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentPath,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { isRtl, t } = useLanguage();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'assets-group': true,
    'master-group': true,
    'audit-trail-group': true,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleSelectPath = (path: string) => {
    onNavigate?.(path);
    onCloseMobile?.();
  };

  const renderTreeContent = (isCompact = false) => (
    <div className="flex flex-col h-full bg-awn-surface border-r rtl:border-r-0 rtl:border-l border-awn-border select-none">
      {/* Brand Lockup */}
      <div className="h-14 px-4 border-b border-awn-border flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={() => handleSelectPath('/assets/registry')}
          className="flex items-center gap-2.5 text-left rtl:text-right min-w-0 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-md bg-awn-primary text-awn-on-primary flex items-center justify-center font-semibold text-sm shrink-0">
            ع
          </div>
          {!isCompact && (
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight text-awn-text-primary truncate">
                {isRtl ? 'نظام عَوْن (AWN)' : 'AWN (عَوْن)'}
              </div>
              <div className="text-xs text-awn-text-muted truncate">
                {isRtl ? 'إدارة الأصول' : 'Assets Module'}
              </div>
            </div>
          )}
        </button>

        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label={isRtl ? 'إغلاق القائمة' : 'Close navigation menu'}
            className="lg:hidden p-1.5 rounded-md text-awn-text-secondary hover:text-awn-text-primary hover:bg-awn-surface-alt cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCompact ? (isRtl ? 'توسيع القائمة' : 'Expand sidebar') : (isRtl ? 'طي القائمة' : 'Collapse sidebar')}
            aria-label={isCompact ? (isRtl ? 'توسيع القائمة' : 'Expand sidebar') : (isRtl ? 'طي القائمة' : 'Collapse sidebar')}
            className="hidden lg:inline-flex p-1.5 rounded-md text-awn-text-muted hover:text-awn-text-primary hover:bg-awn-surface-alt cursor-pointer"
          >
            {isCompact ? (
              <PanelLeftOpen className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            ) : (
              <PanelLeftClose className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            )}
          </button>
        )}
      </div>

      {/* Module Hierarchy Tree */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        <div>
          {!isCompact && (
            <div className="px-2.5 pb-2 text-xs font-semibold text-awn-text-muted">
              {isRtl ? 'منظومة الأصول' : 'Assets Workspace'}
            </div>
          )}

          <nav aria-label={isRtl ? 'التنقل في مساحات الأصول' : 'Assets Module Navigation'} className="space-y-1">
            {NAVIGATION_TREE.map((item) => {
              const children = item.children || [];
              const hasChildren = children.length > 0;
              const isDirectActive = currentPath === item.path;
              const isChildActive =
                hasChildren && children.some((child) => child.path === currentPath);
              const isExpanded = Boolean(expandedGroups[item.id]);
              const itemLabel = isRtl ? item.arabicLabel || item.label : item.label;

              if (!hasChildren) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPath(item.path)}
                    title={isCompact ? itemLabel : undefined}
                    aria-current={isDirectActive ? 'page' : undefined}
                    className={`w-full flex items-center ${
                      isCompact ? 'justify-center px-2' : 'justify-between px-2.5'
                    } py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isDirectActive
                        ? 'bg-awn-primary-soft text-awn-primary font-semibold border border-awn-border'
                        : 'text-awn-text-secondary hover:bg-awn-surface-alt hover:text-awn-text-primary border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <RouteIcon
                        name={item.icon}
                        className={`w-4 h-4 shrink-0 ${
                          isDirectActive ? 'text-awn-primary' : 'text-awn-text-muted'
                        }`}
                      />
                      {!isCompact && <span className="truncate">{itemLabel}</span>}
                    </span>
                  </button>
                );
              }

              return (
                <div key={item.id} className="space-y-1">
                  <div
                    className={`w-full flex items-center rounded-md transition-colors border ${
                      isDirectActive
                        ? 'bg-awn-primary-soft text-awn-primary font-semibold border-awn-border'
                        : isChildActive
                        ? 'bg-awn-surface-alt text-awn-text-primary font-medium border-transparent'
                        : 'text-awn-text-secondary hover:bg-awn-surface-alt hover:text-awn-text-primary border-transparent'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isCompact) {
                          handleSelectPath(
                            item.id === 'assets-group'
                              ? item.path
                              : children[0]?.path || item.path
                          );
                        } else if (item.id === 'assets-group') {
                          handleSelectPath(item.path);
                          if (!isExpanded) toggleGroup(item.id);
                        } else {
                          toggleGroup(item.id);
                        }
                      }}
                      title={isCompact ? itemLabel : undefined}
                      aria-current={isDirectActive ? 'page' : undefined}
                      className={`flex-1 flex items-center ${
                        isCompact ? 'justify-center px-2' : 'gap-2.5 px-2.5'
                      } py-2 text-xs text-left rtl:text-right min-w-0 cursor-pointer`}
                    >
                      <RouteIcon
                        name={item.icon}
                        className={`w-4 h-4 shrink-0 ${
                          isDirectActive || isChildActive
                            ? 'text-awn-primary'
                            : 'text-awn-text-muted'
                        }`}
                      />
                      {!isCompact && <span className="truncate">{itemLabel}</span>}
                    </button>

                    {!isCompact && (
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.id)}
                        aria-label={isRtl ? `تبديل قائمة ${itemLabel}` : `Toggle ${itemLabel} submenu`}
                        aria-expanded={isExpanded}
                        className="p-2 text-awn-text-muted hover:text-awn-text-primary cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                    )}
                  </div>

                  {!isCompact && isExpanded && (
                    <div className="ml-4 pl-3 border-l rtl:ml-0 rtl:mr-4 rtl:pl-0 rtl:pr-3 rtl:border-l-0 rtl:border-r border-awn-border space-y-0.5">
                      {children.map((child) => {
                        const childActive = currentPath === child.path;
                        const childLabel = isRtl ? child.arabicLabel || child.label : child.label;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleSelectPath(child.path)}
                            aria-current={childActive ? 'page' : undefined}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                              childActive
                                ? 'bg-awn-primary-soft text-awn-primary font-semibold'
                                : 'text-awn-text-secondary hover:bg-awn-surface-alt hover:text-awn-text-primary'
                            }`}
                          >
                            <RouteIcon
                              name={child.icon}
                              className={`w-3.5 h-3.5 shrink-0 ${
                                childActive ? 'text-awn-primary' : 'text-awn-text-muted'
                              }`}
                            />
                            <span className="truncate">{childLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 border-t border-awn-border bg-awn-surface-alt shrink-0">
        {isCompact ? (
          <div
            className="text-center text-xs font-mono text-awn-text-muted tabular-nums"
            title={isRtl ? 'سجل أصول عَوْن' : 'AWN Assets Workspace'}
          >
            AWN
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-awn-text-secondary">
            <span>{isRtl ? 'منظومة عَوْن المؤسسية' : 'AWN Enterprise'}</span>
            <span className="font-mono text-awn-text-primary font-medium tabular-nums">
              {isRtl ? 'الأصول 1.0' : 'Assets v1.0'}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        aria-label="Primary Sidebar"
        className={`hidden lg:block shrink-0 transition-all duration-150 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderTreeContent(collapsed)}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0"
            style={{ backgroundColor: 'var(--awn-backdrop)' }}
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full">
            {renderTreeContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
