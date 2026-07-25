import { useGetDashboardStats, useGetPipeline, useGetRecentActivity, useGetCompanyBreakdown } from '@workspace/api-client-react';
import { Shell } from '@/components/layout/Shell';
import { SkeletonCards, SkeletonTable } from '@/components/SkeletonTable';
import { StageBadge, OfferBadge } from '@/components/StageBadge';
import { Link } from 'wouter';
import { TrendingUp, Users, Building2, Package, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';

const STAGE_COLORS: Record<string, string> = {
  Applied: '#3b82f6',
  Shortlisted: '#f59e0b',
  Interview: '#8b5cf6',
  Selected: '#10b981',
  Rejected: '#ef4444',
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-lg border p-4 flex flex-col gap-3"
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--card-border))',
        boxShadow: 'var(--shadow-xs)',
      }}
      data-testid="stat-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {label}
        </span>
        <div
          className="w-7 h-7 rounded flex items-center justify-center"
          style={{
            backgroundColor: accent ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--muted))',
          }}
        >
          <Icon size={14} style={{ color: accent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
        </div>
      </div>
      <div>
        <div
          className="text-2xl font-bold tabular-nums fade-up"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: accent ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}
        >
          {value}
        </div>
        {sub && (
          <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useGetDashboardStats();
  const { data: pipeline, isLoading: pipelineLoading } = useGetPipeline();
  const { data: recent, isLoading: recentLoading } = useGetRecentActivity();
  const { data: breakdown, isLoading: breakdownLoading } = useGetCompanyBreakdown();

  return (
    <Shell>
      <div className="page-in px-6 py-5 max-w-[1400px]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Placement Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Live overview of all placement drives and student applications
          </p>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <SkeletonCards count={4} />
        ) : statsError ? (
          <div className="flex items-center gap-2 p-4 rounded-lg border text-sm" style={{ borderColor: 'hsl(var(--destructive) / 0.3)', backgroundColor: 'hsl(var(--destructive) / 0.05)', color: 'hsl(var(--destructive))' }}>
            <AlertCircle size={15} />
            Failed to load dashboard stats. Please refresh.
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Applications"
              value={stats.totalApplications != null ? stats.totalApplications.toLocaleString() : '—'}
              sub={`${stats.totalStudents ?? '—'} unique students`}
              icon={Users}
            />
            <StatCard
              label="Offers Extended"
              value={stats.totalOffers != null ? stats.totalOffers.toLocaleString() : '—'}
              sub={`${stats.totalCompanies ?? '—'} companies`}
              icon={TrendingUp}
              accent
            />
            <StatCard
              label="Offer Rate"
              value={stats.offerRate != null ? `${stats.offerRate.toFixed(1)}%` : '—'}
              sub={`${stats.pendingApplications ?? '—'} still pending`}
              icon={Package}
            />
            <StatCard
              label="Avg Package"
              value={stats.avgPackage != null ? `${stats.avgPackage.toFixed(2)} LPA` : '—'}
              sub="for selected students"
              icon={Building2}
            />
          </div>
        ) : null}

        {/* Pipeline + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Pipeline chart */}
          <div
            className="lg:col-span-2 rounded-lg border p-4"
            style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  Application Pipeline
                </div>
                <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Stage distribution across all drives
                </div>
              </div>
            </div>

            {pipelineLoading ? (
              <div className="h-52 flex items-center justify-center">
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading pipeline...</div>
              </div>
            ) : Array.isArray(pipeline) && pipeline.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipeline} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <XAxis
                      dataKey="stage"
                      tick={{ fontSize: 11, fill: 'hsl(222 15% 50%)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(222 15% 50%)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px',
                        boxShadow: 'var(--shadow)',
                      }}
                      labelStyle={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      formatter={(value: number, name: string) => [value, 'Applications']}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {pipeline.map((entry) => (
                        <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] ?? '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                No pipeline data available
              </div>
            )}

            {/* Legend */}
            {Array.isArray(pipeline) && pipeline.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                {pipeline.map((p) => (
                  <div key={p.stage} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS[p.stage] ?? '#94a3b8' }} />
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {p.stage} ({p.count})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div
            className="rounded-lg border p-4 flex flex-col"
            style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Recent Activity
              </div>
              <Clock size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>

            {recentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: 'hsl(var(--muted))' }} />
                ))}
              </div>
            ) : Array.isArray(recent) && recent.length > 0 ? (
              <div className="flex-1 overflow-auto space-y-0 -mx-4">
                {recent.slice(0, 10).map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    data-testid={`activity-row-${app.id}`}
                    className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                    >
                      {app.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                        {app.studentName}
                      </div>
                      <div className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {app.company}
                      </div>
                    </div>
                    <StageBadge stage={app.stage} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Company Breakdown Table */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Company Breakdown
              </div>
              <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Offer rate and package per company
              </div>
            </div>
            <Link
              href="/companies"
              data-testid="link-all-companies"
              className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'hsl(var(--primary))' }}
            >
              View all
              <ArrowRight size={11} />
            </Link>
          </div>

          {breakdownLoading ? (
            <SkeletonTable rows={5} cols={6} />
          ) : Array.isArray(breakdown) && breakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="company-breakdown-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Company', 'Total', 'Offers', 'Rejections', 'Pending', 'Offer Rate', 'Avg Package'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {breakdown.slice(0, 8).map((row, i) => (
                    <tr
                      key={row.company}
                      data-testid={`breakdown-row-${i}`}
                      className="hover:bg-muted/40 transition-colors"
                      style={{ borderBottom: i < breakdown.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                    >
                      <td className="px-4 py-2.5 font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        {row.company}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}>
                        {row.total}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#10b981' }}>
                        {row.offers}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#ef4444' }}>
                        {row.rejections}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
                        {row.pending}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(row.offerRate ?? 0, 100)}%`,
                                backgroundColor: (row.offerRate ?? 0) >= 50 ? '#10b981' : (row.offerRate ?? 0) >= 25 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="tabular-nums text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}>
                            {(row.offerRate ?? 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}>
                        {row.avgPackage != null ? `${row.avgPackage.toFixed(2)} LPA` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No company data yet. Add applications to see the breakdown.
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
