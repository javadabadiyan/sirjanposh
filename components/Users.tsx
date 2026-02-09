
// Fix: Use namespace import for React to resolve JSX intrinsic element errors
import * as React from 'react';
import { useState } from 'react';
import { AppData, User } from '../types';
import { toEnglishDigits } from '../utils/formatters';

interface UsersProps {
  data: AppData;
  setData: (data: AppData) => void;
  currentUser: User;
}

const ALL_PERMISSIONS = [
  { id: 'dashboard', label: 'داشبورد' },
  { id: 'inventory', label: 'مدیریت کالاها' },
  { id: 'partners', label: 'شرکا و سرمایه' },
  { id: 'invoices', label: 'صدور فاکتور' },
  { id: 'users', label: 'مدیریت کاربران' },
  { id: 'backup', label: 'پشتیبان‌گیری' },
];

const Users: React.FC<UsersProps> = ({ data, setData, currentUser }) => {
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

    const userData: User = {
      id: editingUser ? editingUser.id : Date.now().toString(),
      username: normalizedUsername,
      password: normalizedPassword,
      role: formData.role,
      permissions: formData.role === 'admin' ? ALL_PERMISSIONS.map(p => p.id) : formData.permissions,
      registeredBy: editingUser ? editingUser.registeredBy : currentUser.username
    };

    if (editingUser) {
      setData({ ...data, users: data.users.map(u => u.id === editingUser.id ? userData : u) });
    } else {
      if (data.users.some(u => u.username.toLowerCase() === normalizedUsername.toLowerCase())) return alert('کاربر تکراری است');
      setData({ ...data, users: [...data.users, userData] });
    }

    setShowModal(false);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    const user = data.users.find(u => u.id === id);
    if (user?.username === 'admin') return alert('مدیر اصلی حذف نمی‌شود');
    if (confirm('حذف کاربر؟')) setData({ ...data, users: data.users.filter(u => u.id !== id) });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border shadow-sm gap-4">
        <h2 className="text-xl font-black text-slate-800 text-center md:text-right w-full md:w-auto">👥 مدیریت دسترسی‌ها</h2>
        <button onClick={() => { setEditingUser(null); setFormData({username: '', password: '', role: 'staff', permissions: ['dashboard']}); setShowModal(true); }} className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all min-h-[56px]">+ کاربر جدید</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.users.map(user => (
          <div key={user.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative group overflow-hidden">
            <div className={`absolute top-0 right-0 w-2 h-full ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
            <div className="flex items-center space-x-reverse space-x-4 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl">{user.role === 'admin' ? '👑' : '👤'}</div>
              <div>
                <p className="font-black text-xl text-slate-800 truncate">{user.username}</p>
                <p className="text-[9px] font-black text-slate-400 mt-0.5">ثبت شده توسط: {user.registeredBy || 'سیستم'}</p>
              </div>
            </div>
            <div className="mb-8 min-h-[50px]">
              <div className="flex flex-wrap gap-1.5">
                {user.role === 'admin' ? <span className="bg-emerald-50 text-emerald-600 text-[10px] px-3 py-1 rounded-lg font-black">مدیر سیستم</span> : 
                 user.permissions?.slice(0, 3).map(pId => <span key={pId} className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-1 rounded-lg font-black">{ALL_PERMISSIONS.find(p => p.id === pId)?.label}</span>)}
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button onClick={() => handleEdit(user)} className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-xs">ویرایش</button>
              {user.username !== 'admin' && <button onClick={() => deleteUser(user.id)} className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-black text-xs">حذف</button>}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[2000] overflow-y-auto">
          <div className="bg-white w-full max-w-lg md:rounded-[3rem] shadow-2xl flex flex-col relative overflow-hidden">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">{editingUser ? 'ویرایش کاربر' : 'کاربر جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="text-3xl">&times;</button>
            </div>
            <form onSubmit={saveUser} className="p-10 space-y-6 bg-slate-50/30">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="نام کاربری" className="p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-center" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                <input required type="password" placeholder="رمز عبور" className="p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-center" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormData({...formData, role: 'staff'})} className={`py-4 rounded-2xl font-black border-2 ${formData.role === 'staff' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400'}`}>فروشنده</button>
                <button type="button" onClick={() => setFormData({...formData, role: 'admin'})} className={`py-4 rounded-2xl font-black border-2 ${formData.role === 'admin' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400'}`}>مدیر</button>
              </div>
              {formData.role === 'staff' && (
                <div className="space-y-2 bg-white p-5 rounded-2xl border-2 border-slate-100">
                  <p className="text-[10px] font-black text-indigo-900 mb-2">مجوزهای دسترسی:</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {ALL_PERMISSIONS.map(perm => (
                      <div key={perm.id} onClick={() => togglePermission(perm.id)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.permissions.includes(perm.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                        <span className="text-xs font-black">{perm.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95">ثبت نهایی حساب ✅</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
