
import React, { useState, useEffect } from 'react';
import { AppData, Partner, PaymentHistory, InvestmentRecord, User } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, parseRawNumber, toEnglishDigits, formatWithCommas } from '../utils/formatters';
import DatePicker from './DatePicker';

interface PartnersProps {
  data: AppData;
  setData: (data: AppData) => void;
  currentUser: User;
}

const Partners: React.FC<PartnersProps> = ({ data, setData, currentUser }) => {
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

  const calculateProfitForPeriod = (period: string) => {
    let totalProfit = 0;
    const engPeriod = toEnglishDigits(period);
    const periodParts = engPeriod.split('/');
    if (periodParts.length < 2) return 0;
    const targetYear = periodParts[0];
    const targetMonth = periodParts[1].padStart(2, '0');

    data.invoices.forEach(inv => {
      const invDateEng = toEnglishDigits(inv.date);
      const invParts = invDateEng.split('/');
      if (invParts.length >= 2) {
        const invYear = invParts[0];
        const invMonth = invParts[1].padStart(2, '0');
        if (invYear === targetYear && invMonth === targetMonth) {
          inv.items.forEach(item => {
            const product = data.products.find(p => p.id === item.productId);
            if (product) {
              const costPerUnit = product.buyPrice + product.shippingCost;
              const profitPerUnit = item.price - costPerUnit;
              totalProfit += profitPerUnit * item.quantity;
            }
          });
        }
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
      description: `تسویه سود دوره ${toPersianNumbers(selectedPeriod)}`,
      registeredBy: currentUser.username
    }));

    setData({ ...data, payments: [...data.payments, ...newPayments] });
    alert('سود دوره ثبت شد.');
  };

  const savePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name) return;

    const pData: Partner = {
      id: editingPartner ? editingPartner.id : Date.now().toString(),
      name: partnerForm.name,
      investments: editingPartner 
        ? editingPartner.investments 
        : [{ id: Date.now().toString(), amount: parseRawNumber(partnerForm.initialAmount), date: toPersianNumbers(partnerForm.initialDate), registeredBy: currentUser.username }],
      date: toPersianNumbers(partnerForm.initialDate),
      registeredBy: editingPartner ? editingPartner.registeredBy : currentUser.username
    };

    setData({ 
      ...data, 
      partners: editingPartner ? data.partners.map(p => p.id === pData.id ? pData : p) : [...data.partners, pData]
    });
    setShowPartnerModal(false);
    setEditingPartner(null);
  };

  const saveInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInvestmentModal) return;

    const newInv: InvestmentRecord = {
      id: Date.now().toString(),
      amount: parseRawNumber(invForm.amount),
      date: toPersianNumbers(invForm.date),
      registeredBy: currentUser.username
    };

    setData({
      ...data,
      partners: data.partners.map(p => p.id === showInvestmentModal.id ? { ...p, investments: [...p.investments, newInv] } : p)
    });
    setShowInvestmentModal(null);
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
              ? { ...inv, amount: parseRawNumber(editInvForm.amount), date: toPersianNumbers(editInvForm.date) } 
              : inv
          )
        };
      }
      return p;
    });

    setData({ ...data, partners: updatedPartners });
    setEditingInvestmentRecord(null);
    setManageInvestmentsPartner(null);
  };

  const savePaymentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentEditModal) return;

    setData({
      ...data,
      payments: data.payments.map(p => p.id === showPaymentEditModal.id ? {
        ...p,
        amount: parseRawNumber(paymentEditForm.amount),
        period: toPersianNumbers(paymentEditForm.period),
        date: toPersianNumbers(paymentEditForm.date)
      } : p)
    });
    setShowPaymentEditModal(null);
  };

  const handleNumericChange = (setter: any, field: string, value: string) => {
    const clean = toEnglishDigits(value).replace(/[^0-9]/g, '');
    setter((prev: any) => ({ ...prev, [field]: clean }));
  };

  const filteredPartners = data.partners.filter(p => p.name.includes(partnerSearch));
  const filteredHistory = data.payments.filter(p => 
    toPersianNumbers(p.period).includes(toPersianNumbers(toEnglishDigits(historySearch))) || 
    data.partners.find(part => part.id === p.partnerId)?.name.includes(historySearch)
  ).reverse();

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-24">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
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
                    <button onClick={() => setManageInvestmentsPartner(p)} className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg text-[8px] hover:bg-indigo-600 hover:text-white transition-all">سوابق 🗓️</button>
                  </div>
                  <div className="text-left">
                    <span className="opacity-50">ثبت: {toPersianNumbers(p.date)}</span>
                    <span className="mr-2 text-indigo-500">({p.registeredBy})</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button onClick={() => { setInvForm({amount: '', date: getCurrentJalaliDate()}); setShowInvestmentModal(p); }} className="bg-emerald-50 text-emerald-600 py-3 rounded-xl font-black text-[10px] shadow-sm hover:bg-emerald-600 hover:text-white transition-all min-h-[44px]">+ واریز سرمایه</button>
                  <button onClick={() => { setEditingPartner(p); setPartnerForm({name: p.name, initialAmount: '', initialDate: p.date}); setShowPartnerModal(true); }} className="bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-[10px] shadow-sm hover:bg-blue-600 hover:text-white transition-all min-h-[44px]">ویرایش</button>
                  <button onClick={() => { if(confirm('حذف شود؟')) setData({...data, partners: data.partners.filter(i=>i.id!==p.id)}) }} className="bg-red-50 text-red-500 py-3 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all min-h-[44px]">حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 md:p-8 rounded-[2.2rem] md:rounded-[3rem] shadow-sm border-2 border-indigo-100 h-fit">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-indigo-950">💎 تقسیم سود دوره</h3>
            <div className="flex gap-2">
               <button onClick={() => setIsAutoCalculating(true)} className={`px-3 py-1.5 rounded-full text-[8px] font-black transition-all ${isAutoCalculating ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>🔄 اتوماتیک</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">ماه/سال</label>
              <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center outline-none focus:border-indigo-500 min-h-[52px]" value={toPersianNumbers(selectedPeriod)} onChange={e=>setSelectedPeriod(toPersianNumbers(e.target.value))} />
            </div>
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">سود کل دوره</label>
              <input className={`w-full p-4 border-2 rounded-2xl font-black text-center text-lg outline-none min-h-[52px] ${isAutoCalculating ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'}`} value={toPersianNumbers(formatWithCommas(monthlyProfit))} onChange={e=>{setMonthlyProfit(toEnglishDigits(e.target.value).replace(/,/g,'')); setIsAutoCalculating(false);}} />
            </div>
          </div>
          <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white space-y-4 shadow-2xl">
            {data.partners.map(p => (
              <div key={p.id} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0">
                <span className="font-bold text-xs md:text-sm truncate pr-2">{p.name}</span>
                <span className="font-black text-emerald-400 text-base md:text-lg whitespace-nowrap">{formatCurrency(calculateShare(getPartnerTotalInvestment(p)))}</span>
              </div>
            ))}
            <button onClick={handlePayDividends} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl shadow-xl transition-all mt-4 min-h-[60px]">تسویه نهایی ✅</button>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 md:p-8 rounded-[2.2rem] md:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="text-lg md:text-xl font-black text-slate-800 mb-8">📜 تاریخچه پرداخت‌ها</h3>
        <div className="overflow-x-auto -mx-5 md:mx-0">
          <table className="w-full text-right min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase">
                <th className="p-5">شریک</th>
                <th className="p-5 text-center">دوره</th>
                <th className="p-5">مبلغ سود</th>
                <th className="p-5 text-center">ثبت‌کننده</th>
                <th className="p-5 text-center">تاریخ</th>
                <th className="p-5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.map(pay => (
                <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 font-black text-slate-800 text-sm">{data.partners.find(p=>p.id===pay.partnerId)?.name || 'نامشخص'}</td>
                  <td className="p-5 text-center font-bold text-indigo-600 text-sm">{toPersianNumbers(pay.period)}</td>
                  <td className="p-5 font-black text-emerald-600 text-sm">{formatCurrency(pay.amount)}</td>
                  <td className="p-5 text-center"><span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-600">{pay.registeredBy || 'سیستم'}</span></td>
                  <td className="p-5 text-center text-[11px] font-bold text-slate-400">{toPersianNumbers(pay.date)}</td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center gap-2">
                       <button onClick={() => { setPaymentEditForm({ amount: pay.amount.toString(), period: pay.period, date: pay.date }); setShowPaymentEditModal(pay); }} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-500 rounded-lg">📝</button>
                       <button onClick={() => { if(confirm('حذف؟')) setData({...data, payments: data.payments.filter(i=>i.id!==pay.id)}) }} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-400 rounded-lg">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                {showPartnerModal ? 'اطلاعات شریک' : 
                 showInvestmentModal ? 'افزایش سرمایه' : 
                 showPaymentEditModal ? 'ویرایش تسویه' : 
                 manageInvestmentsPartner ? `سوابق: ${manageInvestmentsPartner.name}` :
                 editingInvestmentRecord ? 'ویرایش واریز' : ''}
              </h3>
              <button onClick={() => { setShowPartnerModal(false); setShowInvestmentModal(null); setShowPaymentEditModal(null); setManageInvestmentsPartner(null); setEditingInvestmentRecord(null); setEditingPartner(null); }} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-3xl">&times;</button>
            </div>
            
            <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-slate-50/30">
              {showPartnerModal && (
                <form onSubmit={savePartner} className="space-y-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">نام شریک</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold" value={partnerForm.name} onChange={e=>setPartnerForm({...partnerForm, name: e.target.value})} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!editingPartner && (
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">سرمایه اولیه</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl font-black text-center" value={toPersianNumbers(formatWithCommas(partnerForm.initialAmount))} onChange={e=>handleNumericChange(setPartnerForm, 'initialAmount', e.target.value)} /></div>
                    )}
                    <DatePicker label="تاریخ عضویت" value={partnerForm.initialDate} onChange={val => setPartnerForm({...partnerForm, initialDate: val})} accentColor="indigo" />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all mt-4">{editingPartner ? 'بروزرسانی' : 'ایجاد حساب'}</button>
                </form>
              )}

              {showInvestmentModal && (
                <form onSubmit={saveInvestment} className="space-y-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">مبلغ واریزی</label><input required className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-center text-2xl text-emerald-600" value={toPersianNumbers(formatWithCommas(invForm.amount))} onChange={e=>handleNumericChange(setInvForm, 'amount', e.target.value)} /></div>
                  <DatePicker label="تاریخ واریز" value={invForm.date} onChange={val => setInvForm({...invForm, date: val})} accentColor="emerald" />
                  <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 mt-4">تایید واریز ✅</button>
                </form>
              )}

              {manageInvestmentsPartner && !editingInvestmentRecord && (
                <div className="space-y-4">
                  {manageInvestmentsPartner.investments.map((inv) => (
                    <div key={inv.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div>
                        <p className="font-black text-sm text-slate-800">{formatCurrency(inv.amount)}</p>
                        <p className="text-[9px] font-bold text-slate-400">تاریخ: {toPersianNumbers(inv.date)} | ثبت: {inv.registeredBy || 'نامشخص'}</p>
                      </div>
                      <button onClick={() => setEditingInvestmentRecord({ partnerId: manageInvestmentsPartner.id, record: inv })} className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-[9px] font-black">ویرایش</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
