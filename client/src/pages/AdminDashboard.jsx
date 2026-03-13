import { useEffect, useMemo, useState } from 'react';
import { Activity, Calendar, Download, FileText, Plus, Settings, SlidersHorizontal, Users } from 'lucide-react';
import { adminApi } from '../api';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';
import BoltLayout from '@/components/BoltLayout';
import { SectionCard, StatCard } from '@/components/ui/bolt';
import AnimatedDropdown from '@/components/ui/AnimatedDropdown';

const emptyUser = { name: '', email: '', password: '', role: 'employee', manager: '', ssoEnabled: false };
const roleOptions = [
  { id: 'employee', label: 'Employee', description: 'Can create visitor requests' },
  { id: 'manager', label: 'Manager', description: 'Can approve or reject requests' },
  { id: 'front-desk', label: 'Front-Desk', description: 'Can scan and manage check-ins' },
  { id: 'it-admin', label: 'IT Admin', description: 'Can manage users and settings' }
];

const roleBadgeStyles = {
  employee: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  manager: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200',
  'front-desk': 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200',
  'it-admin': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200'
};

const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [filters, setFilters] = useState({ action: '', role: '', from: '', to: '' });
  const [editing, setEditing] = useState({});
  const [settings, setSettings] = useState({ companyName: '', allowEmployeeSso: true, checkInWindowMinutes: 120 });
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionMessage, setActionMessage] = useState('');

  const updateCreateUserField = (key, value) => setUserForm((previous) => ({ ...previous, [key]: value }));

  const handleCreateRoleChange = (input) => {
    const nextRole = typeof input === 'string' ? input : input?.target?.value;
    if (!roleOptions.some((option) => option.id === nextRole)) return;
    updateCreateUserField('role', nextRole);
  };

  const loadUsers = async () => {
    const { data } = await adminApi.getUsers();
    setUsers(data.users || []);
  };

  const loadLogs = async (query = filters) => {
    const { data } = await adminApi.getLogs(query);
    setLogs(data.logs || []);
  };

  const loadSettings = async () => {
    const { data } = await adminApi.getSettings();
    setSettings(data.settings || settings);
  };

  useEffect(() => {
    loadUsers();
    loadLogs();
    loadSettings();
  }, []);

  const createUser = async (event) => {
    event.preventDefault();
    try {
      await adminApi.createUser(userForm);
      setUserForm(emptyUser);
      setActionMessage('User created successfully.');
      await Promise.all([loadUsers(), loadLogs()]);
    } catch (error) {
      await Promise.all([loadUsers(), loadLogs()]);
      const errorText = error?.response?.data?.message || error?.message || '';
      const smtpFailed = /enotfound|smtp/i.test(String(errorText));
      setActionMessage(smtpFailed ? 'User created, but notification email failed.' : (error.response?.data?.message || 'Failed to create user.'));
    }
  };

  const deleteUser = async (id) => {
    try {
      await adminApi.deleteUser(id);
      setActionMessage('User deleted successfully.');
      await Promise.all([loadUsers(), loadLogs()]);
    } catch (error) {
      await Promise.all([loadUsers(), loadLogs()]);
      setActionMessage(error.response?.data?.message || 'Failed to delete user.');
    }
  };

  const updateUser = async (id) => {
    try {
      await adminApi.updateUser(id, editing[id]);
      setActionMessage('User updated successfully.');
      await Promise.all([loadUsers(), loadLogs()]);
    } catch (error) {
      await Promise.all([loadUsers(), loadLogs()]);
      const errorText = error?.response?.data?.message || error?.message || '';
      const smtpFailed = /enotfound|smtp/i.test(String(errorText));
      setActionMessage(smtpFailed ? 'User updated, but notification email failed.' : (error.response?.data?.message || 'Failed to update user.'));
    }
  };

  const applyFilters = async () => {
    setPage(1);
    await loadLogs(filters);
  };

  const clearFilters = async () => {
    const reset = { action: '', role: '', from: '', to: '' };
    setFilters(reset);
    setPage(1);
    await loadLogs(reset);
  };

  const saveSettings = async () => {
    try {
      await adminApi.updateSettings({
        companyName: settings.companyName,
        allowEmployeeSso: settings.allowEmployeeSso,
        checkInWindowMinutes: Number(settings.checkInWindowMinutes)
      });
      setActionMessage('Settings saved successfully.');
      await Promise.all([loadSettings(), loadLogs()]);
    } catch (error) {
      await Promise.all([loadSettings(), loadLogs()]);
      setActionMessage(error.response?.data?.message || 'Failed to save settings.');
    }
  };

  const pageSize = 10;
  const totalLogs = logs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));
  const pagedLogs = useMemo(() => logs.slice((page - 1) * pageSize, page * pageSize), [logs, page]);
  const pendingRequests = logs.filter((log) => log.action?.includes('pending') || log.action === 'request.created').length;

  return (
    <BoltLayout title="IT Administrator Dashboard" subtitle="System management and configuration">
      {actionMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {actionMessage}
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Users" value={users.length} tone="blue" icon={Users} />
        <StatCard label="Active Users" value={users.filter((user) => user.isActive).length} tone="green" icon={Activity} />
        <StatCard label="Audit Logs" value={totalLogs} tone="purple" icon={FileText} />
        <StatCard label="Pending Requests" value={pendingRequests} tone="yellow" icon={Calendar} />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
        <div className="border-b border-gray-200 dark:border-slate-800 px-4">
          <nav className="flex gap-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'logs', label: 'Audit Logs', icon: FileText },
              { id: 'settings', label: 'System Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="System Status">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-sm text-green-700 dark:text-green-300">Database Connection: Healthy</div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-sm text-green-700 dark:text-green-300">Security Status: Secure</div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-sm text-green-700 dark:text-green-300">API Services: Online</div>
                </div>
              </SectionCard>
              <SectionCard title="Recent Activity">
                <div className="space-y-2 max-h-[320px] overflow-auto">
                  {logs.slice(0, 8).map((log) => (
                    <div key={log._id} className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{log.action}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{log.user?.name || 'System'} · {new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          ) : null}

          {activeTab === 'users' ? (
            <SectionCard title="User Management" actions={<RippleButton type="submit" form="create-user-form" variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"><Plus className="w-4 h-4" />Create</RippleButton>}>
              <form id="create-user-form" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6" onSubmit={createUser}>
                <input className="input" name="name" placeholder="Full name" value={userForm.name} onChange={(event) => updateCreateUserField('name', event.target.value)} required />
                <input className="input" name="email" type="email" placeholder="Email" value={userForm.email} onChange={(event) => updateCreateUserField('email', event.target.value)} required />
                <input className="input" name="password" type="password" placeholder="Password" value={userForm.password} onChange={(event) => updateCreateUserField('password', event.target.value)} required />
                <AnimatedDropdown options={roleOptions} value={userForm.role} onChange={handleCreateRoleChange} placeholder="Select role" />
              </form>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700"><th className="py-2">User</th><th className="py-2">Role</th><th className="py-2">Status</th><th className="py-2">Actions</th></tr></thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-gray-100 dark:border-slate-800">
                        <td className="py-3"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">{getInitials(user.name)}</div><div><p className="font-medium text-gray-900 dark:text-slate-100">{user.name}</p><p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p></div></div></td>
                        <td className="py-3 w-64"><AnimatedDropdown options={roleOptions} value={editing[user._id]?.role ?? user.role} onChange={(event) => setEditing((p) => ({ ...p, [user._id]: { ...p[user._id], role: event.target.value } }))} /></td>
                        <td className="py-3"><div className="flex items-center gap-4"><label className="text-sm text-gray-700 dark:text-slate-300 flex items-center gap-2"><input type="checkbox" checked={editing[user._id]?.isActive ?? user.isActive} onChange={(event) => setEditing((p) => ({ ...p, [user._id]: { ...p[user._id], isActive: event.target.checked } }))} />Active</label><label className="text-sm text-gray-700 dark:text-slate-300 flex items-center gap-2"><input type="checkbox" checked={editing[user._id]?.ssoEnabled ?? user.ssoEnabled} onChange={(event) => setEditing((p) => ({ ...p, [user._id]: { ...p[user._id], ssoEnabled: event.target.checked } }))} />SSO</label></div></td>
                        <td className="py-3"><div className="flex gap-2"><RippleButton onClick={() => updateUser(user._id)} variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">Save</RippleButton><RippleButton onClick={() => deleteUser(user._id)} variant="default" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0">Delete</RippleButton></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          ) : null}

          {activeTab === 'logs' ? (
            <SectionCard title="Audit Logs" actions={<RippleButton onClick={() => window.open(adminApi.exportLogsUrl, '_blank', 'noopener,noreferrer')} variant="hoverborder" hoverBorderEffectColor="#10b981" hoverBorderEffectThickness="2px"><Download className="w-4 h-4" />Export CSV</RippleButton>}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <input className="input" placeholder="Action" value={filters.action} onChange={(event) => setFilters((previous) => ({ ...previous, action: event.target.value }))} />
                  <input className="input" placeholder="Role" value={filters.role} onChange={(event) => setFilters((previous) => ({ ...previous, role: event.target.value }))} />
                  <input className="input" type="date" value={filters.from} onChange={(event) => setFilters((previous) => ({ ...previous, from: event.target.value }))} />
                  <input className="input" type="date" value={filters.to} onChange={(event) => setFilters((previous) => ({ ...previous, to: event.target.value }))} />
                </div>
                <div className="flex gap-2"><RippleButton onClick={applyFilters} variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">Search</RippleButton><RippleButton onClick={clearFilters} variant="ghost">Clear</RippleButton></div>
                <div className="space-y-2 max-h-[520px] overflow-auto">{pagedLogs.map((log) => <div key={log._id} className="border border-gray-100 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Activity className="w-4 h-4 text-slate-600 dark:text-slate-300" /></div><div className="min-w-0"><p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{log.action}</p><p className="text-xs text-gray-500 dark:text-slate-400 truncate">{log.user?.name || 'System'}</p></div><p className="ml-auto text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</p><span className={`text-xs px-2 py-1 rounded-full capitalize font-semibold ${roleBadgeStyles[log.role] || 'bg-slate-100 text-slate-700'}`}>{log.role || 'unknown'}</span></div></div>)}</div>
                <div className="flex items-center justify-between"><RippleButton onClick={() => setPage((previous) => Math.max(1, previous - 1))} disabled={page === 1} variant="hover">Previous</RippleButton><p className="text-sm text-gray-600 dark:text-slate-300">Page {page} of {totalPages}</p><RippleButton onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))} disabled={page === totalPages} variant="hover">Next</RippleButton></div>
              </div>
            </SectionCard>
          ) : null}

          {activeTab === 'settings' ? (
            <SectionCard title="System Settings" actions={<SlidersHorizontal className="w-5 h-5 text-emerald-600" />}>
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px_200px_auto] gap-3 items-end">
                <div><label className="block text-sm text-gray-700 dark:text-slate-300 mb-1">Company Name</label><input className="input" value={settings.companyName} onChange={(event) => setSettings((previous) => ({ ...previous, companyName: event.target.value }))} /></div>
                <div><label className="block text-sm text-gray-700 dark:text-slate-300 mb-1">Check-in Window (minutes)</label><input className="input" type="number" value={settings.checkInWindowMinutes} onChange={(event) => setSettings((previous) => ({ ...previous, checkInWindowMinutes: event.target.value }))} /></div>
                <label className="text-sm text-gray-700 dark:text-slate-300 flex items-center gap-2 pb-2"><input type="checkbox" checked={settings.allowEmployeeSso} onChange={(event) => setSettings((previous) => ({ ...previous, allowEmployeeSso: event.target.checked }))} />Allow Employee SSO</label>
                <RippleButton onClick={saveSettings} variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">Save Settings</RippleButton>
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </BoltLayout>
  );
};

export default AdminDashboard;
