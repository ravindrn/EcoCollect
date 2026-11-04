import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getRoutes,
  updateRoute,
  addScheduleDay,
  updateScheduleDay,
  deleteScheduleDay,
  addStop,
  deleteStop,
  reorderStops,
  searchPlaces,
  type AdminRoute,
  type PlaceLite,
} from '../services/adminApi';
import { ApiError } from '../services/http';
import { colors } from '../theme/colors';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; route: AdminRoute }
  | { kind: 'error'; message: string };

export function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [saving, setSaving] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);

  // Editable metadata
  const [name, setName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [workers, setWorkers] = useState('');
  const [color, setColor] = useState('#0F766E');

  // Add-day form
  const [newDay, setNewDay] = useState(1);
  const [newStartTime, setNewStartTime] = useState('05:00');

  // Stop picker modal
  const [pickerScheduleId, setPickerScheduleId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setState({ kind: 'loading' });
    try {
      const routes = await getRoutes();
      const found = routes.find((r) => r.id === id);
      if (!found) {
        setState({ kind: 'error', message: 'Route not found' });
        return;
      }
      setState({ kind: 'ok', route: found });
      setName(found.name);
      setVehicle(found.vehicle ?? '');
      setDriver(found.driver ?? '');
      setWorkers(found.workers ?? '');
      setColor(found.color ?? '#0F766E');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load';
      setState({ kind: 'error', message });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveMeta = async () => {
    if (state.kind !== 'ok') return;
    setSaving(true);
    try {
      await updateRoute(state.route.id, {
        name: name.trim(),
        vehicle: vehicle.trim(),
        driver: driver.trim(),
        workers: workers.trim(),
        color,
      });
      await load();
      window.alert('Route saved');
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDay = async () => {
    if (state.kind !== 'ok') return;
    setActionKey('add-day');
    try {
      await addScheduleDay(state.route.id, {
        dayOfWeek: newDay,
        startTime: newStartTime,
      });
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Add day failed');
    } finally {
      setActionKey(null);
    }
  };

  const handleUpdateStartTime = async (
    scheduleId: string,
    startTime: string,
  ) => {
    if (state.kind !== 'ok') return;
    setActionKey(`time-${scheduleId}`);
    try {
      await updateScheduleDay(state.route.id, scheduleId, { startTime });
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setActionKey(null);
    }
  };

  const handleDeleteDay = async (scheduleId: string, dayName: string) => {
    if (state.kind !== 'ok') return;
    if (!window.confirm(`Remove ${dayName} from this route?`)) return;
    setActionKey(`del-${scheduleId}`);
    try {
      await deleteScheduleDay(state.route.id, scheduleId);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setActionKey(null);
    }
  };

  const handleAddStop = async (scheduleId: string, placeId: string) => {
    if (state.kind !== 'ok') return;
    setActionKey(`stop-${scheduleId}`);
    try {
      await addStop(state.route.id, scheduleId, placeId);
      setPickerScheduleId(null);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Add stop failed');
    } finally {
      setActionKey(null);
    }
  };

  const handleDeleteStop = async (scheduleId: string, stopId: string) => {
    if (state.kind !== 'ok') return;
    setActionKey(`stop-${stopId}`);
    try {
      await deleteStop(state.route.id, scheduleId, stopId);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setActionKey(null);
    }
  };

  const handleMoveStop = async (
    scheduleId: string,
    stopIds: string[],
    index: number,
    direction: -1 | 1,
  ) => {
    if (state.kind !== 'ok') return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stopIds.length) return;

    const reordered = [...stopIds];
    [reordered[index], reordered[newIndex]] = [
      reordered[newIndex]!,
      reordered[index]!,
    ];

    setActionKey(`reorder-${scheduleId}`);
    try {
      await reorderStops(state.route.id, scheduleId, reordered);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Reorder failed');
    } finally {
      setActionKey(null);
    }
  };

  if (state.kind === 'loading') {
    return (
      <div style={{ padding: 40, color: colors.textSecondary }}>
        Loading route…
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate('/routes')} style={backBtn}>
          ← Back to routes
        </button>
        <div
          role="alert"
          style={{
            background: colors.errorSoft,
            border: '1px solid #FECACA',
            color: colors.error,
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 14,
            marginTop: 20,
          }}
        >
          {state.message}
        </div>
      </div>
    );
  }

  const route = state.route;
  const usedDays = new Set(route.schedules.map((s) => s.dayOfWeek));
  const availableDays = [1, 2, 3, 4, 5, 6].filter((d) => !usedDays.has(d));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <button onClick={() => navigate('/routes')} style={backBtn}>
          ← Back to routes
        </button>
      </div>

      {/* Metadata card */}
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: 20,
          borderLeft: `4px solid ${color}`,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: colors.textPrimary,
            margin: 0,
            marginBottom: 16,
          }}
        >
          Route details
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Vehicle">
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Driver">
            <input
              type="text"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Color">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 50, height: 40, border: 'none', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </Field>
        </div>

        <Field label="Workers">
          <input
            type="text"
            value={workers}
            onChange={(e) => setWorkers(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button
            onClick={handleSaveMeta}
            disabled={saving}
            style={{
              background: colors.primary,
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 10,
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Add day form */}
      {availableDays.length > 0 && (
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <Field label="Add day">
            <select
              value={newDay}
              onChange={(e) => setNewDay(Number(e.target.value))}
              style={{ ...inputStyle, width: 140 }}
            >
              {availableDays.map((d) => (
                <option key={d} value={d}>
                  {DAY_NAMES[d]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start time">
            <input
              type="time"
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
              style={{ ...inputStyle, width: 120 }}
            />
          </Field>
          <button
            onClick={handleAddDay}
            disabled={actionKey === 'add-day'}
            style={{
              background: colors.primary,
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 10,
              fontWeight: 700,
              cursor: actionKey === 'add-day' ? 'wait' : 'pointer',
              height: 40,
            }}
          >
            + Add day
          </button>
        </div>
      )}

      {/* Day sections */}
      {route.schedules.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: colors.textMuted,
            border: `1px dashed ${colors.border}`,
            borderRadius: 16,
          }}
        >
          No days scheduled yet. Add a day above.
        </div>
      ) : (
        route.schedules.map((s) => (
          <ScheduleDayCard
            key={s.id}
            schedule={s}
            routeId={route.id}
            onUpdateTime={(newTime) => handleUpdateStartTime(s.id, newTime)}
            onDelete={() => handleDeleteDay(s.id, DAY_NAMES[s.dayOfWeek] ?? '')}
            onAddStop={() => setPickerScheduleId(s.id)}
            onDeleteStop={(stopId) => handleDeleteStop(s.id, stopId)}
            onMoveStop={(stopIds, index, dir) =>
              handleMoveStop(s.id, stopIds, index, dir)
            }
            actionKey={actionKey}
          />
        ))
      )}

      {pickerScheduleId && (
        <PlacePickerModal
          alreadyOnDay={
            new Set(
              route.schedules
                .find((s) => s.id === pickerScheduleId)
                ?.stops.map((st) => st.place.id) ?? [],
            )
          }
          onClose={() => setPickerScheduleId(null)}
          onPick={(placeId) => handleAddStop(pickerScheduleId, placeId)}
        />
      )}
    </div>
  );
}

// ---------- sub-components ----------

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: colors.textMuted,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function ScheduleDayCard({
  schedule,
  onUpdateTime,
  onDelete,
  onAddStop,
  onDeleteStop,
  onMoveStop,
  actionKey,
}: {
  schedule: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    stops: { id: string; order: number; place: { id: string; name: string } }[];
  };
  routeId: string;
  onUpdateTime: (time: string) => void;
  onDelete: () => void;
  onAddStop: () => void;
  onDeleteStop: (stopId: string) => void;
  onMoveStop: (stopIds: string[], index: number, dir: -1 | 1) => void;
  actionKey: string | null;
}) {
  const [timeDraft, setTimeDraft] = useState(schedule.startTime);
  const stopIds = schedule.stops.map((s) => s.id);

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              background: colors.primarySoft,
              color: colors.primary,
              fontWeight: 800,
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              textTransform: 'uppercase',
            }}
          >
            {DAY_SHORT[schedule.dayOfWeek]}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: colors.textPrimary,
            }}
          >
            {DAY_NAMES[schedule.dayOfWeek]}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="time"
            value={timeDraft}
            onChange={(e) => setTimeDraft(e.target.value)}
            style={{ ...inputStyle, width: 110 }}
          />
          <button
            onClick={() => onUpdateTime(timeDraft)}
            disabled={actionKey === `time-${schedule.id}` || timeDraft === schedule.startTime}
            style={{
              background:
                timeDraft === schedule.startTime
                  ? colors.border
                  : colors.primary,
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              opacity: actionKey === `time-${schedule.id}` ? 0.6 : 1,
            }}
          >
            Save time
          </button>
          <button
            onClick={onDelete}
            disabled={actionKey === `del-${schedule.id}`}
            style={{
              background: 'transparent',
              color: colors.error,
              border: `1px solid ${colors.error}`,
              padding: '8px 14px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Remove day
          </button>
        </div>
      </div>

      {schedule.stops.length === 0 ? (
        <p
          style={{
            fontSize: 13,
            color: colors.textMuted,
            fontStyle: 'italic',
            margin: 0,
            marginBottom: 12,
          }}
        >
          No stops yet.
        </p>
      ) : (
        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            marginBottom: 12,
          }}
        >
          {schedule.stops.map((stop, index) => (
            <li
              key={stop.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                borderTop: index > 0 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: colors.primarySoft,
                  color: colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {stop.order}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: colors.textPrimary,
                }}
              >
                {stop.place.name}
              </span>
              <button
                onClick={() => onMoveStop(stopIds, index, -1)}
                disabled={index === 0 || actionKey === `reorder-${schedule.id}`}
                style={iconBtn}
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => onMoveStop(stopIds, index, 1)}
                disabled={
                  index === schedule.stops.length - 1 ||
                  actionKey === `reorder-${schedule.id}`
                }
                style={iconBtn}
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => onDeleteStop(stop.id)}
                disabled={actionKey === `stop-${stop.id}`}
                style={{ ...iconBtn, color: colors.error }}
                title="Remove stop"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={onAddStop}
        style={{
          background: colors.primarySoft,
          color: colors.primary,
          border: `1px solid ${colors.primaryLight}`,
          padding: '8px 14px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        + Add stop
      </button>
    </div>
  );
}

function PlacePickerModal({
  alreadyOnDay,
  onClose,
  onPick,
}: {
  alreadyOnDay: Set<string>;
  onClose: () => void;
  onPick: (placeId: string) => void;
}) {
  const [q, setQ] = useState('');
  const [places, setPlaces] = useState<PlaceLite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const result = await searchPlaces(q.trim() || undefined);
        if (!cancelled) setPlaces(result);
      } catch {
        if (!cancelled) setPlaces([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.surface,
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 520,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              color: colors.textPrimary,
            }}
          >
            Add a stop
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: colors.textMuted,
            }}
          >
            ×
          </button>
        </div>

        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search places…"
          autoFocus
          style={inputStyle}
        />

        <div style={{ overflowY: 'auto', maxHeight: 400 }}>
          {loading && (
            <p style={{ fontSize: 13, color: colors.textMuted }}>Loading…</p>
          )}
          {!loading && places.length === 0 && (
            <p style={{ fontSize: 13, color: colors.textMuted }}>
              No places found.
            </p>
          )}
          {!loading &&
            places.map((p) => {
              const already = alreadyOnDay.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => !already && onPick(p.id)}
                  disabled={already}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderTop: `1px solid ${colors.border}`,
                    cursor: already ? 'not-allowed' : 'pointer',
                    opacity: already ? 0.4 : 1,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>
                    {p.area.name} {already && '· already added'}
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  fontSize: 14,
  background: colors.surface,
  color: colors.textPrimary,
  outline: 'none',
  boxSizing: 'border-box',
};

const backBtn: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  padding: '8px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const iconBtn: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  width: 28,
  height: 28,
  borderRadius: 6,
  fontSize: 14,
  cursor: 'pointer',
  color: colors.textSecondary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};