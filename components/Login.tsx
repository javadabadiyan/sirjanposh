
import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '5221157') {
      onLogin();
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-900 p-4 font-['Vazirmatn']">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-scaleIn">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">سیرجان پوش</h1>
          <p className="text-gray-500">پنل مدیریت یکپارچه فروشگاه</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">نام کاربری</label>
            <input 
              type="text" 
              className="w-full p-4 border rounded-2xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">رمز عبور</label>
            <input 
              type="password" 
              className="w-full p-4 border rounded-2xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            ورود به پنل مدیریت
          </button>
        </form>

        <div className="mt-10 text-center text-xs text-gray-400">
          تمامی حقوق برای سیرجان پوش محفوظ است &copy; ۱۴۰۴
        </div>
      </div>
    </div>
  );
};

export default Login;
