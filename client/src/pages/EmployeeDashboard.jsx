import { useEffect, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, ClipboardList, FilePlus, LayoutDashboard, LogOut, Moon, Sun } from 'lucide-react';
import { employeeApi } from '../api';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const initialForm = {
  visitorName: '',
  visitorEmail: '',
  visitorPhone: '',
  dateOfVisit: '',
  timeOfVisit: '',
  purpose: '',
  officeLocation: '',
  attachment: null
};

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

const EmployeeDashboard = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState(initialForm);
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');

  const loadRequests = async () => {
    const { data } = await employeeApi.getRequests();
    setRequests(data.requests);
  };

  useEffect(() => {
    loadRequests();
    const timer = setInterval(loadRequests, 15000);
    return () => clearInterval(timer);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) fd.append(key, value);
    });

    try {
      await employeeApi.createRequest(fd);
      setForm(initialForm);
      setMessage('Request submitted successfully');
      await loadRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit');
    }
  };

  const startEdit = (request) => {
    setEditingId(request._id);
    setEditForm({
      visitorName: request.visitorName || '',
      visitorEmail: request.visitorEmail || '',
      visitorPhone: request.visitorPhone || '',
      dateOfVisit: request.dateOfVisit || '',
      timeOfVisit: request.timeOfVisit || '',
      purpose: request.purpose || '',
      officeLocation: request.officeLocation || '',
      attachment: null
    });
  };

  const resubmit = async (requestId) => {
    const fd = new FormData();
    Object.entries(editForm).forEach(([key, value]) => {
      if (value) fd.append(key, value);
    });

    try {
      await employeeApi.updateRequest(requestId, fd);
      setMessage('Request resubmitted to manager');
      setEditingId('');
      setEditForm(initialForm);
      await loadRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to resubmit');
    }
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
                  <p className="text-white/50 text-xs mt-0.5">Employee Panel</p>
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
            onClick={() => openSection('employee-dashboard', 'dashboard')}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              activeNav === 'dashboard' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard size={16} />
            {!collapsed && <span>Dashboard</span>}
          </button>

          <button
            type="button"
            onClick={() => openSection('employee-new-request', 'new-request')}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              activeNav === 'new-request' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <FilePlus size={16} />
            {!collapsed && <span>New Request</span>}
          </button>

          <button
            type="button"
            onClick={() => openSection('employee-history', 'history')}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              activeNav === 'history' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <ClipboardList size={16} />
            {!collapsed && <span>Request History</span>}
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

      <main className={`min-h-screen bg-gray-50 dark:bg-slate-950 p-8 w-full overflow-y-auto transition-all duration-300 ease-in-out ${collapsed ? 'ml-16' : 'ml-64'}`} id="employee-dashboard">
        <section id="employee-new-request" className="rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">New Visitor Request</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Visitor Name</label>
              <input className="input" type="text" placeholder="Visitor Name" value={form.visitorName} onChange={(e) => setForm((p) => ({ ...p, visitorName: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Visitor Email</label>
              <input className="input" type="email" placeholder="Visitor Email" value={form.visitorEmail} onChange={(e) => setForm((p) => ({ ...p, visitorEmail: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Visitor Phone</label>
              <input className="input" type="text" placeholder="Visitor Phone" value={form.visitorPhone} onChange={(e) => setForm((p) => ({ ...p, visitorPhone: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Purpose</label>
              <input className="input" type="text" placeholder="Purpose of Visit" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Office Location</label>
              <input className="input" type="text" placeholder="Office Location" value={form.officeLocation} onChange={(e) => setForm((p) => ({ ...p, officeLocation: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Date of Visit</label>
              <input className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" type="date" value={form.dateOfVisit} onChange={(e) => setForm((p) => ({ ...p, dateOfVisit: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Visit Time</label>
              <input className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" type="time" value={form.timeOfVisit} onChange={(e) => setForm((p) => ({ ...p, timeOfVisit: e.target.value }))} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Attachment (optional)</label>
              <input className="w-full border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg p-4 text-sm text-gray-400 dark:text-slate-500" type="file" onChange={(e) => setForm((p) => ({ ...p, attachment: e.target.files?.[0] || null }))} />
            </div>
            <div className="md:col-span-2">
              <RippleButton className="" type="submit" variant="default">Submit Request</RippleButton>
            </div>
          </form>
          {message && <p className="text-sm mt-3 text-slate-600 dark:text-slate-300">{message}</p>}
        </section>

        <section id="employee-history" className="rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 mt-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Request History (Auto-refresh 15s)</h3>
        {requests.map((request) => (
          <div
            key={request._id}
            className={`border border-slate-200 rounded-xl p-4 space-y-3 ${statusCardStyles[request.status] || 'bg-white border-l-[6px] border-slate-200'}`}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{request.referenceId} · {request.visitorName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{request.dateOfVisit} {request.timeOfVisit} · {request.officeLocation}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full capitalize h-fit font-semibold ${statusBadgeStyles[request.status] || 'bg-slate-100 text-slate-700'}`}>
                {request.status}
              </span>
            </div>

            {!!request.managerComment && request.status === 'needs-changes' && (
              <div className="rounded-lg border border-orange-200 bg-orange-100 px-3 py-2 text-sm text-orange-800">
                <p className="font-semibold">Manager Comment</p>
                <p>{request.managerComment}</p>
              </div>
            )}

            {!!request.managerComment && request.status !== 'needs-changes' && (
              <p className="text-sm text-slate-600 dark:text-slate-300">Comment: {request.managerComment}</p>
            )}

            {request.status === 'needs-changes' && editingId !== request._id && (
              <RippleButton
                className=""
                onClick={() => startEdit(request)}
                variant="hoverborder"
                hoverBorderEffectColor="#2E75B6"
                hoverBorderEffectThickness="2px"
              >
                Edit &amp; Resubmit
              </RippleButton>
            )}

            {editingId === request._id && (
              <div className="border border-orange-200 dark:border-orange-900 bg-white dark:bg-slate-900 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Visitor Name</label>
                  <input className="input" type="text" placeholder="Visitor Name" value={editForm.visitorName} onChange={(e) => setEditForm((p) => ({ ...p, visitorName: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Visitor Email</label>
                  <input className="input" type="email" placeholder="Visitor Email" value={editForm.visitorEmail} onChange={(e) => setEditForm((p) => ({ ...p, visitorEmail: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Visitor Phone</label>
                  <input className="input" type="text" placeholder="Visitor Phone" value={editForm.visitorPhone} onChange={(e) => setEditForm((p) => ({ ...p, visitorPhone: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Purpose</label>
                  <input className="input" type="text" placeholder="Purpose of Visit" value={editForm.purpose} onChange={(e) => setEditForm((p) => ({ ...p, purpose: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Office Location</label>
                  <input className="input" type="text" placeholder="Office Location" value={editForm.officeLocation} onChange={(e) => setEditForm((p) => ({ ...p, officeLocation: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Date of Visit</label>
                  <input className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" type="date" value={editForm.dateOfVisit} onChange={(e) => setEditForm((p) => ({ ...p, dateOfVisit: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Visit Time</label>
                  <input className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" type="time" value={editForm.timeOfVisit} onChange={(e) => setEditForm((p) => ({ ...p, timeOfVisit: e.target.value }))} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Attachment (optional)</label>
                  <input className="w-full border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg p-4 text-sm text-gray-400 dark:text-slate-500" type="file" onChange={(e) => setEditForm((p) => ({ ...p, attachment: e.target.files?.[0] || null }))} />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <RippleButton className="" onClick={() => resubmit(request._id)} variant="default">Resubmit</RippleButton>
                  <RippleButton className="" onClick={() => setEditingId('')} variant="hover" hoverRippleColor="#6996e2">Cancel</RippleButton>
                </div>
              </div>
            )}
          </div>
        ))}
        </section>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
