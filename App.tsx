
import React, { useState, useEffect, useCallback } from 'react';
import { AppData, Product, Partner, User, Invoice } from './types';
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
  // Fixed: profitHistory was removed because it is not defined in the AppData interface in types.ts
  users: [{ id: '1', username: 'admin', password: 'password', role: 'admin' }]
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('sirjan_poosh_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('sirjan_poosh_data', JSON.stringify(data));
  }, [data]);

  const handleLogout = () => setIsAuthenticated(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-indigo-900 text-white fixed h-full">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:mr-64 p-4 md:p-8">
        {/* Mobile Navigation (Bottom) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-50">
          <button onClick={() => setActiveTab('dashboard')} className={`p-2 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-gray-500'}`}>📊</button>
          <button onClick={() => setActiveTab('inventory')} className={`p-2 ${activeTab === 'inventory' ? 'text-indigo-600' : 'text-gray-500'}`}>👕</button>
          <button onClick={() => setActiveTab('partners')} className={`p-2 ${activeTab === 'partners' ? 'text-indigo-600' : 'text-gray-500'}`}>🤝</button>
          <button onClick={() => setActiveTab('invoices')} className={`p-2 ${activeTab === 'invoices' ? 'text-indigo-600' : 'text-gray-500'}`}>📜</button>
          <button onClick={() => setActiveTab('users')} className={`p-2 ${activeTab === 'users' ? 'text-indigo-600' : 'text-gray-500'}`}>👥</button>
        </div>

        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-indigo-900">سیرجان پوش</h1>
          <div className="text-gray-500">تاریخ امروز: {getCurrentJalaliDate()}</div>
        </header>

        <main className="mb-20 md:mb-0">
          {activeTab === 'dashboard' && <Dashboard data={data} />}
          {activeTab === 'inventory' && <Inventory data={data} setData={setData} />}
          {activeTab === 'partners' && <Partners data={data} setData={setData} />}
          {activeTab === 'invoices' && <Invoices data={data} setData={setData} />}
          {activeTab === 'users' && <Users data={data} setData={setData} />}
          {activeTab === 'backup' && <BackupRestore data={data} setData={setData} />}
        </main>
      </div>
    </div>
  );
};

export default App;
