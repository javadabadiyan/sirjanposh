
import React, { useState } from 'react';
import { AppData, Product } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, parseRawNumber } from '../utils/formatters';
import * as XLSX from 'xlsx';

interface InventoryProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const Inventory: React.FC<InventoryProps> = ({ data, setData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    code: '', 
    name: '', 
    buyPrice: '0', 
    shippingCost: '0', 
    marginPercent: '0', 
    quantity: '0'
  });

  // محاسبه قیمت نهایی فروش: (خرید + کرایه) * (1 + درصد سود/100)
  const calculateFinalPrice = () => {
    const buyPrice = parseRawNumber(formData.buyPrice);
    const shipping = parseRawNumber(formData.shippingCost);
    const margin = parseRawNumber(formData.marginPercent);
    const baseCost = buyPrice + shipping;
    const finalPrice = baseCost + (baseCost * (margin / 100));
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
      date: editingProduct ? editingProduct.date : getCurrentJalaliDate()
    };

    if (editingProduct) {
      setData({ ...data, products: data.products.map(p => p.id === editingProduct.id ? newProduct : p) });
    } else {
      setData({ ...data, products: [...data.products, newProduct] });
    }
    
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ code: '', name: '', buyPrice: '0', shippingCost: '0', marginPercent: '0', quantity: '0' });
  };

  const formatInputNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const deleteProduct = (id: string) => {
    if (confirm('آیا از حذف این کالا از لیست انبار اطمینان دارید؟')) {
      setData({ ...data, products: data.products.filter(p => p.id !== id) });
    }
  };

  const exportToExcel = () => {
    const wsData = data.products.map(p => ({
      'کد کالا': toPersianNumbers(p.code),
      'نام کالا': p.name,
      'قیمت خرید (تومان)': p.buyPrice,
      'هزینه حمل (تومان)': p.shippingCost,
      'درصد سود (%)': toPersianNumbers(p.marginPercent),
      'قیمت فروش نهایی (تومان)': p.sellPrice,
      'تعداد': toPersianNumbers(p.quantity),
      'تاریخ ثبت': p.date
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SirjanPooshInventory");
    XLSX.writeFile(wb, "Inventory_Backup.xlsx");
  };

  const filtered = data.products.filter(p => p.name.includes(searchTerm) || p.code.includes(searchTerm));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="جستجوی کالا بر اساس نام یا کد..." 
            className="w-full pr-12 pl-4 py-4 border-2 border-gray-50 bg-gray-50 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-4 top-4 text-xl opacity-30">🔍</span>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => { setEditingProduct(null); setShowModal(true); }}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> ثبت کالای جدید
          </button>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-6 py-4 rounded-2xl hover:bg-green-700 transition font-black shadow-xl shadow-green-100 flex items-center gap-2">
            <span>📊</span> خروجی اکسل
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-indigo-900 text-white">
                <th className="py-6 px-8 font-black">کد</th>
                <th className="py-6 px-8 font-black">نام محصول</th>
                <th className="py-6 px-8 font-black">قیمت فروش</th>
                <th className="py-6 px-8 font-black text-center">تعداد</th>
                <th className="py-6 px-8 font-black text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="py-5 px-8 font-black text-indigo-600">{toPersianNumbers(p.code)}</td>
                  <td className="py-5 px-8 font-bold text-gray-800">{p.name}</td>
                  <td className="py-5 px-8 font-black text-lg text-indigo-900">{formatCurrency(p.sellPrice)}</td>
                  <td className="py-5 px-8 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black ${p.quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {toPersianNumbers(p.quantity)} عدد
                    </span>
                  </td>
                  <td className="py-5 px-8 text-center">
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => {
                          setEditingProduct(p);
                          setFormData({
                            code: p.code, name: p.name, buyPrice: p.buyPrice.toString(),
                            shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(),
                            quantity: p.quantity.toString()
                          });
                          setShowModal(true);
                        }}
                        className="text-blue-600 font-black hover:bg-blue-50 px-3 py-1.5 rounded-xl transition"
                      >ویرایش</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-500 font-black hover:bg-red-50 px-3 py-1.5 rounded-xl transition">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-24 text-center text-gray-400 font-black text-xl">هیچ کالایی در لیست انبار موجود نیست</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-fadeIn border-4 border-white">
            <div className="p-8 bg-indigo-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">{editingProduct ? 'ویرایش کالا' : 'ثبت کالای جدید'}</h3>
                <p className="text-xs text-indigo-300 mt-1">اطلاعات فنی و قیمت‌گذاری محصول را دقیق وارد کنید</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-4xl hover:rotate-90 transition text-indigo-300">&times;</button>
            </div>
            
            <form onSubmit={saveProduct} className="p-10 space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-600 mr-2">کد اختصاصی کالا</label>
                  <input required placeholder="مثلاً: SP-102" className="w-full p-4 border-2 border-gray-100 rounded-[1.5rem] outline-none focus:border-indigo-500 font-bold bg-gray-50 transition-all" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-600 mr-2">نام کالا (نوع پوشاک)</label>
                  <input required placeholder="مثلاً: پیراهن مردانه نخی" className="w-full p-4 border-2 border-gray-100 rounded-[1.5rem] outline-none focus:border-indigo-500 font-bold bg-gray-50 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>

              {/* Financial Calculations */}
              <div className="bg-indigo-50 p-8 rounded-[2rem] border-2 border-dashed border-indigo-200 space-y-6">
                <h4 className="font-black text-indigo-900 text-center mb-2">محاسبه قیمت تمام شده و سود</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 mr-2">قیمت خرید (تومان)</label>
                    <input 
                      type="text" 
                      className="w-full p-4 border-2 border-white rounded-2xl outline-none focus:border-indigo-500 font-black text-indigo-600 shadow-sm" 
                      value={toPersianNumbers(formatInputNumber(formData.buyPrice))} 
                      onChange={e => setFormData({...formData, buyPrice: e.target.value.replace(/[^0-9]/g, '')})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 mr-2">هزینه کرایه حمل (تومان)</label>
                    <input 
                      type="text" 
                      className="w-full p-4 border-2 border-white rounded-2xl outline-none focus:border-indigo-500 font-black shadow-sm" 
                      value={toPersianNumbers(formatInputNumber(formData.shippingCost))} 
                      onChange={e => setFormData({...formData, shippingCost: e.target.value.replace(/[^0-9]/g, '')})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 mr-2">درصد سود (٪)</label>
                    <input 
                      type="number" 
                      className="w-full p-4 border-2 border-white rounded-2xl outline-none focus:border-indigo-500 font-black shadow-sm" 
                      value={formData.marginPercent} 
                      onChange={e => setFormData({...formData, marginPercent: e.target.value})} 
                    />
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-indigo-200">
                  <div className="text-center md:text-right">
                    <p className="text-xs font-black text-gray-400">قیمت تمام شده برای شما:</p>
                    <p className="font-black text-gray-700">{formatCurrency(parseRawNumber(formData.buyPrice) + parseRawNumber(formData.shippingCost))}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">قیمت نهایی فروش (با احتساب سود):</p>
                    <p className="text-4xl font-black text-indigo-700">{formatCurrency(calculateFinalPrice())}</p>
                  </div>
                </div>
              </div>

              {/* Stock Info */}
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-600 mr-2">تعداد موجودی در انبار</label>
                <input type="number" placeholder="0" className="w-full p-4 border-2 border-gray-100 rounded-[1.5rem] outline-none focus:border-indigo-500 font-black text-xl text-center bg-gray-50" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
              </div>
              
              <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[1.5rem] font-black text-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all active:scale-95">
                {editingProduct ? 'بروزرسانی کالا' : 'تایید و ثبت کالا در انبار'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
