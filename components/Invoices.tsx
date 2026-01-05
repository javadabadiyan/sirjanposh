
import React, { useState, useEffect, useRef } from 'react';
import { AppData, Invoice, InvoiceItem } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, formatWithCommas } from '../utils/formatters';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
  const [isExporting, setIsExporting] = useState(false);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingInvoice) {
      setCustomerName(editingInvoice.customerName);
      setItems([...editingInvoice.items]);
    } else {
      setCustomerName('');
      setItems([]);
    }
  }, [editingInvoice, showModal]);

  const addItem = () => {
    const product = data.products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    const existingIdx = items.findIndex(i => i.productId === product.id);
    if (existingIdx > -1) {
      const newItems = [...items];
      newItems[existingIdx].quantity += qty;
      setItems(newItems);
    } else {
      setItems([...items, {
        productId: product.id,
        name: product.name,
        quantity: qty,
        price: product.sellPrice
      }]);
    }
    setQty(1);
    setSelectedProduct('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const editItemQuantity = (index: number) => {
    const item = items[index];
    const newQty = prompt(`تعداد جدید برای "${item.name}" را وارد کنید:`, item.quantity.toString());
    if (newQty !== null) {
      const val = parseInt(newQty);
      if (!isNaN(val) && val > 0) {
        const newItems = [...items];
        newItems[index].quantity = val;
        setItems(newItems);
      }
    }
  };

  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const saveInvoice = () => {
    if (items.length === 0 || !customerName) {
      alert('لطفاً نام مشتری و حداقل یک کالا را مشخص کنید.');
      return;
    }

    const invoice: Invoice = {
      id: editingInvoice ? editingInvoice.id : Date.now().toString(),
      customerName,
      items,
      totalAmount,
      date: editingInvoice ? editingInvoice.date : getCurrentJalaliDate()
    };

    const updatedInvoices = editingInvoice 
      ? data.invoices.map(inv => inv.id === editingInvoice.id ? invoice : inv)
      : [...data.invoices, invoice];

    setData({ ...data, invoices: updatedInvoices });
    setShowModal(false);
    setEditingInvoice(null);
  };

  const deleteInvoice = (id: string) => {
    if (confirm('آیا از حذف این فاکتور اطمینان دارید؟')) {
      setData({ ...data, invoices: data.invoices.filter(i => i.id !== id) });
    }
  };

  const handleExport = async (type: 'pdf' | 'jpg') => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      if (type === 'jpg') {
        const link = document.createElement('a');
        link.download = `Invoice-${showPrintModal?.id.slice(-5)}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`Invoice-${showPrintModal?.id.slice(-5)}.pdf`);
      }
    } catch (e) { alert('خطا در تولید فایل خروجی'); }
    setIsExporting(false);
  };

  const filtered = data.invoices.filter(i => i.customerName.includes(searchTerm)).reverse();

  return (
    <div className="space-y-6 animate-fadeIn pb-20 lg:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border">
        <input 
          type="text" 
          placeholder="🔍 جستجوی مشتری..." 
          className="w-full md:w-80 p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button 
          onClick={() => { setEditingInvoice(null); setShowModal(true); }}
          className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-lg active:scale-95 transition-all"
        >
          + صدور فاکتور جدید
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-indigo-900 text-white text-xs md:text-sm">
              <tr>
                <th className="p-5">شماره</th>
                <th className="p-5">مشتری</th>
                <th className="p-5 text-center">تاریخ</th>
                <th className="p-5">مبلغ کل</th>
                <th className="p-5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="p-5 font-black text-indigo-600">#{toPersianNumbers(inv.id.slice(-5))}</td>
                  <td className="p-5 font-bold">{inv.customerName}</td>
                  <td className="p-5 text-center text-xs text-gray-400 font-bold">{toPersianNumbers(inv.date)}</td>
                  <td className="p-5 font-black text-green-700">{formatCurrency(inv.totalAmount)}</td>
                  <td className="p-5">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setShowPrintModal(inv)} className="p-2 bg-gray-100 rounded-xl hover:bg-indigo-600 hover:text-white transition" title="مشاهده">👁️</button>
                      <button onClick={() => { setEditingInvoice(inv); setShowModal(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition" title="ویرایش">📝</button>
                      <button onClick={() => deleteInvoice(inv.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition" title="حذف">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 md:p-4 z-[100]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-fadeIn border-4 border-white shadow-2xl">
            <div className="p-6 md:p-8 bg-indigo-950 text-white flex justify-between items-center">
              <h3 className="text-xl md:text-2xl font-black">{editingInvoice ? 'ویرایش فاکتور' : 'صدور فاکتور'}</h3>
              <button onClick={() => setShowModal(false)} className="text-3xl text-indigo-300">&times;</button>
            </div>
            
            <div className="p-4 md:p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="نام مشتری..." className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-indigo-500" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                <input className="p-4 bg-gray-100 border-2 border-transparent rounded-2xl font-bold text-center text-gray-400" readOnly value={editingInvoice ? toPersianNumbers(editingInvoice.date) : getCurrentJalaliDate()} />
              </div>

              <div className="bg-indigo-50 p-4 md:p-6 rounded-3xl border-2 border-dashed border-indigo-200 space-y-4">
                <p className="text-xs font-black text-indigo-900">افزودن کالا به لیست</p>
                <div className="flex flex-col md:flex-row gap-2">
                  <select className="flex-1 p-4 bg-white rounded-xl font-bold text-sm outline-none" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                    <option value="">انتخاب از انبار...</option>
                    {data.products.map(p => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.sellPrice)})</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" className="w-20 p-4 bg-white rounded-xl text-center font-black" value={qty} onChange={e => setQty(Number(e.target.value))} />
                    <button onClick={addItem} className="bg-indigo-600 text-white px-6 rounded-xl font-black">افزودن</button>
                  </div>
                </div>
              </div>

              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs md:text-sm">
                  <thead className="bg-gray-50 text-gray-400 font-black">
                    <tr>
                      <th className="p-4">کالا</th>
                      <th className="p-4 text-center">تعداد</th>
                      <th className="p-4">جمع</th>
                      <th className="p-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-4 font-bold">{item.name}</td>
                        <td className="p-4 text-center font-black text-indigo-600">{toPersianNumbers(item.quantity)}</td>
                        <td className="p-4 font-black">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => editItemQuantity(idx)} className="text-blue-500">📝</button>
                            <button onClick={() => removeItem(idx)} className="text-red-400">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-gray-50 border-t flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase">مبلغ نهایی فاکتور:</p>
                <div className="text-2xl font-black text-indigo-950">{formatCurrency(totalAmount)}</div>
              </div>
              <button onClick={saveInvoice} className="w-full md:w-auto bg-green-600 text-white px-12 py-4 rounded-2xl font-black text-lg hover:bg-green-700 shadow-lg active:scale-95 transition-all">تایید و ثبت نهایی</button>
            </div>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="fixed inset-0 bg-white z-[200] p-2 md:p-8 overflow-auto animate-fadeIn">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3 no-print mb-8">
            <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><span>🖨️</span> چاپ</button>
            <button onClick={() => handleExport('pdf')} disabled={isExporting} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"><span>📄</span> PDF</button>
            <button onClick={() => handleExport('jpg')} disabled={isExporting} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"><span>🖼️</span> JPG</button>
            <button onClick={() => setShowPrintModal(null)} className="bg-gray-100 text-gray-500 px-6 py-3 rounded-xl font-bold">بازگشت</button>
          </div>

          <div ref={invoiceRef} className="max-w-2xl mx-auto border-4 border-indigo-950 p-6 md:p-10 rounded-[2.5rem] bg-white shadow-xl relative">
            <div className="flex justify-between items-center border-b-4 border-indigo-950 pb-6 mb-8">
              <h1 className="text-3xl font-black text-indigo-950">سیرجان پوش</h1>
              <div className="text-left text-sm font-bold text-gray-500">
                <p>فاکتور شماره: {toPersianNumbers(showPrintModal.id.slice(-5))}</p>
                <p>تاریخ: {toPersianNumbers(showPrintModal.date)}</p>
              </div>
            </div>
            <p className="font-black text-indigo-900 mb-8">نام خریدار: <span className="text-gray-700 underline underline-offset-4">{showPrintModal.customerName}</span></p>
            <table className="w-full border-collapse mb-8 text-sm md:text-base">
              <thead>
                <tr className="bg-indigo-950 text-white">
                  <th className="p-3 border border-indigo-950">شرح کالا</th>
                  <th className="p-3 border border-indigo-950 text-center">تعداد</th>
                  <th className="p-3 border border-indigo-950 text-center">جمع کل</th>
                </tr>
              </thead>
              <tbody>
                {showPrintModal.items.map((item, i) => (
                  <tr key={i} className="font-bold">
                    <td className="p-3 border border-gray-200">{item.name}</td>
                    <td className="p-3 border border-gray-200 text-center">{toPersianNumbers(item.quantity)}</td>
                    <td className="p-3 border border-gray-200 text-center">{toPersianNumbers(formatWithCommas(item.price * item.quantity))}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-black">
                  <td colSpan={2} className="p-4 border border-indigo-950 text-left">مبلغ کل قابل پرداخت:</td>
                  <td className="p-4 border border-indigo-950 text-center text-xl">{formatCurrency(showPrintModal.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-20 flex justify-around text-center font-black text-indigo-900 border-t-2 border-indigo-50 pt-6">
              <p>مهر و امضای فروشنده</p>
              <p>امضای خریدار</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
