
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('sirjan_poosh_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('sirjan_poosh_data', JSON.stringify(data));
  }, [data]);

  // Ensure initial admin exists if data is cleared
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

  // Filter accessible tabs
  const canAccess = (tabId: string) => {
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions.includes(tabId);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-indigo-900 text-white fixed h-full">
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-50">
          {canAccess('dashboard') && <button onClick={() => setActiveTab('dashboard')} className={`p-2 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-gray-500'}`}>📊</button>}
          {canAccess('inventory') && <button onClick={() => setActiveTab('inventory')} className={`p-2 ${activeTab === 'inventory' ? 'text-indigo-600' : 'text-gray-500'}`}>👕</button>}
          {canAccess('partners') && <button onClick={() => setActiveTab('partners')} className={`p-2 ${activeTab === 'partners' ? 'text-indigo-600' : 'text-gray-500'}`}>🤝</button>}
          {canAccess('invoices') && <button onClick={() => setActiveTab('invoices')} className={`p-2 ${activeTab === 'invoices' ? 'text-indigo-600' : 'text-gray-500'}`}>📜</button>}
          {canAccess('users') && <button onClick={() => setActiveTab('users')} className={`p-2 ${activeTab === 'users' ? 'text-indigo-600' : 'text-gray-500'}`}>👥</button>}
        </div>

        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-indigo-900">سیرجان پوش</h1>
            <span className="text-xs text-gray-400 font-bold">کاربر: {currentUser.username} ({currentUser.role === 'admin' ? 'مدیر' : 'کارمند'})</span>
          </div>
          <div className="text-gray-500 font-bold text-sm">تاریخ: {getCurrentJalaliDate()}</div>
        </header>

        <main className="mb-20 md:mb-0">
          {activeTab === 'dashboard' && canAccess('dashboard') && <Dashboard data={data} />}
          {activeTab === 'inventory' && canAccess('inventory') && <Inventory data={data} setData={setData} />}
          {activeTab === 'partners' && canAccess('partners') && <Partners data={data} setData={setData} />}
          {activeTab === 'invoices' && canAccess('invoices') && <Invoices data={data} setData={setData} />}
          {activeTab === 'users' && canAccess('users') && <Users data={data} setData={setData} />}
          {activeTab === 'backup' && canAccess('backup') && <BackupRestore data={data} setData={setData} />}
          
          {/* Access Denied Placeholder */}
          {!canAccess(activeTab) && (
            <div className="bg-red-50 text-red-600 p-10 rounded-3xl text-center border-2 border-dashed border-red-200">
              <span className="text-5xl block mb-4">🚫</span>
              <h2 className="text-xl font-black">دسترسی محدود شده</h2>
              <p className="mt-2">شما اجازه دسترسی به این بخش را ندارید. لطفاً با مدیر سیستم تماس بگیرید.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
