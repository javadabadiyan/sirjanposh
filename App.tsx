
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
import { getCurrentJalaliDate } from './utils/formatters';

const INITIAL_DATA: AppData = {
  products: [],
  partners: [
    { id: '1', name: 'شریک اول', investment: 10000000, date: '1403/01/01' },
    { id: '2', name: 'شریک دوم', investment: 30000000, date: '1403/01/01' }
  ],
  payments: [],
  invoices: [],
  users: [{ 
    id: '1', 
    username: 'admin', 
    password: 'password', 
    role: 'admin',
    permissions: ['dashboard', 'inventory', 'partners', 'invoices', 'users', 'backup']
  }]
};

const App: React.FC = () => {
  // بارگذاری اطلاعات کاربر از LocalStorage برای جلوگیری از خروج خودکار
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedSession = localStorage.getItem('sirjan_poosh_session');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('sirjan_poosh_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  // ذخیره اطلاعات دیتابیس هنگام تغییرات
  useEffect(() => {
    localStorage.setItem('sirjan_poosh_data', JSON.stringify(data));
  }, [data]);

  // ذخیره نشست کاربر (Session) هنگام ورود
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sirjan_poosh_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sirjan_poosh_session');
    }
  }, [currentUser]);

  // اطمینان از وجود کاربر ادمین در دیتابیس
  useEffect(() => {
    if (data.users.length === 0) {
      setData(prev => ({...prev, users: INITIAL_DATA.users}));
    }
  }, [data.users.length]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <Login onLogin={(user) => setCurrentUser(user)} users={data.users} />;
  }

  // بررسی سطح دسترسی به تب‌ها
  const canAccess = (tabId: string) => {
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions.includes(tabId);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-indigo-900 text-white fixed h-full shadow-2xl z-40">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
          permissions={currentUser.role === 'admin' ? undefined : currentUser.permissions} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:mr-64 p-4 md:p-8">
        {/* Mobile Navigation (Bottom) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t flex justify-around p-3 z-50 rounded-t-3xl shadow-lg">
          {canAccess('dashboard') && <button onClick={() => setActiveTab('dashboard')} className={`p-2 text-2xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white rounded-2xl scale-110 shadow-lg' : 'text-gray-400'}`}>📊</button>}
          {canAccess('inventory') && <button onClick={() => setActiveTab('inventory')} className={`p-2 text-2xl transition-all ${activeTab === 'inventory' ? 'bg-indigo-600 text-white rounded-2xl scale-110 shadow-lg' : 'text-gray-400'}`}>👕</button>}
          {canAccess('partners') && <button onClick={() => setActiveTab('partners')} className={`p-2 text-2xl transition-all ${activeTab === 'partners' ? 'bg-indigo-600 text-white rounded-2xl scale-110 shadow-lg' : 'text-gray-400'}`}>🤝</button>}
          {canAccess('invoices') && <button onClick={() => setActiveTab('invoices')} className={`p-2 text-2xl transition-all ${activeTab === 'invoices' ? 'bg-indigo-600 text-white rounded-2xl scale-110 shadow-lg' : 'text-gray-400'}`}>📜</button>}
          {canAccess('users') && <button onClick={() => setActiveTab('users')} className={`p-2 text-2xl transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white rounded-2xl scale-110 shadow-lg' : 'text-gray-400'}`}>👥</button>}
        </div>

        <header className="flex justify-between items-center mb-8 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-indigo-900">سیرجان پوش</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-gray-500 font-bold">کاربر فعال: {currentUser.username} ({currentUser.role === 'admin' ? 'مدیر ارشد' : 'کارمند'})</span>
            </div>
          </div>
          <div className="bg-indigo-50 px-4 py-2 rounded-2xl text-indigo-700 font-black text-xs border border-indigo-100 shadow-inner">
            تقویم: {getCurrentJalaliDate()}
          </div>
        </header>

        <main className="mb-24 md:mb-0">
          {activeTab === 'dashboard' && canAccess('dashboard') && <Dashboard data={data} />}
          {activeTab === 'inventory' && canAccess('inventory') && <Inventory data={data} setData={setData} />}
          {activeTab === 'partners' && canAccess('partners') && <Partners data={data} setData={setData} />}
          {activeTab === 'invoices' && canAccess('invoices') && <Invoices data={data} setData={setData} />}
          {activeTab === 'users' && canAccess('users') && <Users data={data} setData={setData} />}
          {activeTab === 'backup' && canAccess('backup') && <BackupRestore data={data} setData={setData} />}
          
          {/* Access Denied Placeholder */}
          {!canAccess(activeTab) && (
            <div className="bg-white p-12 rounded-[3rem] text-center border-4 border-dashed border-gray-100 animate-fadeIn">
              <div className="bg-red-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-5xl shadow-inner border border-red-100">🚫</div>
              <h2 className="text-2xl font-black text-gray-800">دسترسی غیرمجاز</h2>
              <p className="mt-4 text-gray-500 font-bold max-w-sm mx-auto leading-relaxed">
                شما اجازه مشاهده این بخش را ندارید. برای تغییر سطح دسترسی با مدیریت سیستم هماهنگ کنید.
              </p>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="mt-8 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100"
              >
                بازگشت به داشبورد
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
