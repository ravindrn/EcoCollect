import { useEffect, useState } from 'react';
import {
  getAreasAdmin,
  createArea,
  updateArea,
  deleteArea,
  type AdminArea,
} from '../services/adminApi';
import { ApiError } from '../services/http';
import { colors } from '../theme/colors';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; areas: AdminArea[] }
  | { kind: 'error'; message: string };

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; area: AdminArea };

export function AreasPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setState({ kind: 'loading' });
    try {
      const areas = await getAreasAdmin();
      setState({ kind: 'ok', areas });
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'Failed to load',
      });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleToggle = async (a: AdminArea) => {
    setActionId(a.id);
    try {
      await updateArea(a.id, { isActive: !a.isActive });
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (a: AdminArea) => {
    if (!window.confirm(`Delete area "${a.name}"?`)) return;
    setActionId(a.id);
    try {
      await deleteArea(a.id);
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
            Areas
          </h2>
          <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14 }}>
            Areas citizens can select during registration.
          </p>
        </div>
        <button
          onClick={() => setModal({ kind: 'create' })}
          style={{
            background: colors.primary,
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          + New area
        </button>
      </section>

      {state.kind === 'loading' && (
        <p style={{ color: colors.textSecondary }}>Loading…</p>
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
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: colors.background, textAlign: 'left' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Citizens</th>
                <th style={thStyle}>Community updates</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.areas.map((a) => (
                <tr key={a.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: colors.textPrimary }}>
                      {a.name}
                    </div>
                  </td>
                  <td style={tdStyle}>{a.citizenCount}</td>
                  <td style={tdStyle}>{a.updateCount}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        background: a.isActive ? colors.successSoft : colors.errorSoft,
                        color: a.isActive ? colors.success : colors.error,
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 999,
                      }}
                    >
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setModal({ kind: 'edit', area: a })}
                        style={smallBtn(colors.primary)}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(a)}
                        disabled={actionId === a.id}
                        style={smallBtn(a.isActive ? colors.warning : colors.success)}
                      >
                        {a.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        disabled={actionId === a.id}
                        style={smallBtn(colors.error)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {state.areas.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}
                  >
                    No areas configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal.kind !== 'closed' && (
        <AreaModal
          area={modal.kind === 'edit' ? modal.area : undefined}
          onClose={() => setModal({ kind: 'closed' })}
          onSaved={async () => {
            setModal({ kind: 'closed' });
            await load();
          }}
        />
      )}
    </div>
  );
}

function AreaModal({
  area,
  onClose,
  onSaved,
}: {
  area?: AdminArea;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!area;
  const [name, setName] = useState(area?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEdit && area) {
        await updateArea(area.id, { name: name.trim() });
      } else {
        await createArea({ name: name.trim() });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={modalCard}>
        <h2 style={{ margin: 0, color: colors.textPrimary }}>
          {isEdit ? 'Edit area' : 'New area'}
        </h2>

        <label style={{ display: 'block', marginTop: 16 }}>
          <div style={labelText}>Name</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Area A"
            style={inputStyle}
          />
        </label>

        {error && (
          <div
            role="alert"
            style={{
              background: colors.errorSoft,
              border: '1px solid #FECACA',
              color: colors.error,
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              marginTop: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" onClick={onClose} disabled={saving} style={cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
          </button>
        </div>
      </form>
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

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 700,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
};

const smallBtn = (color: string): React.CSSProperties => ({
  background: 'transparent',
  color,
  border: `1px solid ${color}`,
  padding: '6px 10px',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
});

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.45)',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  zIndex: 1000,
};

const modalCard: React.CSSProperties = {
  background: colors.surface,
  borderRadius: 16,
  padding: 24,
  width: '100%',
  maxWidth: 480,
  boxShadow: '0 20px 60px rgba(15,23,42,0.25)',
};

const labelText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: colors.textPrimary,
  marginBottom: 6,
};

const primaryBtn: React.CSSProperties = {
  background: colors.primary,
  color: 'white',
  border: 'none',
  padding: '10px 18px',
  borderRadius: 10,
  fontWeight: 700,
  cursor: 'pointer',
};

const cancelBtn: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  padding: '10px 16px',
  borderRadius: 10,
  fontWeight: 600,
  cursor: 'pointer',
};