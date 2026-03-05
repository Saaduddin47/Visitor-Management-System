import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, LogOut, Moon, Sun } from 'lucide-react';
import { managerApi } from '../api';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const statusCardStyles = {
  approved: 'border-l-[6px] border-[#16a34a] bg-[#f0fdf4] dark:bg-green-950/30',
  rejected: 'border-l-[6px] border-[#dc2626] bg-[#fef2f2] dark:bg-red-950/30',
  pending: 'border-l-[6px] border-[#ca8a04] bg-[#fefce8] dark:bg-yellow-950/30',
  'needs-changes': 'border-l-[6px] border-[#ea580c] bg-[#fff7ed] dark:bg-orange-950/30'
};

const statusBadgeStyles = {
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  'needs-changes': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200'
};

const ManagerDashboard = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [requests, setRequests] = useState([]);
  const [commentById, setCommentById] = useState({});
  const [activeNav, setActiveNav] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const load = async () => {
    const { data } = await managerApi.getRequests();
    setRequests(data.requests);
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => ({
    pending: requests.filter((request) => request.status === 'pending').length,
    approved: requests.filter((request) => request.status === 'approved').length,
    rejected: requests.filter((request) => request.status === 'rejected').length
  }), [requests]);

  const action = async (id, type) => {
    const payload = { comment: commentById[id] || type };
    if (type === 'approve') await managerApi.approve(id, payload);
    if (type === 'reject') await managerApi.reject(id, payload);
    if (type === 'comment') await managerApi.comment(id, payload);
    await load();
  };

  const openSection = (sectionId, navKey) => {
    setActiveNav(navKey);
    const node = document.getElementById(sectionId);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-screen">
      <aside className={`fixed left-0 top-0 h-screen bg-[#1F4E79] text-white flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
            <Building2 className="text-white" size={22} />
              {!collapsed && (
                <div>
                  <h1 className="text-white font-bold text-lg leading-none">VMS</h1>
                  <p className="text-white/50 text-xs mt-0.5">Manager Panel</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="text-white/80 hover:text-white rounded-md p-1 hover:bg-white/10 transition-all"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        <div className="flex-1 px-3 py-4 space-y-1">
          <button
            type="button"
            onClick={() => openSection('manager-dashboard', 'dashboard')}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              activeNav === 'dashboard' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard size={16} />
            {!collapsed && <span>Dashboard</span>}
          </button>
          <button
            type="button"
            onClick={() => openSection('manager-requests', 'requests')}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              activeNav === 'requests' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <ClipboardList size={16} />
            {!collapsed && <span>Visitor Requests</span>}
          </button>
        </div>

        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm font-medium`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={logout}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-all text-sm font-medium`}
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`min-h-screen bg-gray-50 dark:bg-slate-950 p-8 w-full overflow-y-auto transition-all duration-300 ease-in-out ${collapsed ? 'ml-16' : 'ml-64'}`} id="manager-dashboard">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Pending</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{counts.pending}</p>
          </div>
          <div className="rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Approved</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{counts.approved}</p>
          </div>
          <div className="rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Rejected</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{counts.rejected}</p>
          </div>
        </div>

        <section id="manager-requests" className="rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 mt-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Team Visitor Requests</h3>
          {requests.map((request) => (
            <div
              key={request._id}
              className={`border border-slate-200 rounded-2xl p-6 space-y-3 ${statusCardStyles[request.status] || 'bg-white border-l-[6px] border-slate-200'}`}
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{request.visitorName} · {request.referenceId}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{request.dateOfVisit} {request.timeOfVisit} · {request.officeLocation}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Employee: {request.employee?.name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize h-fit font-semibold ${statusBadgeStyles[request.status] || 'bg-slate-100 text-slate-700'}`}>
                  {request.status}
                </span>
              </div>
              {request.status === 'needs-changes' && (
                <div className="text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 rounded-lg px-3 py-2 w-fit">
                  Awaiting Employee Edit
                </div>
              )}
              <input
                className="input"
                placeholder="Comment"
                value={commentById[request._id] || ''}
                onChange={(e) => setCommentById((prev) => ({ ...prev, [request._id]: e.target.value }))}
                disabled={request.status === 'needs-changes'}
              />
              <div className="flex gap-2">
                <RippleButton
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${request.status === 'needs-changes' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : ''}`}
                  onClick={() => action(request._id, 'approve')}
                  disabled={request.status === 'needs-changes'}
                  variant="default"
                >
                  Approve
                </RippleButton>
                <RippleButton
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${request.status === 'needs-changes' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white border-0'}`}
                  onClick={() => action(request._id, 'reject')}
                  disabled={request.status === 'needs-changes'}
                  variant="default"
                >
                  Reject
                </RippleButton>
                <RippleButton
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${request.status === 'needs-changes' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : ''}`}
                  onClick={() => action(request._id, 'comment')}
                  disabled={request.status === 'needs-changes'}
                  variant="hover"
                  hoverRippleColor="#6996e2"
                >
                  Send Back
                </RippleButton>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default ManagerDashboard;
