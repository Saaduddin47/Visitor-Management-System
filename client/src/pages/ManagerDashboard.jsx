import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle, Clock, FileText, MessageSquare, Search, User, XCircle } from 'lucide-react';
import { managerApi } from '../api';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';
import BoltLayout from '@/components/BoltLayout';
import { SectionCard, StatCard, StatusBadge } from '@/components/ui/bolt';

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

const ManagerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [commentById, setCommentById] = useState({});
  const [activeRequestsTab, setActiveRequestsTab] = useState('live');
  const [loadingById, setLoadingById] = useState({});
  const [justActedById, setJustActedById] = useState({});
  const [toast, setToast] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    const { data } = await managerApi.getRequests();
    setRequests(data.requests || []);
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => ({
    pending: requests.filter((request) => request.status === 'pending').length,
    approved: requests.filter((request) => request.status === 'approved').length,
    rejected: requests.filter((request) => request.status === 'rejected').length,
    revision: requests.filter((request) => request.status === 'needs-changes').length
  }), [requests]);

  const filteredRequests = useMemo(() => {
    const liveStatuses = ['pending', 'needs-changes', 'approved', 'checked-in'];
    const historyStatuses = ['rejected', 'checked-out', 'no-show'];
    const allowed = activeRequestsTab === 'live' ? liveStatuses : historyStatuses;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return requests.filter((request) => {
      const inTab = allowed.includes(request.status);
      if (!inTab) return false;
      if (!normalizedSearch) return true;
      return [request.visitorName, request.referenceId, request.employee?.name, request.officeLocation]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [requests, activeRequestsTab, searchTerm]);

  const action = async (id, type) => {
    if (loadingById[id]) return;

    const nextStatusByAction = { approve: 'approved', reject: 'rejected', comment: 'needs-changes' };
    const nextStatus = nextStatusByAction[type];
    const previousRequest = requests.find((request) => request._id === id);
    if (!previousRequest || !nextStatus) return;

    const payload = { comment: commentById[id] || type };

    setLoadingById((previous) => ({ ...previous, [id]: true }));
    setJustActedById((previous) => ({ ...previous, [id]: true }));
    setRequests((previous) => previous.map((request) => (request._id === id ? { ...request, status: nextStatus } : request)));

    try {
      if (type === 'approve') await managerApi.approve(id, payload);
      if (type === 'reject') await managerApi.reject(id, payload);
      if (type === 'comment') await managerApi.comment(id, payload);
      await load();
      setJustActedById((previous) => {
        const copy = { ...previous };
        delete copy[id];
        return copy;
      });
    } catch (error) {
      await load();
      setJustActedById((previous) => {
        const copy = { ...previous };
        delete copy[id];
        return copy;
      });
      const errorText = error?.response?.data?.message || error?.message || '';
      const smtpFailed = /enotfound|smtp/i.test(String(errorText));
      setToast(smtpFailed ? 'Action completed, but notification email failed.' : (error.response?.data?.message || 'Action failed. Please try again.'));
      window.setTimeout(() => setToast(''), 3000);
    } finally {
      setLoadingById((previous) => {
        const copy = { ...previous };
        delete copy[id];
        return copy;
      });
    }
  };

  return (
    <BoltLayout title="Manager Dashboard" subtitle="Review and action visitor requests">
      {toast ? <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{toast}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Pending" value={counts.pending} tone="yellow" icon={Clock} />
        <StatCard label="Approved" value={counts.approved} tone="green" icon={CheckCircle} />
        <StatCard label="Rejected" value={counts.rejected} tone="red" icon={XCircle} />
        <StatCard label="Needs Revision" value={counts.revision} tone="purple" icon={MessageSquare} />
      </div>

      <SectionCard title="Team Visitor Requests" actions={<span className="text-xs text-gray-500 dark:text-slate-400">Live review queue</span>}>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-slate-700">
              <button type="button" onClick={() => setActiveRequestsTab('live')} className={activeRequestsTab === 'live' ? 'border-b-2 border-emerald-600 text-emerald-600 font-semibold pb-2' : 'text-gray-500 dark:text-slate-400 pb-2'}>Live Requests</button>
              <button type="button" onClick={() => setActiveRequestsTab('history')} className={activeRequestsTab === 'history' ? 'border-b-2 border-emerald-600 text-emerald-600 font-semibold pb-2' : 'text-gray-500 dark:text-slate-400 pb-2'}>Request History</button>
            </div>
            <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search requests..." className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm" /></div>
          </div>

          {filteredRequests.map((request) => (
            <div key={request._id} className={`rounded-xl p-4 border space-y-3 ${statusCardStyles[request.status] || 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{request.visitorName} · {request.referenceId}</p>
                  <div className="mt-1 text-sm text-gray-600 dark:text-slate-300 space-y-1">
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {request.dateOfVisit} {request.timeOfVisit}</p>
                    <p className="flex items-center gap-2"><User className="w-4 h-4" /> Employee: {request.employee?.name}</p>
                    <p className="flex items-center gap-2"><FileText className="w-4 h-4" /> Purpose: {request.purpose || request.visitPurpose || request.purposeOfVisit || '-'}</p>
                  </div>
                </div>
                <StatusBadge status={request.status} map={statusBadgeStyles} circular />
              </div>

              <input className="input" placeholder="Comment" value={commentById[request._id] || ''} onChange={(e) => setCommentById((p) => ({ ...p, [request._id]: e.target.value }))} disabled={loadingById[request._id]} />

              {(request.status === 'pending' || request.status === 'needs-changes') && !justActedById[request._id] ? (
                <div className="flex flex-wrap gap-2">
                  <RippleButton onClick={() => action(request._id, 'approve')} disabled={!!loadingById[request._id]} variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">Approve</RippleButton>
                  <RippleButton onClick={() => action(request._id, 'reject')} disabled={!!loadingById[request._id]} variant="default" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0">Reject</RippleButton>
                  <RippleButton onClick={() => action(request._id, 'comment')} disabled={!!loadingById[request._id]} variant="hover">Send Back</RippleButton>
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

export default ManagerDashboard;
