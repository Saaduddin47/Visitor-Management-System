import Sidebar from './Sidebar';

const AppLayout = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-canvas md:flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header>
            <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
