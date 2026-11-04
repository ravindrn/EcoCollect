import type { ComplaintStatus } from '../services/adminApi';
import { colors } from '../theme/colors';

const STATUS_STYLES: Record<
  ComplaintStatus,
  { bg: string; fg: string; label: string }
> = {
  PENDING: { bg: '#F1F5F9', fg: colors.textSecondary, label: 'Pending' },
  IN_PROGRESS: { bg: colors.infoSoft, fg: colors.info, label: 'In progress' },
  RESOLVED: { bg: colors.successSoft, fg: colors.success, label: 'Resolved' },
  REJECTED: { bg: colors.errorSoft, fg: colors.error, label: 'Rejected' },
};

const CATEGORY_LABELS: Record<string, string> = {
  OVERFLOW: 'Overflow',
  MISSED_PICKUP: 'Missed pickup',
  ILLEGAL_DUMPING: 'Illegal dumping',
  BURNING: 'Burning waste',
  DAMAGED_BIN: 'Damaged bin',
  OTHER: 'Other',
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      style={{
        background: colors.background,
        color: colors.textSecondary,
        padding: '3px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

export { STATUS_STYLES, CATEGORY_LABELS };