
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
      const confirmSave = confirm(`هشدار: کد کالای "${toPersianNumbers(formData.code)}" قبلاً ثبت شده است. مایل به ثبت هستید؟`);
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
    if (confirm('آیا از حذف این کالا اطمینان دارید؟')) {
      setData({ ...data, products: data.products.filter(p => p.id !== id) });
    }
  };

  const exportToExcel = () => {
    const wsData = (data.products || []).map(p => ({
      'کد کالا': p.code,
      'نام کالا': p.name,
      'قیمت خرید': p.buyPrice,
      'قیمت فروش': p.sellPrice,
      'تعداد': p.quantity,
      'تاریخ': p.date
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "SirjanPoosh_Inventory.xlsx");
  };

  const filtered = (data.products || []).filter(p => p.name.includes(searchTerm) || p.code.includes(searchTerm));

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
            + کالای جدید
          </button>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-6 py-4 rounded-2xl hover:bg-green-700 transition font-black shadow-xl">
            📊 اکسل
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead>
              <tr className="bg-indigo-900 text-white">
                <th className="py-6 px-4 font-black">کد و نام</th>
                <th className="py-6 px-4 font-black">خرید</th>
                <th className="py-6 px-4 font-black">فروش واحد</th>
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
                      }} className="text-blue-500 font-black">ویرایش</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-500 font-black">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-6 z-[200] overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-full md:max-h-[90vh] shadow-2xl overflow-hidden animate-fadeIn flex flex-col my-auto">
            <div className="p-6 bg-indigo-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black">{editingProduct ? 'ویرایش کالا' : 'ثبت کالای جدید'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-3xl">&times;</button>
            </div>
            
            <form onSubmit={saveProduct} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 mr-2">کد کالا</label>
                  <input required className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-gray-50" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 mr-2">نام کالا</label>
                  <input required className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-gray-50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 mr-2">تاریخ</label>
                  <input required className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-gray-50 text-center" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-black text-gray-500 mr-2">تعداد</label>
                   <input type="text" className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-xl text-center" value={toPersianNumbers(formData.quantity)} onChange={e => handleNumericChange('quantity', e.target.value)} required />
                </div>
              </div>

              <div className="bg-indigo-50 p-6 rounded-[2rem] border-2 border-dashed border-indigo-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400">قیمت خرید</label>
                    <input type="text" className="w-full p-3 border-2 border-white rounded-xl font-black text-indigo-600" value={toPersianNumbers(formatWithCommas(formData.buyPrice))} onChange={e => handleNumericChange('buyPrice', e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400">کرایه حمل</label>
                    <input type="text" className="w-full p-3 border-2 border-white rounded-xl font-black" value={toPersianNumbers(formatWithCommas(formData.shippingCost))} onChange={e => handleNumericChange('shippingCost', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400">سود (٪)</label>
                    <input type="text" className="w-full p-3 border-2 border-white rounded-xl font-black" value={toPersianNumbers(formData.marginPercent)} onChange={e => handleNumericChange('marginPercent', e.target.value)} />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-indigo-200 flex justify-between items-center">
                  <span className="text-xs font-black text-gray-500 uppercase">قیمت نهایی فروش:</span>
                  <span className="text-2xl font-black text-indigo-900">{formatCurrency(calculateFinalPrice())}</span>
                </div>
              </div>
            </form>

            <div className="p-6 bg-gray-50 border-t flex flex-col md:flex-row gap-3 shrink-0">
              <button onClick={saveProduct} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl">تایید و ثبت کالا</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white text-gray-500 py-4 rounded-2xl font-black border-2">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
