import { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import {
  useGetApplication,
  getGetApplicationQueryKey,
  useUpdateApplication,
  useDeleteApplication,
  getListApplicationsQueryKey,
  getListPredictionsQueryKey,
  getGetDashboardStatsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Shell } from '@/components/layout/Shell';
import { StageBadge, OfferBadge } from '@/components/StageBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type Stage = 'Applied' | 'Shortlisted' | 'Interview' | 'Selected' | 'Rejected';
type OfferStatus = 'Pending' | 'Offered' | 'Rejected' | 'Withdrawn';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {label}
      </div>
      <div className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
        {value ?? <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>}
      </div>
    </div>
  );
}

export default function ApplicationDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: app, isLoading, isError } = useGetApplication(id, {
    query: { enabled: !!id && !isNaN(id), queryKey: getGetApplicationQueryKey(id) },
  });

  const updateMutation = useUpdateApplication();
  const deleteMutation = useDeleteApplication();

  // Edit state
  const [editingStage, setEditingStage] = useState(false);
  const [editingOffer, setEditingOffer] = useState(false);
  const [editingPackage, setEditingPackage] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);

  const [stageValue, setStageValue] = useState<Stage>('Applied');
  const [offerValue, setOfferValue] = useState<OfferStatus>('Pending');
  const [packageValue, setPackageValue] = useState('');
  const [notesValue, setNotesValue] = useState('');

  const startEdit = (field: string) => {
    if (!app) return;
    if (field === 'stage') { setStageValue(app.stage as Stage); setEditingStage(true); }
    if (field === 'offer') { setOfferValue(app.offerStatus as OfferStatus); setEditingOffer(true); }
    if (field === 'package') { setPackageValue(app.package != null ? String(app.package) : ''); setEditingPackage(true); }
    if (field === 'notes') { setNotesValue(app.notes ?? ''); setEditingNotes(true); }
  };

  const saveField = (field: string) => {
    if (!app) return;
    const data: Record<string, unknown> = {};
    if (field === 'stage') data.stage = stageValue;
    if (field === 'offer') data.offerStatus = offerValue;
    if (field === 'package') data.package = packageValue ? Number(packageValue) : null;
    if (field === 'notes') data.notes = notesValue || null;

    updateMutation.mutate({ id, data }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetApplicationQueryKey(id), updated);
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPredictionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        if (field === 'stage') setEditingStage(false);
        if (field === 'offer') setEditingOffer(false);
        if (field === 'package') setEditingPackage(false);
        if (field === 'notes') setEditingNotes(false);
        toast({ title: 'Updated', description: 'Application record saved.' });
      },
      onError: () => {
        toast({ title: 'Error', description: 'Update failed. Please try again.', variant: 'destructive' });
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPredictionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: 'Deleted', description: 'Application record removed.' });
        setLocation('/applications');
      },
      onError: () => {
        toast({ title: 'Error', description: 'Delete failed. Please try again.', variant: 'destructive' });
      },
    });
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="page-in px-6 py-5 max-w-3xl">
          <Skeleton className="h-4 w-20 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (isError || !app) {
    return (
      <Shell>
        <div className="page-in px-6 py-5">
          <div className="flex items-center gap-2 p-4 rounded-lg border" style={{ borderColor: 'hsl(var(--destructive) / 0.3)', backgroundColor: 'hsl(var(--destructive) / 0.05)' }}>
            <AlertCircle size={15} style={{ color: 'hsl(var(--destructive))' }} />
            <span className="text-sm" style={{ color: 'hsl(var(--destructive))' }}>
              Application not found or failed to load.
            </span>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="page-in px-6 py-5 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/applications"
            data-testid="btn-back"
            className="flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <ArrowLeft size={14} />
            Applications
          </Link>
          <div className="w-px h-4" style={{ backgroundColor: 'hsl(var(--border))' }} />
          <span className="text-sm tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
            {app.applicationId}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" data-testid="btn-delete" style={{ color: 'hsl(var(--destructive))' }}>
                  <Trash2 size={13} />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Application</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the application record for {app.studentName} at {app.company}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    data-testid="btn-confirm-delete"
                    style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                  >
                    {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Hero info */}
        <div
          className="rounded-lg border p-5 mb-4"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                {app.studentName}
              </h1>
              <div className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {app.studentId} {app.branch ? `· ${app.branch}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <StageBadge stage={app.stage} />
              <OfferBadge status={app.offerStatus} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <Field label="Company" value={app.company} />
            <Field label="Drive Date" value={app.driveDate ? format(new Date(app.driveDate), 'dd MMM yyyy') : null} />
            <Field label="CGPA" value={app.cgpa != null ? (
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{app.cgpa.toFixed(2)}</span>
            ) : null} />
            <Field label="Created" value={app.createdAt ? format(new Date(app.createdAt), 'dd MMM yyyy') : null} />
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-3">
          {/* Stage */}
          <div
            className="rounded-lg border p-4 flex items-center justify-between gap-4"
            style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))' }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Stage
            </div>
            {editingStage ? (
              <div className="flex items-center gap-2">
                <Select value={stageValue} onValueChange={(v) => setStageValue(v as Stage)}>
                  <SelectTrigger className="h-8 w-36 text-sm" data-testid="select-edit-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'] as Stage[]).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7 w-7 p-0" onClick={() => saveField('stage')} disabled={updateMutation.isPending} data-testid="btn-save-stage" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  {updateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingStage(false)} data-testid="btn-cancel-stage">
                  <X size={12} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <StageBadge stage={app.stage} />
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => startEdit('stage')} data-testid="btn-edit-stage">
                  <Pencil size={11} /> Edit
                </Button>
              </div>
            )}
          </div>

          {/* Offer Status */}
          <div
            className="rounded-lg border p-4 flex items-center justify-between gap-4"
            style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))' }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Offer Status
            </div>
            {editingOffer ? (
              <div className="flex items-center gap-2">
                <Select value={offerValue} onValueChange={(v) => setOfferValue(v as OfferStatus)}>
                  <SelectTrigger className="h-8 w-36 text-sm" data-testid="select-edit-offer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Pending', 'Offered', 'Rejected', 'Withdrawn'] as OfferStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7 w-7 p-0" onClick={() => saveField('offer')} disabled={updateMutation.isPending} data-testid="btn-save-offer" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  {updateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingOffer(false)} data-testid="btn-cancel-offer">
                  <X size={12} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <OfferBadge status={app.offerStatus} />
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => startEdit('offer')} data-testid="btn-edit-offer">
                  <Pencil size={11} /> Edit
                </Button>
              </div>
            )}
          </div>

          {/* Package */}
          <div
            className="rounded-lg border p-4 flex items-center justify-between gap-4"
            style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))' }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Package (LPA)
            </div>
            {editingPackage ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={packageValue}
                  onChange={(e) => setPackageValue(e.target.value)}
                  className="h-8 w-28 text-sm"
                  placeholder="e.g. 12.5"
                  data-testid="input-edit-package"
                />
                <Button size="sm" className="h-7 w-7 p-0" onClick={() => saveField('package')} disabled={updateMutation.isPending} data-testid="btn-save-package" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  {updateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingPackage(false)} data-testid="btn-cancel-package">
                  <X size={12} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}>
                  {app.package != null ? `${app.package.toFixed(2)} LPA` : '—'}
                </span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => startEdit('package')} data-testid="btn-edit-package">
                  <Pencil size={11} /> Edit
                </Button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Notes
              </div>
              {!editingNotes && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => startEdit('notes')} data-testid="btn-edit-notes">
                  <Pencil size={11} /> Edit
                </Button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  className="text-sm resize-none"
                  rows={3}
                  data-testid="input-edit-notes"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveField('notes')} disabled={updateMutation.isPending} data-testid="btn-save-notes" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                    {updateMutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)} data-testid="btn-cancel-notes">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm" style={{ color: app.notes ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                {app.notes || 'No notes recorded.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
