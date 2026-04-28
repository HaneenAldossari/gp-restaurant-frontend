import { useEffect, useState } from 'react';
import { Users, Check } from 'lucide-react';
import { fetchWorkspaceUsers, getWorkspaceUserId, setWorkspaceUserId } from '../../lib/api';

// Temporary workspace switcher for thesis testing. Each teammate picks
// their own isolated workspace; the chosen user id is stored in
// localStorage and sent on every API request as X-User-Id. Will be
// replaced with real auth later.
const WorkspaceSwitcher = ({ compact = false }) => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentId, setCurrentId] = useState(getWorkspaceUserId());

  useEffect(() => {
    fetchWorkspaceUsers()
      .then((d) => {
        const list = d.users || [];
        setUsers(list);
        // If nothing picked yet, default to the first available user so
        // the rest of the app has a concrete workspace to query.
        if (!getWorkspaceUserId() && list.length) {
          setWorkspaceUserId(list[0].id);
          setCurrentId(list[0].id);
        }
      })
      .catch(() => setUsers([]));
  }, []);

  const current = users.find((u) => u.id === currentId);

  const pick = (id) => {
    setWorkspaceUserId(id);
    setCurrentId(id);
    setOpen(false);
    // Reload so every page re-fetches against the new workspace. Simpler
    // than threading a refetch trigger through every consumer.
    window.location.reload();
  };

  if (users.length === 0) return null;

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          title={current ? `Workspace: ${current.name}` : 'Pick a workspace'}
        >
          <Users size={16} />
        </button>
        {open && (
          <WorkspaceMenu users={users} currentId={currentId} onPick={pick} onClose={() => setOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition"
      >
        <Users size={14} className="text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Workspace</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {current?.name || 'Pick one'}
          </p>
        </div>
      </button>
      {open && (
        <WorkspaceMenu users={users} currentId={currentId} onPick={pick} onClose={() => setOpen(false)} />
      )}
    </div>
  );
};

const WorkspaceMenu = ({ users, currentId, onPick, onClose }) => (
  <>
    <div className="fixed inset-0 z-40" onClick={onClose} />
    <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
      <p className="px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        Switch workspace
      </p>
      <ul className="max-h-64 overflow-y-auto">
        {users.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => onPick(u.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition ${
                u.id === currentId
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{u.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
              </div>
              {u.id === currentId && <Check size={14} className="flex-shrink-0" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  </>
);

export default WorkspaceSwitcher;
