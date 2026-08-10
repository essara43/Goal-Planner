import type { ReactNode } from 'react';
import type { NavSection } from '../navigation';

interface LayoutProps {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'goals', label: 'Objectifs' },
  { id: 'settings', label: 'Paramètres' },
];

export function Layout({ active, onNavigate, children }: LayoutProps) {
  return (
    <div className="min-h-full">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-accent-strong focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Aller au contenu
      </a>

      <header className="border-b border-line bg-surface/70">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-lg font-extrabold tracking-tight text-accent-strong">
            🎯 Goal Planner
          </span>
          <nav aria-label="Navigation principale">
            <ul className="flex gap-1">
              {NAV_ITEMS.map((item) => {
                const current = item.id === active;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      aria-current={current ? 'page' : undefined}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        current
                          ? 'bg-accent-soft font-semibold text-ink'
                          : 'text-ink-dim hover:bg-surface-2 hover:text-ink'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenu" className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
