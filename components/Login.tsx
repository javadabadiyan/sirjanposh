
// Fix: Use namespace import for React to resolve JSX intrinsic element errors
import * as React from 'react';
import { useState } from 'react';
import { toEnglishDigits } from '../utils/formatters';
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
    
    // نرمال‌سازی ورودی‌ها (تبدیل به حروف کوچک، حذف فضاها و تبدیل اعداد)
    const cleanUsername = toEnglishDigits(username).trim().toLowerCase();
    const cleanPassword = toEnglishDigits(password).trim();

    // بررسی ادمین اصلی
    if (cleanUsername === 'admin' && cleanPassword === '5221157') {
      const adminInDb = users.find(u => u.username.toLowerCase() === 'admin');
      const adminUser: User = adminInDb || {
        id: '1',
        username: 'admin',
        role: 'admin' as const,
        permissions: ['dashboard', 'inventory', 'partners', 'invoices', 'users', 'backup']
      };
      onLogin(adminUser);
      return;
    }

    // بررسی سایر کاربران در لیست
    const user = users.find(u => 
      toEnglishDigits(u.username).trim().toLowerCase() === cleanUsername && 
      toEnglishDigits(u.password || '').trim() === cleanPassword
    );

    if (user) {
      onLogin(user);
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 md:p-8 overflow-hidden relative text-right" dir="rtl">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>

      <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-white/20 animate-fadeIn relative z-10">
        <div className="text-center mb-10">
          <div className="bg-indigo-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-4xl shadow-2xl shadow-indigo-200 text-white">👕</div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">سیرجان پوش</h1>
          <p className="text-slate-400 font-bold text-sm tracking-wide">پنل مدیریت هوشمند</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 mr-2 uppercase tracking-widest text-right">نام کاربری</label>
            <input 
              type="text" 
              className="w-full p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:border-indigo-600 focus:bg-white outline-none transition-all text-lg font-bold text-center"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 mr-2 uppercase tracking-widest text-right">رمز عبور</label>
            <input 
              type="password" 
              className="w-full p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:border-indigo-600 focus:bg-white outline-none transition-all text-lg font-bold text-center"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs text-center font-black border border-red-100 animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
          >
            ورود به سامانه
          </button>
        </form>

        <div className="mt-12 text-center space-y-2">
           <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Powered by sirjanpoosh.ir</p>
           <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
             کدنویسی شده توسط : جناب آقای محمد جواد آبادیان <br/>
             (مثه بابای برای همه شریک ها)
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
