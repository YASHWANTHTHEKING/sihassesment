import { cn } from '@/lib/utils';

type Stage = 'Applied' | 'Shortlisted' | 'Interview' | 'Selected' | 'Rejected';
type OfferStatus = 'Pending' | 'Offered' | 'Rejected' | 'Withdrawn';
type RiskLevel = 'Low' | 'Medium' | 'High';

const stageConfig: Record<Stage, { label: string; className: string }> = {
  Applied: {
    label: 'Applied',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  Shortlisted: {
    label: 'Shortlisted',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  Interview: {
    label: 'Interview',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  Selected: {
    label: 'Selected',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-600 border-red-200',
  },
};

const offerConfig: Record<OfferStatus, { label: string; className: string }> = {
  Pending: {
    label: 'Pending',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  Offered: {
    label: 'Offered',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-600 border-red-200',
  },
  Withdrawn: {
    label: 'Withdrawn',
    className: 'bg-orange-50 text-orange-600 border-orange-200',
  },
};

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  Low: {
    label: 'Low Risk',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Medium: {
    label: 'Medium Risk',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  High: {
    label: 'High Risk',
    className: 'bg-red-50 text-red-600 border-red-200',
  },
};

interface StageBadgeProps {
  stage: Stage;
  className?: string;
}

interface OfferBadgeProps {
  status: OfferStatus;
  className?: string;
}

interface RiskBadgeProps {
  risk: RiskLevel;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const config = stageConfig[stage];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', config.className, className)}>
      {config.label}
    </span>
  );
}

export function OfferBadge({ status, className }: OfferBadgeProps) {
  const config = offerConfig[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', config.className, className)}>
      {config.label}
    </span>
  );
}

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  const config = riskConfig[risk];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', config.className, className)}>
      {config.label}
    </span>
  );
}
