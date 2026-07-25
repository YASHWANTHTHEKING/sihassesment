import { Link, useLocation } from 'wouter';
import { LayoutDashboard, FileText, Building2, BrainCircuit, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/applications', label: 'Applications', icon: FileText },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/predictions', label: 'Predictions', icon: BrainCircuit },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-56 flex flex-col" style={{ backgroundColor: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--sidebar-border))' }}>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-primary-foreground))' }}>
            PC
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
              PlaceCell
            </div>
            <div className="text-xs leading-tight" style={{ color: 'hsl(var(--sidebar-foreground) / 0.5)' }}>
              Placement Tracker
            </div>
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/applications/new"
          data-testid="link-new-application"
          className="flex items-center gap-2 w-full px-3 py-2 rounded text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-primary-foreground))' }}
        >
          <Plus size={13} />
          New Application
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <div className="text-[10px] font-semibold uppercase tracking-widest px-2 pb-1 pt-2" style={{ color: 'hsl(var(--sidebar-foreground) / 0.35)' }}>
          Navigation
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? location === '/' : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              data-testid={`nav-${label.toLowerCase()}`}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded text-sm font-medium transition-all',
                isActive
                  ? 'text-white'
                  : 'hover:opacity-100'
              )}
              style={isActive
                ? { backgroundColor: 'hsl(var(--sidebar-accent))', color: 'hsl(var(--sidebar-foreground))' }
                : { color: 'hsl(var(--sidebar-foreground) / 0.65)' }
              }
            >
              <Icon size={15} className={isActive ? 'opacity-100' : 'opacity-70'} />
              {label}
              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full" style={{ backgroundColor: 'hsl(var(--sidebar-primary))' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="text-[10px]" style={{ color: 'hsl(var(--sidebar-foreground) / 0.35)' }}>
          Placement Cell v1.0
        </div>
      </div>
    </aside>
  );
}
