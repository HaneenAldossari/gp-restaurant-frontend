import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Mail, Lock, Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import {
  fetchSubUsers,
  createSubUser,
  updateSubUser,
  deleteSubUser,
} from '../lib/api';

// Permission labels reworded to be manager-friendly. The backend
// stores the technical names (read_only / write_only / read_write)
// per the schema; we only translate at the UI layer.
const PERMISSIONS = [
  {
    value: 'read_only',
    label: 'Viewer',
    short: 'Sees reports only',
    desc: 'Can open Dashboard, Forecasting, and Menu Insights. Cannot upload data or change settings.',
  },
  {
    value: 'write_only',
    label: 'Cashier',
    short: 'Uploads data only',
    desc: 'Can upload sales files. Cannot see Dashboard, Forecasting, or Menu Insights — useful for staff who only enter end-of-day data.',
  },
  {
    value: 'read_write',
    label: 'Full access',
    short: 'View & upload',
    desc: 'Same view as a manager — Dashboard, Forecasting, Menu Insights, and Upload. Cannot create other sub-users.',
  },
];

const permissionLabel = (value) => PERMISSIONS.find((p) => p.value === value)?.label || value;
const permissionTone = (value) => ({
  read_only:  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  write_only: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  read_write: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}[value] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300');

const TeamManagement = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', permission: 'read_only',
  });
  const [createError, setCreateError] = useState(null);
  const [createOk, setCreateOk] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const d = await fetchSubUsers();
      setList(d.subUsers || []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not load sub-users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateOk(null);
    if (!createForm.name.trim() || !createForm.email.trim() || createForm.password.length < 6) {
      setCreateError('Fill in name, email, and a password of at least 6 characters.');
      return;
    }
    setCreating(true);
    try {
      await createSubUser(createForm);
      setCreateOk(`Sub-user "${createForm.name}" added.`);
      setCreateForm({ name: '', email: '', password: '', permission: 'read_only' });
      refresh();
    } catch (e) {
      setCreateError(e.message || 'Could not create sub-user');
    } finally {
      setCreating(false);
    }
  };

  const onChangePermission = async (id, permission) => {
    setBusyId(id);
    try {
      await updateSubUser(id, { permission });
      refresh();
    } catch (e) {
      alert(e.message || 'Could not update permission');
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id, name) => {
    if (!confirm(`Remove "${name}"? They will lose access immediately.`)) return;
    setBusyId(id);
    try {
      await deleteSubUser(id);
      refresh();
    } catch (e) {
      alert(e.message || 'Could not remove sub-user');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          Team
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sub-users you add here get their own login. They see the same data as you and act on your workspace; their permission level controls what they can do.
        </p>
      </div>

      {/* Create form */}
      <div className="card dark:bg-gray-800 dark:border-gray-700 p-5">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary-500" /> Add a sub-user
        </h4>
        <form onSubmit={onCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Full name"
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              className="input pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Initial password (≥6 chars)"
              className="input pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              minLength={6}
              required
            />
          </div>
          <select
            value={createForm.permission}
            onChange={(e) => setCreateForm((f) => ({ ...f, permission: e.target.value }))}
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {PERMISSIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          <div className="sm:col-span-2 text-xs text-gray-500 dark:text-gray-400">
            {PERMISSIONS.find((p) => p.value === createForm.permission)?.desc}
          </div>

          {createError && (
            <div className="sm:col-span-2 flex items-center gap-2 text-sm text-danger-700 dark:text-danger-400">
              <AlertCircle size={14} /> {createError}
            </div>
          )}
          {createOk && (
            <div className="sm:col-span-2 flex items-center gap-2 text-sm text-success-700 dark:text-success-400">
              <CheckCircle2 size={14} /> {createOk}
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={creating} className="btn-primary disabled:opacity-50 flex items-center gap-2">
              {creating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <>+ Add sub-user</>}
            </button>
          </div>
        </form>
      </div>

      {/* Existing list */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Your sub-users {list.length > 0 && <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({list.length})</span>}
        </h4>

        {error && (
          <div className="text-sm text-danger-700 dark:text-danger-400 flex items-center gap-2 mb-3">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </p>
        ) : list.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No sub-users yet. Add one above so a teammate can log in with their own credentials.
          </p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {list.map((u) => (
              <div key={u.id} className="py-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${permissionTone(u.permission)}`}>
                  {permissionLabel(u.permission)}
                </span>
                <select
                  value={u.permission}
                  onChange={(e) => onChangePermission(u.id, e.target.value)}
                  disabled={busyId === u.id}
                  className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200"
                  title="Change permission"
                >
                  {PERMISSIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => onDelete(u.id, u.name)}
                  disabled={busyId === u.id}
                  className="text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 p-2 rounded disabled:opacity-50"
                  title="Remove sub-user"
                >
                  {busyId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
