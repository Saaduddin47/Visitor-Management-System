import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { employeeApi } from '../api';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';

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

const EmployeeDashboard = () => {
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState(initialForm);

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

  return (
    <AppLayout title="Employee Dashboard">
      <section className="card p-5">
        <h3 className="font-semibold mb-4">New Visitor Request</h3>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={onSubmit}>
          {['visitorName', 'visitorEmail', 'visitorPhone', 'dateOfVisit', 'timeOfVisit', 'purpose', 'officeLocation'].map((field) => (
            <input
              key={field}
              className="input"
              type={field.includes('date') ? 'date' : field.includes('time') ? 'time' : 'text'}
              placeholder={field}
              value={form[field]}
              onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
              required
            />
          ))}
          <input className="input md:col-span-2" type="file" onChange={(e) => setForm((p) => ({ ...p, attachment: e.target.files?.[0] || null }))} />
          <div className="md:col-span-2">
            <RippleButton className="" type="submit" variant="default">Submit Request</RippleButton>
          </div>
        </form>
        {message && <p className="text-sm mt-3 text-slate-600">{message}</p>}
      </section>

      <section className="card p-5 space-y-4">
        <h3 className="font-semibold">Request History (Auto-refresh 15s)</h3>
        {requests.map((request) => (
          <div
            key={request._id}
            className={`border border-slate-200 rounded-xl p-4 space-y-3 ${statusCardStyles[request.status] || 'bg-white border-l-[6px] border-slate-200'}`}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">{request.referenceId} · {request.visitorName}</p>
                <p className="text-sm text-slate-500">{request.dateOfVisit} {request.timeOfVisit} · {request.officeLocation}</p>
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
              <p className="text-sm text-slate-600">Comment: {request.managerComment}</p>
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
              <div className="border border-orange-200 bg-white rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {['visitorName', 'visitorEmail', 'visitorPhone', 'dateOfVisit', 'timeOfVisit', 'purpose', 'officeLocation'].map((field) => (
                  <input
                    key={field}
                    className="input"
                    type={field.includes('date') ? 'date' : field.includes('time') ? 'time' : 'text'}
                    placeholder={field}
                    value={editForm[field]}
                    onChange={(e) => setEditForm((p) => ({ ...p, [field]: e.target.value }))}
                    required
                  />
                ))}
                <input className="input md:col-span-2" type="file" onChange={(e) => setEditForm((p) => ({ ...p, attachment: e.target.files?.[0] || null }))} />
                <div className="md:col-span-2 flex gap-2">
                  <RippleButton className="" onClick={() => resubmit(request._id)} variant="default">Resubmit</RippleButton>
                  <RippleButton className="" onClick={() => setEditingId('')} variant="hover" hoverRippleColor="#6996e2">Cancel</RippleButton>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </AppLayout>
  );
};

export default EmployeeDashboard;
