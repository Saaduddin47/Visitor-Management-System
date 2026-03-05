import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle,
  Download,
  FilePen,
  FilePlus,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  MessageSquare,
  ScrollText,
  Settings,
  SlidersHorizontal,
  UserPlus,
  Users,
  Sun,
  XCircle
} from 'lucide-react';
import { adminApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useTheme } from '../context/ThemeContext';
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

const avatarRoleStyles = {
  employee: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  manager: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200',
  'front-desk': 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200',
  'it-admin': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200'
};

const actionVisuals = {
  'user.login': { icon: LogIn, color: 'text-blue-600' },
  'user.logout': { icon: LogOut, color: 'text-red-600' },
  'request.created': { icon: FilePlus, color: 'text-blue-600' },
  'request.approved': { icon: CheckCircle, color: 'text-green-600' },
  'request.rejected': { icon: XCircle, color: 'text-red-600' },
  'request.commented': { icon: MessageSquare, color: 'text-orange-600' },
  'request.updated': { icon: FilePen, color: 'text-blue-600' },
  'admin.settings-updated': { icon: SlidersHorizontal, color: 'text-slate-500' }
};

const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getLogVisual = (action = '') => actionVisuals[action] || { icon: Activity, color: 'text-slate-500' };

const AdminDashboard = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [filters, setFilters] = useState({ action: '', role: '', from: '', to: '' });
  const [editing, setEditing] = useState({});
  const [settings, setSettings] = useState({ companyName: '', allowEmployeeSso: true, checkInWindowMinutes: 120 });
  const [page, setPage] = useState(1);

  const [activeSection, setActiveSection] = useState('users');
  const [activeNav, setActiveNav] = useState('users');

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
    await loadLogs(filters);
  };

  const clearFilters = async () => {
    const reset = { action: '', role: '', from: '', to: '' };
    setFilters(reset);
    setPage(1);
    await loadLogs(reset);
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
  const pagedLogs = useMemo(() => logs.slice((page - 1) * pageSize, page * pageSize), [logs, page]);

  const openSection = (nav) => {
    setActiveNav(nav);
    if (nav === 'logs') setActiveSection('logs');
    else if (nav === 'settings') setActiveSection('settings');
    else setActiveSection('users');
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full bg-[#1F4E79]">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Building2 className="text-white" size={22} />
          <div>
            <h1 className="text-white font-bold text-lg leading-none">VMS</h1>
            <p className="text-white/50 text-xs mt-0.5">IT Admin Panel</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {[
            { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { key: 'users', icon: Users, label: 'User Management' },
            { key: 'logs', icon: ScrollText, label: 'Audit Logs' },
            { key: 'settings', icon: Settings, label: 'System Settings' }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.key;
            const button = (
              <button
                type="button"
                onClick={() => openSection(item.key)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  active ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );

            if (!mobile) return <div key={item.key}>{button}</div>;
            return (
              <SheetClose asChild key={item.key}>
                {button}
              </SheetClose>
            );
          })}
        </div>
      </ScrollArea>

      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  const UsersSection = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <UserPlus size={18} className="text-[#2E75B6]" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create New User</h2>
      </div>

      <form className="space-y-4" onSubmit={createUser}>
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Name</label>
          <input className="input" placeholder="Enter full name" value={userForm.name} onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))} required />
        </div>
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <input className="input" placeholder="Enter email" value={userForm.email} onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))} required />
        </div>
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Password</label>
          <input className="input" type="password" placeholder="Create password" value={userForm.password} onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Role</label>
            <AnimatedDropdown
              options={roleOptions}
              value={userForm.role}
              onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
              placeholder="Select role"
            />
          </div>
          <label className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2 mt-6">
            <input type="checkbox" checked={userForm.ssoEnabled} onChange={(event) => setUserForm((prev) => ({ ...prev, ssoEnabled: event.target.checked }))} />
            SSO Enabled
          </label>
        </div>

        <RippleButton className="w-full" type="submit" variant="default">Create</RippleButton>
      </form>

      <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Users</h3>
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {users.map((user) => (
            <div key={user._id} className="py-4 first:pt-0 last:pb-0">
              <div className="grid grid-cols-1 2xl:grid-cols-[1.2fr_1.2fr_auto] gap-4 items-center">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${avatarRoleStyles[user.role] || 'bg-slate-100 text-slate-700'}`}>
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadgeStyles[user.role] || 'bg-slate-100 text-slate-700'}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <AnimatedDropdown
                    options={roleOptions}
                    value={editing[user._id]?.role ?? user.role}
                    onChange={(event) => setEditing((prev) => ({
                      ...prev,
                      [user._id]: { ...prev[user._id], role: event.target.value }
                    }))}
                    placeholder="Select role"
                  />
                  <label className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2 px-2">
                    <input
                      type="checkbox"
                      checked={editing[user._id]?.isActive ?? user.isActive}
                      onChange={(event) => setEditing((prev) => ({
                        ...prev,
                        [user._id]: { ...prev[user._id], isActive: event.target.checked }
                      }))}
                    />
                    Active
                  </label>
                  <label className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2 px-2">
                    <input
                      type="checkbox"
                      checked={editing[user._id]?.ssoEnabled ?? user.ssoEnabled}
                      onChange={(event) => setEditing((prev) => ({
                        ...prev,
                        [user._id]: { ...prev[user._id], ssoEnabled: event.target.checked }
                      }))}
                    />
                    SSO
                  </label>
                </div>

                <div className="flex gap-2 justify-start 2xl:justify-end">
                  <RippleButton onClick={() => updateUser(user._id)} variant="default">Save</RippleButton>
                  <RippleButton onClick={() => deleteUser(user._id)} variant="default" className="bg-red-600 hover:bg-red-700">Delete</RippleButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const LogsSection = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ScrollText size={18} className="text-[#2E75B6]" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Audit Logs</h2>
          <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-semibold">{totalLogs}</span>
        </div>

        <RippleButton
          onClick={() => window.open(adminApi.exportLogsUrl, '_blank', 'noopener,noreferrer')}
          variant="hoverborder"
          hoverBorderEffectColor="#2E75B6"
          hoverBorderEffectThickness="2px"
          className="inline-flex"
        >
          <Download size={14} />
          Export CSV
        </RippleButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Action</label>
          <input className="input" placeholder="e.g. request.created" value={filters.action} onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Role</label>
          <input className="input" placeholder="e.g. manager" value={filters.role} onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))} />
        </div>
      </div>

      <div className="flex items-end flex-wrap gap-2">
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">From Date</label>
          <div className="relative">
            <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
              className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pb-2 text-slate-400 dark:text-slate-500">—</div>

        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">To Date</label>
          <div className="relative">
            <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
              className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <RippleButton
          onClick={applyFilters}
          variant="hoverborder"
          hoverBorderEffectColor="#2E75B6"
          hoverBorderEffectThickness="2px"
        >
          Search
        </RippleButton>

        <RippleButton onClick={clearFilters} variant="ghost">Clear Filters</RippleButton>
      </div>

      <div className="space-y-2 max-h-[520px] overflow-auto">
        {pagedLogs.map((log) => {
          const visual = getLogVisual(log.action);
          const Icon = visual.icon;
          return (
            <div key={log._id} className="border border-gray-100 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Icon size={18} className={visual.color} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{log.action}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{log.user?.name || 'System'}</p>
                </div>
                <p className="ml-auto text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</p>
                <span className={`text-xs px-2 py-1 rounded-full capitalize font-semibold ${roleBadgeStyles[log.role] || 'bg-slate-100 text-slate-700'}`}>
                  {log.role || 'unknown'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <RippleButton
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
          variant="hoverborder"
          hoverBorderEffectColor="#2E75B6"
          hoverBorderEffectThickness="2px"
        >
          Previous
        </RippleButton>
        <p className="text-sm text-slate-600 dark:text-slate-300">Page {page} of {totalPages}</p>
        <RippleButton
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
          variant="hoverborder"
          hoverBorderEffectColor="#2E75B6"
          hoverBorderEffectThickness="2px"
        >
          Next
        </RippleButton>
      </div>
    </div>
  );

  const SettingsSection = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={18} className="text-[#2E75B6]" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">System Settings</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px_200px_auto] gap-3 items-end">
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
          <input className="input" value={settings.companyName} onChange={(event) => setSettings((prev) => ({ ...prev, companyName: event.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Check-in Window (minutes)</label>
          <input className="input" type="number" value={settings.checkInWindowMinutes} onChange={(event) => setSettings((prev) => ({ ...prev, checkInWindowMinutes: event.target.value }))} />
        </div>
        <label className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2 pb-2">
          <input type="checkbox" checked={settings.allowEmployeeSso} onChange={(event) => setSettings((prev) => ({ ...prev, allowEmployeeSso: event.target.checked }))} />
          Allow Employee SSO
        </label>
        <RippleButton onClick={saveSettings} variant="default">Save Settings</RippleButton>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200">
              <Menu size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-r border-white/10">
            <SidebarContent mobile />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:flex h-screen">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <SidebarContent />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={80}>
            <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-slate-950 p-8">
              {activeSection === 'users' && <UsersSection />}
              {activeSection === 'logs' && <LogsSection />}
              {activeSection === 'settings' && <SettingsSection />}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="lg:hidden min-h-screen bg-gray-50 dark:bg-slate-950 pt-20 p-4">
        {activeSection === 'users' && <UsersSection />}
        {activeSection === 'logs' && <LogsSection />}
        {activeSection === 'settings' && <SettingsSection />}
      </div>
    </div>
  );
};

export default AdminDashboard;
