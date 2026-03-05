import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import AppLayout from '../components/AppLayout';
import { frontDeskApi } from '../api';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';

const statusBadgeStyles = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  'needs-changes': 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
  'checked-in': 'bg-blue-100 text-blue-700',
  'checked-out': 'bg-slate-200 text-slate-700',
  'no-show': 'bg-red-900/15 text-red-900'
};

const FrontDeskDashboard = () => {
  const [visitors, setVisitors] = useState([]);
  const [manualRef, setManualRef] = useState('');
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState('');
  const scannerMounted = useRef(false);

  const load = async () => {
    const { data } = await frontDeskApi.today();
    setVisitors(data.visitors);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (scannerMounted.current) return;
    scannerMounted.current = true;

    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 200 }, false);
    scanner.render(
      async (decodedText) => {
        try {
          const parsed = JSON.parse(decodedText);
          const { data } = await frontDeskApi.scan({ visitId: parsed.visitId });
          setSelected(data.request);
        } catch {
          // ignore malformed scans
        }
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  const manualLookup = async () => {
    const { data } = await frontDeskApi.manual({ referenceId: manualRef });
    setSelected(data.request);
  };

  const mark = async (type) => {
    if (!selected) return;
    if (type === 'in') await frontDeskApi.checkIn(selected._id, { remark });
    if (type === 'out') await frontDeskApi.checkOut(selected._id, { remark });
    if (type === 'no-show') await frontDeskApi.noShow(selected._id, { remark });
    setRemark('');
    await load();
  };

  const checkInFromRow = async (visitorId) => {
    await frontDeskApi.checkIn(visitorId, { remark: '' });
    await load();
  };

  return (
    <AppLayout title="Front-Desk Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="card p-5 space-y-4">
          <h3 className="font-semibold">QR Scanner</h3>
          <div id="qr-reader" className="rounded-lg overflow-hidden border border-slate-200" />
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Manual fallback</p>
            <div className="flex gap-2">
              <input className="input" placeholder="Reference ID" value={manualRef} onChange={(e) => setManualRef(e.target.value)} />
              <RippleButton className="" onClick={manualLookup} variant="default">Find</RippleButton>
            </div>
          </div>
        </section>

        <section className="card p-5 space-y-3">
          <h3 className="font-semibold">Action Panel</h3>
          {selected ? (
            <>
              <p className="text-sm">{selected.visitorName} · {selected.referenceId}</p>
              <p className="text-xs text-slate-500">Status: {selected.status}</p>
              {selected.status === 'approved' ? (
                <>
                  <input className="input" placeholder="Remarks (optional)" value={remark} onChange={(e) => setRemark(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    <RippleButton className="" onClick={() => mark('in')} variant="default">Checked-In</RippleButton>
                    <RippleButton className="" onClick={() => mark('out')} variant="hover" hoverRippleColor="#6996e2">Checked-Out</RippleButton>
                    <RippleButton className="bg-red-600 hover:bg-red-700" onClick={() => mark('no-show')} variant="default">No-Show</RippleButton>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Only approved visitors can be checked in.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Scan QR or enter reference ID.</p>
          )}
        </section>
      </div>

      <section className="card p-5 overflow-x-auto">
        <h3 className="font-semibold mb-4">Today’s Visitors</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="pb-2">Reference</th>
              <th className="pb-2">Visitor</th>
              <th className="pb-2">Host</th>
              <th className="pb-2">Time</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((visitor) => (
              <tr key={visitor._id} className="border-t border-slate-100">
                <td className="py-2">{visitor.referenceId}</td>
                <td className="py-2">{visitor.visitorName}</td>
                <td className="py-2">{visitor.officeLocation}</td>
                <td className="py-2">{visitor.timeOfVisit}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusBadgeStyles[visitor.status] || 'bg-slate-100 text-slate-700'}`}>
                    {visitor.status}
                  </span>
                </td>
                <td className="py-2">
                  {visitor.status === 'approved' ? (
                    <RippleButton className="" onClick={() => checkInFromRow(visitor._id)} variant="default">Check-In</RippleButton>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppLayout>
  );
};

export default FrontDeskDashboard;
