
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

    // چک کردن کد تکراری کالا
    const duplicateProduct = data.products.find(p => 
      p.code.trim() === formData.code.trim() && p.id !== (editingProduct?.id || '')
    );

    if (duplicateProduct) {
      const confirmDuplicate = confirm(`⚠️ هشدار: کد کالای "${formData.code}" قبلاً برای محصول "${duplicateProduct.name}" ثبت شده است. آیا مایلید کالا با کد تکراری ثبت شود؟`);
      if (!confirmDuplicate) return;
    }

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
      const profitPerUnit = p.sellPrice - (p.buyPrice + p.shippingCost);
      return {
        'کد کالا': p.code,
        'نام کالا': p.name,
        'قیمت خرید اصلی (تومان)': formatWithCommas(p.buyPrice),
        'هزینه کرایه (تومان)': formatWithCommas(p.shippingCost),
        'قیمت تمام شده (تومان)': formatWithCommas(p.buyPrice + p.shippingCost),
        'مبلغ سود خالص هر عدد (تومان)': formatWithCommas(profitPerUnit),
        'درصد سود (%)': p.marginPercent,
        'قیمت نهایی فروش (تومان)': formatWithCommas(p.sellPrice),
        'موجودی فعلی': p.quantity,
        'تعداد فروخته شده': sold,
        'کل ورودی انبار': p.quantity + sold,
        'تاریخ ثبت': p.date
      };
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory_SirjanPoosh");
    XLSX.writeFile(wb, `Inventory_Report_${getCurrentJalaliDate().replace(/\//g, '-')}.xlsx`);
  };

  const filtered = (data.products || []).filter(p => 
    p.name.includes(searchTerm) || p.code.includes(searchTerm)
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn pb-16 w-full">
      {/* هدر بخش انبار */}
      <div className="flex flex-col md:flex-row justify-between items-stretch gap-3 bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <input type="text" placeholder="جستجوی نام یا کد کالا..." className="w-full pr-10 py-3 md:py-4.5 bg-slate-50 border-2 border-transparent rounded-xl md:rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all text-xs md:text-sm shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg opacity-30">🔍</span>
        </div>
        <div className="flex gap-2 h-[48px] md:h-auto">
          <button onClick={() => { setEditingProduct(null); setFormData({ code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate() }); setShowModal(true); }} className="flex-1 md:flex-none bg-indigo-600 text-white px-4 md:px-10 rounded-xl md:rounded-2xl font-black hover:bg-indigo-700 shadow-xl transition-all active:scale-95 text-xs md:text-base">+ کالا جدید</button>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-4 rounded-xl md:rounded-2xl font-black hover:bg-green-700 shadow-lg transition-all active:scale-95 flex items-center justify-center text-lg md:text-xl" title="خروجی اکسل کامل">📊</button>
        </div>
      </div>

      {/* لیست کالاها */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filtered.map(p => {
          const sold = getSoldCount(p.id);
          const totalInventory = p.quantity + sold;
          const soldPercentage = totalInventory > 0 ? (sold / totalInventory) * 100 : 0;
          const isLowStock = p.quantity <= 3;
          const unitProfit = p.sellPrice - (p.buyPrice + p.shippingCost);

          return (
            <div key={p.id} className="bg-white p-5 md:p-7 rounded-[1.8rem] md:rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-1.5 h-full transition-colors ${isLowStock ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`}></div>
              
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <div className="space-y-1 overflow-hidden pr-2">
                  <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">{toPersianNumbers(p.code)}</span>
                  <h4 className="font-black text-slate-800 text-base md:text-lg leading-tight truncate">{p.name}</h4>
                  <p className="text-[8px] text-slate-400 font-bold">ثبت: {toPersianNumbers(p.date)}</p>
                </div>
                {isLowStock && (
                  <div className="bg-red-100 text-red-600 p-1.5 rounded-lg text-sm md:text-lg animate-bounce shrink-0">⚠️</div>
                )}
              </div>

              <div className="bg-slate-50 rounded-[1.2rem] md:rounded-[2rem] p-3 md:p-5 mb-4 md:mb-6 border border-slate-100">
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="border-l border-slate-200">
                    <p className="text-[7px] md:text-[9px] font-black text-slate-400 mb-1">ورودی</p>
                    <p className="text-[10px] md:text-xs font-black text-slate-600">{toPersianNumbers(totalInventory)}</p>
                  </div>
                  <div className="border-l border-slate-200">
                    <p className="text-[7px] md:text-[9px] font-black text-indigo-400 mb-1">فروش</p>
                    <p className="text-[10px] md:text-xs font-black text-indigo-700">{toPersianNumbers(sold)}</p>
                  </div>
                  <div>
                    <p className={`text-[7px] md:text-[9px] font-black mb-1 ${isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>مانده</p>
                    <p className={`text-sm md:text-base font-black ${isLowStock ? 'text-red-600' : 'text-emerald-600'}`}>{toPersianNumbers(p.quantity)}</p>
                  </div>
                </div>
              </div>

              {/* جدول جزئیات مالی در کارت کالا */}
              <div className="mb-5 bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800">
                 <div className="grid grid-cols-2 text-[9px] font-black text-slate-400 border-b border-slate-800/50">
                    <div className="p-2 border-l border-slate-800/50">عنوان</div>
                    <div className="p-2">مبلغ (تومان)</div>
                 </div>
                 <div className="grid grid-cols-2 text-[10px] border-b border-slate-800/30">
                    <div className="p-2 border-l border-slate-800/30 font-bold">قیمت خرید</div>
                    <div className="p-2 font-black text-slate-200">{formatCurrency(p.buyPrice).replace(' تومان', '')}</div>
                 </div>
                 <div className="grid grid-cols-2 text-[10px] border-b border-slate-800/30">
                    <div className="p-2 border-l border-slate-800/30 font-bold">هزینه کرایه</div>
                    <div className="p-2 font-black text-slate-200">{formatCurrency(p.shippingCost).replace(' تومان', '')}</div>
                 </div>
                 <div className="grid grid-cols-2 text-[10px] bg-emerald-950/30">
                    <div className="p-2 border-l border-slate-800/30 font-black text-emerald-400">سود هر واحد</div>
                    <div className="p-2 font-black text-emerald-400">{formatCurrency(unitProfit).replace(' تومان', '')}</div>
                 </div>
              </div>
              
              <div className="flex justify-between items-center mb-5 px-1">
                <div>
                  <p className="text-[8px] font-black text-slate-400">قیمت نهایی فروش (در فاکتور)</p>
                  <p className="text-base md:text-lg font-black text-indigo-600">{formatCurrency(p.sellPrice)}</p>
                </div>
                <div className="bg-indigo-50 px-2 py-1 rounded-lg">
                  <p className="text-[10px] font-black text-indigo-700">{toPersianNumbers(p.marginPercent)}٪ سود</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setEditingProduct(p); setFormData({ code: p.code, name: p.name, buyPrice: p.buyPrice.toString(), shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(), quantity: p.quantity.toString(), date: p.date }); setShowModal(true); }} className="flex-[2] bg-slate-100 text-slate-700 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 min-h-[44px]">📝 ویرایش</button>
                <button onClick={() => { if(confirm('حذف کالا؟')) setData({...data, products: data.products.filter(item => item.id !== p.id)}) }} className="flex-1 bg-red-50 text-red-500 px-3 rounded-xl md:rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all min-h-[44px]">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* مدال ثبت کالا */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/90 backdrop-blur-md safe-padding">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-2xl md:rounded-[2.5rem] shadow-2xl relative z-[1100] flex flex-col animate-fadeIn overflow-hidden">
            <div className="px-5 py-4 md:px-10 md:py-6 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg md:text-xl font-black text-slate-900">{editingProduct ? 'ویرایش کالا' : 'ثبت کالای جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl text-xl transition-all shadow-sm">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 md:p-10 bg-slate-50/30">
              <form id="product-form" onSubmit={saveProduct} className="space-y-4 md:space-y-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 mr-2">کد کالا</label><input required className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold text-center" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 mr-2">نام دقیق لباس</label><input required className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 mr-2">تعداد فعلی</label><input required type="text" className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-black text-center text-lg text-indigo-700" value={toPersianNumbers(formData.quantity)} onChange={e => handleNumericChange('quantity', e.target.value)} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 mr-2">تاریخ ثبت (قابل ویرایش)</label><input required className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold text-center" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                </div>

                <div className="p-4 md:p-6 bg-white rounded-2xl border-2 border-slate-100 shadow-inner space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 text-center block">قیمت خرید</label><input required type="text" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center text-xs" value={toPersianNumbers(formatWithCommas(formData.buyPrice))} onChange={e => handleNumericChange('buyPrice', e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 text-center block">هزینه کرایه</label><input type="text" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center text-xs" value={toPersianNumbers(formatWithCommas(formData.shippingCost))} onChange={e => handleNumericChange('shippingCost', e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 text-center block">درصد سود</label><input type="text" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center text-base text-emerald-600" value={toPersianNumbers(formData.marginPercent)} onChange={e => handleNumericChange('marginPercent', e.target.value)} /></div>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 text-white flex flex-col items-center gap-2 border-2 border-indigo-600/20 text-center">
                    <div className="text-xs">قیمت تمام شده: <span className="font-black">{formatCurrency(calculateTotalCost())}</span></div>
                    <div className="w-full bg-white/5 p-3 rounded-lg border border-white/10">
                      <p className="text-[8px] font-black text-emerald-400 mb-0.5">سود واحد: <span className="font-bold">{formatCurrency(calculateFinalPrice() - calculateTotalCost())}</span></p>
                      <p className="text-xl md:text-2xl font-black text-emerald-400">{formatCurrency(calculateFinalPrice())}</p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-5 py-4 md:px-10 md:py-6 bg-white border-t border-slate-100 flex gap-2 shrink-0">
              <button type="submit" form="product-form" className="flex-2 bg-indigo-600 text-white py-4 rounded-xl font-black text-base md:text-lg shadow-xl hover:bg-indigo-700 transition-all active:scale-95">✅ تایید و ثبت</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-500 px-3 rounded-xl font-black hover:bg-slate-200 text-xs">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
