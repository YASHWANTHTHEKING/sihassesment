import { useListPredictions, getListPredictionsQueryKey, useRunPredictions } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Shell } from '@/components/layout/Shell';
import { RiskBadge } from '@/components/StageBadge';
import { SkeletonTable } from '@/components/SkeletonTable';
import { Button } from '@/components/ui/button';
import { AlertCircle, BrainCircuit, RefreshCw, Loader2, TriangleAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.75 ? '#10b981' : value >= 0.6 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="tabular-nums text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}>
        {pct}%
      </span>
    </div>
  );
}

export default function Predictions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: predictions, isLoading, isError, refetch } = useListPredictions();
  const runMutation = useRunPredictions();

  const handleRunPredictions = () => {
    runMutation.mutate(undefined, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListPredictionsQueryKey() });
        toast({
          title: 'Predictions updated',
          description: result.message || `Processed ${result.count} applications.`,
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to run predictions. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  const needsAttention = predictions?.filter((p) => p.needsAttention) ?? [];
  const highRisk = predictions?.filter((p) => p.riskLevel === 'High') ?? [];

  return (
    <Shell>
      <div className="page-in px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              ML Predictions
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Outcome predictions for active applications
            </p>
          </div>
          <Button
            onClick={handleRunPredictions}
            disabled={runMutation.isPending}
            data-testid="btn-run-predictions"
            className="gap-1.5 text-sm"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {runMutation.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <RefreshCw size={14} />
            }
            Re-run Predictions
          </Button>
        </div>

        {/* Attention banner */}
        {!isLoading && needsAttention.length > 0 && (
          <div
            className="flex items-start gap-3 p-4 rounded-lg border mb-5"
            style={{ backgroundColor: 'hsl(38 92% 52% / 0.08)', borderColor: 'hsl(38 92% 52% / 0.3)' }}
          >
            <TriangleAlert size={16} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                {needsAttention.length} application{needsAttention.length !== 1 ? 's' : ''} need attention
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {highRisk.length} high-risk applications may require intervention. Review them below.
              </div>
            </div>
          </div>
        )}

        {/* Summary row */}
        {!isLoading && predictions && predictions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Total Predictions', value: predictions.length, color: undefined },
              { label: 'High Risk', value: highRisk.length, color: '#ef4444' },
              { label: 'Needs Attention', value: needsAttention.length, color: 'hsl(var(--primary))' },
              {
                label: 'Avg Confidence',
                value: `${Math.round((predictions.reduce((a, p) => a + p.confidence, 0) / predictions.length) * 100)}%`,
                color: undefined,
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</div>
                <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: color ?? 'hsl(var(--foreground))' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}
        >
          {isLoading ? (
            <SkeletonTable rows={10} cols={6} />
          ) : isError ? (
            <div className="px-4 py-12 flex flex-col items-center gap-3">
              <AlertCircle size={24} style={{ color: 'hsl(var(--destructive))' }} />
              <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Failed to load predictions.</div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : !predictions || predictions.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <BrainCircuit size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                No predictions available
              </div>
              <div className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Run the prediction model to generate risk assessments for active applications.
              </div>
              <Button
                size="sm"
                onClick={handleRunPredictions}
                disabled={runMutation.isPending}
                data-testid="btn-run-predictions-empty"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                {runMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <BrainCircuit size={14} className="mr-1.5" />}
                Run Predictions
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="predictions-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
                    {['Student', 'Company', 'Stage', 'Risk Level', 'Confidence', 'Predicted Outcome', 'Attention'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred, i) => (
                    <tr
                      key={`${pred.applicationId}-${i}`}
                      data-testid={`prediction-row-${pred.applicationId}`}
                      className="hover:bg-muted/40 transition-colors"
                      style={{
                        borderBottom: i < predictions.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                        backgroundColor: pred.needsAttention ? 'hsl(38 92% 52% / 0.04)' : undefined,
                      }}
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/applications/${pred.applicationId}`}
                          data-testid={`prediction-link-${pred.applicationId}`}
                          className="font-medium hover:underline"
                          style={{ color: 'hsl(var(--foreground))' }}
                        >
                          {pred.studentName}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'hsl(var(--foreground))' }}>
                        {pred.company}
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {pred.stage}
                      </td>
                      <td className="px-4 py-2.5">
                        <RiskBadge risk={pred.riskLevel} />
                      </td>
                      <td className="px-4 py-2.5">
                        <ConfidenceBar value={pred.confidence} />
                      </td>
                      <td className="px-4 py-2.5">
                        {pred.confidence < 0.6 ? (
                          <span className="text-xs italic" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Low confidence — no forced prediction
                          </span>
                        ) : pred.predictedOutcome ? (
                          <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                            {pred.predictedOutcome}
                          </span>
                        ) : (
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {pred.needsAttention ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
                            style={{ backgroundColor: 'hsl(38 92% 52% / 0.1)', borderColor: 'hsl(38 92% 52% / 0.3)', color: 'hsl(38 60% 40%)' }}
                          >
                            <TriangleAlert size={10} />
                            Review
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>OK</span>
                        )}
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
