import { useListCompanies } from '@workspace/api-client-react';
import { Shell } from '@/components/layout/Shell';
import { SkeletonTable } from '@/components/SkeletonTable';
import { Link } from 'wouter';
import { AlertCircle, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function Companies() {
  const { data: companies, isLoading, isError, refetch } = useListCompanies();

  return (
    <Shell>
      <div className="page-in px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Companies
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {companies != null ? `${companies.length} companies with placement drives` : 'All companies that have conducted drives'}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        {!isLoading && companies && companies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Companies</div>
              <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{companies.length}</div>
            </div>
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Drives</div>
              <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {companies.reduce((acc, c) => acc + c.driveCount, 0)}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Applications</div>
              <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {companies.reduce((acc, c) => acc + c.applicationCount, 0)}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Offers</div>
              <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--primary))' }}>
                {companies.reduce((acc, c) => acc + (c.offerCount ?? 0), 0)}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}
        >
          {isLoading ? (
            <SkeletonTable rows={8} cols={5} />
          ) : isError ? (
            <div className="px-4 py-12 flex flex-col items-center gap-3">
              <AlertCircle size={24} style={{ color: 'hsl(var(--destructive))' }} />
              <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Failed to load company data.</div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : !companies || companies.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <Building2 size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                No companies yet
              </div>
              <div className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Add applications to see company summaries here.
              </div>
              <Link href="/applications/new">
                <Button size="sm">Add Application</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="companies-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
                    {['Company', 'Drives', 'Applications', 'Offers', 'Offer Rate', 'Latest Drive'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {h}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company, i) => {
                    const offerRate = company.applicationCount > 0
                      ? ((company.offerCount ?? 0) / company.applicationCount) * 100
                      : 0;

                    return (
                      <tr
                        key={company.company}
                        data-testid={`company-row-${i}`}
                        className="hover:bg-muted/40 transition-colors group"
                        style={{ borderBottom: i < companies.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                            >
                              {company.company.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                              {company.company}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}>
                          {company.driveCount}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}>
                          {company.applicationCount}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#10b981' }}>
                          {company.offerCount ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(offerRate, 100)}%`,
                                  backgroundColor: offerRate >= 50 ? '#10b981' : offerRate >= 25 ? '#f59e0b' : '#ef4444',
                                }}
                              />
                            </div>
                            <span className="tabular-nums text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}>
                              {offerRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-xs whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
                          {company.latestDriveDate
                            ? format(new Date(company.latestDriveDate), 'dd MMM yyyy')
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/applications?company=${encodeURIComponent(company.company)}`}
                            data-testid={`link-company-applications-${i}`}
                            className="flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'hsl(var(--primary))' }}
                          >
                            View
                            <ArrowRight size={11} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
