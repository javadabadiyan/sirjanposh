
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
    password: '5221157', // تغییر رمز عبور اولیه ادمین
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
      
      const parsed = JSON.parse(saved);
      
      if (parsed.partners && Array.isArray(parsed.partners)) {
        parsed.partners = parsed.partners.map((p: any) => {
          if (!p.investments && p.investment !== undefined) {
            return {
              ...p,
              investments: [{ 
                id: 'migrated-' + Date.now() + Math.random(), 
                amount: Number(p.investment) || 0, 
                date: p.date || getCurrentJalaliDate() 
              }]
            };
          }
          if (!p.investments) {
            return { ...p, investments: [] };
          }
          return p;
        });
      }
      
      return parsed;
    } catch (e) {
      console.error("Data Migration Error:", e);
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
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <Login onLogin={(user) => setCurrentUser(user)} users={data.users} />;
  }

  const canAccess = (tabId: string) => {
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.includes(tabId) ?? false;
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-gray-800 font-medium overflow-x-hidden">
      <aside className="hidden lg:flex flex-col w-72 bg-indigo-950 text-white fixed h-full shadow-2xl z-40">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
          permissions={currentUser.role === 'admin' ? undefined : currentUser.permissions} 
        />
      </aside>

      <div className="flex-1 lg:mr-72 min-h-screen flex flex-col">
        <header className="lg:hidden bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl text-xl">👕</div>
            <h1 className="text-lg font-black text-indigo-950">سیرجان پوش</h1>
          </div>
          <button onClick={handleLogout} className="text-red-500 bg-red-50 p-2 rounded-xl text-xl">🚪</button>
        </header>

        <main className="p-4 md:p-8 lg:p-10 flex-1 pb-24 lg:pb-10 overflow-x-hidden">
          <div className="hidden lg:flex justify-between items-center mb-10 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 p-4 rounded-3xl text-3xl">👋</div>
              <div>
                <h2 className="text-xl font-black text-indigo-950">خوش آمدید، {currentUser.username}</h2>
                <p className="text-xs text-gray-400 font-bold mt-1">مدیریت هوشمند فروشگاه سیرجان پوش</p>
              </div>
            </div>
            <div className="flex gap-4">
               <div className="bg-gray-50 px-6 py-3 rounded-2xl text-gray-500 font-black text-sm border border-gray-100 flex items-center gap-2">
                 <span>📅</span> {getCurrentJalaliDate()}
               </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && canAccess('dashboard') && <Dashboard data={data} />}
            {activeTab === 'inventory' && canAccess('inventory') && <Inventory data={data} setData={setData} currentUser={currentUser} />}
            {activeTab === 'partners' && canAccess('partners') && <Partners data={data} setData={setData} />}
            {activeTab === 'invoices' && canAccess('invoices') && <Invoices data={data} setData={setData} />}
            {activeTab === 'users' && canAccess('users') && <Users data={data} setData={setData} />}
            {activeTab === 'backup' && canAccess('backup') && <BackupRestore data={data} setData={setData} />}
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center px-4 py-3 z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          {[
            { id: 'dashboard', icon: '📊', label: 'وضعیت' },
            { id: 'inventory', icon: '👕', label: 'انبار' },
            { id: 'partners', icon: '🤝', label: 'شرکا' },
            { id: 'invoices', icon: '📜', label: 'فاکتور' },
            { id: 'backup', icon: '💾', label: 'تنظیمات' }
          ].filter(item => canAccess(item.id)).map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${
                activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-gray-400 opacity-60'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[10px] font-black">{item.label}</span>
              {activeTab === item.id && <span className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5 animate-pulse"></span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default App;
