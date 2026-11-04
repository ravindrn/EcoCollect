import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRoutes,
  createRoute,
  deleteRoute,
  type AdminRoute,
} from '../services/adminApi';
import { ApiError } from '../services/http';
import { colors } from '../theme/colors';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; routes: AdminRoute[] }
  | { kind: 'error'; message: string };

export function RoutesPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const routes = await getRoutes();
      setState({ kind: 'ok', routes });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load routes';
      setState({ kind: 'error', message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    const name = window.prompt('Route name (e.g. Route F):');
    if (!name || !name.trim()) return;
    setCreating(true);
    try {
      const created = await createRoute({ name: name.trim() });
      navigate(`/routes/${created.id}`);
    } catch (err) {
      window.alert(
        err instanceof ApiError ? err.message : 'Failed to create route',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (route: AdminRoute) => {
    if (
      !window.confirm(
        `Delete route "${route.name}"? It must have no citizens or places attached.`,
      )
    )
      return;
    setActionId(route.id);
    try {
      await deleteRoute(route.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
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
            Routes
          </h2>
          <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14 }}>
            Manage collection routes, days, and stops.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          style={{
            background: colors.primary,
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            cursor: creating ? 'wait' : 'pointer',
            opacity: creating ? 0.7 : 1,
          }}
        >
          {creating ? 'Creating…' : '+ New route'}
        </button>
      </section>

      {state.kind === 'loading' && (
        <p style={{ color: colors.textSecondary }}>Loading routes…</p>
      )}

      {state.kind === 'error' && (
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
      )}

      {state.kind === 'ok' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
          {state.routes.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: 40,
                textAlign: 'center',
                color: colors.textMuted,
                border: `1px dashed ${colors.border}`,
                borderRadius: 16,
              }}
            >
              No routes yet. Create one to get started.
            </div>
          )}

          {state.routes.map((route) => (
            <div
              key={route.id}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                borderLeft: `4px solid ${route.color ?? colors.primary}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: colors.textPrimary,
                    }}
                  >
                    {route.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {route.vehicle ?? 'No vehicle'} · {route.driver ?? 'No driver'}
                  </div>
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: route.isActive
                      ? colors.successSoft
                      : colors.errorSoft,
                    color: route.isActive ? colors.success : colors.error,
                  }}
                >
                  {route.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                <span style={chipStyle}>
                  {route.schedules.length} day
                  {route.schedules.length === 1 ? '' : 's'}
                </span>
                <span style={chipStyle}>
                  {route.schedules.reduce(
                    (sum, s) => sum + s.stops.length,
                    0,
                  )}{' '}
                  stops
                </span>
                <span style={chipStyle}>{route.citizenCount} citizens</span>
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {route.schedules.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      background: colors.background,
                      color: colors.textPrimary,
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {DAY_NAMES[s.dayOfWeek]}
                  </span>
                ))}
                {route.schedules.length === 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      fontStyle: 'italic',
                    }}
                  >
                    No days scheduled
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: 12,
                }}
              >
                <button
                  onClick={() => navigate(`/routes/${route.id}`)}
                  style={smallBtn(colors.primary)}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(route)}
                  disabled={actionId === route.id}
                  style={smallBtn(colors.error)}
                >
                  {actionId === route.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  background: colors.background,
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
};

const smallBtn = (color: string): React.CSSProperties => ({
  background: 'transparent',
  color,
  border: `1px solid ${color}`,
  padding: '6px 12px',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
});