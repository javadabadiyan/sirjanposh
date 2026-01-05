
import React, { useState } from 'react';
import { AppData, User } from '../types';

interface UsersProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const Users: React.FC<UsersProps> = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'staff' as const });

  const saveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Date.now().toString(),
      ...formData
    };

    setData({
      ...data,
      users: [...data.users, newUser]
    });
    setShowModal(false);
    setFormData({ username: '', password: '', role: 'staff' });
  };

  const deleteUser = (id: string) => {
    if (data.users.length === 1) {
      alert('حداقل یک کاربر ادمین باید در سیستم موجود باشد.');
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">مدیریت کاربران و دسترسی‌ها</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >+ کاربر جدید</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border relative">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">👤</div>
              <div>
                <p className="font-bold text-lg">{user.username}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {user.role === 'admin' ? 'مدیر سیستم' : 'اپراتور فروش'}
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t flex justify-end space-x-reverse space-x-4">
              <button className="text-sm text-gray-400 hover:text-indigo-600">تغییر رمز</button>
              <button 
                onClick={() => deleteUser(user.id)}
                className="text-sm text-red-400 hover:text-red-600"
              >حذف کاربر</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 bg-indigo-900 text-white flex justify-between">
              <h3 className="text-xl font-bold">تعریف کاربر جدید</h3>
              <button onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={saveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1">نام کاربری</label>
                <input required className="w-full p-2 border rounded-lg" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1">رمز عبور</label>
                <input required type="password" className="w-full p-2 border rounded-lg" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1">نقش کاربری</label>
                <select className="w-full p-2 border rounded-lg" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                  <option value="staff">اپراتور (فقط فروش)</option>
                  <option value="admin">مدیر (دسترسی کامل)</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 mt-4">ذخیره کاربر</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
