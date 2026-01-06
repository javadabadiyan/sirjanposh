
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
  const [isSaving, setIsSaving] = useState(false);
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
      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || `خطای سرور: ${response.status}`);
      }
      
      const result = await response.json();
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
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newData)
      });
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error('پاسخ سرور معتبر نیست. احتمالاً دیتابیس متصل نیست.');
      }

      if (!response.ok) {
        throw new Error(result.error || 'خطا در ثبت اطلاعات در دیتابیس ابری');
      }

      console.log('Data saved successfully');
    } catch (err: any) {
      console.error('Save error:', err);
      alert(`⚠️ متاسفانه ذخیره نشد: ${err.message}\nلطفاً از بخش تنظیمات، فایل پشتیبان تهیه کنید تا اطلاعاتتان از دست نرود.`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-7xl animate-bounce mb-4">👕</div>
        <div className="text-xl font-bold animate-pulse">در حال فراخوانی اطلاعات...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-red-100 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">خطا در اتصال به دیتابیس</h2>
          <p className="text-red-600 font-bold mb-6 text-sm">{errorMsg}</p>
          <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-500 font-bold mb-6 text-right leading-relaxed">
            ۱. وارد پنل Vercel شوید.<br/>
            ۲. به بخش <b>Settings &rarr; Environment Variables</b> بروید.<br/>
            ۳. متغیر <b>NEON_DB_URL</b> را با لینک دیتابیس Neon مقداردهی کنید.<br/>
            ۴. پروژه را <b>Redeploy</b> کنید.
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
      {isSaving && (
        <div className="saving-loader">
          <span className="w-3 h-3 bg-indigo-500 rounded-full animate-ping"></span>
          در حال همگام‌سازی...
        </div>
      )}

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
