'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, TrendingUp, Zap, PieChart, Menu, X, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useHealth } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: health } = useHealth();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/agent', label: 'Agent Profile', icon: User },
    { href: '/signals', label: 'Market Data', icon: TrendingUp },
    { href: '/trade', label: 'Trade Details', icon: Zap },
    { href: '/portfolio', label: 'Portfolio', icon: PieChart },
  ];

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 block md:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:sticky left-0 top-0 z-30 h-screen w-64 border-r border-slate-700 bg-slate-900 transition-transform md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-400" />
              Macro-Sentry
            </h1>
            <p className="mt-1 text-xs text-slate-400">AI Trading Agent</p>
          </div>

          {/* Health Status */}
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  health?.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                )}
              />
              <span className="text-xs font-medium text-slate-300">
                {health?.status === 'healthy' ? 'Backend Connected' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    className="w-full justify-start gap-3"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-700 pt-4">
            <Badge variant="secondary" className="text-xs">
              Sepolia Testnet
            </Badge>
            <p className="mt-2 text-xs text-slate-500">
              Contract: <br />
              <code className="font-mono">0xCfAF15...</code>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
