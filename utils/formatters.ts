
export const toPersianNumbers = (str: string | number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, (w) => persianDigits[parseInt(w)]);
};

export const formatCurrency = (amount: number): string => {
  const formatted = new Intl.NumberFormat('fa-IR').format(amount);
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
  return `${year}/${month}/${day}`;
};
