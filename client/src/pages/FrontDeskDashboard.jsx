import { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, QrCode, Search, UserCheck, UserX, FileText } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { frontDeskApi } from '../api';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';
import BoltLayout from '@/components/BoltLayout';
import { SectionCard, StatCard, StatusBadge } from '@/components/ui/bolt';

const statusBadgeStyles = {
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  'needs-changes': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  'checked-in': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  'checked-out': 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  'no-show': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200'
};

const FrontDeskDashboard = () => {
  const [visitors, setVisitors] = useState([]);
  const [manualRef, setManualRef] = useState('');
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const scannerMounted = useRef(false);

  const load = async () => {
    const { data } = await frontDeskApi.today();
    const nextVisitors = Array.isArray(data.visitors) ? data.visitors : [];
    setVisitors(nextVisitors);
    return nextVisitors;
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
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
    const selectedId = selected._id;
    try {
      if (type === 'in') await frontDeskApi.checkIn(selected._id, { remark });
      if (type === 'out') await frontDeskApi.checkOut(selected._id, { remark });
      if (type === 'no-show') await frontDeskApi.noShow(selected._id, { remark });
    } catch (error) {
      const errorText = error?.response?.data?.message || error?.message || '';
      const smtpFailed = /enotfound|smtp/i.test(String(errorText));
      if (!smtpFailed) throw error;
    } finally {
      setRemark('');
      const refreshedVisitors = await load();
      const refreshedSelected = refreshedVisitors.find((visitor) => visitor._id === selectedId);
      setSelected(refreshedSelected || null);
    }
  };

  const checkInFromRow = async (visitorId) => {
    try {
      await frontDeskApi.checkIn(visitorId, { remark: '' });
    } catch (error) {
      const errorText = error?.response?.data?.message || error?.message || '';
      const smtpFailed = /enotfound|smtp/i.test(String(errorText));
      if (!smtpFailed) throw error;
    } finally {
      await load();
    }
  };

  const filteredVisitors = visitors.filter((visitor) => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return true;
    return [visitor.referenceId, visitor.visitorName, visitor.officeLocation, visitor.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized));
  });

  const checkedInCount = visitors.filter((visitor) => visitor.status === 'checked-in').length;
  const approvedCount = visitors.filter((visitor) => visitor.status === 'approved').length;
  const checkedOutCount = visitors.filter((visitor) => visitor.status === 'checked-out').length;

  return (
    <BoltLayout title="Front Desk Dashboard" subtitle="Manage visitor check-ins and check-outs">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Expected Today" value={visitors.length} tone="blue" icon={Calendar} />
        <StatCard label="Checked In" value={checkedInCount} tone="green" icon={UserCheck} />
        <StatCard label="Checked Out" value={checkedOutCount} tone="purple" icon={UserX} />
        <StatCard label="Awaiting" value={approvedCount} tone="yellow" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="QR Scanner" actions={<QrCode className="w-5 h-5 text-emerald-600" />}>
          <div className="space-y-3">
            <div id="qr-reader" className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700" />
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-slate-400">Manual fallback</p>
              <div className="flex gap-2">
                <input className="input" placeholder="Reference ID" value={manualRef} onChange={(e) => setManualRef(e.target.value)} />
                <RippleButton onClick={manualLookup} variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">Find</RippleButton>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Action Panel">
          {selected ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-800 dark:text-slate-200">{selected.visitorName} · {selected.referenceId}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Status: {selected.status}</p>
              {selected.status === 'approved' ? (
                <>
                  <input className="input" placeholder="Remarks (optional)" value={remark} onChange={(e) => setRemark(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    <RippleButton onClick={() => mark('in')} variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">Check-In</RippleButton>
                    <RippleButton onClick={() => mark('out')} variant="hover">Check-Out</RippleButton>
                    <RippleButton onClick={() => mark('no-show')} variant="default" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0">No-Show</RippleButton>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400">Only approved visitors can be checked in.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">Scan QR or enter reference ID.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Today's Visitors">
        <div className="space-y-4">
          <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search visitors..." className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm" /></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 dark:text-slate-400"><tr><th className="pb-2">Reference</th><th className="pb-2">Visitor</th><th className="pb-2">Host</th><th className="pb-2">Time</th><th className="pb-2">Status</th><th className="pb-2">Action</th></tr></thead>
              <tbody>
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor._id} className="border-t border-gray-100 dark:border-slate-800 text-gray-800 dark:text-slate-200">
                    <td className="py-2">{visitor.referenceId}</td>
                    <td className="py-2">{visitor.visitorName}</td>
                    <td className="py-2">{visitor.officeLocation}</td>
                    <td className="py-2">{visitor.timeOfVisit}</td>
                    <td className="py-2"><StatusBadge status={visitor.status} map={statusBadgeStyles} /></td>
                    <td className="py-2">{visitor.status === 'approved' ? <RippleButton onClick={() => checkInFromRow(visitor._id)} variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">Check-In</RippleButton> : <span className="text-xs text-gray-400 dark:text-slate-500">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVisitors.length === 0 ? <div className="text-center py-8 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg"><FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" /><p className="text-sm text-gray-500 dark:text-slate-400">No visitors found.</p></div> : null}
        </div>
      </SectionCard>
    </BoltLayout>
  );
};

export default FrontDeskDashboard;
