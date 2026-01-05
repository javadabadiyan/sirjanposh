
import React, { useState, useEffect } from 'react';
import { AppData, Partner, PaymentHistory } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, parseRawNumber, toEnglishDigits, formatWithCommas } from '../utils/formatters';

interface PartnersProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const Partners: React.FC<PartnersProps> = ({ data, setData }) => {
  const [monthlyProfit, setMonthlyProfit] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentJalaliDate().substring(0, 7)); // پیش‌فرض ماه جاری: ۱۴۰۴/۱۰
  const [searchTerm, setSearchTerm] = useState('');
  const [isAutoCalculating, setIsAutoCalculating] = useState(true);
  
  // Partner Modal State
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', investment: '' });

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentHistory | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', period: '', description: '' });

  const totalInvestment = data.partners.reduce((acc, p) => acc + p.investment, 0);

  // محاسبه خودکار سود از فاکتورها
  useEffect(() => {
    if (isAutoCalculating) {
      let totalProfit = 0;
      // فاکتورهایی که تاریخشان با دوره انتخاب شده شروع می‌شود
      const periodInvoices = data.invoices.filter(inv => inv.date.startsWith(selectedPeriod));
      
      periodInvoices.forEach(inv => {
        inv.items.forEach(item => {
          const product = data.products.find(p => p.id === item.productId);
          if (product) {
            const unitCost = product.buyPrice + product.shippingCost;
            const unitProfit = item.price - unitCost;
            totalProfit += unitProfit * item.quantity;
          }
        });
      });
      
      setMonthlyProfit(totalProfit.toString());
    }
  }, [selectedPeriod, data.invoices, data.products, isAutoCalculating]);

  const calculateShare = (investment: number) => {
    if (totalInvestment === 0) return 0;
    const profit = parseRawNumber(monthlyProfit);
    return (investment / totalInvestment) * profit;
  };

  const handleNumericChange = (setter: (val: string) => void, value: string) => {
    const cleanValue = toEnglishDigits(value).replace(/[^0-9]/g, '');
    setter(cleanValue);
    if (setter === setMonthlyProfit) setIsAutoCalculating(false); // اگر کاربر دستی تغییر داد، محاسبه خودکار غیرفعال شود
  };

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

  // Fix: Added missing deletePartner function to resolve the error on line 150
  const deletePartner = (id: string) => {
    if (confirm('آیا از حذف این شریک اطمینان دارید؟')) {
      setData({ ...data, partners: data.partners.filter(p => p.id !== id) });
    }
  };

  const handlePayDividends = () => {
    const profit = parseRawNumber(monthlyProfit);
    if (profit <= 0) {
      alert('مبلغ سود قابل تقسیم صفر است.');
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
    alert('سود دوره با موفقیت تقسیم و در تاریخچه ثبت شد.');
  };

  const deletePayment = (id: string) => {
    if (confirm('آیا از حذف این سابقه پرداخت اطمینان دارید؟')) {
      setData({ ...data, payments: data.payments.filter(p => p.id !== id) });
    }
  };

  const filteredPayments = data.payments.filter(p => 
    p.period.includes(searchTerm) || 
    data.partners.find(part => part.id === p.partnerId)?.name.includes(searchTerm)
  ).reverse();

  return (
    <div className="space-y-8 animate-fadeIn pb-24 lg:pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Partners Section */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg md:text-xl font-black text-gray-800 flex items-center gap-3">
              <span className="bg-indigo-100 p-3 rounded-2xl text-xl">🤝</span> لیست شرکا
            </h3>
            <button 
              onClick={() => { setEditingPartner(null); setPartnerForm({ name: '', investment: '' }); setShowPartnerModal(true); }}
              className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-100"
            >
              + افزودن شریک
            </button>
          </div>
          
          <div className="space-y-4">
            {data.partners.map(p => {
              const sharePercent = totalInvestment > 0 ? ((p.investment/totalInvestment)*100).toFixed(1) : "0";
              return (
                <div key={p.id} className="p-5 border border-gray-100 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-black text-lg text-indigo-900">{p.name}</span>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">تاریخ ورود: {toPersianNumbers(p.date)}</p>
                    </div>
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-[10px] font-black">
                      {toPersianNumbers(sharePercent)}٪ سهم
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-bold">سرمایه:</span>
                    <span className="font-black text-indigo-900">{formatCurrency(p.investment)}</span>
                  </div>
                  <div className="pt-4 mt-3 border-t border-gray-200 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingPartner(p); setPartnerForm({ name: p.name, investment: p.investment.toString() }); setShowPartnerModal(true); }} className="text-blue-600 font-black text-xs">ویرایش</button>
                    <button onClick={() => deletePartner(p.id)} className="text-red-500 font-black text-xs">حذف</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profit Distribution Section */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border-2 border-indigo-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg md:text-xl font-black text-indigo-950 flex items-center gap-3">
              <span className="bg-green-100 p-3 rounded-2xl text-xl">📊</span> تقسیم سود هوشمند
            </h3>
            {isAutoCalculating && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black animate-pulse">محاسبه خودکار فعال</span>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 mr-2">انتخاب دوره (ماه/سال)</label>
                <input 
                  placeholder="۱۴۰۴/۱۰"
                  className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-2xl outline-none focus:border-indigo-500 font-black text-center" 
                  value={selectedPeriod} 
                  onChange={e => setSelectedPeriod(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 mr-2">سود خالص کل دوره (تومان)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className={`w-full p-4 border-2 rounded-2xl text-center font-black text-xl outline-none transition-all ${isAutoCalculating ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-800'}`}
                    value={toPersianNumbers(formatWithCommas(monthlyProfit))}
                    onChange={e => handleNumericChange(setMonthlyProfit, e.target.value)}
                  />
                  {!isAutoCalculating && (
                    <button 
                      onClick={() => setIsAutoCalculating(true)} 
                      className="absolute left-2 top-2 p-2 text-xs bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 font-bold"
                      title="بازگشت به محاسبه خودکار"
                    >🔄</button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-dashed border-indigo-200">
              <p className="text-[10px] font-black text-indigo-900 mb-4 opacity-70 uppercase tracking-widest text-center">سهم هر شریک از سود {toPersianNumbers(selectedPeriod)}</p>
              <div className="space-y-3">
                {data.partners.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b last:border-0 border-indigo-100/50">
                    <span className="text-gray-700 font-bold text-sm">{p.name}:</span>
                    <span className="font-black text-green-700">{formatCurrency(calculateShare(p.investment))}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handlePayDividends} className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-indigo-700 shadow-xl transition-all active:scale-95">
              ثبت نهایی و پرداخت سود این دوره
            </button>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h3 className="text-xl font-black text-gray-800">تاریخچه پرداخت‌ها</h3>
          <input 
            type="text" 
            placeholder="🔍 جستجو در تاریخچه..." 
            className="w-full md:w-80 p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 text-indigo-950">
                <th className="p-5 font-black">شریک</th>
                <th className="p-5 text-center font-black">دوره مالی</th>
                <th className="p-5 font-black">مبلغ واریزی</th>
                <th className="p-5 text-center font-black">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map(pay => (
                <tr key={pay.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5 font-black text-indigo-900">{data.partners.find(part => part.id === pay.partnerId)?.name || 'شریک حذف شده'}</td>
                  <td className="p-5 text-center font-bold text-gray-500">{toPersianNumbers(pay.period)}</td>
                  <td className="p-5 font-black text-green-600">{formatCurrency(pay.amount)}</td>
                  <td className="p-5 text-center">
                    <button onClick={() => deletePayment(pay.id)} className="text-red-400 hover:text-red-600 transition p-2">🗑️ حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partner Modal (Shared with previous version but styled better) */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-6 bg-indigo-950 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">{editingPartner ? 'ویرایش شریک' : 'افزودن شریک'}</h3>
              <button onClick={() => setShowPartnerModal(false)} className="text-2xl">&times;</button>
            </div>
            <form onSubmit={savePartner} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2">نام کامل شریک</label>
                <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2">سرمایه اولیه (تومان)</label>
                <input required type="text" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-xl text-indigo-700" value={toPersianNumbers(formatWithCommas(partnerForm.investment))} onChange={e => handleNumericChange((v) => setPartnerForm({...partnerForm, investment: v}), e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all">ذخیره اطلاعات</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
