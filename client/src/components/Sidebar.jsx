import { ClipboardList, ShieldCheck, UserCheck, Users, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navByRole = {
  employee: [{ to: '/employee', label: 'Employee', icon: ClipboardList }],
  manager: [{ to: '/manager', label: 'Manager', icon: ShieldCheck }],
  'front-desk': [{ to: '/frontdesk', label: 'Front Desk', icon: UserCheck }],
  'it-admin': [{ to: '/admin', label: 'IT Admin', icon: Users }]
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const items = user ? navByRole[user.role] || [] : [];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-100 shadow-soft md:min-h-screen">
      <div className="p-5 border-b border-slate-100">
        <h1 className="text-lg font-semibold text-slate-900">VMS</h1>
        <p className="text-xs text-slate-500 mt-1">{user?.name}</p>
      </div>
      <nav className="p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active ? 'bg-accent text-white' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 mt-auto">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 btn-secondary"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
