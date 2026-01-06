
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

const SESSION_KEY = 'sirjan_poosh_auth_session';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { 
      return null; 
    }
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

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
      try { result = JSON.parse(responseText); } catch (e) { throw new Error('پاسخ سرور معتبر نیست.'); }
      if (!response.ok) throw new Error(result.error || 'خطا در ثبت اطلاعات');
    } catch (err: any) {
      alert(`⚠️ ذخیره نشد: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm('آیا قصد خروج از سامانه را دارید؟')) {
      setCurrentUser(null);
      localStorage.removeItem(SESSION_KEY);
      setIsMobileMenuOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white text-center p-6">
        <div className="text-7xl animate-bounce mb-6">👕</div>
        <div className="text-xl font-black animate-pulse">در حال فراخوانی اطلاعات سیرجان پوش...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl border border-red-100 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">خطا در اتصال به دیتابیس</h2>
          <p className="text-red-600 font-bold mb-6 text-sm">{errorMsg}</p>
          <button onClick={loadData} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl">تلاش دوباره 🔄</button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} users={data?.users || []} />;
  }

  if (!data) return null;

  const canAccess = (tab: string) => currentUser.role === 'admin' || currentUser.permissions?.includes(tab);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 relative" dir="rtl">
      {isSaving && (
        <div className="saving-loader">
          <span className="w-3 h-3 bg-indigo-500 rounded-full animate-ping"></span>
          در حال همگام‌سازی...
        </div>
      )}

      {/* منوی کناری دسکتاپ */}
      <aside className="hidden lg:flex flex-col w-80 bg-slate-900 text-white fixed h-full shadow-2xl z-40">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onLogout={handleLogout} 
          permissions={currentUser.role === 'admin' ? undefined : currentUser.permissions} 
        />
      </aside>

      {/* منوی متحرک موبایل (Drawer) */}
      <div className={`fixed inset-0 z-[100] lg:hidden transition-all duration-500 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        {/* Drawer Content */}
        <aside className={`absolute top-0 right-0 h-full w-80 bg-slate-900 shadow-2xl transition-transform duration-500 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={handleTabChange} 
            onLogout={handleLogout} 
            permissions={currentUser.role === 'admin' ? undefined : currentUser.permissions} 
          />
        </aside>
      </div>

      <div className="flex-1 lg:mr-80 min-h-screen flex flex-col">
        {/* هدر موبایل اصلاح شده */}
        <header className="lg:hidden bg-white border-b px-6 py-5 flex justify-between items-center sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-xl shadow-inner border border-slate-100"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white">👕</div>
              <h1 className="text-lg font-black tracking-tight">سیرجان پوش</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">{currentUser.username}</span>
          </div>
        </header>

        <main className="p-4 md:p-8 lg:p-10 overflow-x-hidden">
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
