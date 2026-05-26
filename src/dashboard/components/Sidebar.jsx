import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  sidebarOpen, 
  setSidebarOpen, 
  sidebarItems, 
  sidebarGroups = [],
  activeView, 
  selectView 
}) => {
  const { t } = useTranslation();
  const itemMap = useMemo(() => new Map(sidebarItems.map((item) => [item.id, item])), [sidebarItems]);
  const activeGroupId = useMemo(() => sidebarGroups.find((group) => group.items.includes(activeView))?.id || sidebarGroups[0]?.id, [activeView, sidebarGroups]);
  const [openGroups, setOpenGroups] = useState(() => activeGroupId ? { [activeGroupId]: true } : {});
  const [sidebarTooltip, setSidebarTooltip] = useState(null);

  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => ({ ...prev, [activeGroupId]: true }));
    }
  }, [activeGroupId]);

  const toggleGroup = (groupId) => {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  };

  const showCollapsedTooltip = (event, label) => {
    if (!sidebarCollapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setSidebarTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const hideCollapsedTooltip = () => setSidebarTooltip(null);

  const renderNavItem = (item, compact = false) => {
    const isActive = activeView === item.id;
    const itemLabel = t(`dashboard.${item.i18nKey}`, item.label);
    const handleSelect = () => {
      if (item.path) {
        window.location.href = item.path;
        return;
      }
      selectView(item.id);
    };

    return (
      <button
        key={item.id}
        type="button"
        title={itemLabel}
        aria-label={itemLabel}
        onMouseEnter={(event) => showCollapsedTooltip(event, itemLabel)}
        onMouseLeave={hideCollapsedTooltip}
        onFocus={(event) => showCollapsedTooltip(event, itemLabel)}
        onBlur={hideCollapsedTooltip}
        onClick={handleSelect}
        className={`
          dashboard-sidebar-link group relative flex items-center gap-3 transition-all duration-300
          ${compact || sidebarCollapsed ? 'justify-center rounded-2xl px-3 py-3' : 'rounded-2xl px-3.5 py-2.5'}
          ${isActive
            ? 'is-active bg-white text-[#172554] shadow-[0_14px_35px_rgba(37,99,235,0.18)]'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }
        `}
        style={{ '--item-accent': item.accent }}
      >
        {isActive && !compact && !sidebarCollapsed && (
          <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#4d83ee]" />
        )}
        <span className={`
          flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300
          ${isActive
            ? 'bg-[#dbeafe] text-[#2563eb] shadow-none'
            : 'bg-white/[0.05] text-slate-400 ring-1 ring-white/10 group-hover:bg-blue-500/15 group-hover:text-blue-200 group-hover:ring-blue-400/30'
          }
        `}>
          <i className={`${item.icon} text-[0.95rem]`} aria-hidden="true" />
        </span>

        {!sidebarCollapsed && !compact && (
          <>
            <span className="min-w-0 flex-1 truncate text-left text-[0.86rem] font-black tracking-tight">
              {itemLabel}
            </span>
            <i className={`fa-solid fa-chevron-right text-[0.65rem] transition ${isActive ? 'text-blue-500' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} aria-hidden="true" />
          </>
        )}
      </button>
    );
  };

  return (
    <>
      <aside 
        className={`
        fixed inset-y-0 left-0 z-50 flex flex-col gap-5 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${sidebarCollapsed ? 'w-[100px]' : 'w-[310px]'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-visible border-r border-white/10 p-4 lg:relative
        bg-[radial-gradient(circle_at_top_left,rgba(77,131,238,0.24),transparent_28%),linear-gradient(180deg,#15172f_0%,#202341_46%,#111827_100%)]
        shadow-[24px_0_90px_rgba(0,0,0,0.42)]
      `}
      >
      <div className="pointer-events-none absolute inset-x-3 top-3 h-32 rounded-[2rem] bg-white/[0.035] blur-2xl" />
      {/* Brand Section */}
      <Link
        to="/"
        className={`relative flex items-center gap-4 rounded-[1.65rem] border border-white/10 bg-white/[0.075] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition-all duration-300 no-underline hover:bg-white/[0.12] hover:border-white/20 ${sidebarCollapsed ? 'justify-center' : ''}`}
        title="Go to home page"
        aria-label="Go to home page"
      >
        <img 
          src="/assets/images/logo.png" 
          alt="Institute Einstein" 
          className="h-12 w-12 shrink-0 rounded-2xl bg-white p-1.5 object-contain shadow-lg shadow-blue-950/20" 
        />
        {!sidebarCollapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <strong className="whitespace-nowrap bg-gradient-to-br from-white to-blue-100 bg-clip-text text-[1.03rem] font-[900] tracking-tight text-transparent">
              Institute Einsteins
            </strong>
            <span className="mt-1 text-[0.62rem] font-black uppercase tracking-[0.22em] text-blue-200/70">Management Console</span>
          </div>
        )}
      </Link>

      {/* Toggle Button */}
      <button 
        className="absolute -right-4 top-8 z-[90] flex h-9 w-9 items-center justify-center rounded-2xl border border-blue-100 bg-white text-[#172554] shadow-[0_18px_42px_rgba(15,23,42,0.28)] transition-transform hover:scale-105"
        type="button" 
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
        aria-label="Toggle sidebar"
      >
        <i className={`fa-solid ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`}></i>
      </button>

      {/* Navigation */}
      <nav className="relative flex flex-1 flex-col gap-3 overflow-y-auto no-scrollbar pr-1" aria-label="Dashboard navigation">
        {!sidebarCollapsed && (
          <small className="px-2 text-[0.66rem] font-black uppercase tracking-[0.24em] text-slate-500">
            Main Menu
          </small>
        )}

        {sidebarCollapsed ? (
          sidebarItems.map((item) => renderNavItem(item, true))
        ) : (
          sidebarGroups.map((group) => {
            const groupItems = group.items.map((id) => itemMap.get(id)).filter(Boolean);
            const isOpen = !!openGroups[group.id];
            return (
              <section key={group.id} className={`rounded-[1.45rem] border p-1.5 transition ${isOpen ? 'border-blue-400/20 bg-blue-500/[0.045]' : 'border-white/10 bg-white/[0.028]'}`}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-white/10 ${isOpen ? 'bg-blue-500 text-white shadow-[0_10px_24px_rgba(59,130,246,0.22)]' : 'bg-white/[0.06] text-blue-300'}`}>
                      <i className={group.icon} aria-hidden="true" />
                    </span>
                    <span className="truncate text-[0.68rem] font-black uppercase tracking-[0.18em]">{group.label}</span>
                  </span>
                  <i className={`fa-solid fa-chevron-down text-[0.7rem] text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {isOpen && (
                  <div className="mt-1 grid gap-1">
                    {groupItems.map((item) => renderNavItem(item))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </nav>

      {/* Compact Status Indicator */}
      {!sidebarCollapsed && (
        <div className="relative mt-auto rounded-[1.35rem] border border-emerald-400/15 bg-emerald-500/[0.06] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
            <span className="text-[0.64rem] font-black uppercase tracking-[0.2em] text-emerald-200/80">System Online</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400" />
          </div>
        </div>
      )}

      {/* Collapsed Mini Status Indicator */}
      {sidebarCollapsed && (
         <div className="mt-auto flex justify-center p-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
         </div>
      )}

      </aside>

      {sidebarCollapsed && sidebarTooltip && (
        <div
          className="pointer-events-none fixed z-[120] -translate-y-1/2 rounded-xl border border-slate-700/70 bg-slate-950 px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_45px_rgba(0,0,0,0.38)]"
          style={{ top: sidebarTooltip.top, left: sidebarTooltip.left }}
        >
          {sidebarTooltip.label}
        </div>
      )}
    </>
  );
};

export default Sidebar;
