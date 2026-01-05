
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'داشبورد', icon: '📊' },
    { id: 'inventory', label: 'مدیریت پوشاک', icon: '👕' },
    { id: 'partners', label: 'شرکا و سرمایه', icon: '🤝' },
    { id: 'invoices', label: 'صدور فاکتور', icon: '📜' },
    { id: 'users', label: 'مدیریت کاربران', icon: '👥' },
    { id: 'backup', label: 'پشتیبان‌گیری', icon: '💾' },
  ];

  return (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-10">
        <h2 className="text-xl font-bold tracking-wider">سیرجان پوش</h2>
        <p className="text-xs text-indigo-300">مدیریت هوشمند کسب و کار</p>
      </div>
      <nav className="flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-right px-6 py-4 flex items-center space-x-reverse space-x-3 transition-colors ${
              activeTab === item.id ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-6 mt-auto">
        <button
          onClick={onLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-reverse space-x-2"
        >
          <span>🚪</span>
          <span>خروج از سیستم</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
