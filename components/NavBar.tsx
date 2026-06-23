'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/goal-system', label: '目标', icon: '🎯' },
  { href: '/training-plan', label: '训练计划', icon: '📋' },
  { href: '/exercise-library', label: '动作库', icon: '📚' },
  { href: '/custom-plan', label: '自定义', icon: '✏️' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-gym-dark/95 backdrop-blur border-b border-gym-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl">🏋️</span>
            <span className="font-bold text-lg text-white hidden sm:inline">Training System</span>
            <span className="text-xs text-gym-muted bg-gym-card px-1.5 py-0.5 rounded">V1</span>
          </Link>

          {/* 桌面端顶部导航链接 */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gym-muted hover:text-white hover:bg-gym-card'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 底部导航栏（移动端） */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gym-dark/95 backdrop-blur border-t border-gym-border md:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary-400'
                    : 'text-gym-muted hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 移动端底部导航占位 */}
      <div className="md:hidden h-16" />
    </>
  );
}
