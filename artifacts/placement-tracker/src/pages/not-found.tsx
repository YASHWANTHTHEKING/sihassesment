import { Link } from 'wouter';
import { Shell } from '@/components/layout/Shell';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <Shell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div
          className="text-7xl font-bold tabular-nums mb-4"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground) / 0.3)' }}
        >
          404
        </div>
        <h1 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
          Page not found
        </h1>
        <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/">
          <Button size="sm" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </Shell>
  );
}
