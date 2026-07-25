import { useState } from 'react';
import { useListApplications, getListApplicationsQueryKey } from '@workspace/api-client-react';
import { Shell } from '@/components/layout/Shell';
import { StageBadge, OfferBadge } from '@/components/StageBadge';
import { SkeletonTable } from '@/components/SkeletonTable';
import { Link, useLocation } from 'wouter';
import { Search, Plus, AlertCircle, ChevronRight, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

const STAGES = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];
const OFFER_STATUSES = ['Pending', 'Offered', 'Rejected', 'Withdrawn'];

export default function Applications() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [offerStatus, setOfferStatus] = useState('');

  const params = {
    ...(search ? { search } : {}),
    ...(stage ? { stage } : {}),
    ...(offerStatus ? { offer_status: offerStatus } : {}),
  };

  const { data: applications, isLoading, isError, refetch } = useListApplications(params);

  return (
    <Shell>
      <div className="page-in px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Applications
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {applications != null ? `${applications.length} record${applications.length !== 1 ? 's' : ''}` : 'All placement applications'}
            </p>
          </div>
          <Link href="/applications/new" data-testid="btn-new-application">
            <Button size="sm" className="gap-1.5" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
              <Plus size={14} />
              New Application
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap gap-2.5 mb-4 p-3 rounded-lg border"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))' }}
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <Input
              type="search"
              placeholder="Search by student, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              data-testid="input-search"
            />
          </div>

          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="h-8 w-36 text-sm" data-testid="select-stage">
              <Filter size={12} className="mr-1 opacity-50" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={offerStatus} onValueChange={setOfferStatus}>
            <SelectTrigger className="h-8 w-36 text-sm" data-testid="select-offer-status">
              <SelectValue placeholder="Offer Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              {OFFER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(search || stage || offerStatus) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setSearch(''); setStage(''); setOfferStatus(''); }}
              data-testid="btn-clear-filters"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Table */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}
        >
          {isLoading ? (
            <SkeletonTable rows={10} cols={7} />
          ) : isError ? (
            <div className="px-4 py-12 flex flex-col items-center gap-3">
              <AlertCircle size={24} style={{ color: 'hsl(var(--destructive))' }} />
              <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Failed to load applications.
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : !applications || applications.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                No applications found
              </div>
              <div className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {search || stage || offerStatus
                  ? 'Try adjusting your filters.'
                  : 'Get started by adding the first application.'}
              </div>
              {!search && !stage && !offerStatus && (
                <Link href="/applications/new">
                  <Button size="sm">Add Application</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="applications-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
                    {['App ID', 'Student', 'Company', 'Drive Date', 'Stage', 'Offer', 'Package'].map((h) => (
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
                  {applications.map((app, i) => (
                    <tr
                      key={app.id}
                      data-testid={`application-row-${app.id}`}
                      className="hover:bg-muted/40 transition-colors cursor-pointer group"
                      style={{ borderBottom: i < applications.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                      onClick={() => setLocation(`/applications/${app.id}`)}
                    >
                      <td className="px-4 py-2.5">
                        <span className="tabular-nums text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
                          {app.applicationId}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {app.studentName}
                        </div>
                        <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {app.studentId} {app.branch ? `· ${app.branch}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        {app.company}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-xs whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
                        {app.driveDate ? format(new Date(app.driveDate), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <StageBadge stage={app.stage} />
                      </td>
                      <td className="px-4 py-2.5">
                        <OfferBadge status={app.offerStatus} />
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}>
                        {app.package != null ? `${app.package.toFixed(2)} LPA` : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
