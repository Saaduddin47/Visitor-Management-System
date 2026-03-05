import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, LogOut, Moon, ScanLine, Sun } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { frontDeskApi } from '../api';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const statusBadgeStyles = {
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  'needs-changes': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  'checked-in': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  'checked-out': 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  'no-show': 'bg-red-900/15 text-red-900 dark:bg-red-900/40 dark:text-red-200'
};

const FrontDeskDashboard = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [visitors, setVisitors] = useState([]);
  const [manualRef, setManualRef] = useState('');
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
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
                  <p className="text-white/50 text-xs mt-0.5">Front Desk Panel</p>
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
            onClick={() => openSection('frontdesk-dashboard', 'dashboard')}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              activeNav === 'dashboard' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard size={16} />
            {!collapsed && <span>Dashboard</span>}
          </button>

          <button
            type="button"
            onClick={() => openSection('frontdesk-scanner', 'scanner')}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              activeNav === 'scanner' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <ScanLine size={16} />
            {!collapsed && <span>QR Scanner</span>}
          </button>

          <button
            type="button"
            onClick={() => openSection('frontdesk-visitors', 'visitors')}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              activeNav === 'visitors' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <ClipboardList size={16} />
            {!collapsed && <span>Today's Visitors</span>}
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

      <main className={`min-h-screen bg-gray-50 dark:bg-slate-950 p-8 w-full overflow-y-auto transition-all duration-300 ease-in-out ${collapsed ? 'ml-16' : 'ml-64'}`} id="frontdesk-dashboard">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="frontdesk-scanner">
          <section className="rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">QR Scanner</h3>
          <div id="qr-reader" className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700" />
          <div className="space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Manual fallback</p>
            <div className="flex gap-2">
              <input className="input" placeholder="Reference ID" value={manualRef} onChange={(e) => setManualRef(e.target.value)} />
              <RippleButton className="" onClick={manualLookup} variant="default">Find</RippleButton>
            </div>
          </div>
        </section>

          <section className="rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Action Panel</h3>
          {selected ? (
            <>
              <p className="text-sm text-slate-800 dark:text-slate-200">{selected.visitorName} · {selected.referenceId}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Status: {selected.status}</p>
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
                <p className="text-sm text-slate-500 dark:text-slate-400">Only approved visitors can be checked in.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Scan QR or enter reference ID.</p>
          )}
        </section>
        </div>

        <section id="frontdesk-visitors" className="rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 overflow-x-auto mt-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Today’s Visitors</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 dark:text-slate-400">
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
                <tr key={visitor._id} className="border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200">
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
                      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default FrontDeskDashboard;
