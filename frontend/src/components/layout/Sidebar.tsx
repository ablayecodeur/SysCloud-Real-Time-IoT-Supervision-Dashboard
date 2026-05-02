'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Cpu, Bell, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { href: '/devices', label: 'Devices',   icon: Cpu },
  { href: '/alerts',  label: 'Alerts',    icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex flex-col shrink-0 bg-slate-800 border-r border-slate-700">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
        <Activity className="w-6 h-6 text-blue-400" />
        <span className="font-bold text-white tracking-tight">SysCloud</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-500">v1.0.0</p>
      </div>
    </aside>
  );
}
