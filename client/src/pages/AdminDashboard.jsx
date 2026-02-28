import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { adminApi } from '../api';

const emptyUser = { name: '', email: '', password: '', role: 'employee', manager: '', ssoEnabled: false };

const roleBadgeStyles = {
  employee: 'bg-blue-100 text-blue-700',
  manager: 'bg-purple-100 text-purple-700',
  'it-admin': 'bg-red-100 text-red-700',
  'front-desk': 'bg-slate-200 text-slate-700'
};

const logIcon = (action = '') => {
  const normalized = action.toLowerCase();
  if (normalized.includes('login') || normalized.includes('logout')) return '🔐';
  if (normalized.includes('request.created')) return '📝';
  if (normalized.includes('approved')) return '✅';
  if (normalized.includes('rejected')) return '❌';
  if (normalized.includes('comment')) return '💬';
  if (normalized.includes('settings')) return '⚙️';
  return '📌';
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [filters, setFilters] = useState({ action: '', role: '' });
  const [editing, setEditing] = useState({});
  const [settings, setSettings] = useState({ companyName: '', allowEmployeeSso: true, checkInWindowMinutes: 120 });
  const [page, setPage] = useState(1);

  const loadUsers = async () => {
    const { data } = await adminApi.getUsers();
    setUsers(data.users);
  };

  const loadLogs = async () => {
    const { data } = await adminApi.getLogs(filters);
    setLogs(data.logs);
  };

  const loadSettings = async () => {
    const { data } = await adminApi.getSettings();
    setSettings(data.settings);
  };

  useEffect(() => {
    loadUsers();
    loadLogs();
    loadSettings();
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    await adminApi.createUser(userForm);
    setUserForm(emptyUser);
    await loadUsers();
  };

  const deleteUser = async (id) => {
    await adminApi.deleteUser(id);
    await loadUsers();
  };

  const updateUser = async (id) => {
    await adminApi.updateUser(id, editing[id]);
    await loadUsers();
  };

  const applyFilters = async () => {
    setPage(1);
    await loadLogs();
  };

  const saveSettings = async () => {
    await adminApi.updateSettings({
      companyName: settings.companyName,
      allowEmployeeSso: settings.allowEmployeeSso,
      checkInWindowMinutes: Number(settings.checkInWindowMinutes)
    });
    await loadSettings();
  };

  const pageSize = 10;
  const totalLogs = logs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));
  const pagedLogs = logs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppLayout title="IT Admin Dashboard">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="card p-5 space-y-4">
          <h3 className="font-semibold">Create User</h3>
          <form className="grid grid-cols-2 gap-3" onSubmit={createUser}>
            <input className="input col-span-2" placeholder="Name" value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="input col-span-2" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} required />
            <input className="input col-span-2" type="password" placeholder="Password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} required />
            <select className="input col-span-1" value={userForm.role} onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}>
              <option value="employee">employee</option>
              <option value="manager">manager</option>
              <option value="front-desk">front-desk</option>
              <option value="it-admin">it-admin</option>
            </select>
            <label className="flex items-center gap-2 text-sm col-span-1">
              <input type="checkbox" checked={userForm.ssoEnabled} onChange={(e) => setUserForm((p) => ({ ...p, ssoEnabled: e.target.checked }))} />
              SSO Enabled
            </label>
            <button className="btn-primary col-span-2" type="submit">Create</button>
          </form>

          <div className="space-y-2">
            <h4 className="font-medium">Users</h4>
            {users.map((user) => (
              <div key={user._id} className="border border-slate-100 rounded-lg p-3 space-y-3">
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select
                    className="input"
                    value={editing[user._id]?.role ?? user.role}
                    onChange={(e) => setEditing((prev) => ({
                      ...prev,
                      [user._id]: { ...prev[user._id], role: e.target.value }
                    }))}
                  >
                    <option value="employee">employee</option>
                    <option value="manager">manager</option>
                    <option value="front-desk">front-desk</option>
                    <option value="it-admin">it-admin</option>
                  </select>
                  <label className="text-sm flex items-center gap-2 px-2">
                    <input
                      type="checkbox"
                      checked={editing[user._id]?.isActive ?? user.isActive}
                      onChange={(e) => setEditing((prev) => ({
                        ...prev,
                        [user._id]: { ...prev[user._id], isActive: e.target.checked }
                      }))}
                    />
                    Active
                  </label>
                  <label className="text-sm flex items-center gap-2 px-2">
                    <input
                      type="checkbox"
                      checked={editing[user._id]?.ssoEnabled ?? user.ssoEnabled}
                      onChange={(e) => setEditing((prev) => ({
                        ...prev,
                        [user._id]: { ...prev[user._id], ssoEnabled: e.target.checked }
                      }))}
                    />
                    SSO
                  </label>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => updateUser(user._id)}>Save</button>
                  <button className="btn-secondary" onClick={() => deleteUser(user._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <h3 className="font-semibold">Audit Logs</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input className="input" placeholder="Action" value={filters.action} onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))} />
            <input className="input" placeholder="Role" value={filters.role} onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))} />
            <input className="input" type="date" value={filters.from || ''} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
            <input className="input" type="date" value={filters.to || ''} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
            <button className="btn-secondary" onClick={applyFilters}>Search</button>
          </div>
          <a className="btn-primary inline-flex" href={adminApi.exportLogsUrl} target="_blank" rel="noreferrer">Export CSV</a>
          <p className="text-sm text-slate-600">Total Logs: <span className="font-semibold">{totalLogs}</span></p>
          <div className="max-h-[420px] overflow-auto space-y-2">
            {pagedLogs.map((log) => (
              <div key={log._id} className="border border-slate-100 rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold flex items-center gap-2">
                      <span>{logIcon(log.action)}</span>
                      <span>{log.action}</span>
                    </p>
                    <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                    <p className="text-xs text-slate-600">User: {log.user?.name || 'System'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full h-fit capitalize font-semibold ${roleBadgeStyles[log.role] || 'bg-slate-100 text-slate-700'}`}>
                    {log.role || 'unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button
              className="btn-secondary"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <p className="text-sm text-slate-600">Page {page} of {totalPages}</p>
            <button
              className="btn-secondary"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="font-medium">System Settings</h4>
            <input className="input" placeholder="Company Name" value={settings.companyName} onChange={(e) => setSettings((p) => ({ ...p, companyName: e.target.value }))} />
            <input className="input" type="number" placeholder="Check-in Window (minutes)" value={settings.checkInWindowMinutes} onChange={(e) => setSettings((p) => ({ ...p, checkInWindowMinutes: e.target.value }))} />
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={settings.allowEmployeeSso} onChange={(e) => setSettings((p) => ({ ...p, allowEmployeeSso: e.target.checked }))} />
              Allow Employee SSO
            </label>
            <button className="btn-secondary" onClick={saveSettings}>Save Settings</button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
