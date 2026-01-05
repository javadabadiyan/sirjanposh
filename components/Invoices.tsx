
import React, { useState, useEffect } from 'react';
import { AppData, Invoice, InvoiceItem } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, formatWithCommas } from '../utils/formatters';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintModal, setShowPrintModal] = useState<Invoice | null>(null);

  // همگام‌سازی فرم با فاکتوری که برای ویرایش انتخاب شده است
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
    if (confirm('آیا از حذف این فاکتور از سوابق اطمینان دارید؟')) {
      setData({ ...data, invoices: data.invoices.filter(i => i.id !== id) });
    }
  };

  const filteredInvoices = data.invoices.filter(inv => 
    inv.customerName.includes(searchTerm) || inv.id.includes(searchTerm)
  ).reverse();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="جستجوی فاکتور (نام مشتری)..." 
            className="w-full pr-12 pl-4 py-4 border-2 border-gray-50 bg-gray-50 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-4 top-4 text-xl opacity-30">🔍</span>
        </div>
        <button 
          onClick={() => { setEditingInvoice(null); setShowModal(true); }}
          className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span> صدور فاکتور جدید
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-indigo-900 text-white">
                <th className="py-6 px-8 font-black">شماره فاکتور</th>
                <th className="py-6 px-8 font-black">نام مشتری</th>
                <th className="py-6 px-8 font-black">مبلغ کل</th>
                <th className="py-6 px-8 font-black text-center">تاریخ صدور</th>
                <th className="py-6 px-8 font-black text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((inv, index) => (
                <tr key={inv.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="py-5 px-8 font-black text-indigo-600">#{toPersianNumbers(inv.id.slice(-5))}</td>
                  <td className="py-5 px-8 font-bold text-gray-800">{inv.customerName}</td>
                  <td className="py-5 px-8 font-black text-lg text-green-700">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-5 px-8 text-center text-gray-400 font-bold">{toPersianNumbers(inv.date)}</td>
                  <td className="py-5 px-8 text-center">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => setShowPrintModal(inv)} 
                        className="bg-gray-100 text-gray-600 p-2.5 rounded-xl hover:bg-indigo-100 hover:text-indigo-600 transition shadow-sm"
                        title="مشاهده و چاپ"
                      >🖨️</button>
                      <button 
                        onClick={() => { setEditingInvoice(inv); setShowModal(true); }} 
                        className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-xs hover:bg-blue-100 transition shadow-sm"
                      >ویرایش</button>
                      <button 
                        onClick={() => deleteInvoice(inv.id)} 
                        className="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-black text-xs hover:bg-red-100 transition shadow-sm"
                      >حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr><td colSpan={5} className="py-24 text-center text-gray-400 font-black text-xl">هیچ فاکتوری یافت نشد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Issue/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-fadeIn border-4 border-white">
            <div className="p-8 bg-indigo-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">{editingInvoice ? 'ویرایش فاکتور' : 'صدور فاکتور جدید'}</h3>
                <p className="text-xs text-indigo-300 mt-1">مشخصات خریدار و اقلام را وارد کنید</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-4xl hover:rotate-90 transition text-indigo-300">&times;</button>
            </div>
            
            <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-600 mr-2">نام مشتری (خریدار)</label>
                  <input 
                    placeholder="نام خریدار را وارد کنید..."
                    className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-[1.5rem] outline-none focus:border-indigo-500 font-bold transition-all" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-600 mr-2">تاریخ فاکتور</label>
                  <input 
                    className="w-full p-4 border-2 border-gray-100 bg-gray-100 rounded-[1.5rem] text-center font-bold text-gray-500" 
                    readOnly 
                    value={editingInvoice ? toPersianNumbers(editingInvoice.date) : getCurrentJalaliDate()} 
                  />
                </div>
              </div>

              {/* Item Selection Box */}
              <div className="bg-indigo-50 p-8 rounded-[2rem] border-2 border-dashed border-indigo-200 space-y-4">
                <p className="text-sm font-black text-indigo-900 mb-2">افزودن کالا به فاکتور</p>
                <div className="flex flex-col md:flex-row gap-3">
                  <select 
                    className="flex-1 p-4 border-2 border-white rounded-2xl font-bold text-sm outline-none shadow-sm focus:border-indigo-500" 
                    value={selectedProduct} 
                    onChange={e => setSelectedProduct(e.target.value)}
                  >
                    <option value="">انتخاب کالا از انبار...</option>
                    {data.products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - موجودی: {toPersianNumbers(p.quantity)} عدد</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="w-24 p-4 border-2 border-white rounded-2xl text-center font-black shadow-sm outline-none" 
                      value={qty} 
                      onChange={e => setQty(Math.max(1, Number(e.target.value)))} 
                      placeholder="تعداد"
                    />
                    <button 
                      onClick={addItem} 
                      className="bg-indigo-600 text-white px-8 rounded-2xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                    >افزودن</button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-[2rem] border-2 border-gray-50 overflow-hidden shadow-inner">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-widest font-black">
                    <tr>
                      <th className="py-4 px-6">نام کالا</th>
                      <th className="py-4 px-6 text-center">تعداد</th>
                      <th className="py-4 px-6">قیمت واحد</th>
                      <th className="py-4 px-6">جمع</th>
                      <th className="py-4 px-6 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 font-bold text-gray-700">{item.name}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="bg-gray-100 px-3 py-1 rounded-lg font-black text-indigo-900">{toPersianNumbers(item.quantity)}</span>
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-400 font-bold">{formatCurrency(item.price)}</td>
                        <td className="py-4 px-6 font-black text-indigo-600">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="py-4 px-6 text-center">
                          <button 
                            onClick={() => removeItem(idx)} 
                            className="text-red-400 hover:text-red-600 text-xl transition"
                            title="حذف از لیست"
                          >🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-300 font-bold italic">لیست اقلام فاکتور خالی است</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">جمع کل قابل پرداخت:</p>
                <div className="text-3xl font-black text-indigo-900">{formatCurrency(totalAmount)}</div>
              </div>
              <button 
                onClick={saveInvoice} 
                className="w-full md:w-auto bg-green-600 text-white px-16 py-5 rounded-[1.5rem] font-black text-xl hover:bg-green-700 shadow-2xl shadow-green-100 transition-all active:scale-95"
              >
                {editingInvoice ? 'بروزرسانی و ثبت فاکتور' : 'تایید و صدور فاکتور نهایی'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-white z-[200] p-4 md:p-10 overflow-auto animate-fadeIn">
          <div className="max-w-3xl mx-auto border-4 border-indigo-950 p-6 md:p-12 rounded-[3rem] shadow-2xl bg-white relative">
            <div className="absolute top-8 left-8 opacity-5 text-8xl -rotate-12 select-none">SIRJAN POOSH</div>
            
            <div className="flex justify-between items-center border-b-4 border-indigo-950 pb-8 mb-10">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-950 text-white p-4 rounded-3xl text-3xl">👕</div>
                <div>
                  <h1 className="text-4xl font-black text-indigo-950">سیرجان پوش</h1>
                  <p className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-widest">Premium Clothing Store</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-indigo-950 mb-2">فاکتور فروش</p>
                <div className="space-y-1 text-sm font-bold text-gray-500">
                  <p>شماره: {toPersianNumbers(showPrintModal.id.slice(-6))}</p>
                  <p>تاریخ: {toPersianNumbers(showPrintModal.date)}</p>
                </div>
              </div>
            </div>

            <div className="mb-10 bg-indigo-50/50 p-6 rounded-3xl border-2 border-indigo-100">
              <p className="font-black text-indigo-900">نام خریدار گرامی: <span className="mr-2 font-bold text-gray-700 underline underline-offset-8 decoration-indigo-200">{showPrintModal.customerName}</span></p>
            </div>

            <table className="w-full border-collapse mb-10 overflow-hidden rounded-2xl">
              <thead>
                <tr className="bg-indigo-950 text-white">
                  <th className="p-4 text-center font-black border border-indigo-950">ردیف</th>
                  <th className="p-4 text-right font-black border border-indigo-950">شرح کالا</th>
                  <th className="p-4 text-center font-black border border-indigo-950">تعداد</th>
                  <th className="p-4 text-center font-black border border-indigo-950">قیمت واحد (تومان)</th>
                  <th className="p-4 text-center font-black border border-indigo-950">جمع کل (تومان)</th>
                </tr>
              </thead>
              <tbody>
                {showPrintModal.items.map((item, idx) => (
                  <tr key={idx} className="font-bold text-gray-700">
                    <td className="p-4 text-center border border-gray-200">{toPersianNumbers(idx + 1)}</td>
                    <td className="p-4 text-right border border-gray-200">{item.name}</td>
                    <td className="p-4 text-center border border-gray-200">{toPersianNumbers(item.quantity)}</td>
                    <td className="p-4 text-center border border-gray-200">{toPersianNumbers(formatWithCommas(item.price))}</td>
                    <td className="p-4 text-center border border-gray-200">{toPersianNumbers(formatWithCommas(item.price * item.quantity))}</td>
                  </tr>
                ))}
                <tr className="bg-indigo-50 font-black text-indigo-950">
                  <td colSpan={4} className="p-6 text-left border border-indigo-950 text-xl">مبلغ کل قابل پرداخت:</td>
                  <td className="p-6 text-center border border-indigo-950 text-2xl">{formatCurrency(showPrintModal.totalAmount)}</td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-20 mt-24 mb-10 text-center">
              <div>
                <div className="h-20 flex items-center justify-center opacity-10">مهر فروشگاه</div>
                <p className="font-black text-indigo-900 border-t-2 border-indigo-100 pt-4">مهر و امضای فروشنده</p>
              </div>
              <div>
                <div className="h-20 flex items-center justify-center opacity-10">امضا</div>
                <p className="font-black text-gray-500 border-t-2 border-gray-100 pt-4">امضای خریدار</p>
              </div>
            </div>

            <div className="no-print mt-12 flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.print()} 
                className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3"
              >
                <span>🖨️</span> چاپ مستقیم فاکتور
              </button>
              <button 
                onClick={() => setShowPrintModal(null)} 
                className="bg-gray-100 text-gray-500 px-12 py-4 rounded-2xl font-black hover:bg-gray-200 transition"
              >
                بازگشت به پنل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
