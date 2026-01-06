
import React, { useState, useEffect } from 'react';
import { AppData, Partner, PaymentHistory, InvestmentRecord } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, parseRawNumber, toEnglishDigits, formatWithCommas } from '../utils/formatters';

interface PartnersProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const Partners: React.FC<PartnersProps> = ({ data, setData }) => {
  const [monthlyProfit, setMonthlyProfit] = useState<string>('0');
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentJalaliDate().substring(0, 7));
  const [partnerSearch, setPartnerSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [isAutoCalculating, setIsAutoCalculating] = useState(true);
  
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', initialAmount: '', initialDate: getCurrentJalaliDate() });

  const [showInvestmentModal, setShowInvestmentModal] = useState<Partner | null>(null);
  const [invForm, setInvForm] = useState({ amount: '', date: getCurrentJalaliDate() });

  const [showPaymentEditModal, setShowPaymentEditModal] = useState<PaymentHistory | null>(null);
  const [paymentEditForm, setPaymentEditForm] = useState({ amount: '', period: '', date: '' });

  const [manageInvestmentsPartner, setManageInvestmentsPartner] = useState<Partner | null>(null);
  const [editingInvestmentRecord, setEditingInvestmentRecord] = useState<{partnerId: string, record: InvestmentRecord} | null>(null);
  const [editInvForm, setEditInvForm] = useState({ amount: '', date: '' });

  const getPartnerTotalInvestment = (partner: Partner) => partner.investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalInvestment = data.partners.reduce((acc, p) => acc + getPartnerTotalInvestment(p), 0);

  // تابع اصلی محاسبه سود دوره
  const calculateProfitForPeriod = (period: string) => {
    let totalProfit = 0;
    // نرمال‌سازی دوره به اعداد فارسی برای مطابقت با دیتابیس
    const normalizedPeriod = toPersianNumbers(toEnglishDigits(period));
    
    data.invoices.forEach(inv => {
      // بررسی تطابق دوره (مثلاً ۱۴۰۳/۱۱ در ۱۴۰۳/۱۱/۰۵ موجود است)
      if (inv.date.includes(normalizedPeriod)) {
        inv.items.forEach(item => {
          const product = data.products.find(p => p.id === item.productId);
          if (product) {
            // سود = (قیمت فروش در فاکتور - (قیمت خرید انبار + هزینه کرایه انبار)) * تعداد
            const costPerUnit = product.buyPrice + product.shippingCost;
            const profitPerUnit = item.price - costPerUnit;
            totalProfit += profitPerUnit * item.quantity;
          }
        });
      }
    });
    return totalProfit;
  };

  useEffect(() => {
    if (isAutoCalculating) {
      const calculatedProfit = calculateProfitForPeriod(selectedPeriod);
      setMonthlyProfit(calculatedProfit.toString());
    }
  }, [selectedPeriod, data.invoices, data.products, isAutoCalculating]);

  const calculateShare = (partnerInvestment: number) => {
    if (totalInvestment === 0) return 0;
    const profit = parseRawNumber(monthlyProfit);
    return (partnerInvestment / totalInvestment) * profit;
  };

  const handlePayDividends = () => {
    const profit = parseRawNumber(monthlyProfit);
    if (profit <= 0) return alert('سود دوره جاری صفر یا منفی است.');

    const newPayments: PaymentHistory[] = data.partners.map(p => ({
      id: Date.now().toString() + p.id,
      partnerId: p.id,
      amount: calculateShare(getPartnerTotalInvestment(p)),
      period: toPersianNumbers(toEnglishDigits(selectedPeriod)),
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
      date: partnerForm.initialDate
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

  const handleEditInvestmentRecord = (partner: Partner, record: InvestmentRecord) => {
    setEditingInvestmentRecord({ partnerId: partner.id, record });
    setEditInvForm({ amount: record.amount.toString(), date: record.date });
  };

  const saveEditedInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestmentRecord) return;

    const updatedPartners = data.partners.map(p => {
      if (p.id === editingInvestmentRecord.partnerId) {
        return {
          ...p,
          investments: p.investments.map(inv => 
            inv.id === editingInvestmentRecord.record.id 
              ? { ...inv, amount: parseRawNumber(editInvForm.amount), date: editInvForm.date } 
              : inv
          )
        };
      }
      return p;
    });

    setData({ ...data, partners: updatedPartners });
    const updatedPartner = updatedPartners.find(p => p.id === editingInvestmentRecord.partnerId);
    if (updatedPartner) setManageInvestmentsPartner(updatedPartner);
    setEditingInvestmentRecord(null);
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
    p.period.includes(toPersianNumbers(toEnglishDigits(historySearch))) || 
    data.partners.find(part => part.id === p.partnerId)?.name.includes(historySearch)
  ).reverse();

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-24">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        
        {/* لیست شرکا */}
        <div className="bg-white p-5 md:p-8 rounded-[2.2rem] md:rounded-[3rem] shadow-sm border border-slate-100 flex flex-col min-h-[500px] lg:h-[700px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg md:text-xl font-black text-slate-800">🤝 مدیریت شرکا</h3>
            <button onClick={() => { 
              setEditingPartner(null); 
              setPartnerForm({name:'', initialAmount:'', initialDate: getCurrentJalaliDate()}); 
              setShowPartnerModal(true); 
            }} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-xs md:text-sm shadow-xl hover:bg-indigo-700 transition-all min-h-[48px]">+ شریک جدید</button>
          </div>
          <div className="relative mb-6">
            <input placeholder="🔍 جستجوی شریک..." className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm shadow-inner pr-12 min-h-[52px]" value={partnerSearch} onChange={e => setPartnerSearch(e.target.value)} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {filteredPartners.map(p => (
              <div key={p.id} className="p-5 md:p-6 bg-slate-50 rounded-[1.8rem] md:rounded-[2rem] border-2 border-slate-100 hover:border-indigo-300 transition-all group">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-base md:text-lg font-black text-slate-800 truncate pr-2">{p.name}</span>
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-black whitespace-nowrap">
                    {toPersianNumbers(((getPartnerTotalInvestment(p)/totalInvestment)*100).toFixed(1))}٪ سهم
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between text-[10px] md:text-xs font-bold text-slate-500 mb-6 bg-white/50 p-3 rounded-xl gap-2">
                  <div className="flex items-center gap-2">
                    <span>سرمایه: {formatCurrency(getPartnerTotalInvestment(p))}</span>
                    <button onClick={() => setManageInvestmentsPartner(p)} className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg text-[8px] hover:bg-indigo-600 hover:text-white transition-all">ویرایش تاریخ‌ها 🗓️</button>
                  </div>
                  <span className="md:text-left">عضویت: {toPersianNumbers(p.date)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button onClick={() => { setInvForm({amount: '', date: getCurrentJalaliDate()}); setShowInvestmentModal(p); }} className="bg-emerald-50 text-emerald-600 py-3 rounded-xl font-black text-[10px] shadow-sm hover:bg-emerald-600 hover:text-white transition-all min-h-[44px]">+ واریز سرمایه</button>
                  <button onClick={() => { setEditingPartner(p); setPartnerForm({name: p.name, initialAmount: '', initialDate: p.date}); setShowPartnerModal(true); }} className="bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-[10px] shadow-sm hover:bg-blue-600 hover:text-white transition-all min-h-[44px]">ویرایش مشخصات</button>
                  <button onClick={() => { if(confirm('با حذف شریک تمامی سوابق واریزی و سهم وی حذف می‌شود. مطمئن هستید؟')) setData({...data, partners: data.partners.filter(i=>i.id!==p.id)}) }} className="bg-red-50 text-red-500 py-3 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all min-h-[44px]">حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* تقسیم سود */}
        <div className="bg-white p-5 md:p-8 rounded-[2.2rem] md:rounded-[3rem] shadow-sm border-2 border-indigo-100 h-fit">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-indigo-950">💎 تقسیم سود دوره</h3>
            <div className="flex gap-2">
               <button onClick={() => setIsAutoCalculating(true)} className={`px-3 py-1.5 rounded-full text-[8px] font-black transition-all ${isAutoCalculating ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>🔄 محاسبه خودکار</button>
               <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-[9px] font-black">سود مرکب</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">انتخاب ماه/سال (مثلاً ۱۴۰۳/۱۱)</label>
              <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center outline-none focus:border-indigo-500 min-h-[52px]" value={selectedPeriod} onChange={e=>setSelectedPeriod(e.target.value)} placeholder="۱۴۰۳/۱۱" />
            </div>
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">سود خالص کل (تومان)</label>
              <input className={`w-full p-4 border-2 rounded-2xl font-black text-center text-lg outline-none transition-all min-h-[52px] ${isAutoCalculating ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'}`} value={toPersianNumbers(formatWithCommas(monthlyProfit))} onChange={e=>{setMonthlyProfit(toEnglishDigits(e.target.value).replace(/,/g,'')); setIsAutoCalculating(false);}} />
              {!isAutoCalculating && <p className="text-[8px] text-orange-500 font-bold mt-1 text-center">⚠️ سود دستی وارد شده است</p>}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white space-y-4 shadow-2xl">
            <p className="text-[9px] font-black opacity-50 uppercase tracking-widest text-center">پیش‌نمایش تقسیم سود دوره {toPersianNumbers(selectedPeriod)}</p>
            {data.partners.map(p => (
              <div key={p.id} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0">
                <span className="font-bold text-xs md:text-sm truncate pr-2">{p.name}</span>
                <span className="font-black text-emerald-400 text-base md:text-lg whitespace-nowrap">{formatCurrency(calculateShare(getPartnerTotalInvestment(p)))}</span>
              </div>
            ))}
            <button onClick={handlePayDividends} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 mt-4 min-h-[60px]">ثبت و تسویه نهایی</button>
          </div>
        </div>
      </div>

      {/* تاریخچه پرداخت‌ها */}
      <div className="bg-white p-5 md:p-8 rounded-[2.2rem] md:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-8 gap-4">
          <h3 className="text-lg md:text-xl font-black text-slate-800">📜 تاریخچه پرداخت‌ها</h3>
          <div className="relative w-full lg:w-80">
            <input placeholder="🔍 جستجوی دوره یا نام..." className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm shadow-inner min-h-[52px]" value={historySearch} onChange={e=>setHistorySearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto -mx-5 md:mx-0">
          <table className="w-full text-right min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase">
                <th className="p-5">نام شریک</th>
                <th className="p-5 text-center">دوره</th>
                <th className="p-5">مبلغ سود</th>
                <th className="p-5 text-center">تاریخ ثبت</th>
                <th className="p-5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.map(pay => (
                <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5 font-black text-slate-800 text-sm">{data.partners.find(p=>p.id===pay.partnerId)?.name || 'نامشخص'}</td>
                  <td className="p-5 text-center font-bold text-indigo-600 text-sm">{toPersianNumbers(pay.period)}</td>
                  <td className="p-5 font-black text-emerald-600 text-sm">{formatCurrency(pay.amount)}</td>
                  <td className="p-5 text-center text-[11px] font-bold text-slate-400">{toPersianNumbers(pay.date)}</td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center gap-2">
                       <button onClick={() => { setPaymentEditForm({ amount: pay.amount.toString(), period: pay.period, date: pay.date }); setShowPaymentEditModal(pay); }} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">📝</button>
                       <button onClick={() => { if(confirm('حذف شود؟')) setData({...data, payments: data.payments.filter(i=>i.id!==pay.id)}) }} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* مدال‌های مدیریت */}
      {(showPartnerModal || showInvestmentModal || showPaymentEditModal || manageInvestmentsPartner || editingInvestmentRecord) && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-4 bg-slate-900/95 backdrop-blur-md overflow-y-auto safe-padding">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
            <div className={`p-6 md:p-8 text-white flex justify-between items-center shrink-0 ${
              showInvestmentModal ? 'bg-emerald-600' : 
              showPaymentEditModal ? 'bg-blue-600' : 
              manageInvestmentsPartner ? 'bg-indigo-900' : 
              editingInvestmentRecord ? 'bg-orange-600' : 'bg-indigo-600'
            }`}>
              <h3 className="text-xl md:text-2xl font-black truncate">
                {showPartnerModal ? (editingPartner ? 'ویرایش شریک' : 'شریک جدید') : 
                 showInvestmentModal ? 'افزایش سرمایه' : 
                 showPaymentEditModal ? 'ویرایش تسویه' : 
                 manageInvestmentsPartner ? `تاریخچه سرمایه: ${manageInvestmentsPartner.name}` :
                 editingInvestmentRecord ? 'ویرایش رکورد واریز' : ''}
              </h3>
              <button onClick={() => { setShowPartnerModal(false); setShowInvestmentModal(null); setShowPaymentEditModal(null); setManageInvestmentsPartner(null); setEditingInvestmentRecord(null); setEditingPartner(null); }} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-3xl">&times;</button>
            </div>
            
            <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-slate-50/30">
              {showPartnerModal && (
                <form onSubmit={savePartner} className="space-y-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">نام کامل شریک</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={partnerForm.name} onChange={e=>setPartnerForm({...partnerForm, name: e.target.value})} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!editingPartner && (
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">سرمایه اولیه</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-center" value={toPersianNumbers(formatWithCommas(partnerForm.initialAmount))} onChange={e=>handleNumericChange(setPartnerForm, 'initialAmount', e.target.value)} /></div>
                    )}
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">تاریخ عضویت (قابل ویرایش)</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-center" value={partnerForm.initialDate} onChange={e=>setPartnerForm({...partnerForm, initialDate: e.target.value})} /></div>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg md:text-xl shadow-xl min-h-[60px] active:scale-95 transition-all mt-4">{editingPartner ? 'ثبت تغییرات' : 'ایجاد حساب شریک'}</button>
                </form>
              )}

              {showInvestmentModal && (
                <form onSubmit={saveInvestment} className="space-y-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">مبلغ واریزی (تومان)</label><input required className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-center text-2xl text-emerald-600" value={toPersianNumbers(formatWithCommas(invForm.amount))} onChange={e=>handleNumericChange(setInvForm, 'amount', e.target.value)} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">تاریخ واریز سرمایه جدید (قابل ویرایش)</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-center" value={invForm.date} onChange={e=>setInvForm({...invForm, date: e.target.value})} /></div>
                  <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg md:text-xl shadow-xl min-h-[60px] active:scale-95 transition-all mt-4">تایید واریز وجه ✅</button>
                </form>
              )}

              {manageInvestmentsPartner && !editingInvestmentRecord && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 mb-4 text-center">لیست تمامی واریزی‌های سرمایه</p>
                  <div className="space-y-2">
                    {manageInvestmentsPartner.investments.map((inv, idx) => (
                      <div key={inv.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="overflow-hidden">
                          <p className="font-black text-sm text-slate-800">{formatCurrency(inv.amount)}</p>
                          <p className="text-[10px] font-bold text-slate-400">تاریخ: {toPersianNumbers(inv.date)}</p>
                        </div>
                        <button onClick={() => handleEditInvestmentRecord(manageInvestmentsPartner, inv)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all">ویرایش تاریخ و مبلغ 📝</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingInvestmentRecord && (
                <form onSubmit={saveEditedInvestment} className="space-y-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">مبلغ واریزی</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-black text-center" value={toEnglishDigits(formatWithCommas(editInvForm.amount))} onChange={e=>handleNumericChange(setEditInvForm, 'amount', e.target.value)} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">تغییر تاریخ این واریزی</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-black text-center" value={editInvForm.date} onChange={e=>setEditInvForm({...editInvForm, date: e.target.value})} /></div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-2 bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg">ذخیره تغییرات 💾</button>
                    <button type="button" onClick={() => setEditingInvestmentRecord(null)} className="flex-1 bg-slate-100 text-slate-500 rounded-2xl font-bold">بازگشت</button>
                  </div>
                </form>
              )}

              {showPaymentEditModal && (
                <form onSubmit={savePaymentEdit} className="space-y-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">مبلغ واریز شده (تومان)</label><input required className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-black text-center text-2xl text-blue-600" value={toPersianNumbers(formatWithCommas(paymentEditForm.amount))} onChange={e=>handleNumericChange(setPaymentEditForm, 'amount', e.target.value)} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">دوره</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl font-black text-center" value={paymentEditForm.period} onChange={e=>setPaymentEditForm({...paymentEditForm, period: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase mr-2">تاریخ تسویه</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl font-black text-center" value={paymentEditForm.date} onChange={e=>setPaymentEditForm({...paymentEditForm, date: e.target.value})} /></div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg md:text-xl shadow-xl min-h-[60px] active:scale-95 transition-all mt-4">ذخیره تغییرات تسویه 💾</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
