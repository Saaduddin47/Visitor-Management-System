import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, ssoEmployee } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const routeByRole = (role) => {
    if (role === 'employee') navigate('/employee');
    if (role === 'manager') navigate('/manager');
    if (role === 'front-desk') navigate('/frontdesk');
    if (role === 'it-admin') navigate('/admin');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const user = await login(form);
      routeByRole(user.role);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
  };

  const onSso = async () => {
    setMessage('');
    try {
      const user = await ssoEmployee({ email: form.email });
      routeByRole(user.role);
    } catch (error) {
      setMessage(error.response?.data?.message || 'SSO failed');
    }
  };

  return (
    <div className="min-h-screen bg-canvas grid place-items-center p-4">
      <div className="card w-full max-w-md p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Visitor Management System</h1>
          <p className="text-sm text-slate-500 mt-1">Secure role-based portal</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
          <button className="btn-primary w-full" type="submit">Login</button>
        </form>
        <button className="btn-secondary w-full" onClick={onSso}>Employee SSO (Placeholder)</button>
        {message && <p className="text-sm text-rose-600">{message}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
