
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
    code: '', 
    name: '', 
    buyPrice: '', 
    shippingCost: '', 
    marginPercent: '', 
    quantity: '',
    date: getCurrentJalaliDate()
  });

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

    const existingProduct = data.products.find(p => 
      p.code.trim() === formData.code.trim() && 
      (!editingProduct || p.id !== editingProduct.id)
    );

    if (existingProduct) {
      const confirmSave = confirm(`هشدار: کد کالای "${toPersianNumbers(formData.code)}" قبلاً برای کالا "${existingProduct.name}" ثبت شده است. آیا همچنان مایل به ثبت کالا با کد تکراری هستید؟`);
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
      registeredBy: editingProduct ? editingProduct.registeredBy : currentUser.username
    };

    if (editingProduct) {
      setData({ ...data, products: data.products.map(p => p.id === editingProduct.id ? newProduct : p) });
    } else {
      setData({ ...data, products: [...data.products, newProduct] });
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
    if (confirm('آیا از حذف این کالا از لیست انبار اطمینان دارید؟')) {
      setData({ ...data, products: data.products.filter(p => p.id !== id) });
    }
  };

  const exportToExcel = () => {
    const wsData = data.products.map(p => {
      const unitProfit = p.sellPrice - (p.buyPrice + p.shippingCost);
      return {
        'کد کالا': p.code,
        'نام کالا': p.name,
        'قیمت خرید (تومان)': p.buyPrice,
        'هزینه حمل (تومان)': p.shippingCost,
        'درصد سود (%)': p.marginPercent,
        'سود خالص هر کالا (تومان)': unitProfit,
        'قیمت فروش نهایی (تومان)': p.sellPrice,
        'تعداد': p.quantity,
        'تاریخ ثبت': p.date,
        'ثبت توسط': p.registeredBy || 'نامشخص'
      };
    });
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SirjanPooshInventory");
    XLSX.writeFile(wb, "Inventory_List.xlsx");
  };

  const filtered = data.products.filter(p => p.name.includes(searchTerm) || p.code.includes(searchTerm));

  return (
    <div className="space-y-6 animate-fadeIn">
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
            onClick={() => { setEditingProduct(null); setFormData({ code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate() }); setShowModal(true); }}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> ثبت کالای جدید
          </button>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-6 py-4 rounded-2xl hover:bg-green-700 transition font-black shadow-xl shadow-green-100 flex items-center gap-2">
            <span>📊</span> خروجی اکسل
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[1000px] lg:min-w-0">
            <thead>
              <tr className="bg-indigo-900 text-white text-xs md:text-sm">
                <th className="py-6 px-4 font-black">کد / نام</th>
                <th className="py-6 px-4 font-black">قیمت خرید</th>
                <th className="py-6 px-4 font-black">کرایه حمل</th>
                <th className="py-6 px-4 font-black">سود واحد</th>
                <th className="py-6 px-4 font-black">قیمت فروش</th>
                <th className="py-6 px-4 font-black text-center">تعداد</th>
                <th className="py-6 px-4 font-black text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => {
                const unitProfit = p.sellPrice - (p.buyPrice + p.shippingCost);
                return (
                  <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-5 px-4">
                      <div className="font-black text-indigo-600 text-xs">{toPersianNumbers(p.code)}</div>
                      <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                    </td>
                    <td className="py-5 px-4 font-bold text-gray-500 text-xs">{formatCurrency(p.buyPrice)}</td>
                    <td className="py-5 px-4 font-bold text-gray-500 text-xs">{formatCurrency(p.shippingCost)}</td>
                    <td className="py-5 px-4">
                      <div className="bg-green-50 text-green-700 px-3 py-1 rounded-xl text-[11px] font-black inline-block border border-green-100">
                        {formatCurrency(unitProfit)}
                      </div>
                    </td>
                    <td className="py-5 px-4 font-black text-lg text-indigo-950">{formatCurrency(p.sellPrice)}</td>
                    <td className="py-5 px-4 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black ${p.quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {toPersianNumbers(p.quantity)} عدد
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <div className="flex justify-center gap-2">
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
                          className="text-blue-600 font-black hover:bg-blue-50 px-2 py-1 rounded-lg transition text-xs"
                        >ویرایش</button>
                        <button onClick={() => deleteProduct(p.id)} className="text-red-500 font-black hover:bg-red-50 px-2 py-1 rounded-lg transition text-xs">حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 md:p-6 z-[200]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden animate-fadeIn border-4 border-white flex flex-col">
            {/* Header - Fixed */}
            <div className="p-6 md:p-8 bg-indigo-950 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-black">{editingProduct ? 'ویرایش کالا' : 'ثبت کالای جدید'}</h3>
                <p className="text-[10px] md:text-xs text-indigo-300 mt-1">اطلاعات فنی و قیمت‌گذاری محصول</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-2xl transition-all"
              >
                &times;
              </button>
            </div>
            
            {/* Form Content - Scrollable */}
            <form onSubmit={saveProduct} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 mr-2">کد اختصاصی کالا</label>
                  <input required placeholder="مثلاً: SP-102" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-gray-50 transition-all" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 mr-2">نام کالا (نوع پوشاک)</label>
                  <input required placeholder="مثلاً: پیراهن مردانه نخی" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-gray-50 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 mr-2">تاریخ ثبت (شمسی)</label>
                  <input required placeholder="۱۴۰۴/۰۱/۲۰" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-gray-50 transition-all text-center" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-gray-500 mr-2">تعداد موجودی</label>
                   <input type="text" placeholder="۵۰" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-xl text-center bg-gray-50" value={toPersianNumbers(formData.quantity)} onChange={e => handleNumericChange('quantity', e.target.value)} required />
                </div>
              </div>

              <div className="bg-indigo-50 p-6 md:p-8 rounded-[2rem] border-2 border-dashed border-indigo-200 space-y-6">
                <h4 className="font-black text-indigo-900 text-center mb-2">محاسبه سود و قیمت نهایی</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 mr-1">قیمت خرید (تومان)</label>
                    <input type="text" className="w-full p-4 border-2 border-white rounded-xl outline-none focus:border-indigo-500 font-black text-indigo-600 shadow-sm" value={toPersianNumbers(formatWithCommas(formData.buyPrice))} onChange={e => handleNumericChange('buyPrice', e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 mr-1">کرایه حمل (تومان)</label>
                    <input type="text" className="w-full p-4 border-2 border-white rounded-xl outline-none focus:border-indigo-500 font-black shadow-sm" value={toPersianNumbers(formatWithCommas(formData.shippingCost))} onChange={e => handleNumericChange('shippingCost', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 mr-1">درصد سود (٪)</label>
                    <input type="text" className="w-full p-4 border-2 border-white rounded-xl outline-none focus:border-indigo-500 font-black shadow-sm" value={toPersianNumbers(formData.marginPercent)} onChange={e => handleNumericChange('marginPercent', e.target.value)} />
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-indigo-200">
                  <div className="text-center md:text-right">
                    <p className="text-[10px] font-black text-gray-400">قیمت تمام شده:</p>
                    <p className="font-black text-lg text-gray-700">{formatCurrency(calculateTotalCost())}</p>
                  </div>
                  <div className="text-center md:text-left bg-indigo-600 p-4 px-6 rounded-2xl shadow-xl w-full md:w-auto">
                    <p className="text-[9px] font-black text-indigo-100 uppercase mb-1">قیمت نهایی فروش:</p>
                    <p className="text-xl md:text-2xl font-black text-white">{formatCurrency(calculateFinalPrice())}</p>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer Buttons - Fixed */}
            <div className="p-6 bg-gray-50 border-t flex flex-col md:flex-row gap-3 shrink-0">
              <button 
                type="submit" 
                onClick={saveProduct}
                className="w-full md:flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
              >
                {editingProduct ? 'بروزرسانی کالا' : 'تایید و ثبت کالا'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="w-full md:flex-1 bg-white text-gray-500 py-4 rounded-2xl font-black border-2 border-gray-200 hover:bg-gray-50 transition-all"
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
