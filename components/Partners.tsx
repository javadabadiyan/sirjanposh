
import React, { useState, useEffect } from 'react';
import { AppData, Partner, PaymentHistory, InvestmentRecord } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, parseRawNumber, toEnglishDigits, formatWithCommas } from '../utils/formatters';

interface PartnersProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const Partners: React.FC<PartnersProps> = ({ data, setData }) => {
  const [monthlyProfit, setMonthlyProfit] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentJalaliDate().substring(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [isAutoCalculating, setIsAutoCalculating] = useState(true);
  
  // Partner Modal State
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', initialAmount: '', initialDate: getCurrentJalaliDate() });

  // Add Investment Modal State
  const [showInvestmentModal, setShowInvestmentModal] = useState<Partner | null>(null);
  const [invForm, setInvForm] = useState({ amount: '', date: getCurrentJalaliDate() });

  const getPartnerTotalInvestment = (partner: Partner) => {
    return partner.investments.reduce((sum, inv) => sum + inv.amount, 0);
  };

  const totalInvestment = data.partners.reduce((acc, p) => acc + getPartnerTotalInvestment(p), 0);

  useEffect(() => {
    if (isAutoCalculating) {
      let totalProfit = 0;
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

  const calculateShare = (partnerInvestment: number) => {
    if (totalInvestment === 0) return 0;
    const profit = parseRawNumber(monthlyProfit);
    return (partnerInvestment / totalInvestment) * profit;
  };

  const handleNumericChange = (setter: (val: string) => void, value: string) => {
    const cleanValue = toEnglishDigits(value).replace(/[^0-9]/g, '');
    setter(cleanValue);
    if (setter === setMonthlyProfit) setIsAutoCalculating(false);
  };

  const savePartner = (e: React.FormEvent) => {
    e.preventDefault();
    const newPartner: Partner = {
      id: editingPartner ? editingPartner.id : Date.now().toString(),
      name: partnerForm.name,
      investments: editingPartner ? editingPartner.investments : [{
        id: Date.now().toString(),
        amount: parseRawNumber(partnerForm.initialAmount),
        date: partnerForm.initialDate
      }],
      date: editingPartner ? editingPartner.date : partnerForm.initialDate
    };

    if (editingPartner) {
      setData({ ...data, partners: data.partners.map(p => p.id === editingPartner.id ? newPartner : p) });
    } else {
      setData({ ...data, partners: [...data.partners, newPartner] });
    }
    setShowPartnerModal(false);
    setEditingPartner(null);
    setPartnerForm({ name: '', initialAmount: '', initialDate: getCurrentJalaliDate() });
  };

  const addInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInvestmentModal) return;

    const newRecord: InvestmentRecord = {
      id: Date.now().toString(),
      amount: parseRawNumber(invForm.amount),
      date: invForm.date
    };

    const updatedPartners = data.partners.map(p => {
      if (p.id === showInvestmentModal.id) {
        return { ...p, investments: [...p.investments, newRecord] };
      }
      return p;
    });

    setData({ ...data, partners: updatedPartners });
    setShowInvestmentModal(null);
    setInvForm({ amount: '', date: getCurrentJalaliDate() });
  };

  const deletePartner = (id: string) => {
    if (confirm('آیا از حذف این شریک و تمامی سوابق سرمایه او اطمینان دارید؟')) {
      setData({ ...data, partners: data.partners.filter(p => p.id !== id) });
    }
  };

  const removeInvestment = (partnerId: string, invId: string) => {
    if (confirm('آیا از حذف این واریزی اطمینان دارید؟')) {
      const updatedPartners = data.partners.map(p => {
        if (p.id === partnerId) {
          if (p.investments.length <= 1) {
            alert('حداقل یک واریزی برای شریک باید باقی بماند.');
            return p;
          }
          return { ...p, investments: p.investments.filter(i => i.id !== invId) };
        }
        return p;
      });
      setData({ ...data, partners: updatedPartners });
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
      amount: calculateShare(getPartnerTotalInvestment(p)),
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
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg md:text-xl font-black text-gray-800 flex items-center gap-3">
              <span className="bg-indigo-100 p-3 rounded-2xl text-xl">🤝</span> لیست شرکا و سرمایه
            </h3>
            <button 
              onClick={() => { setEditingPartner(null); setPartnerForm({ name: '', initialAmount: '', initialDate: getCurrentJalaliDate() }); setShowPartnerModal(true); }}
              className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-100"
            >
              + شریک جدید
            </button>
          </div>
          
          <div className="space-y-6 overflow-y-auto flex-1 max-h-[600px] custom-scrollbar pr-2">
            {data.partners.map(p => {
              const currentTotal = getPartnerTotalInvestment(p);
              const sharePercent = totalInvestment > 0 ? ((currentTotal / totalInvestment) * 100).toFixed(1) : "0";
              return (
                <div key={p.id} className="p-6 border border-gray-100 rounded-[2rem] bg-gray-50 hover:bg-white hover:shadow-xl transition-all group border-r-8 border-r-indigo-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-black text-xl text-indigo-900">{p.name}</span>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">ثبت اولیه: {toPersianNumbers(p.date)}</p>
                    </div>
                    <div className="text-left">
                      <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-black">
                        {toPersianNumbers(sharePercent)}٪ سهم کل
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 bg-white p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 mb-2 border-b pb-1">تاریخچه واریزی‌ها:</p>
                    {p.investments.map((inv, idx) => (
                      <div key={inv.id} className="flex justify-between items-center text-xs group/inv">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center text-[8px] font-black">{toPersianNumbers(idx+1)}</span>
                          <span className="text-gray-400 font-bold">{toPersianNumbers(inv.date)}:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-indigo-900">{formatCurrency(inv.amount)}</span>
                          <button onClick={() => removeInvestment(p.id, inv.id)} className="text-red-300 hover:text-red-600 opacity-0 group-hover/inv:opacity-100 transition-opacity">×</button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t flex justify-between items-center">
                      <span className="text-xs font-black text-gray-500">مجموع سرمایه فعلی:</span>
                      <span className="font-black text-indigo-950 text-lg">{formatCurrency(currentTotal)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setInvForm({amount: '', date: getCurrentJalaliDate()}); setShowInvestmentModal(p); }} 
                      className="flex-1 bg-green-50 text-green-700 py-3 rounded-xl text-xs font-black hover:bg-green-600 hover:text-white transition shadow-sm"
                    >
                      + واریز جدید
                    </button>
                    <button 
                      onClick={() => { setEditingPartner(p); setPartnerForm({ name: p.name, initialAmount: '', initialDate: p.date }); setShowPartnerModal(true); }} 
                      className="px-4 bg-gray-100 text-gray-500 py-3 rounded-xl text-xs font-black hover:bg-indigo-900 hover:text-white transition"
                    >
                      ویرایش نام
                    </button>
                    <button 
                      onClick={() => deletePartner(p.id)} 
                      className="px-4 bg-red-50 text-red-500 py-3 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition"
                    >
                      حذف
                    </button>
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
                    <span className="font-black text-green-700">{formatCurrency(calculateShare(getPartnerTotalInvestment(p)))}</span>
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
                    <button onClick={() => deletePayment(pay.id)} className="text-red-400 hover:text-red-600 transition p-2 font-black text-xs">🗑️ حذف سابقه</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-6 bg-indigo-950 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">{editingPartner ? 'ویرایش نام شریک' : 'ثبت شریک جدید'}</h3>
              <button onClick={() => setShowPartnerModal(false)} className="text-2xl hover:rotate-90 transition">&times;</button>
            </div>
            <form onSubmit={savePartner} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2">نام کامل شریک</label>
                <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} />
              </div>
              {!editingPartner && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">مبلغ اولین سرمایه‌گذاری (تومان)</label>
                    <input required type="text" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-xl text-indigo-700" value={toPersianNumbers(formatWithCommas(partnerForm.initialAmount))} onChange={e => handleNumericChange((v) => setPartnerForm({...partnerForm, initialAmount: v}), e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">تاریخ ثبت و اولین واریز</label>
                    <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-center" value={partnerForm.initialDate} onChange={e => setPartnerForm({...partnerForm, initialDate: e.target.value})} />
                  </div>
                </>
              )}
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                {editingPartner ? 'بروزرسانی نام' : 'تایید و ایجاد پرونده شریک'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Investment Modal */}
      {showInvestmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn border-t-8 border-green-500">
            <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-indigo-950">افزودن سرمایه جدید</h3>
                <p className="text-[10px] font-bold text-gray-400">برای شریک: {showInvestmentModal.name}</p>
              </div>
              <button onClick={() => setShowInvestmentModal(null)} className="text-2xl text-gray-400 hover:text-red-500 transition">&times;</button>
            </div>
            <form onSubmit={addInvestment} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2">مبلغ واریز جدید (تومان)</label>
                <input required type="text" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-500 font-black text-2xl text-green-700 shadow-inner" value={toPersianNumbers(formatWithCommas(invForm.amount))} onChange={e => handleNumericChange((v) => setInvForm({...invForm, amount: v}), e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2">تاریخ واریز</label>
                <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-500 font-bold text-center" value={invForm.date} onChange={e => setInvForm({...invForm, date: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-[1.5rem] font-black text-xl hover:bg-green-700 transition-all shadow-xl shadow-green-100 active:scale-95">
                تایید و ثبت واریزی
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
