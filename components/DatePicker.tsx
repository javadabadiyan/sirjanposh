
import React, { useState, useEffect, useRef } from 'react';
import { toPersianNumbers, toEnglishDigits, getCurrentJalaliDate, getJalaliMonthDays, JALALI_MONTH_NAMES } from '../utils/formatters';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  accentColor?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label, className, accentColor = 'indigo' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState({ year: 1403, month: 1, day: 1 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parts = toEnglishDigits(value || getCurrentJalaliDate()).split('/');
    if (parts.length === 3) {
      setViewDate({
        year: parseInt(parts[0]),
        month: parseInt(parts[1]),
        day: parseInt(parts[2])
      });
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDay = (day: number) => {
    const formatted = `${viewDate.year}/${String(viewDate.month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    onChange(toPersianNumbers(formatted));
    setIsOpen(false);
  };

  const changeMonth = (delta: number) => {
    let newMonth = viewDate.month + delta;
    let newYear = viewDate.year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setViewDate({ ...viewDate, month: newMonth, year: newYear });
  };

  const daysInMonth = getJalaliMonthDays(viewDate.year, viewDate.month);
  
  // شبیه‌سازی شروع هفته (محاسبه تقریبی برای نمایش زیبا)
  // در یک سیستم واقعی باید تبدیل تاریخ میلادی به شمسی دقیق انجام شود
  // برای سادگی اینجا فقط روزها را رندر می‌کنیم
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="text-[10px] font-black text-slate-500 uppercase mr-2 mb-1 block">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-center cursor-pointer flex items-center justify-between shadow-sm"
      >
        <span className={`text-${accentColor}-600`}>{toPersianNumbers(value)}</span>
        <span className="opacity-30">📅</span>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-[3000] p-5 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <button type="button" onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">{'<'}</button>
            <div className="text-center">
              <p className="font-black text-slate-800 text-sm">{JALALI_MONTH_NAMES[viewDate.month - 1]}</p>
              <p className="text-[10px] font-bold text-slate-400">{toPersianNumbers(viewDate.year)}</p>
            </div>
            <button type="button" onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">{'>'}</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(w => (
              <div key={w} className="text-center text-[9px] font-black text-slate-300 py-1">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map(d => {
              const isSelected = viewDate.day === d && value.includes(toPersianNumbers(String(viewDate.month).padStart(2, '0')));
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isSelected 
                    ? `bg-${accentColor}-600 text-white shadow-lg scale-110` 
                    : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {toPersianNumbers(d)}
                </button>
              );
            })}
          </div>

          <button 
            type="button"
            onClick={() => { onChange(getCurrentJalaliDate()); setIsOpen(false); }}
            className={`w-full mt-6 py-2.5 bg-slate-50 text-slate-500 rounded-xl font-black text-[10px] hover:bg-${accentColor}-600 hover:text-white transition-all`}
          >
            انتخاب امروز
          </button>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
