
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
    { 
      id: '1', 
      name: 'شریک اول', 
      investments: [{ id: 'init-1', amount: 10000000, date: '1403/01/01' }], 
      date: '1403/01/01' 
    },
    { 
      id: '2', 
      name: 'شریک دوم', 
      investments: [{ id: 'init-2', amount: 30000000, date: '1403/01/01' }], 
      date: '1403/01/01' 
    }
  ],
  payments: [],
  invoices: [],
  users: [{ 
    id: '1', 
    username: 'admin', 
    password: '5221157',
    role: 'admin',
    permissions: ['dashboard', 'inventory', 'partners', 'invoices', 'users', 'backup']
  }]
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedSession = localStorage.getItem('sirjan_poosh_session');
      return savedSession ? JSON.parse(savedSession) : null;
    } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem('sirjan_poosh_data');
      if (!saved) return INITIAL_DATA;
      return JSON.parse(saved);
    } catch (e) {
      return INITIAL_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem('sirjan_poosh_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sirjan_poosh_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sirjan_poosh_session');
    }
  }, [currentUser]);

  const handleLogout = () => {
    if(confirm('آیا قصد خروج از سیستم را دارید؟')) {
      setCurrentUser(null);
      setActiveTab('dashboard');
    }
  };

  if (!currentUser) {
    return <Login onLogin={(user) => setCurrentUser(user)} users={data.users} />;
  }

  const canAccess = (tabId: string) => {
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.includes(tabId) ?? false;
  };

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'وضعیت' },
    { id: 'inventory', icon: '👕', label: 'انبار' },
    { id: 'partners', icon: '🤝', label: 'شرکا' },
    { id: 'invoices', icon: '📜', label: 'فاکتور' },
    { id: 'backup', icon: '💾', label: 'تنظیمات' }
  ].filter(item => canAccess(item.id));

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] text-slate-800 font-medium overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 bg-slate-900 text-white fixed h-full shadow-2xl z-40">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
          permissions={currentUser.role === 'admin' ? undefined : currentUser.permissions} 
        />
      </aside>

      <div className="flex-1 lg:mr-80 min-h-screen flex flex-col relative pb-20 lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b px-5 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl text-xl shadow-lg shadow-indigo-200">👕</div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none">سیرجان پوش</h1>
              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-left ml-2">
               <p className="text-[10px] font-black text-slate-400 leading-none mb-1">{getCurrentJalaliDate()}</p>
               <p className="text-[11px] font-black text-indigo-600 leading-none">{currentUser.username}</p>
            </div>
            <button onClick={handleLogout} className="text-red-500 bg-red-50 w-10 h-10 rounded-2xl flex items-center justify-center text-xl active:scale-90 transition-transform">🚪</button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-3 md:p-8 lg:p-10 flex-1 overflow-x-hidden">
          {/* Desktop Greeting Header */}
          <div className="hidden lg:flex justify-between items-center mb-10 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-5">
              <div className="bg-indigo-50 p-5 rounded-3xl text-4xl shadow-inner">👋</div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">خوش آمدید، {currentUser.username}</h2>
                <p className="text-sm text-slate-400 font-bold mt-1">مدیریت هوشمند فروشگاه پوشاک سیرجان پوش</p>
              </div>
            </div>
            <div className="flex gap-4">
               <div className="bg-slate-50 px-8 py-4 rounded-3xl text-slate-600 font-black text-sm border border-slate-100 flex items-center gap-3 shadow-sm">
                 <span className="text-xl">📅</span> {getCurrentJalaliDate()}
               </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && canAccess('dashboard') && <Dashboard data={data} />}
            {activeTab === 'inventory' && canAccess('inventory') && <Inventory data={data} setData={setData} currentUser={currentUser} />}
            {activeTab === 'partners' && canAccess('partners') && <Partners data={data} setData={setData} />}
            {activeTab === 'invoices' && canAccess('invoices') && <Invoices data={data} setData={setData} />}
            {activeTab === 'users' && canAccess('users') && <Users data={data} setData={setData} />}
            {activeTab === 'backup' && canAccess('backup') && <BackupRestore data={data} setData={setData} />}
          </div>
        </main>

        {/* Advanced Mobile Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center px-2 py-3 z-50 rounded-t-[2.5rem] shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.08)]">
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center gap-1.5 p-3 min-w-[64px] transition-all duration-300 outline-none group"
            >
              {activeTab === item.id && (
                <span className="absolute inset-0 bg-indigo-50 rounded-2xl scale-110 -z-10 animate-pulse"></span>
              )}
              <span className={`text-2xl transition-transform duration-300 ${activeTab === item.id ? 'scale-110 -translate-y-1' : 'opacity-40 grayscale'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-black tracking-tight transition-colors duration-300 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
              {activeTab === item.id && (
                <span className="absolute -bottom-1 w-5 h-1 bg-indigo-600 rounded-full"></span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default App;
