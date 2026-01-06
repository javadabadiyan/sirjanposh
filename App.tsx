
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
        throw new Error('سرور به جای اطلاعات، کد خطا فرستاد. احتمالاً متغیر محیطی هنوز اعمال نشده است.');
      }
      
      if (!response.ok) {
        throw new Error(result.error || result.details || `خطای ${response.status}`);
      }

      setData(result);
    } catch (err: any) {
      setErrorMsg(err.message);
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
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-7xl animate-bounce mb-4">👕</div>
        <div className="text-xl font-bold animate-pulse">در حال اتصال به دیتابیس...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-red-100 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">خطا در راه‌اندازی</h2>
          <p className="text-red-600 font-bold mb-6 text-sm">{errorMsg}</p>
          <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-500 font-bold mb-6">
            مطمئن شوید متغیر <b>NEON_DB_URL</b> را ساخته‌اید و آخرین ورژن لیست استقرارها را <b>Redeploy</b> کرده‌اید.
          </div>
          <button onClick={loadData} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black">تلاش دوباره 🔄</button>
        </div>
      </div>
    );
  }

  if (!data || !currentUser) {
    return <Login onLogin={setCurrentUser} users={data?.users || []} />;
  }

  const canAccess = (tab: string) => currentUser.role === 'admin' || currentUser.permissions?.includes(tab);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800" dir="rtl">
      <aside className="hidden lg:flex flex-col w-80 bg-slate-900 text-white fixed h-full shadow-2xl">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => {
          sessionStorage.removeItem('sirjan_poosh_session');
          setCurrentUser(null);
        }} permissions={currentUser.role === 'admin' ? undefined : currentUser.permissions} />
      </aside>

      <div className="flex-1 lg:mr-80 min-h-screen flex flex-col">
        <header className="lg:hidden bg-white border-b px-5 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3"><h1 className="text-base font-black">سیرجان پوش</h1></div>
          <button onClick={() => setCurrentUser(null)} className="text-red-500 font-black">خروج</button>
        </header>

        <main className="p-4 md:p-8 lg:p-10">
          {activeTab === 'dashboard' && <Dashboard data={data} />}
          {activeTab === 'inventory' && canAccess('inventory') && <Inventory data={data} setData={updateData} currentUser={currentUser} />}
          {activeTab === 'partners' && canAccess('partners') && <Partners data={data} setData={updateData} />}
          {activeTab === 'invoices' && canAccess('invoices') && <Invoices data={data} setData={updateData} />}
          {activeTab === 'users' && canAccess('users') && <Users data={data} setData={updateData} />}
          {activeTab === 'backup' && canAccess('backup') && <BackupRestore data={data} setData={updateData} />}
        </main>
      </div>
    </div>
  );
};

export default App;
