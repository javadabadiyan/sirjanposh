
import React, { useState } from 'react';
import { AppData, User } from '../types';
import { toEnglishDigits } from '../utils/formatters';

interface UsersProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const ALL_PERMISSIONS = [
  { id: 'dashboard', label: 'داشبورد' },
  { id: 'inventory', label: 'مدیریت کالاها' },
  { id: 'partners', label: 'شرکا و سرمایه' },
  { id: 'invoices', label: 'صدور فاکتور' },
  { id: 'users', label: 'مدیریت کاربران' },
  { id: 'backup', label: 'پشتیبان‌گیری' },
];

const Users: React.FC<UsersProps> = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    role: 'staff' as 'admin' | 'staff',
    permissions: ['dashboard'] as string[]
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password || '',
      role: user.role,
      permissions: user.permissions || []
    });
    setShowModal(true);
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const saveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = toEnglishDigits(formData.username).trim();
    const normalizedPassword = toEnglishDigits(formData.password).trim();

    if (normalizedUsername === 'admin' && normalizedPassword !== '5221157' && !editingUser) {
      alert('نام کاربری admin فقط با رمز عبور سیستمی قابل تعریف است.');
      return;
    }

    const userData: User = {
      id: editingUser ? editingUser.id : Date.now().toString(),
      username: normalizedUsername,
      password: normalizedPassword,
      role: formData.role,
      permissions: formData.role === 'admin' ? ALL_PERMISSIONS.map(p => p.id) : formData.permissions
    };

    if (editingUser) {
      setData({ ...data, users: data.users.map(u => u.id === editingUser.id ? userData : u) });
    } else {
      if (data.users.some(u => u.username.toLowerCase() === normalizedUsername.toLowerCase())) {
        alert('این نام کاربری قبلاً ثبت شده است.');
        return;
      }
      setData({ ...data, users: [...data.users, userData] });
    }

    setShowModal(false);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    const user = data.users.find(u => u.id === id);
    if (user?.username === 'admin') {
      alert('مدیر ارشد قابل حذف نیست.');
      return;
    }
    if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      setData({ ...data, users: data.users.filter(u => u.id !== id) });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 md:pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border shadow-sm gap-4">
        <div className="text-center md:text-right w-full md:w-auto">
          <h2 className="text-xl font-black text-slate-800">👥 کاربران و دسترسی‌ها</h2>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">Staff Access Control</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setFormData({username: '', password: '', role: 'staff', permissions: ['dashboard']}); setShowModal(true); }}
          className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 font-black shadow-lg active:scale-95 transition-all min-h-[56px]"
        >+ کاربر جدید</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {data.users.map(user => (
          <div key={user.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative hover:shadow-xl transition-all duration-300 group overflow-hidden">
            <div className={`absolute top-0 right-0 w-2 h-full transition-all ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-200 group-hover:bg-indigo-300'}`}></div>
            
            <div className="flex items-center space-x-reverse space-x-4 mb-6">
              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                {user.role === 'admin' ? '👑' : '👤'}
              </div>
              <div className="overflow-hidden">
                <p className="font-black text-xl text-slate-800 truncate">{user.username}</p>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${user.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {user.role === 'admin' ? 'مدیر سیستم' : 'اپراتور فروش'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3 mb-8 min-h-[60px]">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">مجوزها:</p>
              <div className="flex flex-wrap gap-1.5">
                {user.role === 'admin' ? (
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] px-3 py-1 rounded-lg border border-emerald-100 font-black">دسترسی نامحدود</span>
                ) : (
                  user.permissions?.map(pId => (
                    <span key={pId} className="bg-indigo-50 text-indigo-600 text-[10px] px-3 py-1 rounded-lg border border-indigo-100 font-black">
                      {ALL_PERMISSIONS.find(p => p.id === pId)?.label}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button onClick={() => handleEdit(user)} className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all min-h-[44px]">📝 ویرایش</button>
              {user.username !== 'admin' && (
                <button onClick={() => deleteUser(user.id)} className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-black text-xs hover:bg-red-600 hover:text-white transition-all min-h-[44px]">🗑️ حذف</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-0 md:p-6 z-[2000] overflow-y-auto">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-lg md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up relative">
            <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-black">{editingUser ? 'ویرایش کاربر' : 'کاربر جدید'}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-1">User Account Setup</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-2xl hover:bg-red-500 transition-all shadow-sm">&times;</button>
            </div>
            
            <form onSubmit={saveUser} className="p-6 md:p-10 space-y-6 flex-1 overflow-y-auto bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">نام کاربری</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-center text-lg shadow-sm" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">رمز عبور</label><input required type="password" className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-center text-lg shadow-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-2">نقش سیستمی</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setFormData({...formData, role: 'staff'})} className={`py-4 rounded-2xl font-black border-2 transition-all min-h-[52px] ${formData.role === 'staff' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}>فروشنده</button>
                  <button type="button" onClick={() => setFormData({...formData, role: 'admin'})} className={`py-4 rounded-2xl font-black border-2 transition-all min-h-[52px] ${formData.role === 'admin' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}>مدیر کل</button>
                </div>
              </div>

              {formData.role === 'staff' && (
                <div className="space-y-4 bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-inner">
                  <label className="text-[11px] font-black text-indigo-900 block mb-2">دسترسی‌های مجاز:</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {ALL_PERMISSIONS.map(perm => (
                      <label key={perm.id} className="flex items-center space-x-reverse space-x-4 cursor-pointer group bg-slate-50 p-3.5 rounded-xl border border-transparent hover:border-indigo-200 transition-all">
                        <div 
                          onClick={() => togglePermission(perm.id)}
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${formData.permissions.includes(perm.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}
                        >
                          {formData.permissions.includes(perm.id) && <span className="text-[11px]">✔</span>}
                        </div>
                        <span className={`text-sm font-black transition-all ${formData.permissions.includes(perm.id) ? 'text-indigo-900' : 'text-slate-400'}`}>
                          {perm.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg md:text-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 min-h-[64px] mt-6">
                {editingUser ? '✅ ذخیره نهایی' : '🚀 ایجاد حساب کاربری'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
