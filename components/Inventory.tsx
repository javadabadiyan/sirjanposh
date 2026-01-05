
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
    code: '', 
    name: '', 
    buyPrice: '', 
    shippingCost: '', 
    marginPercent: '', 
    quantity: '',
    date: getCurrentJalaliDate()
  });

  // جلوگیری از اسکرول صفحه پشت مودال در حالت باز
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModal]);

  const calculateTotalCost = () => {
    const buyPrice = parseRawNumber(formData.buyPrice);
    const shipping = parseRawNumber(formData.shippingCost);
    return buyPrice + shipping;
  };

  const calculateFinalPrice = () => {
    const totalCost = calculateTotalCost();
    const margin = parseRawNumber(formData.marginPercent);
    const finalPrice = totalCost + (totalCost * (margin / 100));
    return Math.round(finalPrice);
  };

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = calculateFinalPrice();
    
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      code: formData.code,
      name: formData.name,
      buyPrice: parseRawNumber(formData.buyPrice),
      shippingCost: parseRawNumber(formData.shippingCost),
      marginPercent: parseRawNumber(formData.marginPercent),
      quantity: parseRawNumber(formData.quantity),
      sellPrice: finalPrice,
      date: formData.date || getCurrentJalaliDate(),
      registeredBy: editingProduct ? editingProduct.registeredBy : (currentUser?.username || 'admin')
    };

    if (editingProduct) {
      setData({ ...data, products: data.products.map(p => p.id === editingProduct.id ? newProduct : p) });
    } else {
      setData({ ...data, products: [...(data.products || []), newProduct] });
    }
    
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate() });
  };

  const handleNumericChange = (field: string, value: string) => {
    const cleanValue = toEnglishDigits(value).replace(/[^0-9]/g, '');
    setFormData({ ...formData, [field]: cleanValue });
  };

  const deleteProduct = (id: string) => {
    if (confirm('آیا از حذف این کالا از انبار اطمینان دارید؟')) {
      setData({ ...data, products: data.products.filter(p => p.id !== id) });
    }
  };

  const exportToExcel = () => {
    const wsData = (data.products || []).map(p => ({
      'کد کالا': p.code,
      'نام کالا': p.name,
      'قیمت خرید': p.buyPrice,
      'هزینه حمل': p.shippingCost,
      'درصد سود': p.marginPercent,
      'قیمت فروش': p.sellPrice,
      'تعداد': p.quantity,
      'تاریخ ثبت': p.date
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "انبار");
    XLSX.writeFile(wb, "SirjanPoosh_Inventory.xlsx");
  };

  const filtered = (data.products || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Search and Add Section */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="جستجوی نام یا کد کالا..." 
            className="w-full pr-12 pl-4 py-4 border-2 border-slate-50 bg-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { 
              setEditingProduct(null); 
              setFormData({ code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate() }); 
              setShowModal(true); 
            }}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span className="text-2xl leading-none">+</span> ثبت کالای جدید
          </button>
          <button onClick={exportToExcel} className="bg-green-600 text-white p-4 rounded-2xl hover:bg-green-700 transition font-black shadow-lg flex items-center justify-center">
            📊 <span className="hidden md:inline mr-2">خروجی اکسل</span>
          </button>
        </div>
      </div>

      {/* Product List - Desktop Table */}
      <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-6 px-6 font-black text-sm">کد کالا</th>
                <th className="py-6 px-6 font-black text-sm">نام محصول</th>
                <th className="py-6 px-6 font-black text-sm">قیمت خرید</th>
                <th className="py-6 px-6 font-black text-sm">قیمت فروش</th>
                <th className="py-6 px-6 font-black text-sm text-center">تعداد</th>
                <th className="py-6 px-6 font-black text-sm text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-5 px-6 font-black text-indigo-600 text-sm">{toPersianNumbers(p.code)}</td>
                  <td className="py-5 px-6 font-bold text-slate-800 text-sm">{p.name}</td>
                  <td className="py-5 px-6 font-bold text-slate-400 text-xs">{formatCurrency(p.buyPrice)}</td>
                  <td className="py-5 px-6 font-black text-slate-900 text-sm">{formatCurrency(p.sellPrice)}</td>
                  <td className="py-5 px-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${p.quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {toPersianNumbers(p.quantity)} عدد
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => {
                        setEditingProduct(p);
                        setFormData({
                          code: p.code, name: p.name, buyPrice: p.buyPrice.toString(),
                          shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(),
                          quantity: p.quantity.toString(), date: p.date
                        });
                        setShowModal(true);
                      }} className="text-blue-600 font-black text-xs bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition">ویرایش</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-600 font-black text-xs bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product List - Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-indigo-600 mb-1">{toPersianNumbers(p.code)}</p>
                <h4 className="font-black text-slate-800 text-lg">{p.name}</h4>
              </div>
              <div className={`px-3 py-1 rounded-xl text-[10px] font-black ${p.quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {toPersianNumbers(p.quantity)} عدد
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl mb-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 mb-1">قیمت خرید:</p>
                <p className="text-xs font-bold text-slate-600">{formatCurrency(p.buyPrice)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-indigo-400 mb-1">قیمت فروش:</p>
                <p className="text-sm font-black text-indigo-900">{formatCurrency(p.sellPrice)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => {
                setEditingProduct(p);
                setFormData({
                  code: p.code, name: p.name, buyPrice: p.buyPrice.toString(),
                  shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(),
                  quantity: p.quantity.toString(), date: p.date
                });
                setShowModal(true);
              }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-xs active:bg-indigo-600 active:text-white transition">ویرایش</button>
              <button onClick={() => deleteProduct(p.id)} className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-black text-xs active:bg-red-600 active:text-white transition">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {/* Improved Modal - Full Screen on Mobile, Centered on Desktop */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:w-[600px] lg:w-[850px] md:rounded-[3rem] shadow-2xl relative z-[110] flex flex-col animate-fadeIn">
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-2xl text-2xl">👕</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black">
                    {editingProduct ? 'ویرایش اطلاعات کالا' : 'ثبت کالای جدید'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sirjan Poosh Inventory</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-3xl transition-all active:scale-90"
              >
                &times;
              </button>
            </div>
            
            {/* Modal Form Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-slate-50">
              <form id="product-form" onSubmit={saveProduct} className="space-y-8 pb-4">
                
                {/* Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                    <h4 className="font-black text-slate-800">اطلاعات پایه</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 mr-2">کد کالا</label>
                      <input required placeholder="مثلاً: SP-101" className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-white transition-all text-sm" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 mr-2">نام کالا</label>
                      <input required placeholder="نام کامل محصول را وارد کنید..." className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-white transition-all text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 mr-2">تاریخ ثبت</label>
                      <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-white transition-all text-center text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 mr-2">تعداد موجودی</label>
                      <input required type="text" className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-center bg-indigo-50/50 text-indigo-700 text-lg" value={toPersianNumbers(formData.quantity)} onChange={e => handleNumericChange('quantity', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Financial Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-6 bg-emerald-600 rounded-full"></span>
                    <h4 className="font-black text-slate-800">بخش مالی و محاسبات سود</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 mr-2">قیمت خرید (تومان)</label>
                      <input required type="text" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-lg bg-white outline-none focus:border-emerald-500 text-center" value={toPersianNumbers(formatWithCommas(formData.buyPrice))} onChange={e => handleNumericChange('buyPrice', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 mr-2">هزینه کرایه (تومان)</label>
                      <input type="text" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-lg bg-white outline-none focus:border-emerald-500 text-center" value={toPersianNumbers(formatWithCommas(formData.shippingCost))} onChange={e => handleNumericChange('shippingCost', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 mr-2">درصد سود (٪)</label>
                      <input type="text" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-2xl bg-white outline-none focus:border-emerald-500 text-center" value={toPersianNumbers(formData.marginPercent)} onChange={e => handleNumericChange('marginPercent', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Final Price Result Panel */}
                <div className="bg-indigo-900 rounded-[2rem] p-6 md:p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="text-center md:text-right relative z-10">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">قیمت تمام شده (خرید + کرایه):</p>
                    <p className="text-xl md:text-2xl font-black">{formatCurrency(calculateTotalCost())}</p>
                  </div>
                  <div className="h-px w-full md:w-px md:h-12 bg-white/10 hidden md:block"></div>
                  <div className="text-center bg-white/10 px-8 py-5 md:py-6 rounded-[1.5rem] border border-white/5 transform transition-transform hover:scale-105 relative z-10 w-full md:w-auto">
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">قیمت نهایی برای فروش:</p>
                    <p className="text-3xl md:text-4xl font-black text-white">{formatCurrency(calculateFinalPrice())}</p>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Actions */}
            <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-3 md:gap-4 shrink-0">
              <button 
                type="submit" 
                form="product-form"
                className="flex-[2] bg-indigo-600 text-white py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                ✅ {editingProduct ? 'بروزرسانی تغییرات' : 'ثبت و تایید نهایی'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="flex-1 bg-slate-100 text-slate-500 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg hover:bg-slate-200 transition-all active:scale-95"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
