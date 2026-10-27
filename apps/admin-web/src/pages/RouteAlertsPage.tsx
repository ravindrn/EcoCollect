import { useEffect, useMemo, useState } from 'react';
import { getRouteAlerts, type RouteAlert } from '../services/adminApi';
import { ApiError } from '../services/http';
import { colors } from '../theme/colors';

const REFRESH_MS = 5000;

function latestByVehicle(alerts: RouteAlert[]) {
  const seen = new Map<string, RouteAlert>();
  for (const alert of alerts) {
    if (!seen.has(alert.vehicle.id)) seen.set(alert.vehicle.id, alert);
  }
  return [...seen.values()];
}

function when(value: string) {
  return new Date(value).toLocaleString();
}

export function RouteAlertsPage() {
  const [alerts, setAlerts] = useState<RouteAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const current = useMemo(() => latestByVehicle(alerts), [alerts]);
  const outsideCount = current.filter((alert) => alert.kind === 'OUTSIDE').length;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const next = await getRouteAlerts();
        if (cancelled) return;
        setAlerts(next);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load route alerts');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
          Route corridor
        </h2>
        <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14 }}>
          Drivers send an alert when they leave the planned route, and another when they return.
        </p>
      </section>

      {error ? (
        <div role="alert" style={{ background: colors.errorSoft, color: colors.error, borderRadius: 12, padding: '14px 16px' }}>
          {error}
        </div>
      ) : null}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        <StatusCard label="Off route now" value={loading ? '…' : String(outsideCount)} tone={outsideCount > 0 ? 'danger' : 'ok'} />
        <StatusCard label="Vehicles reporting" value={loading ? '…' : String(current.length)} tone="ok" />
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {current.map((alert) => (
          <article
            key={alert.vehicle.id}
            style={{
              background: alert.kind === 'OUTSIDE' ? colors.errorSoft : colors.successSoft,
              borderRadius: 14,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontWeight: 800, color: alert.kind === 'OUTSIDE' ? colors.error : colors.success }}>
              {alert.kind === 'OUTSIDE' ? 'Outside the route' : 'Inside the route'}
            </div>
            <div style={{ marginTop: 4, color: colors.textPrimary, fontWeight: 700 }}>
              {alert.vehicle.plateNumber}
              {alert.vehicle.name ? ` · ${alert.vehicle.name}` : ''}
            </div>
            <div style={{ marginTop: 4, color: colors.textSecondary, fontSize: 13 }}>
              {alert.routeName ?? 'Route not named'} · {alert.driver.email} · {when(alert.recordedAt)}
            </div>
          </article>
        ))}
        {!loading && current.length === 0 ? (
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20, color: colors.textSecondary }}>
            No route alerts yet. They appear when a driver leaves or returns to the planned route.
          </div>
        ) : null}
      </section>

      <section
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <h3 style={{ margin: 0, padding: '16px 18px', fontSize: 16, color: colors.textPrimary }}>Recent alerts</h3>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 1fr',
              gap: 12,
              padding: '12px 18px',
              borderTop: `1px solid ${colors.border}`,
              fontSize: 14,
            }}
          >
            <strong style={{ color: alert.kind === 'OUTSIDE' ? colors.error : colors.success }}>
              {alert.kind === 'OUTSIDE' ? 'Outside' : 'Inside'}
            </strong>
            <span style={{ color: colors.textPrimary }}>
              {alert.vehicle.plateNumber}
              {alert.routeName ? ` · ${alert.routeName}` : ''}
            </span>
            <span style={{ color: colors.textSecondary }}>{when(alert.recordedAt)}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function StatusCard({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'danger' }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${tone === 'danger' ? '#FECACA' : colors.border}`,
        borderRadius: 16,
        padding: 18,
      }}
    >
      <div style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 28, fontWeight: 800, color: tone === 'danger' ? colors.error : colors.textPrimary }}>
        {value}
      </div>
    </div>
  );
}
