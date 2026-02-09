
// Fix: Use namespace import for React to resolve JSX intrinsic element errors
import * as React from 'react';
import { useState } from 'react';
import { AppData } from '../types';
import { toPersianNumbers, toEnglishDigits, getCurrentJalaliDate } from '../utils/formatters';

interface BackupRestoreProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ data, setData }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // تهیه نسخه پشتیبان کامل
  const downloadBackup = () => {
    setIsProcessing(true);
    try {
      const backupData = {
        ...data,
        backupDate: new Date().toISOString(),
        version: "2.6",
        source: "SirjanPoosh_Management_System",
        developer: "Mohammad Javad Abadian"
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = toEnglishDigits(getCurrentJalaliDate()).replace(/\//g, '-');
      a.download = `Backup_SirjanPoosh_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  // بازیابی نسخه پشتیبان با اعتبارسنجی
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        
        // اعتبارسنجی ساختار فایل
        if (!jsonData.products || !jsonData.partners || !jsonData.invoices) {
          throw new Error('ساختار فایل پشتیبان معتبر نیست. لطفاً فایل صحیح را انتخاب کنید.');
        }

        const confirmRestore = confirm(
          "⚠️ هشدار جدی!\n" +
          "با بازیابی این فایل، تمامی اطلاعات فعلی به طور کامل حذف و اطلاعات فایل جایگزین می‌شوند.\n" +
          "آیا از انجام این عملیات اطمینان دارید؟"
        );

        if (confirmRestore) {
          setIsProcessing(true);
          setData(jsonData);
          alert('✅ بازیابی با موفقیت انجام شد.');
          window.location.reload();
        }
      } catch (err: any) {
        alert('❌ خطا در بازیابی: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // بازگشت به تنظیمات کارخانه
  const handleFactoryReset = () => {
    const code = prompt('⚠️ جهت تایید حذف کل دیتابیس، عبارت "reset" را تایپ کنید:');
    if (code?.toLowerCase() === 'reset') {
      const finalConfirm = confirm('مطمئن هستید؟ این عمل غیرقابل بازگشت است.');
      if (finalConfirm) {
        const initialData: AppData = {
          products: [],
          partners: [],
          payments: [],
          invoices: [],
          users: data.users.filter(u => u.username === 'admin')
        };
        setData(initialData);
        alert('دیتابیس با موفقیت تخلیه شد.');
        window.location.reload();
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn pb-24 px-2">
      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10 relative overflow-hidden">
        
        <div className="text-center space-y-4">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto shadow-inner">
            💾
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">تنظیمات و پشتیبان‌گیری</h2>
          <p className="text-slate-400 font-bold text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            مدیریت کامل نسخه‌های پشتیبان و تنظیمات حیاتی سامانه سیرجان پوش.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group relative cursor-pointer" onClick={downloadBackup}>
            <div className="flex justify-between items-start mb-6">
              <div className="text-4xl group-hover:scale-110 transition-transform">📤</div>
              <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Backup</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">خروجی کامل (Backup)</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed">
              تهیه یک نسخه کامل از تمامی اطلاعات انبار، فاکتورها و شرکا در قالب یک فایل JSON.
            </p>
            {isProcessing && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-[2.5rem] font-black text-indigo-600">در حال پردازش...</div>}
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group relative overflow-hidden">
            <input 
              type="file" 
              accept=".json" 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              onChange={handleRestore}
            />
            <div className="flex justify-between items-start mb-6">
              <div className="text-4xl group-hover:scale-110 transition-transform">📥</div>
              <span className="bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Restore</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">بازیابی داده‌ها (Restore)</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed">
              بارگذاری فایل پشتیبان قبلی و جایگزینی کامل اطلاعات سیستم.
            </p>
          </div>
        </div>

        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl">⚙️</div>
          <div className="text-center md:text-right">
            <h4 className="font-black text-lg md:text-xl mb-1">وضعیت پایداری سیستم</h4>
            <p className="text-[10px] text-slate-400 font-bold mb-4">تمامی عملیات‌ها تحت پروتکل‌های امنیتی جناب آقای آبادیان انجام می‌شود.</p>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active & Secured</span>
            </div>
          </div>
          
          <button 
            onClick={handleFactoryReset}
            className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-3 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all whitespace-nowrap"
          >
            🔥 بازگشت به تنظیمات کارخانه
          </button>
        </div>

        <div className="pt-8 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-bold">
            کدنویسی شده توسط : جناب آقای محمد جواد آبادیان (مثه بابای برای همه شریک ها)
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
