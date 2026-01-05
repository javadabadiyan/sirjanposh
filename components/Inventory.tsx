
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

  useEffect(() => {
    if (showModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
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
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "SirjanPoosh_Inventory.xlsx");
  };

  const filtered = (data.products || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200/60">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="جستجوی نام یا کد کالا..." 
            className="w-full pr-11 pl-4 py-3.5 md:py-4 border-2 border-slate-50 bg-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg opacity-30">🔍</span>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => { setEditingProduct(null); setFormData({ code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate() }); setShowModal(true); }}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-5 md:px-8 py-3.5 md:py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <span className="text-xl leading-none">+</span> ثبت کالا
          </button>
          <button onClick={exportToExcel} className="bg-green-600 text-white p-3.5 md:px-6 md:py-4 rounded-2xl hover:bg-green-700 transition font-black shadow-lg flex items-center gap-2 text-sm">
            <span className="hidden md:inline">اکسل</span> 📊
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[900px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-6 px-4 font-black">کد و نام محصول</th>
                <th className="py-6 px-4 font-black">قیمت خرید</th>
                <th className="py-6 px-4 font-black">قیمت فروش</th>
                <th className="py-6 px-4 font-black text-center">تعداد</th>
                <th className="py-6 px-4 font-black text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-4">
                    <div className="font-black text-indigo-600 text-[10px]">{toPersianNumbers(p.code)}</div>
                    <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                  </td>
                  <td className="py-5 px-4 font-bold text-slate-400 text-xs">{formatCurrency(p.buyPrice)}</td>
                  <td className="py-5 px-4 font-black text-slate-900 text-sm">{formatCurrency(p.sellPrice)}</td>
                  <td className="py-5 px-4 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${p.quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {toPersianNumbers(p.quantity)} عدد
                    </span>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <div className="flex justify-center gap-4">
                      <button onClick={() => {
                        setEditingProduct(p);
                        setFormData({
                          code: p.code, name: p.name, buyPrice: p.buyPrice.toString(),
                          shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(),
                          quantity: p.quantity.toString(), date: p.date
                        });
                        setShowModal(true);
                      }} className="text-blue-500 font-black text-xs hover:underline">ویرایش</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-500 font-black text-xs hover:underline">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm active:scale-[0.98] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black block w-fit mb-1">{toPersianNumbers(p.code)}</span>
                <h4 className="font-black text-slate-900 text-base">{p.name}</h4>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {toPersianNumbers(p.quantity)} عدد
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-4 rounded-2xl">
               <div>
                 <p className="text-[9px] font-bold text-slate-400 mb-1">قیمت خرید:</p>
                 <p className="text-xs font-bold text-slate-500">{formatCurrency(p.buyPrice)}</p>
               </div>
               <div>
                 <p className="text-[9px] font-bold text-indigo-400 mb-1">قیمت فروش:</p>
                 <p className="text-sm font-black text-indigo-900">{formatCurrency(p.sellPrice)}</p>
               </div>
            </div>

            <div className="flex gap-2 border-t pt-4">
               <button 
                  onClick={() => {
                    setEditingProduct(p);
                    setFormData({
                      code: p.code, name: p.name, buyPrice: p.buyPrice.toString(),
                      shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(),
                      quantity: p.quantity.toString(), date: p.date
                    });
                    setShowModal(true);
                  }}
                  className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-xs"
               >ویرایش</button>
               <button 
                  onClick={() => deleteProduct(p.id)}
                  className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-black text-xs"
               >حذف</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <p className="text-slate-400 font-bold">هیچ کالایی یافت نشد 🧐</p>
          </div>
        )}
      </div>

      {/* Modal - Already improved in previous turns, but ensuring full responsiveness */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-0 md:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[95vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative border-4 border-white">
            
            <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-2xl text-2xl">👕</div>
                <div>
                  <h3 className="text-lg md:text-2xl font-black">
                    {editingProduct ? 'ویرایش اطلاعات کالا' : 'ثبت کالای جدید'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Inventory Management</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-2xl transition-all active:scale-90"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 md:p-10 custom-scrollbar bg-slate-50">
              <form id="product-form" onSubmit={saveProduct} className="space-y-6 md:space-y-10 pb-4">
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                    <h4 className="font-black text-slate-800 text-sm md:text-base">اطلاعات کالا</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 mr-2">کد محصول</label>
                      <input required placeholder="مثلاً: SP-101" className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-white transition-all text-sm" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 mr-2">نام کالا</label>
                      <input required placeholder="نام کامل پوشاک..." className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-white transition-all text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 mr-2">تاریخ ورود</label>
                      <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-white transition-all text-center text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 mr-2">موجودی انبار</label>
                      <input required type="text" className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-center bg-indigo-50/50 text-indigo-700" value={toPersianNumbers(formData.quantity)} onChange={e => handleNumericChange('quantity', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
                    <h4 className="font-black text-slate-800 text-sm md:text-base">بخش مالی و سود</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 mr-2">قیمت خرید (تومان)</label>
                      <input required type="text" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-base md:text-lg bg-white outline-none focus:border-indigo-500 text-center" value={toPersianNumbers(formatWithCommas(formData.buyPrice))} onChange={e => handleNumericChange('buyPrice', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 mr-2">کرایه حمل (تومان)</label>
                      <input type="text" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-base md:text-lg bg-white outline-none focus:border-indigo-500 text-center" value={toPersianNumbers(formatWithCommas(formData.shippingCost))} onChange={e => handleNumericChange('shippingCost', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 mr-2">درصد سود (٪)</label>
                      <input type="text" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-xl md:text-2xl bg-white outline-none focus:border-indigo-500 text-center" value={toPersianNumbers(formData.marginPercent)} onChange={e => handleNumericChange('marginPercent', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                  <div className="text-center md:text-right relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">قیمت تمام شده:</p>
                    <p className="text-xl md:text-2xl font-black">{formatCurrency(calculateTotalCost())}</p>
                  </div>
                  <div className="h-px w-full md:w-px md:h-12 bg-white/10 hidden md:block"></div>
                  <div className="text-center bg-white/10 px-6 py-4 md:px-10 md:py-6 rounded-[1.5rem] border border-white/5 transform transition-transform hover:scale-105 relative z-10 w-full md:w-auto">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">قیمت نهایی فروش:</p>
                    <p className="text-2xl md:text-4xl font-black text-white">{formatCurrency(calculateFinalPrice())}</p>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 md:p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-3 md:gap-4 shrink-0">
              <button 
                type="submit" 
                form="product-form"
                className="flex-[2] bg-indigo-600 text-white py-4 md:py-5 rounded-[1.25rem] md:rounded-[1.5rem] font-black text-lg md:text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                ✅ {editingProduct ? 'بروزرسانی تغییرات' : 'ثبت نهایی کالا'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="flex-1 bg-slate-100 text-slate-500 py-4 md:py-5 rounded-[1.25rem] md:rounded-[1.5rem] font-black text-base md:text-lg hover:bg-slate-200 transition-all active:scale-95"
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
