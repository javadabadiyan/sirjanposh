
import React, { useState, useEffect } from 'react';
import { AppData, User } from './types';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Partners from './components/Partners';
import Invoices from './components/Invoices';
import Users from './components/Users';
import BackupRestore from './components/BackupRestore';
import Login from './components/Login';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AppData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('sirjan_poosh_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      
      const response = await fetch('/api/data');
      const text = await response.text();
      
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error('پاسخ سرور نامعتبر است. احتمالاً استقرار (Deployment) شما قدیمی است.');
      }
      
      if (!response.ok) {
        throw new Error(result.error || result.details || `خطای سرور: ${response.status}`);
      }

      setData(result);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMsg(err.message || 'خطای ناشناخته در اتصال به سرور');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateData = async (newData: AppData) => {
    setData(newData);
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      if (!response.ok) {
        const err = await response.json();
        console.error('Save failed:', err);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-black">
        <div className="text-8xl animate-bounce mb-8">👕</div>
        <div className="text-2xl tracking-tighter animate-pulse">در حال فراخوانی اطلاعات...</div>
        <p className="text-slate-500 mt-4 text-xs font-bold text-center px-4">لطفاً شکیبا باشید، در حال اتصال به دیتابیس ابری هستیم</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6" dir="rtl">
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-200 max-w-2xl w-full animate-fadeIn">
          <div className="text-6xl mb-6 text-center">🛑</div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 text-center">خطا در راه‌اندازی سیستم</h2>
          
          <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100 mb-8 overflow-hidden">
            <p className="text-red-700 font-bold text-center leading-relaxed text-sm break-words">{errorMsg}</p>
          </div>

          <div className="space-y-6 text-right">
            <h4 className="font-black text-lg text-indigo-900 border-r-4 border-indigo-600 pr-3">چگونه این مشکل را حل کنیم؟</h4>
            <ol className="space-y-4 text-sm text-slate-600 font-bold">
              <li className="flex items-start gap-3">
                <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">۱</span>
                <span>مطمئن شوید متغیر <b>NEON_DB_URL</b> را در پنل Vercel ذخیره کرده‌اید.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">۲</span>
                <span><b>بسیار مهم:</b> در تب Deployments در ورسل، دکمه <b>Redeploy</b> را بزنید تا تغییرات اعمال شود.</span>
              </li>
            </ol>
          </div>

          <div className="mt-10 flex gap-4">
            <button onClick={loadData} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95">تلاش دوباره 🔄</button>
            <button onClick={() => window.open('https://vercel.com', '_blank')} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-bold text-xs">پنل Vercel</button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} users={data.users} />;
  }

  const canAccess = (tab: string) => currentUser.role === 'admin' || currentUser.permissions?.includes(tab);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 overflow-x-hidden" dir="rtl">
      <aside className="hidden lg:flex flex-col w-80 bg-slate-900 text-white fixed h-full shadow-2xl z-40">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => {
          sessionStorage.removeItem('sirjan_poosh_session');
          setCurrentUser(null);
        }} permissions={currentUser.role === 'admin' ? undefined : currentUser.permissions} />
      </aside>

      <div className="flex-1 lg:mr-80 min-h-screen flex flex-col pb-24 lg:pb-0">
        <header className="lg:hidden bg-white border-b px-5 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">👕</div>
            <h1 className="text-base font-black">سیرجان پوش</h1>
          </div>
          <button onClick={() => {
            sessionStorage.removeItem('sirjan_poosh_session');
            setCurrentUser(null);
          }} className="text-red-500 font-black">خروج</button>
        </header>

        <main className="p-4 md:p-8 lg:p-10 flex-1">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard data={data} />}
            {activeTab === 'inventory' && canAccess('inventory') && <Inventory data={data} setData={updateData} currentUser={currentUser} />}
            {activeTab === 'partners' && canAccess('partners') && <Partners data={data} setData={updateData} />}
            {activeTab === 'invoices' && canAccess('invoices') && <Invoices data={data} setData={updateData} />}
            {activeTab === 'users' && canAccess('users') && <Users data={data} setData={updateData} />}
            {activeTab === 'backup' && canAccess('backup') && <BackupRestore data={data} setData={updateData} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
