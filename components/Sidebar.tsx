
// Fix: Use namespace import for React to resolve JSX intrinsic element errors
import * as React from 'react';

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
    <div className="flex flex-col h-full py-6 md:py-8 px-5 md:px-6 overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="px-4 mb-8 md:mb-10 shrink-0">
        <div className="bg-indigo-600 p-4 rounded-[1.5rem] w-fit mb-4 md:mb-6 shadow-2xl shadow-indigo-500/40 text-3xl">👕</div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">سیرجان پوش</h2>
        <p className="text-[9px] text-slate-400 font-black mt-2 uppercase tracking-widest opacity-80">مدیریت هوشمند خرده‌فروشی</p>
      </div>
      
      <nav className="flex-1 space-y-3 mb-8">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-right px-5 py-4.5 rounded-2xl flex items-center space-x-reverse space-x-4 transition-all duration-300 group min-h-[56px] ${
              activeTab === item.id 
                ? 'bg-white text-slate-900 shadow-2xl shadow-indigo-950/50 translate-x-1' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={`text-xl transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
            <span className="font-black text-[15px] whitespace-nowrap">{item.label}</span>
            {activeTab === item.id && <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full mr-auto animate-pulse"></span>}
          </button>
        ))}
      </nav>

      <div className="mt-auto shrink-0 space-y-4 pb-4">
        <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mb-1">توسعه و پشتیبانی:</p>
          <p className="text-[10px] text-indigo-400 font-bold leading-relaxed">
            کدنویسی شده توسط : جناب آقای محمد جواد آبادیان <br/>
            <span className="text-slate-500 opacity-60 text-[9px]">(مثه بابای برای همه شریک ها)</span>
          </p>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-5 rounded-2xl transition-all font-black flex items-center justify-center space-x-reverse space-x-3 border border-red-500/20 shadow-lg active:scale-95 min-h-[56px]"
        >
          <span className="text-lg">🚪</span>
          <span className="text-base">خروج از حساب</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
