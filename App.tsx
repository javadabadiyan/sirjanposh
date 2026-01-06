
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
        <div className="text-6xl md:text-7xl animate-bounce mb-6">👕</div>
        <div className="text-lg md:text-xl font-black animate-pulse px-4">در حال فراخوانی اطلاعات سیرجان پوش...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-red-100 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4">خطا در اتصال به دیتابیس</h2>
          <p className="text-red-600 font-bold mb-6 text-xs md:text-sm leading-relaxed">{errorMsg}</p>
          <button onClick={loadData} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">تلاش دوباره 🔄</button>
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
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 relative w-full overflow-x-hidden" dir="rtl">
      {isSaving && (
        <div className="saving-loader">
          <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></span>
          در حال همگام‌سازی...
        </div>
      )}

      {/* منوی کناری دسکتاپ */}
      <aside className="hidden lg:flex flex-col w-80 bg-slate-900 text-white fixed h-full shadow-2xl z-40 transition-all duration-300">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onLogout={handleLogout} 
          permissions={currentUser.role === 'admin' ? undefined : currentUser.permissions} 
        />
      </aside>

      {/* دراور موبایل */}
      <div className={`fixed inset-0 z-[100] lg:hidden transition-all duration-500 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <aside className={`absolute top-0 right-0 h-full w-[80%] max-w-[320px] bg-slate-900 shadow-2xl transition-transform duration-500 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={handleTabChange} 
            onLogout={handleLogout} 
            permissions={currentUser.role === 'admin' ? undefined : currentUser.permissions} 
          />
        </aside>
      </div>

      <div className="flex-1 lg:mr-80 min-h-screen flex flex-col w-full overflow-x-hidden">
        <header className="lg:hidden bg-white border-b px-4 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90 safe-padding">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-xl shadow-inner border border-slate-100 active:scale-90 transition-all"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] text-white">👕</div>
              <h1 className="text-sm font-black tracking-tight">سیرجان پوش</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full max-w-[100px] truncate">{currentUser.username}</span>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-6 lg:p-10 w-full overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto">
            {activeTab === 'dashboard' && <Dashboard data={data} />}
            {activeTab === 'inventory' && canAccess('inventory') && <Inventory data={data} setData={updateData} currentUser={currentUser} />}
            {activeTab === 'partners' && canAccess('partners') && <Partners data={data} setData={updateData} currentUser={currentUser} />}
            {activeTab === 'invoices' && canAccess('invoices') && <Invoices data={data} setData={updateData} currentUser={currentUser} />}
            {activeTab === 'users' && canAccess('users') && <Users data={data} setData={updateData} currentUser={currentUser} />}
            {activeTab === 'backup' && canAccess('backup') && <BackupRestore data={data} setData={updateData} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
