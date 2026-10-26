import { useEffect, useState, type FormEvent } from 'react';
import {
  createUser,
  updateUser,
  type AdminRole,
  type AdminUserListItem,
} from '../services/adminApi';
import { ApiError } from '../services/http';
import { colors } from '../theme/colors';

type Mode = 'create' | 'edit';

type Props = {
  mode: Mode;
  user?: AdminUserListItem;
  onClose: () => void;
  onSaved: () => void;
};

export function UserFormModal({ mode, user, onClose, onSaved }: Props) {
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>(user?.role ?? 'CITIZEN');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [wardDivision, setWardDivision] = useState(user?.wardDivision ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset when user prop changes (edit mode)
    if (mode === 'edit' && user) {
      setEmail(user.email);
      setRole(user.role);
      setFullName(user.fullName ?? '');
      setPhone(user.phone ?? '');
      setWardDivision(user.wardDivision ?? '');
    }
  }, [mode, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (mode === 'create') {
        await createUser({
          email: email.trim(),
          password,
          role,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          wardDivision: wardDivision.trim() || undefined,
        });
      } else if (mode === 'edit' && user) {
        await updateUser(user.id, {
          email: email.trim(),
          role,
          fullName: role === 'CITIZEN' ? fullName.trim() : undefined,
          phone: role === 'CITIZEN' ? phone.trim() || '' : undefined,
          wardDivision: role === 'CITIZEN' ? wardDivision.trim() || '' : undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.45)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.surface,
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(15,23,42,0.25)',
        }}
      >
        <h2 style={{ margin: 0, color: colors.textPrimary }}>
          {mode === 'create' ? 'Create user' : 'Edit user'}
        </h2>
        <p style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
          {mode === 'create'
            ? 'Add a new citizen, driver, or admin.'
            : 'Update account details.'}
        </p>

        <div style={{ marginTop: 18 }}>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </Field>

          {mode === 'create' && (
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                style={inputStyle}
              />
            </Field>
          )}

          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              style={inputStyle}
            >
              <option value="CITIZEN">Citizen</option>
              <option value="DRIVER">Driver</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>

          <Field label="Full name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={role === 'CITIZEN'}
              style={inputStyle}
            />
          </Field>

          <Field label="Phone (optional)">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07X XXX XXXX"
              style={inputStyle}
            />
          </Field>

          <Field label="Ward / Division (optional)">
            <input
              type="text"
              value={wardDivision}
              onChange={(e) => setWardDivision(e.target.value)}
              style={inputStyle}
            />
          </Field>

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
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
                padding: '10px 16px',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
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
              {saving ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};