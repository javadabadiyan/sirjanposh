
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
  
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', initialAmount: '', initialDate: getCurrentJalaliDate() });

  const [showInvestmentModal, setShowInvestmentModal] = useState<Partner | null>(null);
  const [invForm, setInvForm] = useState({ amount: '', date: getCurrentJalaliDate() });

  const [editingPayment, setEditingPayment] = useState<PaymentHistory | null>(null);

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
    if (profit <= 0) return alert('سود صفر است.');

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
    const pData: Partner = {
      id: editingPartner ? editingPartner.id : Date.now().toString(),
      name: partnerForm.name,
      investments: editingPartner ? editingPartner.investments : [{ id: '1', amount: parseRawNumber(partnerForm.initialAmount), date: partnerForm.initialDate }],
      date: editingPartner ? editingPartner.date : partnerForm.initialDate
    };
    setData({ ...data, partners: editingPartner ? data.partners.map(p => p.id === pData.id ? pData : p) : [...data.partners, pData] });
    setShowPartnerModal(false);
  };

  const filteredPartners = data.partners.filter(p => p.name.includes(partnerSearch));
  const filteredHistory = data.payments.filter(p => 
    p.period.includes(historySearch) || 
    data.partners.find(part => part.id === p.partnerId)?.name.includes(historySearch)
  ).reverse();

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* ردیف اول: مدیریت شرکا و محاسبه سود */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* لیست شرکا */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col h-[700px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">🤝 مدیریت شرکا</h3>
            <button onClick={() => { setEditingPartner(null); setPartnerForm({name:'', initialAmount:'', initialDate: getCurrentJalaliDate()}); setShowPartnerModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl">+ شریک جدید</button>
          </div>
          <input placeholder="🔍 جستجوی شریک..." className="w-full p-4 mb-6 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm" value={partnerSearch} onChange={e => setPartnerSearch(e.target.value)} />
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {filteredPartners.map(p => (
              <div key={p.id} className="p-6 bg-slate-50 rounded-[2rem] border-2 border-transparent hover:border-indigo-100 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-black text-slate-800">{p.name}</span>
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black">
                    {toPersianNumbers(((getPartnerTotalInvestment(p)/totalInvestment)*100).toFixed(1))}٪ سهم
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-6">
                  <span>کل سرمایه: {formatCurrency(getPartnerTotalInvestment(p))}</span>
                  <span>تاریخ عضویت: {toPersianNumbers(p.date)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowInvestmentModal(p)} className="flex-1 bg-white py-3 rounded-xl font-black text-[10px] text-emerald-600 shadow-sm">+ واریز سرمایه</button>
                  <button onClick={() => { setEditingPartner(p); setPartnerForm({name: p.name, initialAmount: '', initialDate: p.date}); setShowPartnerModal(true); }} className="flex-1 bg-white py-3 rounded-xl font-black text-[10px] text-slate-500 shadow-sm">ویرایش نام</button>
                  <button onClick={() => { if(confirm('حذف شود؟')) setData({...data, partners: data.partners.filter(i=>i.id!==p.id)}) }} className="bg-red-50 text-red-500 px-4 py-3 rounded-xl font-black text-[10px]">×</button>
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
              <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center" value={selectedPeriod} onChange={e=>setSelectedPeriod(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2">سود خالص (تومان)</label>
              <input className="w-full p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl font-black text-center text-indigo-700 text-lg" value={toPersianNumbers(formatWithCommas(monthlyProfit))} onChange={e=>{setMonthlyProfit(toEnglishDigits(e.target.value).replace(/,/g,'')); setIsAutoCalculating(false);}} />
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
          <input placeholder="🔍 جستجوی دوره یا نام شریک..." className="w-full md:w-80 p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm" value={historySearch} onChange={e=>setHistorySearch(e.target.value)} />
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
                <tr key={pay.id} className="hover:bg-slate-50/50">
                  <td className="p-5 font-black text-slate-800">{data.partners.find(p=>p.id===pay.partnerId)?.name || 'شریک حذف شده'}</td>
                  <td className="p-5 text-center font-bold text-indigo-600">{toPersianNumbers(pay.period)}</td>
                  <td className="p-5 font-black text-emerald-600">{formatCurrency(pay.amount)}</td>
                  <td className="p-5 text-center text-xs font-bold text-slate-400">{toPersianNumbers(pay.date)}</td>
                  <td className="p-5 text-center">
                    <button onClick={() => { if(confirm('حذف سابقه؟')) setData({...data, payments: data.payments.filter(i=>i.id!==pay.id)}) }} className="text-red-400 hover:text-red-600 transition font-black">🗑️</button>
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
