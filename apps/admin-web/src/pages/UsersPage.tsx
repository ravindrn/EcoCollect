import { useEffect, useState } from 'react';
import {
  getUsers,
  setUserActive,
  deleteUser,
  type AdminRole,
  type AdminUserListItem,
  type AdminUserListResult,
} from '../services/adminApi';
import { ApiError } from '../services/http';
import { UserFormModal } from '../components/UserFormModal';
import { colors } from '../theme/colors';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; result: AdminUserListResult }
  | { kind: 'error'; message: string };

const roleLabels: Record<AdminRole, string> = {
  CITIZEN: 'Citizen',
  DRIVER: 'Driver',
  ADMIN: 'Admin',
};

const roleColors: Record<AdminRole, { bg: string; fg: string }> = {
  CITIZEN: { bg: colors.primarySoft, fg: colors.primary },
  DRIVER: { bg: colors.infoSoft, fg: colors.info },
  ADMIN: { bg: '#FEF3C7', fg: colors.warning },
};

export function UsersPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<AdminRole | ''>('');
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);
  const [modal, setModal] = useState<
    | { kind: 'closed' }
    | { kind: 'create' }
    | { kind: 'edit'; user: AdminUserListItem }
  >({ kind: 'closed' });

  const load = async () => {
    setState({ kind: 'loading' });
    try {
      const result = await getUsers({
        page,
        pageSize: 10,
        q: search.trim() || undefined,
        role: role || undefined,
      });
      setState({ kind: 'ok', result });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load users';
      setState({ kind: 'error', message });
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, role]);

  const handleToggle = async (id: string, current: boolean) => {
    setActionId(id);
    try {
      await setUserActive(id, !current);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (user: AdminUserListItem) => {
    if (
      !window.confirm(
        `Delete user ${user.email}? This will remove their profile and cannot be undone.`,
      )
    ) {
      return;
    }
    setActionId(user.id);
    try {
      await deleteUser(user.id);
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
          <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
            Users
          </h2>
          <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14 }}>
            Manage citizens, drivers, and other administrators.
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
          + Create user
        </button>
      </section>

      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by email or name"
          style={inputStyle}
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as AdminRole | '');
            setPage(1);
          }}
          style={{ ...inputStyle, width: 180 }}
        >
          <option value="">All roles</option>
          <option value="CITIZEN">Citizens</option>
          <option value="DRIVER">Drivers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </section>

      {state.kind === 'loading' && (
        <p style={{ color: colors.textSecondary }}>Loading users…</p>
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
        <>
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
                  <th style={thStyle}>Name / Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Area</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.result.items.map((u) => (
                  <tr key={u.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: colors.textPrimary }}>
                        {u.fullName ?? '—'}
                      </div>
                      <div style={{ color: colors.textMuted, fontSize: 12 }}>
                        {u.email}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: roleColors[u.role].bg,
                          color: roleColors[u.role].fg,
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 999,
                        }}
                      >
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td style={tdStyle}>{u.phone ?? '—'}</td>
                    <td style={tdStyle}>{u.wardDivision ?? '—'}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: u.isActive
                            ? colors.successSoft
                            : colors.errorSoft,
                          color: u.isActive ? colors.success : colors.error,
                        }}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setModal({ kind: 'edit', user: u })}
                          disabled={actionId === u.id}
                          style={smallBtn(colors.primary)}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggle(u.id, u.isActive)}
                          disabled={actionId === u.id}
                          style={smallBtn(u.isActive ? colors.warning : colors.success)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={actionId === u.id}
                          style={smallBtn(colors.error)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {state.result.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13,
              color: colors.textSecondary,
            }}
          >
            <span>
              Page {state.result.meta.page} of {state.result.meta.totalPages || 1} ·{' '}
              {state.result.meta.total} total
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={pagerStyle}
              >
                ← Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(state.result.meta.totalPages || 1, p + 1))
                }
                disabled={page >= (state.result.meta.totalPages || 1)}
                style={pagerStyle}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {modal.kind !== 'closed' && (
        <UserFormModal
          mode={modal.kind === 'create' ? 'create' : 'edit'}
          user={modal.kind === 'edit' ? modal.user : undefined}
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

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  fontSize: 14,
  background: colors.surface,
  color: colors.textPrimary,
  outline: 'none',
  minWidth: 260,
  flex: 1,
  maxWidth: 400,
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

const pagerStyle: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  padding: '8px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  color: colors.textPrimary,
  cursor: 'pointer',
};

function smallBtn(color: string): React.CSSProperties {
  return {
    background: 'transparent',
    color,
    border: `1px solid ${color}`,
    padding: '6px 10px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  };
}