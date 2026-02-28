import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { managerApi } from '../api';

const statusCardStyles = {
  approved: 'border-l-[6px] border-[#16a34a] bg-[#f0fdf4]',
  rejected: 'border-l-[6px] border-[#dc2626] bg-[#fef2f2]',
  pending: 'border-l-[6px] border-[#ca8a04] bg-[#fefce8]',
  'needs-changes': 'border-l-[6px] border-[#ea580c] bg-[#fff7ed]'
};

const statusBadgeStyles = {
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  'needs-changes': 'bg-orange-100 text-orange-700'
};

const ManagerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [commentById, setCommentById] = useState({});

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

  return (
    <AppLayout title="Manager Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-slate-500 text-sm">Pending</p><p className="text-2xl font-semibold">{counts.pending}</p></div>
        <div className="card p-4"><p className="text-slate-500 text-sm">Approved</p><p className="text-2xl font-semibold">{counts.approved}</p></div>
        <div className="card p-4"><p className="text-slate-500 text-sm">Rejected</p><p className="text-2xl font-semibold">{counts.rejected}</p></div>
      </div>

      <section className="card p-5 space-y-4">
        <h3 className="font-semibold">Team Visitor Requests</h3>
        {requests.map((request) => (
          <div
            key={request._id}
            className={`border border-slate-200 rounded-xl p-4 space-y-3 ${statusCardStyles[request.status] || 'bg-white border-l-[6px] border-slate-200'}`}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">{request.visitorName} · {request.referenceId}</p>
                <p className="text-sm text-slate-500">{request.dateOfVisit} {request.timeOfVisit} · {request.officeLocation}</p>
                <p className="text-sm text-slate-500">Employee: {request.employee?.name}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full capitalize h-fit font-semibold ${statusBadgeStyles[request.status] || 'bg-slate-100 text-slate-700'}`}>
                {request.status}
              </span>
            </div>
            {request.status === 'needs-changes' && (
              <div className="text-xs font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-lg px-3 py-2 w-fit">
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
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${request.status === 'needs-changes' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-accent text-white hover:opacity-95'}`}
                onClick={() => action(request._id, 'approve')}
                disabled={request.status === 'needs-changes'}
              >
                Approve
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${request.status === 'needs-changes' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                onClick={() => action(request._id, 'reject')}
                disabled={request.status === 'needs-changes'}
              >
                Reject
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${request.status === 'needs-changes' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                onClick={() => action(request._id, 'comment')}
                disabled={request.status === 'needs-changes'}
              >
                Send Back
              </button>
            </div>
          </div>
        ))}
      </section>
    </AppLayout>
  );
};

export default ManagerDashboard;
