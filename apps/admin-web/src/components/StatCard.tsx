import { colors } from '../theme/colors';

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  accent?: 'primary' | 'warning' | 'info' | 'success';
  icon?: string;
};

const accents: Record<NonNullable<Props['accent']>, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primary, border: colors.primaryLight },
  warning: { bg: colors.warningSoft, fg: colors.warning, border: '#FDE68A' },
  info: { bg: colors.infoSoft, fg: colors.info, border: '#BAE6FD' },
  success: { bg: colors.successSoft, fg: colors.success, border: '#BBF7D0' },
};

export function StatCard({ label, value, hint, accent = 'primary', icon }: Props) {
  const a = accents[accent];
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </span>
        {icon && (
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: a.bg,
              border: `1px solid ${a.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: colors.textPrimary, lineHeight: 1.1 }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 12, color: colors.textSecondary }}>{hint}</div>}
    </div>
  );
}