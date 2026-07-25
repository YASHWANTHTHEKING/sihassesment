import { useState, useMemo } from 'react';
import { useListCompanies } from '@workspace/api-client-react';
import { Shell } from '@/components/layout/Shell';
import { SkeletonTable } from '@/components/SkeletonTable';
import { Link } from 'wouter';
import { AlertCircle, Building2, ArrowRight, Search, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

export default function Companies() {
  const { data: companies, isLoading, isError, refetch } = useListCompanies();

  const [search, setSearch] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'drives' | 'applications' | 'offers' | 'offerRate' | 'date'>('applications');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedCompanies = useMemo(() => {
    if (!companies) return [];

    return companies
      .filter((c) => {
        // Search filter by company name
        if (search.trim() && !c.company.toLowerCase().includes(search.trim().toLowerCase())) {
          return false;
        }

        const offerRate = c.applicationCount > 0
          ? ((c.offerCount ?? 0) / c.applicationCount) * 100
          : 0;

        // Performance filter
        if (performanceFilter === 'high' && offerRate < 30) return false;
        if (performanceFilter === 'low' && offerRate >= 30) return false;
        if (performanceFilter === 'with_offers' && (c.offerCount ?? 0) === 0) return false;
        if (performanceFilter === 'no_offers' && (c.offerCount ?? 0) > 0) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

        if (sortBy === 'name') {
          valA = a.company.toLowerCase();
          valB = b.company.toLowerCase();
        } else if (sortBy === 'drives') {
          valA = a.driveCount;
          valB = b.driveCount;
        } else if (sortBy === 'applications') {
          valA = a.applicationCount;
          valB = b.applicationCount;
        } else if (sortBy === 'offers') {
          valA = a.offerCount ?? 0;
          valB = b.offerCount ?? 0;
        } else if (sortBy === 'offerRate') {
          valA = a.applicationCount > 0 ? ((a.offerCount ?? 0) / a.applicationCount) * 100 : 0;
          valB = b.applicationCount > 0 ? ((b.offerCount ?? 0) / b.applicationCount) * 100 : 0;
        } else if (sortBy === 'date') {
          valA = a.latestDriveDate ? new Date(a.latestDriveDate).getTime() : 0;
          valB = b.latestDriveDate ? new Date(b.latestDriveDate).getTime() : 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [companies, search, performanceFilter, sortBy, sortOrder]);

  const hasActiveFilters = Boolean(search || performanceFilter);

  const clearFilters = () => {
    setSearch('');
    setPerformanceFilter('');
  };

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
              {companies != null
                ? `${filteredAndSortedCompanies.length} of ${companies.length} companies shown`
                : 'All companies that have conducted drives'}
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div
          className="flex flex-wrap gap-2.5 mb-4 p-3 rounded-lg border"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))' }}
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies by name..."
              className="pl-9 h-9 text-sm"
              data-testid="input-search-companies"
            />
          </div>

          <Select value={performanceFilter || '__all__'} onValueChange={(val) => setPerformanceFilter(val === '__all__' ? '' : val)}>
            <SelectTrigger className="w-[180px] h-9 text-sm" data-testid="select-filter-performance">
              <Filter size={13} className="mr-1.5 opacity-60" />
              <SelectValue placeholder="Offer Performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Performance</SelectItem>
              <SelectItem value="high">High Offer Rate (≥30%)</SelectItem>
              <SelectItem value="low">Low Offer Rate (&lt;30%)</SelectItem>
              <SelectItem value="with_offers">Has Offers</SelectItem>
              <SelectItem value="no_offers">No Offers Yet</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={`${sortBy}_${sortOrder}`}
            onValueChange={(val) => {
              const [field, order] = val.split('_') as [typeof sortBy, typeof sortOrder];
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <SelectTrigger className="w-[200px] h-9 text-sm" data-testid="select-sort-companies">
              <ArrowUpDown size={13} className="mr-1.5 opacity-60" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applications_desc">Most Applications</SelectItem>
              <SelectItem value="offers_desc">Most Offers</SelectItem>
              <SelectItem value="offerRate_desc">Highest Offer Rate</SelectItem>
              <SelectItem value="drives_desc">Most Drives</SelectItem>
              <SelectItem value="name_asc">Company Name (A-Z)</SelectItem>
              <SelectItem value="date_desc">Latest Drive Date</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              data-testid="btn-clear-company-filters"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Summary cards */}
        {!isLoading && filteredAndSortedCompanies && filteredAndSortedCompanies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Companies</div>
              <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{filteredAndSortedCompanies.length}</div>
            </div>
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Drives</div>
              <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {filteredAndSortedCompanies.reduce((acc, c) => acc + c.driveCount, 0)}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Applications</div>
              <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {filteredAndSortedCompanies.reduce((acc, c) => acc + c.applicationCount, 0)}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Offers</div>
              <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--primary))' }}>
                {filteredAndSortedCompanies.reduce((acc, c) => acc + (c.offerCount ?? 0), 0)}
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
          ) : filteredAndSortedCompanies.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <Building2 size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                No companies found
              </div>
              <div className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {hasActiveFilters
                  ? 'Try adjusting or clearing your search and filter criteria.'
                  : 'Add applications to see company summaries here.'}
              </div>
              {hasActiveFilters ? (
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Link href="/applications/new">
                  <Button size="sm">Add Application</Button>
                </Link>
              )}
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
                  {filteredAndSortedCompanies.map((company, i) => {
                    const offerRate = company.applicationCount > 0
                      ? ((company.offerCount ?? 0) / company.applicationCount) * 100
                      : 0;

                    return (
                      <tr
                        key={company.company}
                        data-testid={`company-row-${i}`}
                        className="hover:bg-muted/40 transition-colors group"
                        style={{ borderBottom: i < filteredAndSortedCompanies.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
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
