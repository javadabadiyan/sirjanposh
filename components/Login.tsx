
import React, { useState } from 'react';
import { toPersianNumbers } from '../utils/formatters';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check master admin first (as requested previously)
    if (username === 'admin' && password === '5221157') {
      const adminUser = users.find(u => u.username === 'admin') || {
        id: '1',
        username: 'admin',
        role: 'admin' as const,
        permissions: ['dashboard', 'inventory', 'partners', 'invoices', 'users', 'backup']
      };
      onLogin(adminUser);
      return;
    }

    // Check custom users
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است. دوباره تلاش کنید.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-indigo-100 animate-fadeIn">
        <div className="text-center mb-10">
          <div className="bg-indigo-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">👕</div>
          <h1 className="text-3xl font-black text-indigo-900 mb-2">سیرجان پوش</h1>
          <p className="text-gray-500 font-medium">سیستم مدیریت هوشمند پوشاک</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 mr-1">نام کاربری</label>
            <input 
              type="text" 
              className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:border-indigo-500 focus:bg-white outline-none transition-all text-lg"
              placeholder="مثلاً: admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 mr-1">رمز عبور</label>
            <input 
              type="password" 
              className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:border-indigo-500 focus:bg-white outline-none transition-all text-lg"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-bold border border-red-100">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 active:scale-[0.98]"
          >
            ورود به پنل مدیریت
          </button>
        </form>

        <div className="mt-12 text-center text-xs text-gray-400 font-bold tracking-widest">
          طراحی شده برای {toPersianNumbers('1404')} &copy; سیرجان پوش
        </div>
      </div>
    </div>
  );
};

export default Login;
