
import React, { useState } from 'react';
import { AppData, Product } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate } from '../utils/formatters';
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
    code: '', name: '', buyPrice: 0, shippingCost: 0, marginPercent: 0, quantity: 0
  });

  const handleCalculatePrice = () => {
    const totalCost = Number(formData.buyPrice) + Number(formData.shippingCost);
    return Math.round(totalCost * (1 + Number(formData.marginPercent) / 100));
  };

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      ...formData,
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
    setFormData({ code: '', name: '', buyPrice: 0, shippingCost: 0, marginPercent: 0, quantity: 0 });
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
    XLSX.writeFile(wb, "Sirjan_Poosh_Inventory_Full.xlsx");
  };

  const filtered = data.products.filter(p => p.name.includes(searchTerm) || p.code.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="جستجوی کالا..." 
            className="w-full pr-12 pl-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-4 top-3.5">🔍</span>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => { setEditingProduct(null); setShowModal(true); }} className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition">افزودن کالا</button>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-6 py-3 rounded-2xl hover:bg-green-700 transition">📥 اکسل</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-indigo-50 text-indigo-900">
              <tr>
                <th className="py-5 px-6">کد</th>
                <th className="py-5 px-6">نام کالا</th>
                <th className="py-5 px-6">قیمت فروش</th>
                <th className="py-5 px-6">تعداد</th>
                <th className="py-5 px-6">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="py-4 px-6 font-bold">{toPersianNumbers(p.code)}</td>
                  <td className="py-4 px-6 font-medium">{p.name}</td>
                  <td className="py-4 px-6 font-black text-indigo-700">{formatCurrency(p.sellPrice)}</td>
                  <td className="py-4 px-6">{toPersianNumbers(p.quantity)}</td>
                  <td className="py-4 px-6 space-x-reverse space-x-3">
                    <button onClick={() => { setEditingProduct(p); setFormData(p); setShowModal(true); }} className="text-blue-600">ویرایش</button>
                    <button onClick={() => setData({ ...data, products: data.products.filter(pr => pr.id !== p.id) })} className="text-red-500">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="p-6 bg-indigo-900 text-white flex justify-between rounded-t-3xl">
              <h3 className="font-bold text-xl">{editingProduct ? 'ویرایش کالا' : 'ثبت کالای جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>
            <form onSubmit={saveProduct} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="کد کالا" className="p-3 border rounded-xl" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
                <input placeholder="نام کالا" className="p-3 border rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="قیمت خرید" className="p-3 border rounded-xl" value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} required />
                <input type="number" placeholder="هزینه حمل" className="p-3 border rounded-xl" value={formData.shippingCost} onChange={e => setFormData({...formData, shippingCost: Number(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="درصد سود" className="p-3 border rounded-xl" value={formData.marginPercent} onChange={e => setFormData({...formData, marginPercent: Number(e.target.value)})} />
                <input type="number" placeholder="تعداد" className="p-3 border rounded-xl" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} required />
              </div>
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex justify-between items-center">
                <span className="font-bold">قیمت نهایی فروش:</span>
                <span className="text-2xl font-black text-indigo-900">{formatCurrency(handleCalculatePrice())}</span>
              </div>
              <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl transition-all">ذخیره اطلاعات کالا</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
