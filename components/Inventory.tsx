
import React, { useState } from 'react';
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

  const getSoldCount = (productId: string) => {
    return data.invoices.reduce((acc, inv) => {
      const item = inv.items.find(i => i.productId === productId);
      return acc + (item ? item.quantity : 0);
    }, 0);
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
    const wsData = data.products.map(p => {
      const sold = getSoldCount(p.id);
      return {
        'کد کالا': p.code,
        'نام کالا': p.name,
        'قیمت خرید (تومان)': formatWithCommas(p.buyPrice),
        'کرایه حمل (تومان)': formatWithCommas(p.shippingCost),
        'درصد سود (%)': p.marginPercent,
        'قیمت فروش (تومان)': formatWithCommas(p.sellPrice),
        'موجودی فعلی': p.quantity,
        'تعداد فروخته شده': sold,
        'کل ورودی انبار': p.quantity + sold,
        'تاریخ ثبت': p.date
      };
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `Inventory_SirjanPoosh_${getCurrentJalaliDate().replace(/\//g, '-')}.xlsx`);
  };

  const filtered = (data.products || []).filter(p => 
    p.name.includes(searchTerm) || p.code.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-16 md:pb-10">
      <div className="flex flex-col md:flex-row justify-between items-stretch gap-4 bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <input type="text" placeholder="جستجوی نام یا کد کالا..." className="w-full pr-12 py-4.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all text-sm shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
        </div>
        <div className="flex gap-3 h-[56px] md:h-auto">
          <button onClick={() => { setEditingProduct(null); setFormData({ code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate() }); setShowModal(true); }} className="flex-1 md:flex-none bg-indigo-600 text-white px-6 md:px-10 rounded-2xl font-black hover:bg-indigo-700 shadow-xl transition-all active:scale-95 text-center whitespace-nowrap text-sm md:text-base">+ کالا جدید</button>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-5 rounded-2xl font-black hover:bg-green-700 shadow-lg transition-all active:scale-95 flex items-center justify-center text-xl" title="خروجی اکسل">📊</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {filtered.map(p => {
          const sold = getSoldCount(p.id);
          const totalInventory = p.quantity + sold;
          const soldPercentage = totalInventory > 0 ? (sold / totalInventory) * 100 : 0;
          const isLowStock = p.quantity <= 3;

          return (
            <div key={p.id} className="bg-white p-6 md:p-7 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-2 h-full transition-colors ${isLowStock ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`}></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1 overflow-hidden pr-2">
                  <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">{toPersianNumbers(p.code)}</span>
                  <h4 className="font-black text-slate-800 text-lg md:text-xl leading-tight truncate">{p.name}</h4>
                  <p className="text-[9px] text-slate-400 font-bold">ثبت: {toPersianNumbers(p.date)}</p>
                </div>
                {isLowStock && (
                  <div className="bg-red-100 text-red-600 p-2 rounded-xl text-lg animate-bounce shrink-0" title="رو به اتمام">⚠️</div>
                )}
              </div>

              <div className="bg-slate-50 rounded-[1.8rem] md:rounded-[2rem] p-4 md:p-5 mb-6 border border-slate-100">
                <div className="grid grid-cols-3 gap-1 md:gap-2 text-center">
                  <div className="border-l border-slate-200">
                    <p className="text-[8px] md:text-[9px] font-black text-slate-400 mb-1">ورودی</p>
                    <p className="text-xs md:text-sm font-black text-slate-600">{toPersianNumbers(totalInventory)}</p>
                  </div>
                  <div className="border-l border-slate-200">
                    <p className="text-[8px] md:text-[9px] font-black text-indigo-400 mb-1">فروش</p>
                    <p className="text-xs md:text-sm font-black text-indigo-700">{toPersianNumbers(sold)}</p>
                  </div>
                  <div>
                    <p className={`text-[8px] md:text-[9px] font-black mb-1 ${isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>مانده</p>
                    <p className={`text-base md:text-lg font-black ${isLowStock ? 'text-red-600' : 'text-emerald-600'}`}>{toPersianNumbers(p.quantity)}</p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[8px] md:text-[9px] font-black px-1">
                    <span className="text-slate-400">پیشرفت فروش</span>
                    <span className="text-indigo-600">{toPersianNumbers(Math.round(soldPercentage))}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${soldPercentage > 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${soldPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-6 px-1">
                <div><p className="text-[9px] font-black text-slate-400">قیمت فروش</p><p className="text-base md:text-lg font-black text-indigo-950">{formatCurrency(p.sellPrice)}</p></div>
                <div className="text-left bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                   <p className="text-[8px] font-black text-emerald-600 mb-0.5">سود</p>
                   <p className="text-[11px] font-black text-emerald-700">{toPersianNumbers(p.marginPercent)}%</p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button onClick={() => { setEditingProduct(p); setFormData({ code: p.code, name: p.name, buyPrice: p.buyPrice.toString(), shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(), quantity: p.quantity.toString(), date: p.date }); setShowModal(true); }} className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-black transition-all shadow-lg active:scale-95 min-h-[48px]">📝 ویرایش کالا</button>
                <button onClick={() => { if(confirm('با حذف کالا تمامی سوابق مرتبط نیز از انبار حذف خواهد شد. مطمئن هستید؟')) setData({...data, products: data.products.filter(item => item.id !== p.id)}) }} className="flex-1 bg-red-50 text-red-500 px-4 rounded-2xl font-black text-sm hover:bg-red-600 hover:text-white transition-all min-h-[48px]">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-6 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-2xl md:rounded-[3rem] shadow-2xl relative z-[1100] flex flex-col animate-fadeIn overflow-hidden">
            <div className="px-6 py-5 md:px-10 md:py-8 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-slate-900">{editingProduct ? 'ویرایش کالا' : 'ثبت کالای جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-2xl text-2xl transition-all shadow-sm">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/30">
              <form id="product-form" onSubmit={saveProduct} className="space-y-6 md:space-y-8 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 mr-2 uppercase">کد کالا</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-center" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 mr-2 uppercase">نام دقیق لباس</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 mr-2 uppercase">تعداد فعلی در انبار</label><input required type="text" className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-center text-xl text-indigo-700" value={toPersianNumbers(formData.quantity)} onChange={e => handleNumericChange('quantity', e.target.value)} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 mr-2 uppercase">تاریخ ثبت</label><input required className="w-full p-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-center" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                </div>

                <div className="p-5 md:p-8 bg-white rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-100 shadow-inner space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 text-center block">قیمت خرید</label><input required type="text" className="w-full p-4.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-sm" value={toPersianNumbers(formatWithCommas(formData.buyPrice))} onChange={e => handleNumericChange('buyPrice', e.target.value)} /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 text-center block">هزینه کرایه</label><input type="text" className="w-full p-4.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-sm" value={toPersianNumbers(formatWithCommas(formData.shippingCost))} onChange={e => handleNumericChange('shippingCost', e.target.value)} /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 text-center block">درصد سود</label><input type="text" className="w-full p-4.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-lg text-emerald-600" value={toPersianNumbers(formData.marginPercent)} onChange={e => handleNumericChange('marginPercent', e.target.value)} /></div>
                  </div>

                  <div className="bg-slate-900 rounded-[1.8rem] p-5 md:p-6 text-white flex flex-col justify-center items-center gap-4 border-4 border-indigo-600/20 text-center">
                    <div><p className="text-[9px] font-black text-slate-500 mb-1">قیمت تمام شده:</p><p className="text-xl font-black">{formatCurrency(calculateTotalCost())}</p></div>
                    <div className="w-full bg-white/5 p-4 rounded-2xl border border-white/10"><p className="text-[9px] font-black text-emerald-400 mb-1">قیمت نهایی فروش (برچسب):</p><p className="text-2xl md:text-3xl font-black text-emerald-400">{formatCurrency(calculateFinalPrice())}</p></div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-6 md:px-10 md:py-8 bg-white border-t border-slate-100 flex gap-3 shrink-0">
              <button type="submit" form="product-form" className="flex-2 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg md:text-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">✅ تایید و ثبت</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-500 px-4 rounded-[1.5rem] font-black hover:bg-slate-200 text-sm">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
