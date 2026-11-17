import React from 'react';

export type AppSection = 'curriculum' | 'sandbox' | 'visualizer' | 'quiz';

interface TopNavProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  onQuickStart: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeSection,
  onNavigate,
  onQuickStart,
}) => {
  const navItems: Array<{ id: AppSection; label: string }> = [
    { id: 'curriculum', label: '課程地圖' },
    { id: 'sandbox', label: '程式沙盒' },
    { id: 'visualizer', label: '執行視覺化' },
    { id: 'quiz', label: '觀念測驗' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('curriculum')}
          className="text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded"
        >
          PyCraft 互動學院
        </button>

        {/* Zone 2: 4 Single-line Text Navigation Links */}
        <nav
          aria-label="主要導覽"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded ${
                  active
                    ? 'text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[19px] h-0.5 bg-sky-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onQuickStart}
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
          >
            立即練習
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="行動裝置導覽"
        className="flex md:hidden items-center justify-around border-t border-slate-100 px-2 py-2 text-xs font-medium bg-white"
      >
        {navItems.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors ${
                active ? 'text-sky-700 bg-sky-50 font-semibold' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
