
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
    { id: 'backup', label: 'تنظیمات و پشتیبان', icon: '💾' },
  ];

  const filteredItems = permissions 
    ? menuItems.filter(item => permissions.includes(item.id)) 
    : menuItems;

  return (
    <div className="flex flex-col h-full py-10 px-6">
      <div className="px-4 mb-14">
        <div className="bg-indigo-600 p-4 rounded-[1.5rem] w-fit mb-6 shadow-xl shadow-indigo-500/20 text-3xl">👕</div>
        <h2 className="text-3xl font-black tracking-tight text-white">سیرجان پوش</h2>
        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest opacity-80">Smart Retail Management</p>
      </div>
      
      <nav className="flex-1 space-y-2.5">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-right px-6 py-4.5 rounded-2xl flex items-center space-x-reverse space-x-4 transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-white text-slate-900 shadow-xl shadow-indigo-950/40 translate-x-1' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={`text-xl transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
            <span className="font-black text-sm">{item.label}</span>
            {activeTab === item.id && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-auto"></span>}
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="bg-slate-800/50 p-6 rounded-3xl mb-6 border border-slate-700/50">
           <p className="text-[10px] font-black text-slate-500 uppercase mb-3">پشتیبانی سیستم</p>
           <button className="text-[11px] text-indigo-400 font-bold hover:text-white transition-colors leading-relaxed text-right">
             تماس با توسعه‌دهنده آقای جواد آبادیان <br/> (مثه یه پدری هست برای همه شما شریکا)
           </button>
        </div>
        <button
          onClick={onLogout}
          className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-5 rounded-2xl transition-all font-black flex items-center justify-center space-x-reverse space-x-3 border border-red-500/20 shadow-lg active:scale-95"
        >
          <span className="text-xl">🚪</span>
          <span className="text-sm">خروج از حساب</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
