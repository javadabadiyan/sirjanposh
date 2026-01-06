
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
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="text-[9px] font-black text-slate-500 uppercase mr-1.5 mb-1 block">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl outline-none hover:border-indigo-300 transition-all font-black text-center cursor-pointer flex items-center justify-between shadow-sm min-h-[48px]"
      >
        <span className={`text-${accentColor}-600 text-xs`}>{toPersianNumbers(value)}</span>
        <span className="opacity-30 text-sm">📅</span>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 md:right-auto md:left-0 mt-1.5 w-52 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 z-[9999] p-3 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <button type="button" onClick={() => changeMonth(1)} className="w-6 h-6 flex items-center justify-center bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-[10px] font-bold">{'<'}</button>
            <div className="text-center">
              <p className="font-black text-slate-800 text-[11px] leading-tight">{JALALI_MONTH_NAMES[viewDate.month - 1]}</p>
              <p className="text-[8px] font-bold text-slate-400">{toPersianNumbers(viewDate.year)}</p>
            </div>
            <button type="button" onClick={() => changeMonth(-1)} className="w-6 h-6 flex items-center justify-center bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-[10px] font-bold">{'>'}</button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1.5 border-b border-slate-50 pb-1">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(w => (
              <div key={w} className="text-center text-[7px] font-black text-slate-300">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map(d => {
              const currentValParts = toEnglishDigits(value).split('/');
              const isSelected = parseInt(currentValParts[0]) === viewDate.year && 
                                parseInt(currentValParts[1]) === viewDate.month && 
                                parseInt(currentValParts[2]) === d;
                                
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                    isSelected 
                    ? `bg-${accentColor}-600 text-white shadow-sm` 
                    : 'hover:bg-slate-50 text-slate-600'
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
            className={`w-full mt-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg font-black text-[8px] hover:bg-${accentColor}-600 hover:text-white transition-all`}
          >
            انتخاب امروز
          </button>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
