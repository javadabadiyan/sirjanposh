
export const toPersianNumbers = (str: string | number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, (w) => persianDigits[parseInt(w)]);
};

export const toEnglishDigits = (str: string | number): string => {
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /٦/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i));
  }
  return res;
};

export const formatWithCommas = (val: string | number): string => {
  if (val === undefined || val === null) return '';
  const num = String(val).replace(/[^0-9]/g, '');
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
  return Number(engStr.replace(/[^0-9,]/g, '').replace(/,/g, '')) || 0;
};
