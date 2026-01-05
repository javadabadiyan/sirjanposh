
import React, { useState } from 'react';
import { AppData, User } from '../types';
import { toEnglishDigits } from '../utils/formatters';

interface UsersProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const ALL_PERMISSIONS = [
  { id: 'dashboard', label: 'داشبورد وضعیت' },
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
    
    // پاکسازی و نرمال‌سازی قبل از ذخیره
    const normalizedUsername = toEnglishDigits(formData.username).trim();
    const normalizedPassword = toEnglishDigits(formData.password).trim();

    if (normalizedUsername === 'admin' && normalizedPassword !== '5221157' && !editingUser) {
      alert('نام کاربری admin فقط با رمز عبور تعیین شده توسط مدیریت قابل تعریف است.');
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
      setData({
        ...data,
        users: data.users.map(u => u.id === editingUser.id ? userData : u)
      });
    } else {
      // جلوگیری از نام کاربری تکراری
      if (data.users.some(u => u.username.toLowerCase() === normalizedUsername.toLowerCase())) {
        alert('این نام کاربری قبلاً در سیستم ثبت شده است.');
        return;
      }
      setData({
        ...data,
        users: [...data.users, userData]
      });
    }

    setShowModal(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'staff', permissions: ['dashboard'] });
  };

  const deleteUser = (id: string) => {
    const user = data.users.find(u => u.id === id);
    if (user?.username === 'admin') {
      alert('کاربر اصلی سیستم (مدیر ارشد) قابل حذف نیست.');
      return;
    }
    if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      setData({
        ...data,
        users: data.users.filter(u => u.id !== id)
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800">مدیریت کاربران و دسترسی‌ها</h2>
          <p className="text-xs text-gray-400 mt-1">تعریف سطوح دسترسی مختلف برای کارکنان فروشگاه</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setFormData({username: '', password: '', role: 'staff', permissions: ['dashboard']}); setShowModal(true); }}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 font-bold transition shadow-lg shadow-indigo-100"
        >+ کاربر جدید</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-[2rem] shadow-sm border relative hover:shadow-md transition duration-300">
            <div className="flex items-center space-x-reverse space-x-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                {user.role === 'admin' ? '👑' : '👤'}
              </div>
              <div>
                <p className="font-black text-xl text-gray-800">{user.username}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {user.role === 'admin' ? 'مدیر ارشد' : 'اپراتور سیستم'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <p className="text-xs font-bold text-gray-400">دسترسی‌ها:</p>
              <div className="flex flex-wrap gap-1">
                {user.role === 'admin' ? (
                  <span className="bg-green-50 text-green-700 text-[10px] px-2 py-1 rounded-lg border border-green-100 font-black">دسترسی کامل</span>
                ) : (
                  user.permissions?.map(pId => (
                    <span key={pId} className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-lg border border-blue-100 font-bold">
                      {ALL_PERMISSIONS.find(p => p.id === pId)?.label}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end space-x-reverse space-x-4">
              <button onClick={() => handleEdit(user)} className="text-sm font-black text-blue-600 hover:underline">ویرایش</button>
              {user.username !== 'admin' && (
                <button onClick={() => deleteUser(user.id)} className="text-sm font-black text-red-500 hover:underline">حذف</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-8 bg-indigo-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">{editingUser ? 'ویرایش کاربر' : 'تعریف کاربر جدید'}</h3>
                <p className="text-xs text-indigo-300 mt-1">نام کاربری و رمز عبور را به دقت وارد کنید</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-3xl">&times;</button>
            </div>
            
            <form onSubmit={saveUser} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 mr-2">نام کاربری (انگلیسی/فارسی)</label>
                  <input 
                    required 
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-center" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 mr-2">رمز عبور</label>
                  <input 
                    required 
                    type="password" 
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-center" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 mr-2">نقش کاربری</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormData({...formData, role: 'staff'})} className={`py-4 rounded-2xl font-bold border-2 transition ${formData.role === 'staff' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-100 text-gray-400'}`}>اپراتور</button>
                  <button type="button" onClick={() => setFormData({...formData, role: 'admin'})} className={`py-4 rounded-2xl font-bold border-2 transition ${formData.role === 'admin' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-100 text-gray-400'}`}>مدیر سیستم</button>
                </div>
              </div>

              {formData.role === 'staff' && (
                <div className="space-y-3 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <label className="text-sm font-black text-gray-700 block mb-2">تعیین دسترسی‌ها:</label>
                  <div className="grid grid-cols-2 gap-3">
                    {ALL_PERMISSIONS.map(perm => (
                      <label key={perm.id} className="flex items-center space-x-reverse space-x-3 cursor-pointer group">
                        <div 
                          onClick={() => togglePermission(perm.id)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${formData.permissions.includes(perm.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300'}`}
                        >
                          {formData.permissions.includes(perm.id) && <span className="text-[10px]">✔</span>}
                        </div>
                        <span className={`text-xs font-bold transition ${formData.permissions.includes(perm.id) ? 'text-indigo-900' : 'text-gray-400'}`}>
                          {perm.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 shadow-xl transition-all">
                {editingUser ? 'ذخیره تغییرات' : 'ایجاد کاربر جدید'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
