import { useEffect, useState } from 'react';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';

const AnimatedSignIn = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSso,
  message,
  isLoading,
  isSsoLoading
}) => {
  const [theme, setTheme] = useState('light');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setFormVisible(true), 250);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-[#e8f4ef]'
      }`}
    >
      <div className="flex min-h-screen items-center justify-center p-4 md:p-6">
        <div
          className={`relative w-full max-w-6xl overflow-hidden rounded-2xl transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 shadow-xl shadow-slate-900/40' : 'bg-white shadow-xl shadow-gray-200'
          } ${formVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          <RippleButton
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`absolute right-4 top-4 z-10 rounded-full p-2 transition-colors ${
              theme === 'dark' ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Toggle theme"
            variant="ghost"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
            )}
          </RippleButton>

          <div className="flex flex-col md:flex-row">
            <div className="hidden w-full md:block md:w-3/5 bg-gray-100 p-6">
              <div className="grid h-full grid-cols-2 grid-rows-3 gap-4 overflow-hidden">
                <div className="overflow-hidden rounded-xl">
                  <img src="https://images.unsplash.com/photo-1497366216548-37526070297c" alt="Reception desk" className="h-full w-full object-cover" />
                </div>
                <div
                  className={`rounded-xl flex flex-col justify-center items-center p-6 text-white ${
                    theme === 'dark' ? 'bg-orange-600' : 'bg-orange-500'
                  }`}
                >
                  <h2 className="text-5xl font-bold mb-2">24/7</h2>
                  <p className="text-center text-sm">Secure visitor entry tracking and approvals in one portal.</p>
                </div>
                <div className="overflow-hidden rounded-xl">
                  <img src="https://images.unsplash.com/photo-1553877522-43269d4ea984" alt="Office meeting" className="h-full w-full object-cover" />
                </div>
                <div className="overflow-hidden rounded-xl">
                  <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d" alt="Security team" className="h-full w-full object-cover" />
                </div>
                <div
                  className={`rounded-xl flex flex-col justify-center items-center p-6 text-white ${
                    theme === 'dark' ? 'bg-green-600' : 'bg-green-500'
                  }`}
                >
                  <h2 className="text-5xl font-bold mb-2">Role</h2>
                  <p className="text-center text-sm">Employee, manager, front desk, and IT admin access control.</p>
                </div>
                <div className="overflow-hidden rounded-xl">
                  <img src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6" alt="System dashboard" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            <div
              className={`w-full md:w-2/5 p-8 md:p-12 ${
                theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'
              }`}
              style={{
                transform: formVisible ? 'translateX(0)' : 'translateX(20px)',
                opacity: formVisible ? 1 : 0,
                transition: 'transform 0.6s ease-out, opacity 0.6s ease-out'
              }}
            >
              <div className="mb-8">
                <h1 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Sign in to <span className="text-blue-500">VMS</span>
                </h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Access visitor requests, approvals, and front desk operations securely.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label htmlFor="email" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    className={`block w-full rounded-md border py-3 px-4 focus:outline-none focus:ring-2 sm:text-sm ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-gray-400 focus:ring-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500'
                    }`}
                    placeholder="name@company.com"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="password"
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      className={`block w-full rounded-md border py-3 px-4 pr-10 focus:outline-none focus:ring-2 sm:text-sm ${
                        theme === 'dark'
                          ? 'bg-slate-800 border-slate-700 text-white placeholder:text-gray-400 focus:ring-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <RippleButton
                      type="button"
                      className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label="Toggle password visibility"
                      variant="ghost"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </RippleButton>
                  </div>
                </div>

                <RippleButton
                  type="submit"
                  disabled={isLoading}
                  className={`flex w-full items-center justify-center gap-2 rounded-md py-3 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-300 ${
                    theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'
                  } ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
                  variant="default"
                >
                  {isLoading ? 'Signing in...' : <><LogIn size={16} /> Login</>}
                </RippleButton>

                <RippleButton
                  type="button"
                  onClick={onSso}
                  disabled={isSsoLoading || !email}
                  className={`flex w-full items-center justify-center gap-2 rounded-md py-3 px-4 text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  } ${(isSsoLoading || !email) ? 'cursor-not-allowed opacity-70' : ''}`}
                  variant="hoverborder"
                  hoverBorderEffectColor="#2E75B6"
                  hoverBorderEffectThickness="2px"
                >
                  <ShieldCheck size={16} />
                  {isSsoLoading ? 'Signing in with SSO...' : 'Employee SSO'}
                </RippleButton>

                {message && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-rose-300' : 'text-rose-600'}`}>{message}</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AnimatedSignIn };