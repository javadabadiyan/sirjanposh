
import React, { useState, useRef } from 'react';
import { AppData, Invoice, InvoiceItem, Product } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, formatWithCommas } from '../utils/formatters';
import DatePicker from './DatePicker';
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
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintModal, setShowPrintModal] = useState<Invoice | null>(null);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setCustomerName(inv.customerName);
    setCustomerAddress(inv.customerAddress || '');
    setCustomerPhone(inv.customerPhone || '');
    setInvoiceDate(toPersianNumbers(inv.date));
    setItems([...inv.items]);
    setShowModal(true);
  };

  const addItem = () => {
    const product = data.products.find(p => p.id === selectedProduct);
    if (!product) return;

    if (product.quantity < qty) {
      alert(`موجودی کالا کافی نیست! موجودی فعلی: ${toPersianNumbers(product.quantity)} عدد`);
      return;
    }
    
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

  const saveInvoice = () => {
    if (items.length === 0 || !customerName) {
      alert('لطفاً نام مشتری و حداقل یک کالا را وارد کنید.');
      return;
    }

    let updatedProducts = [...data.products];

    if (editingInvoice) {
      editingInvoice.items.forEach(oldItem => {
        const prodIdx = updatedProducts.findIndex(p => p.id === oldItem.productId);
        if (prodIdx > -1) {
          updatedProducts[prodIdx] = {
            ...updatedProducts[prodIdx],
            quantity: updatedProducts[prodIdx].quantity + oldItem.quantity
          };
        }
      });
    }

    let stockError = false;
    items.forEach(newItem => {
      const prodIdx = updatedProducts.findIndex(p => p.id === newItem.productId);
      if (prodIdx > -1) {
        if (updatedProducts[prodIdx].quantity < newItem.quantity) {
          stockError = true;
          alert(`خطا: موجودی کالای "${newItem.name}" برای ثبت این فاکتور کافی نیست.`);
        } else {
          updatedProducts[prodIdx] = {
            ...updatedProducts[prodIdx],
            quantity: updatedProducts[prodIdx].quantity - newItem.quantity
          };
        }
      }
    });

    if (stockError) return;

    const invData: Invoice = {
      id: editingInvoice ? editingInvoice.id : Date.now().toString(),
      customerName,
      customerAddress,
      customerPhone: toPersianNumbers(customerPhone),
      items,
      totalAmount: items.reduce((acc, i) => acc + (i.price * i.quantity), 0),
      date: toPersianNumbers(invoiceDate || getCurrentJalaliDate())
    };

    const updatedInvoices = editingInvoice 
      ? data.invoices.map(inv => inv.id === editingInvoice.id ? invData : inv)
      : [...data.invoices, invData];

    setData({ 
      ...data, 
      invoices: updatedInvoices,
      products: updatedProducts
    });

    setShowModal(false);
    setEditingInvoice(null);
    setItems([]);
    setCustomerName('');
    setCustomerAddress('');
    setCustomerPhone('');
    setInvoiceDate('');
  };

  const deleteInvoice = (invId: string) => {
    if(!confirm('آیا از حذف این فاکتور اطمینان دارید؟ موجودی کالاها به انبار بازگردانده خواهد شد.')) return;

    const invoiceToDelete = data.invoices.find(i => i.id === invId);
    if (!invoiceToDelete) return;

    const updatedProducts = data.products.map(p => {
      const soldItem = invoiceToDelete.items.find(si => si.productId === p.id);
      if (soldItem) {
        return { ...p, quantity: p.quantity + soldItem.quantity };
      }
      return p;
    });

    setData({
      ...data,
      invoices: data.invoices.filter(i => i.id !== invId),
      products: updatedProducts
    });
  };

  const exportJPG = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = `Invoice-${showPrintModal?.id.slice(-4)}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  const exportPDF = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice-${showPrintModal?.id.slice(-4)}.pdf`);
  };

  const filtered = data.invoices.filter(i => i.customerName.includes(searchTerm) || toPersianNumbers(i.customerPhone || '').includes(toPersianNumbers(searchTerm))).reverse();

  return (
    <div className="space-y-6 animate-slide-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 md:p-6 rounded-[2.2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <input placeholder="🔍 جستجوی مشتری یا شماره..." className="w-full pr-12 py-4.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
        </div>
        <button onClick={() => { setEditingInvoice(null); setCustomerName(''); setCustomerAddress(''); setCustomerPhone(''); setInvoiceDate(getCurrentJalaliDate()); setItems([]); setShowModal(true); }} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95 text-lg min-h-[60px]">+ صدور فاکتور</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {filtered.map(inv => (
          <div key={inv.id} className="bg-white p-7 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600 group-hover:w-3 transition-all"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-indigo-500 mb-1 uppercase tracking-widest">فاکتور #{toPersianNumbers(inv.id.slice(-4))}</p>
                <h4 className="text-xl font-black text-slate-800 truncate">{inv.customerName}</h4>
                {inv.customerPhone && <p className="text-[11px] font-bold text-slate-400 mt-1">{toPersianNumbers(inv.customerPhone)}</p>}
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full shrink-0">{toPersianNumbers(inv.date)}</span>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100/50">
              <p className="text-[9px] font-black text-slate-400 mb-1">مبلغ نهایی</p>
              <p className="text-2xl font-black text-emerald-600 truncate">{formatCurrency(inv.totalAmount)}</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setShowPrintModal(inv)} className="flex-1 bg-indigo-50 text-indigo-600 py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm">👁️ نمایش</button>
              <button onClick={() => handleEdit(inv)} className="flex-1 bg-blue-50 text-blue-600 py-3.5 rounded-2xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm">📝 ویرایش</button>
              <button onClick={() => deleteInvoice(inv.id)} className="bg-red-50 text-red-500 px-4 rounded-2xl font-black text-sm min-h-[48px]">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 z-[2000] overflow-y-auto">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-4xl md:rounded-[3.5rem] flex flex-col overflow-hidden shadow-2xl animate-slide-up relative">
            <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="text-2xl bg-indigo-600 p-3 rounded-2xl">📜</div>
                <div>
                  <h3 className="text-lg md:text-2xl font-black leading-tight">{editingInvoice ? 'ویرایش فاکتور' : 'صدور فاکتور جدید'}</h3>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-2xl hover:bg-red-500 transition-all shadow-sm">&times;</button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 md:space-y-8 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">نام مشتری</label>
                  <input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 shadow-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">شماره تماس (فارسی)</label>
                  <input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 shadow-sm text-center" value={toPersianNumbers(customerPhone)} onChange={e => setCustomerPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">آدرس مشتری</label>
                  <input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 shadow-sm" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <DatePicker label="تاریخ فاکتور" value={invoiceDate} onChange={val => setInvoiceDate(val)} accentColor="indigo" />
                </div>
              </div>

              <div className="bg-indigo-600 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-indigo-200">
                <h4 className="text-white font-black mb-5 text-sm md:text-base flex items-center gap-2">🛒 انتخاب کالا از انبار</h4>
                <div className="flex flex-col gap-4">
                  <select className="w-full p-4.5 rounded-2xl font-black outline-none shadow-inner text-sm" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                    <option value="">🔎 انتخاب لباس...</option>
                    {data.products.map(p => <option key={p.id} value={p.id} disabled={p.quantity <= 0}>{p.name} ({toPersianNumbers(formatWithCommas(p.sellPrice))}) - مانده: {toPersianNumbers(p.quantity)}</option>)}
                  </select>
                  <div className="flex gap-3">
                    <input type="number" min="1" className="w-24 p-4.5 rounded-2xl text-center font-black shadow-inner" value={qty} onChange={e => setQty(Number(e.target.value))} />
                    <button onClick={addItem} className="flex-1 bg-slate-900 text-white p-4.5 rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95 text-base">+ افزودن به لیست</button>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right min-w-[600px]">
                    <thead className="bg-slate-900 text-white text-[10px] font-black uppercase">
                      <tr>
                        <th className="p-4.5">شرح کالا</th>
                        <th className="p-4.5 text-center">تعداد</th>
                        <th className="p-4.5 text-center">واحد</th>
                        <th className="p-4.5">جمع</th>
                        <th className="p-4.5 text-center">لغو</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-bold text-sm">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-4.5 font-black text-slate-800">{item.name}</td>
                          <td className="p-4.5 text-center font-black">{toPersianNumbers(item.quantity)}</td>
                          <td className="p-4.5 text-center text-[11px] text-slate-400">{formatCurrency(item.price)}</td>
                          <td className="p-4.5 font-black text-indigo-600">{formatCurrency(item.price * item.quantity)}</td>
                          <td className="p-4.5 text-center">
                            <button onClick={() => setItems(items.filter((_,i)=>i!==idx))} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all mx-auto">×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">جمع نهایی فاکتور:</p>
                <div className="text-3xl md:text-4xl font-black text-indigo-950">{formatCurrency(items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}</div>
              </div>
              <button onClick={saveInvoice} className="w-full md:w-auto bg-emerald-500 text-white px-16 py-5 rounded-[1.8rem] font-black text-xl md:text-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95 min-h-[64px]">ثبت و صدور نهایی ✅</button>
            </div>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-100/95 backdrop-blur-lg z-[3000] p-4 md:p-10 overflow-auto flex flex-col items-center">
           <div className="max-w-4xl w-full flex flex-wrap justify-center gap-3 no-print mb-8 md:mb-12">
            <button onClick={() => window.print()} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4.5 rounded-2xl font-black flex items-center justify-center gap-2 text-sm">🖨️ چاپ</button>
            <button onClick={exportJPG} className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4.5 rounded-2xl font-black flex items-center justify-center gap-2 text-sm">📸 عکس</button>
            <button onClick={exportPDF} className="flex-1 md:flex-none bg-red-600 text-white px-8 py-4.5 rounded-2xl font-black flex items-center justify-center gap-2 text-sm">📄 PDF</button>
            <button onClick={() => setShowPrintModal(null)} className="w-full md:w-auto bg-white text-slate-500 px-8 py-4.5 rounded-2xl font-black border-2 border-slate-200 text-sm">بازگشت</button>
          </div>
          <div ref={invoiceRef} className="invoice-container w-full max-w-[210mm] min-h-[297mm] p-8 md:p-16 rounded-xl bg-white shadow-2xl relative mb-20 border-t-[15px] md:border-t-[20px] border-slate-900 origin-top">
             <div className="flex flex-col md:flex-row justify-between items-start mb-12 md:mb-20 gap-8">
                <div>
                   <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-2">سیرجان پوش</h1>
                   <p className="text-slate-400 font-bold tracking-[0.2em] text-xs">SIRJAN POOSH RETAIL</p>
                </div>
                <div className="text-right md:text-left bg-slate-50 p-6 md:p-8 rounded-[1.8rem] border-2 border-slate-100 min-w-full md:min-w-[250px]">
                   <h2 className="text-2xl md:text-3xl font-black text-indigo-600 mb-4 text-center">فـاکـتـور فـروش</h2>
                   <div className="space-y-2 text-sm font-bold">
                      <div className="flex justify-between"><span>شماره:</span><span className="font-black text-slate-800">{toPersianNumbers(showPrintModal.id.slice(-4))}</span></div>
                      <div className="flex justify-between"><span>تاریخ:</span><span className="font-black text-slate-800">{toPersianNumbers(showPrintModal.date)}</span></div>
                   </div>
                </div>
             </div>
             <div className="mb-8 md:mb-12 p-6 md:p-8 bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] text-white">
                <p className="text-[10px] opacity-50 mb-2">اطلاعات خریدار:</p>
                <p className="text-2xl md:text-3xl font-black mb-1">{showPrintModal.customerName}</p>
                {showPrintModal.customerPhone && (
                  <p className="text-base md:text-lg font-black text-emerald-400 mb-2">{toPersianNumbers(showPrintModal.customerPhone)}</p>
                )}
                {showPrintModal.customerAddress && (
                  <p className="text-[11px] md:text-sm font-bold opacity-75 mt-2 border-t border-white/10 pt-2">آدرس: {showPrintModal.customerAddress}</p>
                )}
             </div>
             <div className="overflow-x-auto -mx-2 mb-12">
               <table className="w-full border-collapse rounded-3xl overflow-hidden min-w-[500px]">
                  <thead><tr className="bg-slate-100 text-slate-500 text-xs"><th className="p-5 text-right">شرح کالا</th><th className="p-5 text-center">تعداد</th><th className="p-5 text-center">واحد (تومان)</th><th className="p-5 text-center">جمع کل</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                     {showPrintModal.items.map((item, i) => (
                        <tr key={i} className="font-bold text-base"><td className="p-5">{item.name}</td><td className="p-5 text-center">{toPersianNumbers(item.quantity)}</td><td className="p-5 text-center">{toPersianNumbers(formatWithCommas(item.price))}</td><td className="p-5 text-center font-black text-indigo-600">{toPersianNumbers(formatWithCommas(item.price * item.quantity))}</td></tr>
                     ))}
                  </tbody>
               </table>
             </div>
             <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-white shadow-2xl gap-6">
                <div className="text-center md:text-right">
                   <p className="text-[10px] opacity-50 uppercase tracking-widest mb-1">مبلغ نهایی قابل پرداخت:</p>
                   <p className="text-3xl md:text-5xl font-black text-emerald-400">{formatCurrency(showPrintModal.totalAmount)}</p>
                </div>
                <div className="text-center md:text-left opacity-30 italic font-black text-base md:text-xl">تراکنش با موفقیت ثبت شد</div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
