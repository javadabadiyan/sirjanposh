
import React, { useState, useEffect } from 'react';
import { AppData, Invoice, InvoiceItem } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate } from '../utils/formatters';

interface InvoicesProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const Invoices: React.FC<InvoicesProps> = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [showPrintModal, setShowPrintModal] = useState<Invoice | null>(null);

  useEffect(() => {
    if (editingInvoice) {
      setCustomerName(editingInvoice.customerName);
      setItems(editingInvoice.items);
    } else {
      setCustomerName('');
      setItems([]);
    }
  }, [editingInvoice]);

  const addItem = () => {
    const product = data.products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    setItems([...items, {
      productId: product.id,
      name: product.name,
      quantity: qty,
      price: product.sellPrice
    }]);
    setQty(1);
    setSelectedProduct('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const saveInvoice = () => {
    if (items.length === 0 || !customerName) {
      alert('لطفاً نام مشتری و حداقل یک کالا وارد کنید.');
      return;
    }

    const newInvoice: Invoice = {
      id: editingInvoice ? editingInvoice.id : Date.now().toString(),
      customerName,
      items,
      totalAmount,
      date: editingInvoice ? editingInvoice.date : getCurrentJalaliDate()
    };

    let updatedInvoices;
    if (editingInvoice) {
      updatedInvoices = data.invoices.map(inv => inv.id === editingInvoice.id ? newInvoice : inv);
    } else {
      updatedInvoices = [...data.invoices, newInvoice];
    }

    setData({ ...data, invoices: updatedInvoices });
    setShowModal(false);
    setEditingInvoice(null);
  };

  const deleteInvoice = (id: string) => {
    if (confirm('آیا از حذف این فاکتور اطمینان دارید؟')) {
      setData({ ...data, invoices: data.invoices.filter(i => i.id !== id) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">مدیریت فاکتورها</h2>
        <button 
          onClick={() => { setEditingInvoice(null); setShowModal(true); }}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition font-bold"
        >
          + صدور فاکتور جدید
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-indigo-50 text-indigo-900 text-sm">
              <tr>
                <th className="py-5 px-6">شماره</th>
                <th className="py-5 px-6">نام مشتری</th>
                <th className="py-5 px-6">مبلغ کل</th>
                <th className="py-5 px-6">تاریخ صدور</th>
                <th className="py-5 px-6 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((inv, index) => (
                <tr key={inv.id} className="border-t hover:bg-gray-50 transition">
                  <td className="py-4 px-6 font-bold text-indigo-600">{toPersianNumbers(index + 1)}</td>
                  <td className="py-4 px-6 font-medium">{inv.customerName}</td>
                  <td className="py-4 px-6 font-bold text-green-700">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-4 px-6 text-gray-500">{toPersianNumbers(inv.date)}</td>
                  <td className="py-4 px-6 text-center space-x-reverse space-x-3">
                    <button onClick={() => setShowPrintModal(inv)} className="text-gray-600 hover:text-indigo-600">🖨️</button>
                    <button onClick={() => { setEditingInvoice(inv); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">ویرایش</button>
                    <button onClick={() => deleteInvoice(inv.id)} className="text-red-500 hover:text-red-700">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-indigo-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingInvoice ? 'ویرایش فاکتور' : 'صدور فاکتور جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl hover:rotate-90 transition">&times;</button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-500">نام مشتری</label>
                  <input className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-500">تاریخ ثبت</label>
                  <input className="w-full p-3 border rounded-xl bg-gray-50" readOnly value={getCurrentJalaliDate()} />
                </div>
              </div>

              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                <p className="text-sm font-bold text-indigo-900 mb-4">افزودن کالا به لیست</p>
                <div className="flex gap-2">
                  <select className="flex-1 p-3 border rounded-xl" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                    <option value="">انتخاب از انبار...</option>
                    {data.products.map(p => <option key={p.id} value={p.id}>{p.name} ({toPersianNumbers(p.quantity)})</option>)}
                  </select>
                  <input type="number" className="w-20 p-3 border rounded-xl" value={qty} onChange={e => setQty(Number(e.target.value))} />
                  <button onClick={addItem} className="bg-indigo-600 text-white px-6 rounded-xl hover:bg-indigo-700">افزودن</button>
                </div>
              </div>

              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-100">
                    <tr><th className="p-3">کالا</th><th className="p-3">تعداد</th><th className="p-3">جمع</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3">{toPersianNumbers(item.quantity)}</td>
                        <td className="p-3 font-bold">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="p-3 text-red-500 cursor-pointer" onClick={() => removeItem(idx)}>حذف</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
              <div className="text-lg font-bold text-indigo-900">جمع کل: {formatCurrency(totalAmount)}</div>
              <button onClick={saveInvoice} className="bg-green-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg">ثبت نهایی</button>
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-white z-[200] p-10 overflow-auto">
          <div className="max-w-3xl mx-auto border-2 border-indigo-900 p-8 rounded-lg">
            <div className="flex justify-between items-center border-b-2 border-indigo-900 pb-6 mb-8">
              <div>
                <h1 className="text-3xl font-black text-indigo-900">سیرجان پوش</h1>
                <p className="text-sm mt-1">مدیریت: شرکا</p>
              </div>
              <div className="text-left">
                <p className="font-bold">فاکتور فروش کالا</p>
                <p className="text-sm">شماره: {toPersianNumbers(Date.now())}</p>
                <p className="text-sm">تاریخ: {toPersianNumbers(showPrintModal.date)}</p>
              </div>
            </div>
            <div className="mb-8">
              <p className="font-bold">نام خریدار: <span className="font-normal underline decoration-indigo-200">{showPrintModal.customerName}</span></p>
            </div>
            <table className="w-full border-collapse border border-indigo-900 mb-8">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="border border-indigo-900 p-2">ردیف</th>
                  <th className="border border-indigo-900 p-2">شرح کالا</th>
                  <th className="border border-indigo-900 p-2">تعداد</th>
                  <th className="border border-indigo-900 p-2">قیمت واحد</th>
                  <th className="border border-indigo-900 p-2">جمع کل</th>
                </tr>
              </thead>
              <tbody>
                {showPrintModal.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-indigo-900 p-2 text-center">{toPersianNumbers(idx + 1)}</td>
                    <td className="border border-indigo-900 p-2">{item.name}</td>
                    <td className="border border-indigo-900 p-2 text-center">{toPersianNumbers(item.quantity)}</td>
                    <td className="border border-indigo-900 p-2 text-center">{formatCurrency(item.price)}</td>
                    <td className="border border-indigo-900 p-2 text-center">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
                <tr className="bg-indigo-50 font-bold">
                  <td colSpan={4} className="border border-indigo-900 p-2 text-left">مبلغ کل قابل پرداخت:</td>
                  <td className="border border-indigo-900 p-2 text-center">{formatCurrency(showPrintModal.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-between mt-20">
              <p className="font-bold">مهر و امضای فروشگاه</p>
              <p className="font-bold">امضای خریدار</p>
            </div>
            <div className="no-print mt-10 flex gap-4">
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">چاپ فاکتور</button>
              <button onClick={() => setShowPrintModal(null)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg">بستن</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
