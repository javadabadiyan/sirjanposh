
export const toPersianNumbers = (str: string | number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, (w) => persianDigits[parseInt(w)]);
};

export const toEnglishDigits = (str: string | number): string => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776)) // تبدیل اعداد فارسی (۰-۹)
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632)); // تبدیل اعداد عربی (٠-٩)
};

export const formatWithCommas = (val: string | number): string => {
  if (val === undefined || val === null) return '';
  // ابتدا به انگلیسی تبدیل می‌کنیم تا مطمئن شویم فقط اعداد 0-9 باقی می‌مانند
  const num = toEnglishDigits(val).replace(/[^0-9]/g, '');
  if (!num) return '';
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatCurrency = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-US').format(amount);
  return toPersianNumbers(formatted) + ' تومان';
};

export const getCurrentJalaliDate = (): string => {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    calendar: 'persian'
  };
  const parts = new Intl.DateTimeFormat('fa-IR', options).formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return toPersianNumbers(`${year}/${month}/${day}`);
};

export const parseRawNumber = (str: string | number): number => {
  if (typeof str === 'number') return str;
  const engStr = toEnglishDigits(str);
  return Number(engStr.replace(/[^0-9]/g, '')) || 0;
};

export const getJalaliMonthDays = (year: number, month: number): number => {
  const m = parseInt(toEnglishDigits(month));
  const y = parseInt(toEnglishDigits(year));
  if (m <= 6) return 31;
  if (m <= 11) return 30;
  const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(y % 33);
  return isLeap ? 30 : 29;
};

export const JALALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];
