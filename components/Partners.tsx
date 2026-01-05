
import React, { useState } from 'react';
import { AppData, Partner, PaymentHistory } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate } from '../utils/formatters';

interface PartnersProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const Partners: React.FC<PartnersProps> = ({ data, setData }) => {
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('۱۴۰۴-۰۱');
  const [searchTerm, setSearchTerm] = useState('');

  const totalInvestment = data.partners.reduce((acc, p) => acc + p.investment, 0);

  const calculateShare = (investment: number) => {
    if (totalInvestment === 0) return 0;
    return (investment / totalInvestment) * monthlyProfit;
  };

  const handlePayDividends = () => {
    if (monthlyProfit <= 0) {
      alert('لطفاً مبلغ سود را وارد کنید.');
      return;
    }

    const newPayments: PaymentHistory[] = data.partners.map(p => ({
      id: Date.now().toString() + p.id,
      partnerId: p.id,
      amount: calculateShare(p.investment),
      period: selectedPeriod,
      date: getCurrentJalaliDate(),
      description: `پرداخت سود دوره ${selectedPeriod}`
    }));

    setData({ ...data, payments: [...data.payments, ...newPayments] });
    setMonthlyProfit(0);
    alert('سود با موفقیت تقسیم و ثبت شد.');
  };

  const deletePayment = (id: string) => {
    if (confirm('آیا از حذف این سابقه اطمینان دارید؟')) {
      setData({ ...data, payments: data.payments.filter(p => p.id !== id) });
    }
  };

  const filteredPayments = data.payments.filter(p => 
    p.period.includes(searchTerm) || 
    data.partners.find(part => part.id === p.partnerId)?.name.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-8 text-gray-800 flex items-center gap-2">
            <span className="bg-indigo-100 p-2 rounded-xl">🤝</span> لیست شرکا و سرمایه
          </h3>
          <div className="space-y-4">
            {data.partners.map(p => {
              const sharePercent = ((p.investment/totalInvestment)*100).toFixed(1);
              return (
                <div key={p.id} className="p-6 border border-gray-100 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-lg">{p.name}</span>
                    <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold">{toPersianNumbers(sharePercent)}٪ سهم</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">میزان سرمایه:</span>
                    <span className="font-bold text-indigo-900">{formatCurrency(p.investment)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-left">{toPersianNumbers(p.date)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-indigo-100">
          <h3 className="text-xl font-bold mb-8 text-indigo-900">حسابداری و تقسیم سود ماهانه</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-500 mb-2">مبلغ سود خالص دوره (تومان)</label>
              <input 
                type="number" 
                className="w-full p-4 border rounded-2xl text-2xl font-black text-center text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100 transition"
                value={monthlyProfit}
                onChange={e => setMonthlyProfit(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-2">دوره پرداخت (ماه/سال)</label>
              <input className="w-full p-4 border rounded-2xl outline-none" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} />
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-indigo-200">
              <p className="text-sm font-bold text-indigo-800 mb-4">پیش‌نمایش تقسیم بر اساس سرمایه:</p>
              {data.partners.map(p => (
                <div key={p.id} className="flex justify-between py-2 border-b last:border-0 border-gray-200">
                  <span className="text-gray-600">{p.name}:</span>
                  <span className="font-black text-green-700">{formatCurrency(calculateShare(p.investment))}</span>
                </div>
              ))}
            </div>

            <button onClick={handlePayDividends} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
              تایید و ثبت نهایی تقسیم سود
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h3 className="text-xl font-bold">تاریخچه پرداخت سودها</h3>
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="جستجو در تاریخچه..." 
              className="w-full p-3 border rounded-xl outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-indigo-900 bg-indigo-50 border-b">
                <th className="p-4 rounded-tr-xl">شریک</th>
                <th className="p-4">دوره</th>
                <th className="p-4">مبلغ پرداختی</th>
                <th className="p-4">تاریخ ثبت</th>
                <th className="p-4 rounded-tl-xl text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(pay => (
                <tr key={pay.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-bold">{data.partners.find(part => part.id === pay.partnerId)?.name}</td>
                  <td className="p-4">{toPersianNumbers(pay.period)}</td>
                  <td className="p-4 font-black text-green-600">{formatCurrency(pay.amount)}</td>
                  <td className="p-4 text-gray-500">{toPersianNumbers(pay.date)}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => deletePayment(pay.id)} className="text-red-500 hover:scale-110 transition">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Partners;
