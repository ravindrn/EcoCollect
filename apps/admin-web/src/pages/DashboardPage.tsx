import { useEffect, useState } from 'react';
import { getStats, type StatsResult } from '../services/adminApi';
import { ApiError } from '../services/http';
import { StatCard } from '../components/StatCard';
import { colors } from '../theme/colors';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; stats: StatsResult }
  | { kind: 'error'; message: string };

export function DashboardPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stats = await getStats();
        if (!cancelled) setState({ kind: 'ok', stats });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to load stats';
        if (!cancelled) setState({ kind: 'error', message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') {
    return <p style={{ color: colors.textSecondary }}>Loading dashboard…</p>;
  }

  if (state.kind === 'error') {
    return (
      <div
        role="alert"
        style={{
          background: colors.errorSoft,
          border: `1px solid #FECACA`,
          color: colors.error,
          borderRadius: 12,
          padding: '14px 16px',
          fontSize: 14,
        }}
      >
        {state.message}
      </div>
    );
  }

  const { users, complaints } = state.stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
          Welcome back
        </h2>
        <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14 }}>
          Overview of your EcoCollect system.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <StatCard label="Total Users" value={users.total} hint={`${users.citizens} citizens · ${users.drivers} drivers · ${users.admins} admins`} icon="👥" accent="primary" />
        <StatCard label="Citizens" value={users.citizens} hint="Registered citizens" icon="🧑" accent="info" />
        <StatCard label="Open Complaints" value={complaints.open} hint="Awaiting action" icon="⚠️" accent="warning" />
        <StatCard label="Total Complaints" value={complaints.total} hint="All time" icon="📋" accent="success" />
      </section>

      <section
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          Coming next
        </h3>
        <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14 }}>
          Complaint management, user administration, announcement publishing, and area
          management will appear here.
        </p>
      </section>
    </div>
  );
}