
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
    a.download = `sirjan_poosh_cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (confirm('آیا از بازگردانی اطمینان دارید؟ اطلاعات فعلی در دیتابیس ابری Neon با این فایل جایگزین خواهد شد.')) {
          setData(jsonData);
          alert('اطلاعات با موفقیت در دیتابیس ابری بازنویسی شد.');
        }
      } catch (err) {
        alert('فایل پشتیبان نامعتبر است.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn pb-20">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 text-center space-y-10">
        <div className="text-8xl bg-slate-50 w-32 h-32 flex items-center justify-center rounded-[2.5rem] mx-auto shadow-inner">💾</div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">مرکز مدیریت داده‌ها (Neon Cloud)</h2>
          <p className="text-slate-400 font-bold max-w-lg mx-auto leading-relaxed">تمامی اطلاعات شما هم‌اکنون در سرورهای ابری Neon ذخیره می‌شود. جهت اطمینان بیشتر، می‌توانید نسخه آفلاین تهیه کنید.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          <button onClick={downloadBackup} className="group p-10 border-4 border-dashed rounded-[3rem] border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all duration-300 text-right relative overflow-hidden">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">📤</div>
            <h3 className="font-black text-2xl text-indigo-950 mb-3">تهیه نسخه پشتیبان</h3>
            <p className="text-sm text-indigo-400 font-bold">ذخیره تمامی کالاها، فاکتورها و سوابق شرکا در یک فایل امن.</p>
          </button>

          <div className="group p-10 border-4 border-dashed rounded-[3rem] border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all duration-300 text-right relative overflow-hidden">
            <input type="file" accept=".json" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleRestore} title="انتخاب فایل پشتیبان" />
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">📥</div>
            <h3 className="font-black text-2xl text-emerald-950 mb-3">بازگردانی اطلاعات</h3>
            <p className="text-sm text-emerald-400 font-bold">بارگذاری اطلاعات از فایل پشتیبان قبلی به دیتابیس فعلی.</p>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-right flex items-start gap-6 shadow-2xl">
          <div className="text-3xl">🛡️</div>
          <div>
            <p className="text-sm text-white font-black mb-2">امنیت ابری فعال است</p>
            <p className="text-xs text-slate-400 leading-relaxed font-bold">
              اطلاعات شما به صورت رمزنگاری شده در دیتابیس SQL نگهداری می‌شود. علامت‌های سوال در متون فارسی با این تکنولوژی به طور کامل برطرف شده است.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
