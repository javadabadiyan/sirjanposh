
import React, { useState, useEffect } from 'react';
import { AppData, Product, User } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, parseRawNumber, toEnglishDigits, formatWithCommas } from '../utils/formatters';
import * as XLSX from 'xlsx';

interface InventoryProps {
  data: AppData;
  setData: (data: AppData) => void;
  currentUser: User;
}

const Inventory: React.FC<InventoryProps> = ({ data, setData, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate()
  });

  const calculateTotalCost = () => parseRawNumber(formData.buyPrice) + parseRawNumber(formData.shippingCost);
  const calculateFinalPrice = () => {
    const total = calculateTotalCost();
    return Math.round(total + (total * (parseRawNumber(formData.marginPercent) / 100)));
  };

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      code: formData.code,
      name: formData.name,
      buyPrice: parseRawNumber(formData.buyPrice),
      shippingCost: parseRawNumber(formData.shippingCost),
      marginPercent: parseRawNumber(formData.marginPercent),
      quantity: parseRawNumber(formData.quantity),
      sellPrice: calculateFinalPrice(),
      date: formData.date || getCurrentJalaliDate(),
      registeredBy: editingProduct ? editingProduct.registeredBy : (currentUser?.username || 'admin')
    };

    const updatedProducts = editingProduct 
      ? data.products.map(p => p.id === editingProduct.id ? newProduct : p)
      : [...(data.products || []), newProduct];

    setData({ ...data, products: updatedProducts });
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleNumericChange = (field: string, value: string) => {
    const cleanValue = toEnglishDigits(value).replace(/[^0-9]/g, '');
    setFormData({ ...formData, [field]: cleanValue });
  };

  const exportToExcel = () => {
    // ایجاد داده‌ها با استفاده از XLSX که انکودینگ UTF-8 را به خوبی مدیریت می‌کند
    const wsData = data.products.map(p => ({
      'کد کالا': p.code,
      'نام کالا': p.name,
      'قیمت خرید (تومان)': formatWithCommas(p.buyPrice),
      'کرایه حمل (تومان)': formatWithCommas(p.shippingCost),
      'درصد سود (%)': p.marginPercent,
      'قیمت فروش (تومان)': formatWithCommas(p.sellPrice),
      'موجودی': p.quantity,
      'تاریخ ثبت': p.date
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    
    // خروجی اکسل با فرمت XLSX که مشکل علامت سوال ندارد
    XLSX.writeFile(wb, `Inventory_SirjanPoosh_${getCurrentJalaliDate().replace(/\//g, '-')}.xlsx`);
  };

  const filtered = (data.products || []).filter(p => 
    p.name.includes(searchTerm) || p.code.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-stretch gap-4 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <input type="text" placeholder="جستجوی نام یا کد کالا..." className="w-full pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setEditingProduct(null); setFormData({ code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate() }); setShowModal(true); }} className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl transition-all active:scale-95 text-center whitespace-nowrap">+ ثبت کالا</button>
          <button onClick={exportToExcel} className="bg-green-600 text-white p-4 rounded-2xl font-black hover:bg-green-700 shadow-lg transition-all active:scale-95 flex items-center justify-center" title="خروجی اکسل">📊</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-black text-indigo-500 block mb-1">{toPersianNumbers(p.code)}</span>
                <h4 className="font-black text-slate-800 text-lg leading-tight">{p.name}</h4>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black shrink-0 ${p.quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{toPersianNumbers(p.quantity)} عدد</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 p-4 rounded-2xl">
              <div><p className="text-[9px] font-black text-slate-400 mb-1">قیمت خرید</p><p className="text-xs font-bold text-slate-600">{formatCurrency(p.buyPrice)}</p></div>
              <div><p className="text-[9px] font-black text-indigo-400 mb-1">قیمت فروش</p><p className="text-sm font-black text-indigo-900">{formatCurrency(p.sellPrice)}</p></div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setEditingProduct(p); setFormData({ code: p.code, name: p.name, buyPrice: p.buyPrice.toString(), shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(), quantity: p.quantity.toString(), date: p.date }); setShowModal(true); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-xs hover:bg-indigo-600 hover:text-white transition">ویرایش</button>
              <button onClick={() => { if(confirm('حذف شود؟')) setData({...data, products: data.products.filter(item => item.id !== p.id)}) }} className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-black text-xs hover:bg-red-600 hover:text-white transition">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-2xl md:rounded-[3rem] shadow-2xl relative z-[110] flex flex-col animate-fadeIn overflow-hidden">
            <div className="px-6 py-5 md:px-10 md:py-8 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-slate-900">{editingProduct ? 'ویرایش کالا' : 'ثبت کالای جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl text-2xl transition-all">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/30">
              <form id="product-form" onSubmit={saveProduct} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 mr-2 uppercase">کد کالا</label><input required className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 mr-2 uppercase">نام کالا</label><input required className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 mr-2 uppercase">تعداد</label><input required type="text" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-center" value={toPersianNumbers(formData.quantity)} onChange={e => handleNumericChange('quantity', e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 mr-2 uppercase">تاریخ</label><input required className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-center" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                </div>

                <div className="p-6 md:p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-inner space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 text-center block">خرید</label><input required type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-sm" value={toPersianNumbers(formatWithCommas(formData.buyPrice))} onChange={e => handleNumericChange('buyPrice', e.target.value)} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 text-center block">کرایه</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-sm" value={toPersianNumbers(formatWithCommas(formData.shippingCost))} onChange={e => handleNumericChange('shippingCost', e.target.value)} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 text-center block">درصد سود</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-lg text-emerald-600" value={toPersianNumbers(formData.marginPercent)} onChange={e => handleNumericChange('marginPercent', e.target.value)} /></div>
                  </div>

                  <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col md:flex-row justify-around items-center gap-4">
                    <div className="text-center"><p className="text-[10px] font-black text-slate-500 mb-1">قیمت تمام شده:</p><p className="text-xl font-black">{formatCurrency(calculateTotalCost())}</p></div>
                    <div className="text-center"><p className="text-[10px] font-black text-emerald-400 mb-1">قیمت نهایی فروش:</p><p className="text-3xl font-black text-emerald-400">{formatCurrency(calculateFinalPrice())}</p></div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-6 md:px-10 md:py-8 bg-white border-t border-slate-100 flex gap-4">
              <button type="submit" form="product-form" className="flex-1 bg-indigo-600 text-white py-4 rounded-[1.5rem] font-black text-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">✅ ذخیره کالا</button>
              <button type="button" onClick={() => setShowModal(false)} className="bg-slate-100 text-slate-500 px-8 py-4 rounded-[1.5rem] font-black hover:bg-slate-200">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
