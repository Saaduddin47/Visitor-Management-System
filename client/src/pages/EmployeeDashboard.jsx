import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Edit, FilePlus, FileText, MapPin, Search, User, XCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { employeeApi } from '../api';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';
import BoltLayout from '@/components/BoltLayout';
import { SectionCard, StatCard, StatusBadge } from '@/components/ui/bolt';

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
  approved: 'border-green-200 bg-green-50/60 dark:border-green-900 dark:bg-green-950/30',
  rejected: 'border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30',
  pending: 'border-yellow-200 bg-yellow-50/60 dark:border-yellow-900 dark:bg-yellow-950/30',
  'checked-in': 'border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30',
  'checked-out': 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40',
  'no-show': 'border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30',
  'needs-changes': 'border-orange-200 bg-orange-50/60 dark:border-orange-900 dark:bg-orange-950/30'
};

const statusBadgeStyles = {
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  'checked-in': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  'checked-out': 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  'no-show': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  'needs-changes': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200'
};

const EmployeeDashboard = () => {
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState(initialForm);
  const [activeHistoryTab, setActiveHistoryTab] = useState('live');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadRequests = async () => {
    const { data } = await employeeApi.getRequests();
    setRequests(data.requests || []);
  };

  useEffect(() => {
    loadRequests();
    const timer = setInterval(loadRequests, 15000);
    return () => clearInterval(timer);
  }, []);

  const filteredRequests = useMemo(() => {
    const liveStatuses = ['pending', 'needs-changes', 'approved', 'checked-in'];
    const historyStatuses = ['rejected', 'checked-out', 'no-show'];
    const allowed = activeHistoryTab === 'live' ? liveStatuses : historyStatuses;
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesTab = allowed.includes(request.status);
      if (!matchesTab) return false;
      if (!normalizedSearch) return true;
      return [request.visitorName, request.referenceId, request.officeLocation, request.purpose]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [requests, activeHistoryTab, searchTerm]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
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
      await loadRequests();
      const errorText = error?.response?.data?.message || error?.message || '';
      const smtpFailed = /enotfound|smtp/i.test(String(errorText));
      setMessage(smtpFailed ? 'Request saved, but notification email failed.' : (error.response?.data?.message || 'Failed to submit'));
    } finally {
      setIsSubmitting(false);
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
      await loadRequests();
      const errorText = error?.response?.data?.message || error?.message || '';
      const smtpFailed = /enotfound|smtp/i.test(String(errorText));
      setMessage(smtpFailed ? 'Request updated, but notification email failed.' : (error.response?.data?.message || 'Failed to resubmit'));
    }
  };

  const total = requests.length;
  const approved = requests.filter((request) => request.status === 'approved').length;
  const pending = requests.filter((request) => request.status === 'pending').length;
  const thisMonth = requests.filter((request) => {
    if (!request.createdAt) return false;
    const created = new Date(request.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <BoltLayout title="Employee Dashboard" subtitle="Create visitor requests and track approvals">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Requests" value={total} tone="blue" icon={FileText} />
        <StatCard label="Approved" value={approved} tone="green" icon={CheckCircle} />
        <StatCard label="Pending" value={pending} tone="yellow" icon={Clock} />
        <StatCard label="This Month" value={thisMonth} tone="purple" icon={Calendar} />
      </div>

      <SectionCard title="New Visitor Request" actions={<RippleButton variant="hover" onClick={() => document.getElementById('request-history')?.scrollIntoView({ behavior: 'smooth' })}><FilePlus className="w-4 h-4" />View History</RippleButton>}>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={onSubmit}>
          <input className="input" type="text" placeholder="Visitor Name" value={form.visitorName} onChange={(e) => setForm((p) => ({ ...p, visitorName: e.target.value }))} required />
          <input className="input" type="email" placeholder="Visitor Email" value={form.visitorEmail} onChange={(e) => setForm((p) => ({ ...p, visitorEmail: e.target.value }))} required />
          <input className="input" type="text" placeholder="Visitor Phone" value={form.visitorPhone} onChange={(e) => setForm((p) => ({ ...p, visitorPhone: e.target.value }))} required />
          <input className="input" type="text" placeholder="Purpose" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} required />
          <input className="input" type="text" placeholder="Office Location" value={form.officeLocation} onChange={(e) => setForm((p) => ({ ...p, officeLocation: e.target.value }))} required />
          <input className="input" type="date" value={form.dateOfVisit} onChange={(e) => setForm((p) => ({ ...p, dateOfVisit: e.target.value }))} required />
          <input className="input" type="time" value={form.timeOfVisit} onChange={(e) => setForm((p) => ({ ...p, timeOfVisit: e.target.value }))} required />
          <div className="md:col-span-2"><input className="w-full border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-4 text-sm" type="file" onChange={(e) => setForm((p) => ({ ...p, attachment: e.target.files?.[0] || null }))} /></div>
          <div className="md:col-span-2"><RippleButton type="submit" variant="default" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">{isSubmitting ? 'Submitting...' : 'Submit Request'}</RippleButton></div>
        </form>
        {message ? <p className="text-sm mt-3 text-gray-600 dark:text-slate-300">{message}</p> : null}
      </SectionCard>

      <SectionCard title="Request History" actions={<span className="text-xs text-gray-500 dark:text-slate-400">Auto-refresh every 15s</span>}>
        <div id="request-history" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-slate-700">
              <button type="button" onClick={() => setActiveHistoryTab('live')} className={activeHistoryTab === 'live' ? 'border-b-2 border-emerald-600 text-emerald-600 font-semibold pb-2' : 'text-gray-500 dark:text-slate-400 pb-2'}>Live Requests</button>
              <button type="button" onClick={() => setActiveHistoryTab('past')} className={activeHistoryTab === 'past' ? 'border-b-2 border-emerald-600 text-emerald-600 font-semibold pb-2' : 'text-gray-500 dark:text-slate-400 pb-2'}>Past Requests</button>
            </div>
            <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search requests..." className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm" /></div>
          </div>

          {filteredRequests.map((request) => (
            <div key={request._id} className={`rounded-xl p-4 border space-y-3 ${statusCardStyles[request.status] || 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{request.referenceId} · {request.visitorName}</p>
                  <div className="mt-1 text-sm text-gray-600 dark:text-slate-300 space-y-1">
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {request.dateOfVisit} {request.timeOfVisit}</p>
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {request.officeLocation}</p>
                    <p className="flex items-center gap-2"><User className="w-4 h-4" /> {request.purpose}</p>
                  </div>
                </div>
                <StatusBadge status={request.status} map={statusBadgeStyles} circular />
              </div>

              {!!request.managerComment && request.status === 'needs-changes' ? <div className="rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-100/80 dark:bg-orange-950/40 px-3 py-2 text-sm"><p className="font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Manager Comment</p><p>{request.managerComment}</p></div> : null}
              {!!request.managerComment && request.status !== 'needs-changes' ? <p className="text-sm text-gray-600 dark:text-slate-300">Comment: {request.managerComment}</p> : null}

              {request.status === 'needs-changes' && editingId !== request._id ? <RippleButton onClick={() => startEdit(request)} variant="hoverborder" hoverBorderEffectColor="#10b981" hoverBorderEffectThickness="2px"><Edit className="w-4 h-4" />Edit & Resubmit</RippleButton> : null}

              {editingId === request._id ? (
                <div className="border border-orange-200 dark:border-orange-900 bg-white dark:bg-slate-900 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input" type="text" placeholder="Visitor Name" value={editForm.visitorName} onChange={(e) => setEditForm((p) => ({ ...p, visitorName: e.target.value }))} required />
                  <input className="input" type="email" placeholder="Visitor Email" value={editForm.visitorEmail} onChange={(e) => setEditForm((p) => ({ ...p, visitorEmail: e.target.value }))} required />
                  <input className="input" type="text" placeholder="Visitor Phone" value={editForm.visitorPhone} onChange={(e) => setEditForm((p) => ({ ...p, visitorPhone: e.target.value }))} required />
                  <input className="input" type="text" placeholder="Purpose" value={editForm.purpose} onChange={(e) => setEditForm((p) => ({ ...p, purpose: e.target.value }))} required />
                  <input className="input" type="text" placeholder="Office Location" value={editForm.officeLocation} onChange={(e) => setEditForm((p) => ({ ...p, officeLocation: e.target.value }))} required />
                  <input className="input" type="date" value={editForm.dateOfVisit} onChange={(e) => setEditForm((p) => ({ ...p, dateOfVisit: e.target.value }))} required />
                  <input className="input" type="time" value={editForm.timeOfVisit} onChange={(e) => setEditForm((p) => ({ ...p, timeOfVisit: e.target.value }))} required />
                  <div className="md:col-span-2"><input className="w-full border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-4 text-sm" type="file" onChange={(e) => setEditForm((p) => ({ ...p, attachment: e.target.files?.[0] || null }))} /></div>
                  <div className="md:col-span-2 flex gap-2"><RippleButton onClick={() => resubmit(request._id)} variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">Resubmit</RippleButton><RippleButton onClick={() => setEditingId('')} variant="hover"><XCircle className="w-4 h-4" />Cancel</RippleButton></div>
                </div>
              ) : null}
            </div>
          ))}

          {filteredRequests.length === 0 ? <div className="text-center py-8 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg"><FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" /><p className="text-sm text-gray-500 dark:text-slate-400">No requests found for the selected view.</p></div> : null}
        </div>
      </SectionCard>
    </BoltLayout>
  );
};

export default EmployeeDashboard;
