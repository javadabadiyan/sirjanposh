
import React, { useState } from 'react';
import { AppData, Partner, PaymentHistory } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, parseRawNumber, toEnglishDigits, formatWithCommas } from '../utils/formatters';

interface PartnersProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const Partners: React.FC<PartnersProps> = ({ data, setData }) => {
  const [monthlyProfit, setMonthlyProfit] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState('۱۴۰۴/۰۱');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Partner Modal State
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', investment: '' });

  // Payment Modal State (for editing past payments)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentHistory | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', period: '', description: '' });

  const totalInvestment = data.partners.reduce((acc, p) => acc + p.investment, 0);

  const calculateShare = (investment: number) => {
    if (totalInvestment === 0) return 0;
    const profit = parseRawNumber(monthlyProfit);
    return (investment / totalInvestment) * profit;
  };

  // --- Helper for Numeric Inputs ---
  const handleNumericChange = (setter: (val: string) => void, value: string) => {
    const cleanValue = toEnglishDigits(value).replace(/[^0-9]/g, '');
    setter(cleanValue);
  };

  // --- Partner Actions ---
  const savePartner = (e: React.FormEvent) => {
    e.preventDefault();
    const newPartner: Partner = {
      id: editingPartner ? editingPartner.id : Date.now().toString(),
      name: partnerForm.name,
      investment: parseRawNumber(partnerForm.investment),
      date: editingPartner ? editingPartner.date : getCurrentJalaliDate()
    };

    if (editingPartner) {
      setData({ ...data, partners: data.partners.map(p => p.id === editingPartner.id ? newPartner : p) });
    } else {
      setData({ ...data, partners: [...data.partners, newPartner] });
    }
    setShowPartnerModal(false);
    setEditingPartner(null);
    setPartnerForm({ name: '', investment: '' });
  };

  const deletePartner = (id: string) => {
    if (confirm('آیا از حذف این شریک اطمینان دارید؟')) {
      setData({ ...data, partners: data.partners.filter(p => p.id !== id) });
    }
  };

  // --- Payment Actions ---
  const handlePayDividends = () => {
    const profit = parseRawNumber(monthlyProfit);
    if (profit <= 0) {
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
    setMonthlyProfit('');
    alert('سود با موفقیت تقسیم و ثبت شد.');
  };

  const savePaymentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    const updatedPayment: PaymentHistory = {
      ...editingPayment,
      amount: parseRawNumber(paymentForm.amount),
      period: paymentForm.period,
      description: paymentForm.description
    };

    setData({
      ...data,
      payments: data.payments.map(p => p.id === editingPayment.id ? updatedPayment : p)
    });
    setShowPaymentModal(false);
    setEditingPayment(null);
  };

  const deletePayment = (id: string) => {
    if (confirm('آیا از حذف این سابقه اطمینان دارید؟')) {
      setData({ ...data, payments: data.payments.filter(p => p.id !== id) });
    }
  };

  const filteredPayments = data.payments.filter(p => 
    p.period.includes(searchTerm) || 
    data.partners.find(part => part.id === p.partnerId)?.name.includes(searchTerm)
  ).reverse();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Partners Section */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
              <span className="bg-indigo-100 p-3 rounded-2xl text-2xl">🤝</span> لیست شرکا و سرمایه
            </h3>
            <button 
              onClick={() => { setEditingPartner(null); setPartnerForm({ name: '', investment: '' }); setShowPartnerModal(true); }}
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-100"
            >
              + افزودن شریک
            </button>
          </div>
          
          <div className="space-y-4">
            {data.partners.map(p => {
              const sharePercent = totalInvestment > 0 ? ((p.investment/totalInvestment)*100).toFixed(1) : "0";
              return (
                <div key={p.id} className="p-6 border border-gray-100 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-black text-xl text-indigo-900 block">{p.name}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 block">تاریخ ورود: {toPersianNumbers(p.date)}</span>
                    </div>
                    <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-2xl text-xs font-black shadow-lg shadow-indigo-100">
                      {toPersianNumbers(sharePercent)}٪ سهم
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-4">
                    <span className="text-gray-500 font-bold">میزان سرمایه:</span>
                    <span className="font-black text-indigo-900 text-lg">{formatCurrency(p.investment)}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingPartner(p); setPartnerForm({ name: p.name, investment: p.investment.toString() }); setShowPartnerModal(true); }}
                      className="text-blue-600 font-black text-xs hover:underline"
                    >ویرایش</button>
                    <button 
                      onClick={() => deletePartner(p.id)}
                      className="text-red-500 font-black text-xs hover:underline"
                    >حذف</button>
                  </div>
                </div>
              );
            })}
            {data.partners.length === 0 && (
              <div className="text-center py-10 text-gray-400 font-bold border-2 border-dashed rounded-3xl">هیچ شریکی ثبت نشده است</div>
            )}
          </div>
        </div>

        {/* Profit Distribution Section */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-indigo-100">
          <h3 className="text-xl font-black mb-8 text-indigo-950 flex items-center gap-3">
            <span className="bg-green-100 p-3 rounded-2xl text-2xl">📊</span> حسابداری و تقسیم سود
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2 mr-2">مبلغ سود خالص دوره (تومان)</label>
              <input 
                type="text" 
                placeholder="مبلغ را وارد کنید..."
                className="w-full p-5 border-2 border-gray-100 bg-gray-50 rounded-[2rem] text-3xl font-black text-center text-indigo-600 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                value={toPersianNumbers(formatWithCommas(monthlyProfit))}
                onChange={e => handleNumericChange(setMonthlyProfit, e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2 mr-2">دوره پرداخت (مثلاً: ۱۴۰۴/۰۲)</label>
              <input 
                className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold" 
                value={selectedPeriod} 
                onChange={e => setSelectedPeriod(e.target.value)} 
              />
            </div>

            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-dashed border-indigo-200">
              <p className="text-xs font-black text-indigo-900 mb-4 opacity-70">پیش‌نمایش تقسیم سود بر اساس سهم فعلی:</p>
              <div className="space-y-3">
                {data.partners.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b last:border-0 border-indigo-100/50">
                    <span className="text-gray-700 font-bold">{p.name}:</span>
                    <span className="font-black text-green-700 text-lg">{formatCurrency(calculateShare(p.investment))}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handlePayDividends} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.97]">
              تایید و ثبت نهایی تقسیم سود
            </button>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h3 className="text-xl font-black text-gray-800">تاریخچه پرداخت سودها</h3>
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="جستجو در تاریخچه (نام شریک یا دوره)..." 
              className="w-full p-4 border-2 border-gray-50 bg-gray-50 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all pr-12 font-bold"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <span className="absolute right-4 top-4 opacity-30">🔍</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-indigo-950 bg-indigo-50/50">
                <th className="p-5 rounded-tr-[1.5rem] font-black">شریک</th>
                <th className="p-5 font-black text-center">دوره</th>
                <th className="p-5 font-black">مبلغ پرداختی</th>
                <th className="p-5 font-black">تاریخ ثبت</th>
                <th className="p-5 rounded-tl-[1.5rem] text-center font-black">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.map(pay => (
                <tr key={pay.id} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="p-5 font-black text-indigo-900">{data.partners.find(part => part.id === pay.partnerId)?.name || 'شریک حذف شده'}</td>
                  <td className="p-5 text-center font-bold text-gray-600">{toPersianNumbers(pay.period)}</td>
                  <td className="p-5 font-black text-green-600">{formatCurrency(pay.amount)}</td>
                  <td className="p-5 text-gray-400 text-xs font-bold">{toPersianNumbers(pay.date)}</td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingPayment(pay);
                          setPaymentForm({ amount: pay.amount.toString(), period: pay.period, description: pay.description || '' });
                          setShowPaymentModal(true);
                        }}
                        className="text-blue-600 hover:scale-110 transition p-2 bg-blue-50 rounded-lg"
                        title="ویرایش"
                      >📝</button>
                      <button 
                        onClick={() => deletePayment(pay.id)} 
                        className="text-red-500 hover:scale-110 transition p-2 bg-red-50 rounded-lg"
                        title="حذف"
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-bold">موردی یافت نشد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partner Add/Edit Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-8 bg-indigo-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">{editingPartner ? 'ویرایش اطلاعات شریک' : 'افزودن شریک جدید'}</h3>
                <p className="text-xs text-indigo-300 mt-1">مشخصات و سرمایه اولیه را وارد کنید</p>
              </div>
              <button onClick={() => setShowPartnerModal(false)} className="text-3xl hover:rotate-90 transition">&times;</button>
            </div>
            <form onSubmit={savePartner} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2">نام و نام خانوادگی شریک</label>
                <input 
                  required 
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 transition font-bold" 
                  value={partnerForm.name} 
                  onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2">میزان سرمایه‌گذاری (تومان)</label>
                <input 
                  required 
                  type="text"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 transition font-black text-xl text-indigo-700" 
                  value={toPersianNumbers(formatWithCommas(partnerForm.investment))} 
                  onChange={e => handleNumericChange((v) => setPartnerForm({...partnerForm, investment: v}), e.target.value)} 
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl transition-all">
                {editingPartner ? 'اعمال تغییرات' : 'ثبت شریک جدید'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Edit Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-8 bg-green-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">ویرایش سابقه پرداخت</h3>
                <p className="text-xs text-green-200 mt-1">تغییر جزئیات سود پرداخت شده در گذشته</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-3xl hover:rotate-90 transition">&times;</button>
            </div>
            <form onSubmit={savePaymentEdit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2">مبلغ پرداختی (تومان)</label>
                <input 
                  required 
                  type="text"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-600 transition font-black text-xl text-green-700" 
                  value={toPersianNumbers(formatWithCommas(paymentForm.amount))} 
                  onChange={e => handleNumericChange((v) => setPaymentForm({...paymentForm, amount: v}), e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2">دوره مالی</label>
                <input 
                  required 
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-600 transition font-bold" 
                  value={paymentForm.period} 
                  onChange={e => setPaymentForm({...paymentForm, period: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2">توضیحات</label>
                <textarea 
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-600 transition font-bold text-sm" 
                  rows={2}
                  value={paymentForm.description} 
                  onChange={e => setPaymentForm({...paymentForm, description: e.target.value})} 
                />
              </div>
              <button type="submit" className="w-full bg-green-700 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-800 shadow-xl transition-all">
                بروزرسانی سابقه
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
