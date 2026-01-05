
import React from 'react';
import { AppData } from '../types';

interface BackupRestoreProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ data, setData }) => {
  const downloadBackup = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sirjan_poosh_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (confirm('آیا از بازگردانی این فایل اطمینان دارید؟ تمام اطلاعات فعلی با اطلاعات فایل جایگزین خواهد شد.')) {
          setData(jsonData);
          alert('اطلاعات با موفقیت بازیابی شد.');
        }
      } catch (err) {
        alert('فایل نامعتبر است.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center space-y-8">
        <div className="text-6xl">💾</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">پشتیبان‌گیری و بازیابی اطلاعات</h2>
          <p className="text-gray-500">جهت جلوگیری از پاک شدن اطلاعات، به طور منظم از دیتابیس خود پشتیبان تهیه کنید.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-6 border-2 border-dashed rounded-2xl border-indigo-200 hover:border-indigo-400 transition cursor-pointer" onClick={downloadBackup}>
            <div className="text-3xl mb-4">📤</div>
            <h3 className="font-bold text-indigo-900 mb-2">دانلود نسخه پشتیبان</h3>
            <p className="text-xs text-gray-400">یک فایل JSON شامل تمام کالاها، فاکتورها و سوابق شرکا</p>
          </div>

          <div className="p-6 border-2 border-dashed rounded-2xl border-orange-200 hover:border-orange-400 transition relative">
            <div className="text-3xl mb-4">📥</div>
            <h3 className="font-bold text-orange-900 mb-2">بازگردانی فایل پشتیبان</h3>
            <p className="text-xs text-gray-400">انتخاب فایل از کامپیوتر جهت بارگذاری مجدد در سیستم</p>
            <input 
              type="file" 
              accept=".json" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleRestore}
            />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-right">
          <p className="text-xs text-yellow-800 leading-relaxed">
            <strong>توجه مهم:</strong> این نرم‌افزار از دیتابیس مرورگر شما استفاده می‌کند. 
            برای انتقال اطلاعات به سیستم دیگر یا اطمینان از حذف نشدن داده‌ها، حتما دکمه دانلود را بزنید و فایل را در جای مطمئن ذخیره کنید.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
