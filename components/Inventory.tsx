
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

  // جلوگیری از اسکرول بدنه هنگام باز بودن مودال
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

      {/* Modal Re-designed */}
      {showModal && (
        <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md flex items-center justify-center p-2 md:p-6 z-[200] overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-full md:max-h-[90vh] shadow-2xl overflow-hidden animate-fadeIn flex flex-col my-auto border-4 border-white">
            <div className="p-6 md:p-8 bg-indigo-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-black">{editingProduct ? 'ویرایش اطلاعات کالا' : 'ثبت کالای جدید انبار'}</h3>
                <p className="text-[10px] text-indigo-200 mt-1 uppercase tracking-widest">Sirjan Poosh Inventory System</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl text-3xl transition-all">&times;</button>
            </div>
            
            <form onSubmit={saveProduct} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 mr-2">کد اختصاصی کالا</label>
                  <input required placeholder="مثلاً: SP-400" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-gray-50 transition-all" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 mr-2">نام کالا (نوع پوشاک)</label>
                  <input required placeholder="مثلاً: تیشرت نخی لانگ" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-gray-50 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 mr-2">تاریخ ثبت (شمسی)</label>
                  <input required className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-gray-50 text-center" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-black text-gray-500 mr-2">تعداد موجودی در انبار</label>
                   <input type="text" placeholder="۰" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-2xl text-center bg-gray-50" value={toPersianNumbers(formData.quantity)} onChange={e => handleNumericChange('quantity', e.target.value)} required />
                </div>
              </div>

              <div className="bg-indigo-50 p-6 md:p-8 rounded-[2.5rem] border-2 border-dashed border-indigo-200 space-y-6">
                <h4 className="font-black text-indigo-900 text-center border-b border-indigo-100 pb-2">تنظیمات قیمت‌گذاری و سود</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 block mb-1">قیمت خرید (تومان)</label>
                    <input type="text" className="w-full p-4 border-2 border-white rounded-2xl font-black text-indigo-600 shadow-sm outline-none focus:border-indigo-500" value={toPersianNumbers(formatWithCommas(formData.buyPrice))} onChange={e => handleNumericChange('buyPrice', e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 block mb-1">هزینه کرایه حمل</label>
                    <input type="text" className="w-full p-4 border-2 border-white rounded-2xl font-black shadow-sm outline-none focus:border-indigo-500" value={toPersianNumbers(formatWithCommas(formData.shippingCost))} onChange={e => handleNumericChange('shippingCost', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 block mb-1">درصد سود (٪)</label>
                    <input type="text" className="w-full p-4 border-2 border-white rounded-2xl font-black shadow-sm outline-none focus:border-indigo-500" value={toPersianNumbers(formData.marginPercent)} onChange={e => handleNumericChange('marginPercent', e.target.value)} />
                  </div>
                </div>
                
                <div className="pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-center md:text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase">قیمت تمام شده:</p>
                    <p className="font-black text-lg text-gray-700">{formatCurrency(calculateTotalCost())}</p>
                  </div>
                  <div className="bg-indigo-600 p-4 px-8 rounded-3xl shadow-xl w-full md:w-auto text-center">
                    <p className="text-[10px] font-black text-indigo-200 mb-1 uppercase">قیمت نهایی فروش:</p>
                    <p className="text-2xl font-black text-white">{formatCurrency(calculateFinalPrice())}</p>
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 md:p-8 bg-gray-50 border-t flex flex-col md:flex-row gap-4 shrink-0">
              <button type="button" onClick={saveProduct} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
                {editingProduct ? 'بروزرسانی تغییرات کالا' : 'تایید و ثبت نهایی در انبار'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white text-gray-500 py-5 rounded-[1.5rem] font-black text-lg border-2 border-gray-200 hover:bg-gray-100 transition-all">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
