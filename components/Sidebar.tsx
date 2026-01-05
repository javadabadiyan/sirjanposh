
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  permissions?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, permissions }) => {
  const menuItems = [
    { id: 'dashboard', label: 'داشبورد وضعیت', icon: '📊' },
    { id: 'inventory', label: 'مدیریت کالاها', icon: '👕' },
    { id: 'partners', label: 'شرکا و سرمایه', icon: '🤝' },
    { id: 'invoices', label: 'صدور فاکتور', icon: '📜' },
    { id: 'users', label: 'کاربران سیستم', icon: '👥' },
    { id: 'backup', label: 'پشتیبان‌گیری', icon: '💾' },
  ];

  const filteredItems = permissions 
    ? menuItems.filter(item => permissions.includes(item.id)) 
    : menuItems;

  return (
    <div className="flex flex-col h-full py-8">
      <div className="px-8 mb-12">
        <div className="bg-white/10 p-3 rounded-2xl w-fit mb-4">👕</div>
        <h2 className="text-2xl font-black tracking-tight text-white">سیرجان پوش</h2>
        <p className="text-xs text-indigo-300 font-bold mt-1 opacity-80">سامانه مدیریت یکپارچه</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-right px-6 py-4 rounded-2xl flex items-center space-x-reverse space-x-4 transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-white text-indigo-900 shadow-lg shadow-indigo-950/20' 
                : 'text-indigo-100 hover:bg-white/5'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-6 mt-auto">
        <button
          onClick={onLogout}
          className="w-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white py-4 rounded-2xl transition-all font-bold flex items-center justify-center space-x-reverse space-x-2 border border-red-500/20"
        >
          <span>🚪</span>
          <span>خروج از سیستم</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
