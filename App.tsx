
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/data', { 
          method: 'GET',
          cache: 'no-store' 
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response received:', text);
          throw new Error('پاسخ سرور معتبر نیست (JSON دریافت نشد)');
        }

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || `خطای سرور: ${response.status}`);
        }

        if (result && result.users) {
          setData(result);
          setErrorMsg(null);
        } else {
          throw new Error('فرمت داده‌های دریافتی نامعتبر است');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setErrorMsg(err.message || 'خطا در برقراری ارتباط با دیتابیس Neon');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const updateData = async (newData: AppData) => {
    setData(newData);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(newData)
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to sync with Neon:', errorText);
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-black">
        <div className="text-8xl animate-bounce mb-8">👕</div>
        <div className="text-2xl tracking-tighter animate-pulse">در حال اتصال به دیتابیس Neon...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-950 text-white p-6 text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-black mb-4">خطا در سیستم</h2>
        <p className="bg-red-900/50 p-4 rounded-xl text-sm mb-8 max-w-md border border-red-500/30">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="bg-white text-red-900 px-10 py-4 rounded-2xl font-black shadow-lg">تلاش مجدد</button>
      </div>
    );
  }

  if (!data) return null;

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} users={data.users} />;
  }

  const canAccess = (tab: string) => currentUser.role === 'admin' || currentUser.permissions?.includes(tab);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 overflow-x-hidden">
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
