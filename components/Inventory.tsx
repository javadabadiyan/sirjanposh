
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

  const handleCalculatePrice = () => {
    const buyPrice = parseRawNumber(formData.buyPrice);
    const shipping = parseRawNumber(formData.shippingCost);
    const margin = parseRawNumber(formData.marginPercent);
    const totalCost = buyPrice + shipping;
    return Math.round(totalCost * (1 + margin / 100));
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
      sellPrice: handleCalculatePrice(),
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

  const exportToExcel = () => {
    const wsData = data.products.map(p => ({
      'کد کالا': p.code,
      'نام کالا': p.name,
      'قیمت خرید اصلی': p.buyPrice,
      'هزینه حمل': p.shippingCost,
      'درصد سود': p.marginPercent,
      'قیمت فروش نهایی': p.sellPrice,
      'تعداد موجود': p.quantity,
      'تاریخ ثبت': p.date
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "Sirjan_Poosh_Inventory.xlsx");
  };

  const deleteProduct = (id: string) => {
    if (confirm('آیا از حذف این کالا اطمینان دارید؟')) {
      setData({ ...data, products: data.products.filter(p => p.id !== id) });
    }
  };

  const filtered = data.products.filter(p => p.name.includes(searchTerm) || p.code.includes(searchTerm));

  const formatInputNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="جستجوی سریع کالا..." 
            className="w-full pr-12 pl-4 py-4 border-2 border-gray-50 bg-gray-50 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-4 top-4 opacity-30">🔍</span>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => { setEditingProduct(null); setFormData({ code: '', name: '', buyPrice: '0', shippingCost: '0', marginPercent: '0', quantity: '0' }); setShowModal(true); }} 
            className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            + ثبت کالای جدید
          </button>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-6 py-4 rounded-2xl hover:bg-green-700 transition font-black shadow-xl shadow-green-100">📥 اکسل</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-indigo-50/50 text-indigo-950">
                <th className="py-6 px-8 font-black">کد کالا</th>
                <th className="py-6 px-8 font-black">نام محصول</th>
                <th className="py-6 px-8 font-black">قیمت فروش</th>
                <th className="py-6 px-8 font-black text-center">تعداد موجود</th>
                <th className="py-6 px-8 font-black text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-indigo-50/10 transition-colors group">
                  <td className="py-5 px-8 font-black text-indigo-600">{toPersianNumbers(p.code)}</td>
                  <td className="py-5 px-8 font-black text-gray-800">{p.name}</td>
                  <td className="py-5 px-8 font-black text-lg text-indigo-900">{formatCurrency(p.sellPrice)}</td>
                  <td className="py-5 px-8 text-center">
                    <span className={`px-4 py-1 rounded-full text-xs font-black ${p.quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {toPersianNumbers(p.quantity)} عدد
                    </span>
                  </td>
                  <td className="py-5 px-8 text-center space-x-reverse space-x-4">
                    <button 
                      onClick={() => { setEditingProduct(p); setFormData({ 
                        code: p.code, name: p.name, buyPrice: p.buyPrice.toString(), 
                        shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(), quantity: p.quantity.toString() 
                      }); setShowModal(true); }} 
                      className="text-blue-600 font-black hover:underline text-sm"
                    >ویرایش</button>
                    <button onClick={() => deleteProduct(p.id)} className="text-red-500 font-black hover:underline text-sm">حذف</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-black">هیچ کالایی یافت نشد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-8 bg-indigo-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">{editingProduct ? 'ویرایش کالا' : 'ثبت کالای جدید'}</h3>
                <p className="text-xs text-indigo-300 mt-1">اطلاعات فنی و مالی محصول را وارد کنید</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-3xl hover:rotate-90 transition">&times;</button>
            </div>
            <form onSubmit={saveProduct} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-2">کد کالا</label>
                  <input required className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-2">نام کالا</label>
                  <input required className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-2">قیمت خرید (تومان)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-indigo-600" 
                    value={toPersianNumbers(formatInputNumber(formData.buyPrice))} 
                    onChange={e => setFormData({...formData, buyPrice: e.target.value.replace(/[^0-9]/g, '')})} 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-2">هزینه حمل (تومان)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-black" 
                    value={toPersianNumbers(formatInputNumber(formData.shippingCost))} 
                    onChange={e => setFormData({...formData, shippingCost: e.target.value.replace(/[^0-9]/g, '')})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-2">درصد سود (٪)</label>
                  <input type="number" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={formData.marginPercent} onChange={e => setFormData({...formData, marginPercent: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-2">تعداد موجودی</label>
                  <input type="number" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                </div>
              </div>
              
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex justify-between items-center shadow-inner">
                <span className="font-black text-indigo-900">قیمت نهایی فروش برای مشتری:</span>
                <span className="text-3xl font-black text-indigo-600">{formatCurrency(handleCalculatePrice())}</span>
              </div>
              
              <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                ذخیره کالا در انبار
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
