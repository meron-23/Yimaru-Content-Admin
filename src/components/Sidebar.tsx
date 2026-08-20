import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Library, 
  CalendarClock, 
  CheckCircle, 
  Plus
} from 'lucide-react';

interface SidebarProps {
  onOpenCreateModal: () => void;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenCreateModal,
  pendingCount
}) => {
  const navItems = [
    { id: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: '/content', label: 'Content Library', icon: <Library className="w-5 h-5" />, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: '/upcoming', label: 'Upcoming', icon: <CalendarClock className="w-5 h-5" /> },
    { id: '/published', label: 'Published History', icon: <CheckCircle className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 h-full flex flex-col hidden md:flex shrink-0">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Yimaru Logo" className="w-9 h-9 object-contain" />
          <div className="flex flex-col justify-center">
            <h1 className="font-bold text-[16px] leading-none text-slate-900 dark:text-white tracking-tight mb-1">
              Yimaru
            </h1>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase leading-none">
              CMS SYSTEM
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.id}
            to={item.id}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900 font-medium'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: '#9A288D', color: '#ffffff' }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span
                className="px-2 py-0.5 text-xs font-bold rounded-full"
                style={{ backgroundColor: '#FFD23F', color: '#9A288D' }}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        <div className="mt-8">
          <button
            onClick={onOpenCreateModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-md transition-all active:scale-95 hover:opacity-90"
            style={{ backgroundColor: '#9A288D' }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Content</span>
          </button>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-xs">
            OU
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">Owner User</span>
            <span className="text-[10px] text-slate-500 font-medium truncate">Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

