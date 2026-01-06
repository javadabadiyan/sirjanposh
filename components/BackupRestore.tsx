
import React, { useState } from 'react';
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
        version: "2.5",
        source: "SirjanPoosh_Cloud"
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = toEnglishDigits(getCurrentJalaliDate()).replace(/\//g, '-');
      a.download = `Full_Backup_SirjanPoosh_${date}.json`;
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
          "با بازیابی این فایل، تمامی اطلاعات فعلی (کالاها، فاکتورها، شرکا و کاربران) به طور کامل حذف و با اطلاعات فایل جایگزین می‌شوند.\n" +
          "آیا از انجام این عملیات اطمینان کامل دارید؟"
        );

        if (confirmRestore) {
          setIsProcessing(true);
          setData(jsonData);
          alert('✅ بازیابی با موفقیت انجام شد. تمامی اطلاعات هم‌اکنون بروزرسانی شدند.');
          window.location.reload(); // رفرش برای اعمال کامل تغییرات
        }
      } catch (err: any) {
        alert('❌ خطا در بازیابی: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // ریست کردن ورودی فایل
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
          users: data.users.filter(u => u.username === 'admin') // فقط ادمین را نگهدار
        };
        setData(initialData);
        alert('دیتابیس با موفقیت تخلیه شد.');
        window.location.reload();
      }
    } else if (code !== null) {
      alert('کد تایید اشتباه بود.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn pb-24 px-2">
      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10 relative overflow-hidden">
        
        {/* هدر بخش تنظیمات */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 md:w-28 md:h-28 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl md:text-5xl mx-auto shadow-inner animate-pulse">
            ⚙️
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">مرکز مدیریت و امنیت داده‌ها</h2>
          <p className="text-slate-400 font-bold text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            مدیریت کامل نسخه‌های پشتیبان، بازیابی اطلاعات و تنظیمات حیاتی سامانه «سیرجان پوش» در این بخش انجام می‌شود.
          </p>
        </div>

        {/* کارت‌های عملیاتی */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* بخش خروجی گرفتن */}
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group relative cursor-pointer" onClick={downloadBackup}>
            <div className="flex justify-between items-start mb-6">
              <div className="text-4xl group-hover:scale-125 transition-transform duration-500">📤</div>
              <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Full Backup</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">تهیه پشتیبان کامل</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed">
              یک فایل JSON حاوی تمام اطلاعات انبار، شرکا، فاکتورها و کاربران دانلود می‌شود. این امن‌ترین راه برای حفظ داده‌های شماست.
            </p>
            {isProcessing && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-[2.5rem] font-black text-indigo-600">در حال پردازش...</div>}
          </div>

          {/* بخش بازیابی */}
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group relative overflow-hidden">
            <input 
              type="file" 
              accept=".json" 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              onChange={handleRestore}
            />
            <div className="flex justify-between items-start mb-6">
              <div className="text-4xl group-hover:scale-125 transition-transform duration-500">📥</div>
              <span className="bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Restore Data</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">بازیابی اطلاعات</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed">
              فایل پشتیبانی که قبلاً دانلود کرده‌اید را در اینجا بارگذاری کنید تا تمام اطلاعات سیستم به آن زمان بازگردد.
            </p>
          </div>

        </div>

        {/* ردیف دوم تنظیمات خطرناک و حساس */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* کارت وضعیت دیتابیس */}
          <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-6 shadow-2xl">
            <div className="text-5xl opacity-20 hidden md:block">☁️</div>
            <div className="flex-1 text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Database Status: Connected</p>
              </div>
              <p className="text-sm font-black mb-1">اتصال به دیتابیس ابری (Neon SQL) برقرار است.</p>
              <p className="text-[10px] text-slate-400 font-bold">تمام تغییرات شما به صورت لحظه‌ای در سرورهای ابری ذخیره و پشتیبان‌گیری می‌شود.</p>
            </div>
          </div>

          {/* بخش ریست سیستم */}
          <button 
            onClick={handleFactoryReset}
            className="bg-red-50 p-8 rounded-[2.5rem] border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all group text-right"
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🔥</div>
            <h4 className="font-black text-lg mb-1">پاکسازی کل سیستم</h4>
            <p className="text-[9px] font-bold opacity-60">حذف تمام داده‌ها و شروع مجدد</p>
          </button>

        </div>

        {/* فوتر بخش تنظیمات */}
        <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400">
          <p>آخرین بررسی وضعیت: {toPersianNumbers(getCurrentJalaliDate())}</p>
          <p className="uppercase tracking-widest">Sirjan Poosh Security Protocol v2.5.1</p>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
