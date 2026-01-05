
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

  // Prevent body scroll when modal is open
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

    const existingProduct = data.products?.find(p => 
      p.code.trim() === formData.code.trim() && 
      (!editingProduct || p.id !== editingProduct.id)
    );

    if (existingProduct) {
      const confirmSave = confirm(`هشدار: کد کالای "${toPersianNumbers(formData.code)}" قبلاً برای "${existingProduct.name}" ثبت شده است. مایل به ثبت هستید؟`);
      if (!confirmSave) return;
    }

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
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="جستجوی نام یا کد کالا..." 
            className="w-full pr-12 pl-4 py-4 border-2 border-gray-50 bg-gray-50 rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-4 top-4 text-xl opacity-30">🔍</span>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => { setEditingProduct(null); setFormData({ code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate() }); setShowModal(true); }}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> ثبت کالای جدید
          </button>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-6 py-4 rounded-2xl hover:bg-green-700 transition font-black shadow-xl shadow-green-100 flex items-center gap-2">
            📊 اکسل
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[900px]">
            <thead>
              <tr className="bg-indigo-900 text-white">
                <th className="py-6 px-4 font-black">کد و نام</th>
                <th className="py-6 px-4 font-black">قیمت خرید</th>
                <th className="py-6 px-4 font-black">قیمت فروش</th>
                <th className="py-6 px-4 font-black text-center">تعداد</th>
                <th className="py-6 px-4 font-black text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="py-5 px-4">
                    <div className="font-black text-indigo-600 text-xs">{toPersianNumbers(p.code)}</div>
                    <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                  </td>
                  <td className="py-5 px-4 font-bold text-gray-400 text-xs">{formatCurrency(p.buyPrice)}</td>
                  <td className="py-5 px-4 font-black text-lg text-indigo-950">{formatCurrency(p.sellPrice)}</td>
                  <td className="py-5 px-4 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black ${p.quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {toPersianNumbers(p.quantity)} عدد
                    </span>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => {
                        setEditingProduct(p);
                        setFormData({
                          code: p.code, name: p.name, buyPrice: p.buyPrice.toString(),
                          shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(),
                          quantity: p.quantity.toString(), date: p.date
                        });
                        setShowModal(true);
                      }} className="text-blue-500 font-black hover:underline">ویرایش</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-500 font-black hover:underline">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400 font-bold">هیچ کالایی یافت نشد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Screen Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-[200] flex flex-col animate-fadeIn overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-8 bg-indigo-950 text-white flex justify-between items-center shrink-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-4 rounded-3xl text-3xl">👕</div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black">
                  {editingProduct ? 'ویرایش اطلاعات کالا' : 'ثبت کالای جدید در انبار سیرجان پوش'}
                </h3>
                <p className="text-xs text-indigo-300 mt-1 font-bold uppercase tracking-widest">Sirjan Poosh Inventory Management System</p>
              </div>
            </div>
            <button 
              onClick={() => setShowModal(false)} 
              className="w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl text-4xl transition-all font-light"
            >
              &times;
            </button>
          </div>
          
          {/* Form Content - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <div className="max-w-5xl mx-auto p-6 md:p-12">
              <form id="product-form" onSubmit={saveProduct} className="space-y-12 pb-20">
                
                {/* Section: Basic Info */}
                <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-200">
                  <h4 className="text-lg font-black text-indigo-950 mb-8 flex items-center gap-3">
                    <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                    اطلاعات پایه کالا
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 mr-2">کد اختصاصی کالا</label>
                      <input required placeholder="مثلاً: SP-102" className="w-full p-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black bg-slate-50 transition-all text-xl" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                      <label className="text-xs font-black text-slate-500 mr-2">نام کامل کالا (نوع پوشاک، رنگ، سایز)</label>
                      <input required placeholder="مثلاً: تیشرت نخی لانگ مشکی سایز XL" className="w-full p-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black bg-slate-50 transition-all text-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 mr-2">تاریخ ثبت (شمسی)</label>
                      <input required className="w-full p-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black bg-slate-50 text-center text-xl" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2">تعداد موجودی انبار</label>
                       <input type="text" placeholder="۰" className="w-full p-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-3xl text-center bg-indigo-50 text-indigo-700 shadow-inner" value={toPersianNumbers(formData.quantity)} onChange={e => handleNumericChange('quantity', e.target.value)} required />
                    </div>
                  </div>
                </div>

                {/* Section: Pricing */}
                <div className="bg-indigo-900 rounded-[3rem] p-8 md:p-12 shadow-2xl text-white">
                  <h4 className="text-lg font-black text-indigo-200 mb-8 flex items-center gap-3">
                    <span className="w-2 h-8 bg-white rounded-full"></span>
                    محاسبه قیمت و حاشیه سود
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-300 mr-2">قیمت خرید هر واحد (تومان)</label>
                      <input type="text" className="w-full p-6 border-2 border-white/10 rounded-3xl font-black text-3xl bg-white/5 outline-none focus:border-white transition-all text-center" value={toPersianNumbers(formatWithCommas(formData.buyPrice))} onChange={e => handleNumericChange('buyPrice', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-300 mr-2">هزینه حمل و نقل (تومان)</label>
                      <input type="text" className="w-full p-6 border-2 border-white/10 rounded-3xl font-black text-3xl bg-white/5 outline-none focus:border-white transition-all text-center" value={toPersianNumbers(formatWithCommas(formData.shippingCost))} onChange={e => handleNumericChange('shippingCost', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-300 mr-2">درصد سود مورد نظر (٪)</label>
                      <input type="text" placeholder="۰" className="w-full p-6 border-2 border-white/10 rounded-3xl font-black text-4xl bg-white/5 outline-none focus:border-white transition-all text-center" value={toPersianNumbers(formData.marginPercent)} onChange={e => handleNumericChange('marginPercent', e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="mt-12 pt-12 border-t border-white/10 flex flex-col md:flex-row justify-around items-center gap-10">
                    <div className="text-center">
                      <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">قیمت تمام شده برای شما:</p>
                      <p className="text-3xl font-black text-white">{formatCurrency(calculateTotalCost())}</p>
                    </div>
                    <div className="bg-white p-8 px-16 rounded-[2.5rem] shadow-2xl shadow-black/20 text-center transform scale-110">
                      <p className="text-xs font-black text-indigo-400 mb-2 uppercase tracking-widest">قیمت نهایی فروش (واحد):</p>
                      <p className="text-5xl font-black text-indigo-900">{formatCurrency(calculateFinalPrice())}</p>
                    </div>
                  </div>
                </div>

              </form>
            </div>
          </div>

          {/* Footer - Sticky Bottom */}
          <div className="p-6 md:p-10 bg-white border-t-2 border-slate-100 flex flex-col md:flex-row gap-6 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
            <button 
              type="submit" 
              form="product-form"
              className="flex-[3] bg-indigo-600 text-white py-6 rounded-3xl font-black text-2xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
            >
              <span>{editingProduct ? '💾 ذخیره تغییرات کالا' : '✅ ثبت نهایی کالا در سیستم'}</span>
            </button>
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-3xl font-black text-xl hover:bg-slate-200 transition-all"
            >
              انصراف و بازگشت
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
