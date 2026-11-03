import { useCallback, useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { getStats, type StatsResult } from '../services/adminApi';
import { ApiError } from '../services/http';
import { colors } from '../theme/colors';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; stats: StatsResult }
  | { kind: 'error'; message: string };

const REFRESH_MS = 30000;

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#94A3B8',
  OPEN: colors.warning,
  IN_PROGRESS: colors.info,
  RESOLVED: colors.success,
  REJECTED: colors.error,
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

const CATEGORY_COLORS = [
  colors.primary,
  colors.info,
  colors.warning,
  colors.error,
  '#9333EA',
  '#0891B2',
];

export function DashboardPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const stats = await getStats();
      setState({ kind: 'ok', stats });
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load stats';
      setState({ kind: 'error', message });
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  if (state.kind === 'loading') {
    return (
      <div style={{ padding: 40, color: colors.textSecondary }}>
        Loading dashboard…
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div style={{ padding: 24 }}>
        <div
          role="alert"
          style={{
            background: colors.errorSoft,
            border: '1px solid #FECACA',
            color: colors.error,
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 14,
          }}
        >
          {state.message}
        </div>
        <button
          onClick={() => void load()}
          style={{
            marginTop: 16,
            background: colors.primary,
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 10,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats } = state;
  const resolutionRate =
    stats.complaints.total > 0
      ? Math.round(
          (stats.complaints.resolved / stats.complaints.total) * 100,
        )
      : 0;
  const activeComplaints =
    stats.complaints.pending + stats.complaints.open + stats.complaints.inProgress;

  // Status chart data (skip zero counts)
  const statusChartData = stats.complaintsByStatus.filter((s) => s.count > 0);

  // Category chart data (sorted desc)
  const categoryChartData = [...stats.complaintsByCategory]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Format date for the chart (short form)
  const perDayData = stats.complaintsPerDay.map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: colors.textPrimary,
              margin: 0,
            }}
          >
            Dashboard
          </h2>
          <p
            style={{
              color: colors.textSecondary,
              marginTop: 6,
              fontSize: 14,
            }}
          >
            Overview of EcoCollect activity
          </p>
        </div>
        <div style={{ fontSize: 12, color: colors.textMuted }}>
          {lastRefresh ? `Updated ${lastRefresh}` : '—'} · auto-refresh 30s
        </div>
      </section>

      {/* KPI cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <KpiCard
          label="Total users"
          value={stats.users.total}
          hint={`${stats.users.citizens} citizens · ${stats.users.drivers} drivers · ${stats.users.admins} admins`}
          accent="primary"
        />
        <KpiCard
          label="Active complaints"
          value={activeComplaints}
          hint={`${stats.complaints.total} total submitted`}
          accent="warning"
        />
        <KpiCard
          label="Resolved"
          value={stats.complaints.resolved}
          hint={`${resolutionRate}% resolution rate`}
          accent="success"
        />
        <KpiCard
          label="Active vehicles"
          value={stats.vehicles.active}
          hint={`${stats.announcements.published} announcements live`}
          accent="info"
        />
      </section>

      {/* Charts row 1 */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
        }}
      >
        <ChartCard title="Complaints · last 30 days">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={perDayData}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: colors.textMuted }}
                interval={Math.ceil(perDayData.length / 8)}
                stroke={colors.border}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: colors.textMuted }}
                stroke={colors.border}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  fontSize: 12,
                }}
                labelStyle={{ color: colors.textPrimary, fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={colors.primary}
                strokeWidth={2.5}
                dot={{ r: 2, fill: colors.primary }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By status">
          {statusChartData.length === 0 ? (
            <EmptyChart text="No complaints yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={statusChartData}
                margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis
                  dataKey="status"
                  tickFormatter={(s: string) => STATUS_LABELS[s] ?? s}
                  tick={{ fontSize: 11, fill: colors.textMuted }}
                  stroke={colors.border}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: colors.textMuted }}
                  stroke={colors.border}
                />
                <Tooltip
                  formatter={(v: number, _k, p) => [
                    v,
                    STATUS_LABELS[(p.payload as { status: string }).status] ??
                      p.payload.status,
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? colors.primary}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Charts row 2 */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <ChartCard title="By category">
          {categoryChartData.length === 0 ? (
            <EmptyChart text="No complaints yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, _k, p) => [
                    v,
                    (p.payload as { category: string }).category,
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center',
              fontSize: 11,
            }}
          >
            {categoryChartData.map((entry, index) => (
              <span
                key={entry.category}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: colors.textSecondary,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                  }}
                />
                {entry.category} ({entry.count})
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Recent complaints">
          {stats.recentComplaints.length === 0 ? (
            <EmptyChart text="No recent complaints" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.recentComplaints.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 0',
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background:
                        STATUS_COLORS[c.status] ?? colors.textMuted,
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: colors.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {c.isAnonymous
                        ? 'Anonymous'
                        : (c.reporterName ?? c.reporterEmail ?? 'Unknown')}{' '}
                      · {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: STATUS_COLORS[c.status] ?? colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.3,
                    }}
                  >
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number | string;
  hint: string;
  accent: 'primary' | 'warning' | 'success' | 'info';
}) {
  const accentColor: Record<typeof accent, string> = {
    primary: colors.primary,
    warning: colors.warning,
    success: colors.success,
    info: colors.info,
  };
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: accentColor[accent],
          }}
        />
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: colors.textPrimary,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: colors.textSecondary }}>{hint}</div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 700,
          color: colors.textPrimary,
          marginBottom: 12,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div
      style={{
        height: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textMuted,
        fontSize: 13,
      }}
    >
      {text}
    </div>
  );
}