
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
  const [partnerSearch, setPartnerSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [isAutoCalculating, setIsAutoCalculating] = useState(true);
  
  // States for Modals
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', initialAmount: '', initialDate: getCurrentJalaliDate() });

  const [showInvestmentModal, setShowInvestmentModal] = useState<Partner | null>(null);
  const [invForm, setInvForm] = useState({ amount: '', date: getCurrentJalaliDate() });

  const [showPaymentEditModal, setShowPaymentEditModal] = useState<PaymentHistory | null>(null);
  const [paymentEditForm, setPaymentEditForm] = useState({ amount: '', period: '', date: '' });

  const getPartnerTotalInvestment = (partner: Partner) => partner.investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalInvestment = data.partners.reduce((acc, p) => acc + getPartnerTotalInvestment(p), 0);

  useEffect(() => {
    if (isAutoCalculating) {
      let totalProfit = 0;
      data.invoices.filter(inv => inv.date.startsWith(selectedPeriod)).forEach(inv => {
        inv.items.forEach(item => {
          const product = data.products.find(p => p.id === item.productId);
          if (product) {
            totalProfit += (item.price - (product.buyPrice + product.shippingCost)) * item.quantity;
          }
        });
      });
      setMonthlyProfit(totalProfit.toString());
    }
  }, [selectedPeriod, data.invoices, data.products, isAutoCalculating]);

  const calculateShare = (partnerInvestment: number) => {
    if (totalInvestment === 0) return 0;
    return (partnerInvestment / totalInvestment) * parseRawNumber(monthlyProfit);
  };

  const handlePayDividends = () => {
    const profit = parseRawNumber(monthlyProfit);
    if (profit <= 0) return alert('سود دوره جاری صفر یا منفی است.');

    const newPayments: PaymentHistory[] = data.partners.map(p => ({
      id: Date.now().toString() + p.id,
      partnerId: p.id,
      amount: calculateShare(getPartnerTotalInvestment(p)),
      period: selectedPeriod,
      date: getCurrentJalaliDate(),
      description: `تسویه سود دوره ${selectedPeriod}`
    }));

    setData({ ...data, payments: [...data.payments, ...newPayments] });
    alert('سود دوره با موفقیت در تاریخچه ثبت شد.');
  };

  const savePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name) return alert('نام شریک الزامی است');

    const pData: Partner = {
      id: editingPartner ? editingPartner.id : Date.now().toString(),
      name: partnerForm.name,
      investments: editingPartner 
        ? editingPartner.investments 
        : [{ id: Date.now().toString(), amount: parseRawNumber(partnerForm.initialAmount), date: partnerForm.initialDate }],
      date: editingPartner ? editingPartner.date : partnerForm.initialDate
    };

    const updatedPartners = editingPartner 
      ? data.partners.map(p => p.id === pData.id ? pData : p) 
      : [...data.partners, pData];

    setData({ ...data, partners: updatedPartners });
    setShowPartnerModal(false);
    setEditingPartner(null);
  };

  const saveInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInvestmentModal) return;

    const newInv: InvestmentRecord = {
      id: Date.now().toString(),
      amount: parseRawNumber(invForm.amount),
      date: invForm.date
    };

    const updatedPartners = data.partners.map(p => {
      if (p.id === showInvestmentModal.id) {
        return { ...p, investments: [...p.investments, newInv] };
      }
      return p;
    });

    setData({ ...data, partners: updatedPartners });
    setShowInvestmentModal(null);
  };

  const savePaymentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentEditModal) return;

    const updatedPayments = data.payments.map(p => {
      if (p.id === showPaymentEditModal.id) {
        return {
          ...p,
          amount: parseRawNumber(paymentEditForm.amount),
          period: paymentEditForm.period,
          date: paymentEditForm.date
        };
      }
      return p;
    });

    setData({ ...data, payments: updatedPayments });
    setShowPaymentEditModal(null);
  };

  const handleNumericChange = (setter: any, field: string, value: string) => {
    const clean = toEnglishDigits(value).replace(/[^0-9]/g, '');
    setter((prev: any) => ({ ...prev, [field]: clean }));
  };

  const filteredPartners = data.partners.filter(p => p.name.includes(partnerSearch));
  const filteredHistory = data.payments.filter(p => 
    p.period.includes(historySearch) || 
    data.partners.find(part => part.id === p.partnerId)?.name.includes(historySearch)
  ).reverse();

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* لیست شرکا */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col h-[700px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">🤝 مدیریت شرکا</h3>
            <button onClick={() => { 
              setEditingPartner(null); 
              setPartnerForm({name:'', initialAmount:'', initialDate: getCurrentJalaliDate()}); 
              setShowPartnerModal(true); 
            }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all">+ شریک جدید</button>
          </div>
          <div className="relative mb-6">
            <input placeholder="🔍 جستجوی شریک..." className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm shadow-inner pr-12" value={partnerSearch} onChange={e => setPartnerSearch(e.target.value)} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {filteredPartners.map(p => (
              <div key={p.id} className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-300 transition-all group">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-black text-slate-800">{p.name}</span>
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black">
                    {toPersianNumbers(((getPartnerTotalInvestment(p)/totalInvestment)*100).toFixed(1))}٪ سهم
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-6 bg-white/50 p-3 rounded-xl">
                  <span>کل سرمایه: {formatCurrency(getPartnerTotalInvestment(p))}</span>
                  <span>عضویت: {toPersianNumbers(p.date)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      setInvForm({amount: '', date: getCurrentJalaliDate()}); 
                      setShowInvestmentModal(p); 
                    }} 
                    className="bg-emerald-50 text-emerald-600 py-3 rounded-xl font-black text-[9px] shadow-sm hover:bg-emerald-600 hover:text-white transition-all"
                  >+ واریز سرمایه</button>
                  <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      setEditingPartner(p); 
                      setPartnerForm({name: p.name, initialAmount: '', initialDate: p.date}); 
                      setShowPartnerModal(true); 
                    }} 
                    className="bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-[9px] shadow-sm hover:bg-blue-600 hover:text-white transition-all"
                  >ویرایش نام</button>
                  <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      if(confirm('با حذف شریک تمامی سوابق واریزی و سهم وی حذف می‌شود. مطمئن هستید؟')) setData({...data, partners: data.partners.filter(i=>i.id!==p.id)}) 
                    }} 
                    className="bg-red-50 text-red-500 py-3 rounded-xl font-black text-[9px] hover:bg-red-600 hover:text-white transition-all"
                  >حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* تقسیم سود */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border-2 border-indigo-100 h-fit">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-indigo-950">💎 تقسیم سود دوره</h3>
            <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black">پشتیبانی از سود مرکب</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2">انتخاب ماه/سال</label>
              <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center outline-none focus:border-indigo-500" value={selectedPeriod} onChange={e=>setSelectedPeriod(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2">سود خالص (تومان)</label>
              <input className="w-full p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl font-black text-center text-indigo-700 text-lg outline-none focus:border-indigo-500" value={toPersianNumbers(formatWithCommas(monthlyProfit))} onChange={e=>{setMonthlyProfit(toEnglishDigits(e.target.value).replace(/,/g,'')); setIsAutoCalculating(false);}} />
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-4 shadow-2xl">
            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest text-center">پیش‌نمایش تقسیم سود بر اساس سرمایه لحظه‌ای</p>
            {data.partners.map(p => (
              <div key={p.id} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0">
                <span className="font-bold text-sm">{p.name} <span className="text-[9px] opacity-40">({toPersianNumbers(getCurrentJalaliDate())})</span></span>
                <span className="font-black text-emerald-400 text-lg">{formatCurrency(calculateShare(getPartnerTotalInvestment(p)))}</span>
              </div>
            ))}
            <button onClick={handlePayDividends} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 mt-4">تسویه و ثبت در تاریخچه</button>
          </div>
        </div>
      </div>

      {/* تاریخچه پرداخت‌ها */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h3 className="text-xl font-black text-slate-800">📜 تاریخچه پرداخت‌ها (دوره‌های گذشته)</h3>
          <div className="relative w-full md:w-80">
            <input placeholder="🔍 جستجوی دوره یا نام شریک..." className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm shadow-inner" value={historySearch} onChange={e=>setHistorySearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[11px] font-black uppercase">
                <th className="p-5">نام شریک</th>
                <th className="p-5 text-center">دوره</th>
                <th className="p-5">مبلغ واریز شده</th>
                <th className="p-5 text-center">تاریخ ثبت</th>
                <th className="p-5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.map(pay => (
                <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5 font-black text-slate-800">{data.partners.find(p=>p.id===pay.partnerId)?.name || 'شریک حذف شده'}</td>
                  <td className="p-5 text-center font-bold text-indigo-600">{toPersianNumbers(pay.period)}</td>
                  <td className="p-5 font-black text-emerald-600">{formatCurrency(pay.amount)}</td>
                  <td className="p-5 text-center text-xs font-bold text-slate-400">{toPersianNumbers(pay.date)}</td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center gap-2">
                       <button onClick={() => { 
                         setPaymentEditForm({ amount: pay.amount.toString(), period: pay.period, date: pay.date });
                         setShowPaymentEditModal(pay); 
                       }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition" title="ویرایش">📝</button>
                       <button onClick={() => { if(confirm('سابقه پرداخت برای همیشه حذف شود؟')) setData({...data, payments: data.payments.filter(i=>i.id!==pay.id)}) }} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition" title="حذف">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-slate-300 font-black">هیچ سابقه پرداختی یافت نشد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مدال افزودن/ویرایش شریک */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fadeIn my-auto">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black">{editingPartner ? 'ویرایش اطلاعات شریک' : 'ثبت شریک جدید'}</h3>
              <button onClick={() => { setShowPartnerModal(false); setEditingPartner(null); }} className="text-3xl">&times;</button>
            </div>
            <form onSubmit={savePartner} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 mr-2">نام و نام خانوادگی شریک</label>
                <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={partnerForm.name} onChange={e=>setPartnerForm({...partnerForm, name: e.target.value})} />
              </div>
              
              {!editingPartner && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 mr-2">سرمایه اولیه (تومان)</label>
                    <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-center" value={toPersianNumbers(formatWithCommas(partnerForm.initialAmount))} onChange={e=>handleNumericChange(setPartnerForm, 'initialAmount', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 mr-2">تاریخ ورود</label>
                    <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-center" value={partnerForm.initialDate} onChange={e=>setPartnerForm({...partnerForm, initialDate: e.target.value})} />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl active:scale-95">
                {editingPartner ? 'ذخیره تغییرات' : 'ایجاد حساب شریک'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* مدال واریز سرمایه جدید */}
      {showInvestmentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fadeIn my-auto">
            <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="text-2xl font-black">افزایش سرمایه</h3>
                <p className="text-xs opacity-70 font-bold">شریک: {showInvestmentModal.name}</p>
              </div>
              <button onClick={() => setShowInvestmentModal(null)} className="text-3xl">&times;</button>
            </div>
            <form onSubmit={saveInvestment} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 mr-2">مبلغ واریزی جدید (تومان)</label>
                <input required className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-center text-2xl text-emerald-700" value={toPersianNumbers(formatWithCommas(invForm.amount))} onChange={e=>handleNumericChange(setInvForm, 'amount', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 mr-2">تاریخ واریز</label>
                <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-center" value={invForm.date} onChange={e=>setInvForm({...invForm, date: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all shadow-xl active:scale-95">
                تایید واریز وجه ✅
              </button>
            </form>
          </div>
        </div>
      )}

      {/* مدال ویرایش سابقه پرداخت */}
      {showPaymentEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fadeIn my-auto">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <div className="flex flex-col text-right">
                <h3 className="text-2xl font-black">ویرایش سابقه تسویه</h3>
                <p className="text-xs opacity-70 font-bold">برای شریک: {data.partners.find(p=>p.id===showPaymentEditModal.partnerId)?.name}</p>
              </div>
              <button onClick={() => setShowPaymentEditModal(null)} className="text-3xl">&times;</button>
            </div>
            <form onSubmit={savePaymentEdit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 mr-2">مبلغ واریز شده (تومان)</label>
                <input required className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-black text-center text-2xl text-blue-700" value={toPersianNumbers(formatWithCommas(paymentEditForm.amount))} onChange={e=>handleNumericChange(setPaymentEditForm, 'amount', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 mr-2">دوره (ماه/سال)</label>
                  <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-black text-center" value={paymentEditForm.period} onChange={e=>setPaymentEditForm({...paymentEditForm, period: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 mr-2">تاریخ پرداخت</label>
                  <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-black text-center" value={paymentEditForm.date} onChange={e=>setPaymentEditForm({...paymentEditForm, date: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl active:scale-95">
                ذخیره تغییرات تسویه 💾
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
