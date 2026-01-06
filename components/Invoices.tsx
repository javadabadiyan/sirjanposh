
import React, { useState, useRef } from 'react';
import { AppData, Invoice, InvoiceItem, Product, User } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, formatWithCommas, toEnglishDigits } from '../utils/formatters';
import DatePicker from './DatePicker';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoicesProps {
  data: AppData;
  setData: (data: AppData) => void;
  currentUser: User;
}

const Invoices: React.FC<InvoicesProps> = ({ data, setData, currentUser }) => {
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
  const [isExporting, setIsExporting] = useState(false);
  
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
    if (product.quantity < qty) return alert('موجودی کافی نیست');
    
    const existingIdx = items.findIndex(i => i.productId === product.id);
    if (existingIdx > -1) {
      const newItems = [...items];
      newItems[existingIdx].quantity += qty;
      setItems(newItems);
    } else {
      setItems([...items, { productId: product.id, name: product.name, quantity: qty, price: product.sellPrice }]);
    }
    setQty(1);
    setSelectedProduct('');
  };

  const saveInvoice = () => {
    if (items.length === 0 || !customerName) return alert('نام مشتری و کالا را وارد کنید.');

    let updatedProducts = [...data.products];
    if (editingInvoice) {
      editingInvoice.items.forEach(oldItem => {
        const prodIdx = updatedProducts.findIndex(p => p.id === oldItem.productId);
        if (prodIdx > -1) updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], quantity: updatedProducts[prodIdx].quantity + oldItem.quantity };
      });
    }

    let stockError = false;
    items.forEach(newItem => {
      const prodIdx = updatedProducts.findIndex(p => p.id === newItem.productId);
      if (prodIdx > -1) {
        if (updatedProducts[prodIdx].quantity < newItem.quantity) stockError = true;
        else updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], quantity: updatedProducts[prodIdx].quantity - newItem.quantity };
      }
    });

    if (stockError) return alert('خطا در موجودی انبار');

    const invData: Invoice = {
      id: editingInvoice ? editingInvoice.id : Date.now().toString(),
      customerName,
      customerAddress,
      customerPhone: toPersianNumbers(customerPhone),
      items,
      totalAmount: items.reduce((acc, i) => acc + (i.price * i.quantity), 0),
      date: toPersianNumbers(invoiceDate || getCurrentJalaliDate()),
      registeredBy: editingInvoice ? editingInvoice.registeredBy : currentUser.username
    };

    setData({ 
      ...data, 
      invoices: editingInvoice ? data.invoices.map(inv => inv.id === editingInvoice.id ? invData : inv) : [...data.invoices, invData],
      products: updatedProducts
    });

    setShowModal(false);
    setEditingInvoice(null);
  };

  const deleteInvoice = (invId: string) => {
    if(!confirm('حذف فاکتور و بازگشت کالا به انبار؟')) return;
    const inv = data.invoices.find(i => i.id === invId);
    if (!inv) return;

    const updatedProducts = data.products.map(p => {
      const soldItem = inv.items.find(si => si.productId === p.id);
      return soldItem ? { ...p, quantity: p.quantity + soldItem.quantity } : p;
    });

    setData({ ...data, invoices: data.invoices.filter(i => i.id !== invId), products: updatedProducts });
  };

  const downloadJPG = async () => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 3, useCORS: true });
      const link = document.createElement('a');
      link.download = `Invoice_${toEnglishDigits(showPrintModal?.customerName || 'Customer')}_${toEnglishDigits(getCurrentJalaliDate()).replace(/\//g, '-')}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${toEnglishDigits(showPrintModal?.customerName || 'Customer')}_${toEnglishDigits(getCurrentJalaliDate()).replace(/\//g, '-')}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = data.invoices.filter(i => i.customerName.includes(searchTerm) || toPersianNumbers(i.customerPhone || '').includes(toPersianNumbers(searchTerm))).reverse();

  return (
    <div className="space-y-6 animate-slide-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 md:p-6 rounded-[2.2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <input placeholder="🔍 جستجوی مشتری..." className="w-full pr-12 py-4.5 bg-slate-50 border-none rounded-2xl font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
        </div>
        <button onClick={() => { setEditingInvoice(null); setCustomerName(''); setCustomerAddress(''); setCustomerPhone(''); setInvoiceDate(getCurrentJalaliDate()); setItems([]); setShowModal(true); }} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-xl hover:bg-indigo-700 text-lg min-h-[60px]">+ صدور فاکتور</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(inv => (
          <div key={inv.id} className="bg-white p-7 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all relative">
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600 rounded-r-full"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="overflow-hidden">
                <p className="text-[9px] font-black text-indigo-500 mb-1">فاکتور #{toPersianNumbers(inv.id.slice(-4))}</p>
                <h4 className="text-xl font-black text-slate-800 truncate">{inv.customerName}</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-1">اپراتور: {inv.registeredBy || 'ناشناس'}</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">{toPersianNumbers(inv.date)}</span>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100/50">
              <p className="text-[9px] font-black text-slate-400 mb-1">مبلغ نهایی</p>
              <p className="text-2xl font-black text-emerald-600 truncate">{formatCurrency(inv.totalAmount)}</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setShowPrintModal(inv)} className="flex-1 bg-indigo-50 text-indigo-600 py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all">👁️ نمایش و چاپ</button>
              <button onClick={() => handleEdit(inv)} className="flex-1 bg-blue-50 text-blue-600 py-3.5 rounded-2xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all">📝 ویرایش</button>
              <button onClick={() => deleteInvoice(inv.id)} className="bg-red-50 text-red-500 px-4 rounded-2xl font-black text-sm transition-all active:scale-90">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 z-[2000] overflow-y-auto">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-4xl md:rounded-[3.5rem] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="text-lg md:text-2xl font-black">{editingInvoice ? 'ویرایش فاکتور' : 'صدور فاکتور جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-2xl hover:bg-red-500 transition-all">&times;</button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">نام مشتری</label><input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none" value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">شماره تماس</label><input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none text-center" value={toPersianNumbers(customerPhone)} onChange={e => setCustomerPhone(e.target.value)} /></div>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">آدرس</label><input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} /></div>
                <div className="space-y-1.5 z-[50]"><DatePicker label="تاریخ فاکتور" value={invoiceDate} onChange={val => setInvoiceDate(val)} accentColor="indigo" /></div>
              </div>
              <div className="bg-indigo-600 p-6 md:p-8 rounded-[2rem] shadow-xl">
                <h4 className="text-white font-black mb-5 text-sm">🛒 انتخاب کالا</h4>
                <div className="flex flex-col gap-4">
                  <select className="w-full p-4.5 rounded-2xl font-black outline-none shadow-inner text-sm" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                    <option value="">🔎 جستجوی کالا...</option>
                    {data.products.map(p => <option key={p.id} value={p.id} disabled={p.quantity <= 0}>{p.name} ({toPersianNumbers(formatWithCommas(p.sellPrice))}) - مانده: {toPersianNumbers(p.quantity)}</option>)}
                  </select>
                  <div className="flex gap-3">
                    <input type="number" min="1" className="w-24 p-4.5 rounded-2xl text-center font-black" value={qty} onChange={e => setQty(Number(e.target.value))} />
                    <button onClick={addItem} className="flex-1 bg-slate-900 text-white p-4.5 rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95 text-base">+ افزودن</button>
                  </div>
                </div>
              </div>
              <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden">
                <table className="w-full text-right min-w-[500px]">
                  <thead className="bg-slate-900 text-white text-[10px] font-black uppercase">
                    <tr><th className="p-4.5">شرح کالا</th><th className="p-4.5 text-center">تعداد</th><th className="p-4.5">جمع</th><th className="p-4.5 text-center">حذف</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-bold text-sm">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-4.5 font-black text-slate-800">{item.name}</td>
                        <td className="p-4.5 text-center font-black">{toPersianNumbers(item.quantity)}</td>
                        <td className="p-4.5 font-black text-indigo-600">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="p-4.5 text-center"><button onClick={() => setItems(items.filter((_,i)=>i!==idx))} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-slate-400 mb-1">جمع نهایی:</p>
                <div className="text-3xl font-black text-indigo-950">{formatCurrency(items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}</div>
              </div>
              <button onClick={saveInvoice} className="w-full md:w-auto bg-emerald-500 text-white px-16 py-5 rounded-[1.8rem] font-black text-xl shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95 min-h-[64px]">ثبت نهایی ✅</button>
            </div>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[3000] p-4 md:p-8 overflow-y-auto flex flex-col items-center safe-padding">
          {/* Action Bar */}
          <div className="max-w-[210mm] w-full flex flex-wrap justify-between items-center gap-4 no-print mb-8 bg-white/10 p-4 rounded-3xl border border-white/10">
            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs md:text-sm hover:bg-indigo-700 transition-all flex items-center gap-2">
                <span>🖨️ چاپ فاکتور (A4)</span>
              </button>
              <button 
                onClick={downloadPDF} 
                disabled={isExporting}
                className="bg-red-500 text-white px-6 py-3.5 rounded-2xl font-black text-xs md:text-sm hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span>📄 خروجی PDF</span>
              </button>
              <button 
                onClick={downloadJPG} 
                disabled={isExporting}
                className="bg-emerald-500 text-white px-6 py-3.5 rounded-2xl font-black text-xs md:text-sm hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span>🖼️ خروجی تصویر</span>
              </button>
            </div>
            <button onClick={() => setShowPrintModal(null)} className="w-12 h-12 flex items-center justify-center bg-white/20 text-white rounded-2xl hover:bg-red-500 transition-all text-2xl font-light">&times;</button>
          </div>

          {/* Scale UI Loader */}
          {isExporting && (
            <div className="fixed inset-0 z-[4000] bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white p-8 rounded-[2rem] text-center shadow-2xl animate-bounce">
                    <p className="font-black text-slate-800">در حال آماده‌سازی فایل... ⏳</p>
                </div>
            </div>
          )}

          {/* Actual Invoice Container - Styled as A4 */}
          <div className="invoice-preview-wrapper no-scrollbar overflow-x-auto w-full flex justify-center pb-12">
            <div 
              ref={invoiceRef} 
              id="printable-invoice"
              className="invoice-preview-container bg-white p-12 md:p-16 relative overflow-hidden flex flex-col"
            >
              {/* Decorative Stripe */}
              <div className="absolute top-0 right-0 left-0 h-4 bg-slate-900"></div>
              
              <div className="flex justify-between items-start mb-16 pt-4">
                <div>
                   <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-2 leading-none">سیرجان پوش</h1>
                   <p className="text-slate-400 font-black tracking-[0.2em] text-[10px] mr-1">SIRJAN POOSH MANAGEMENT SYSTEM</p>
                </div>
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-100 min-w-[200px] text-center">
                   <h2 className="text-xl md:text-2xl font-black text-indigo-600 mb-4 border-b border-indigo-100 pb-2">فـاکـتـور فـروش</h2>
                   <div className="space-y-3 text-sm font-black">
                      <div className="flex justify-between gap-4 text-slate-400"><span>شماره:</span><span className="text-slate-900">{toPersianNumbers(showPrintModal.id.slice(-4))}</span></div>
                      <div className="flex justify-between gap-4 text-slate-400"><span>تاریخ:</span><span className="text-slate-900">{toPersianNumbers(showPrintModal.date)}</span></div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-lg">
                   <p className="text-[10px] font-black opacity-50 mb-3 tracking-widest uppercase">اطلاعات مشتری (Buyer)</p>
                   <p className="text-2xl md:text-3xl font-black mb-1">{showPrintModal.customerName}</p>
                   <div className="flex flex-col gap-1.5 mt-4">
                      {showPrintModal.customerPhone && <div className="flex items-center gap-2 text-emerald-400 font-black text-lg"><span>📞</span> {toPersianNumbers(showPrintModal.customerPhone)}</div>}
                      {showPrintModal.customerAddress && <div className="text-slate-400 text-xs font-bold leading-relaxed">{showPrintModal.customerAddress}</div>}
                   </div>
                </div>
                <div className="p-8 border-2 border-slate-100 rounded-[2.5rem] flex flex-col justify-center">
                   <p className="text-[10px] font-black text-slate-300 mb-2 tracking-widest uppercase">صادر کننده (Issuer)</p>
                   <p className="text-lg font-black text-slate-700">{showPrintModal.registeredBy || 'مدیریت مرکزی'}</p>
                   <p className="text-xs font-bold text-slate-400 mt-1">واحد فروش و ترخیص کالا</p>
                </div>
             </div>

             <div className="flex-1">
                <table className="w-full border-collapse">
                   <thead>
                      <tr className="bg-slate-100 text-slate-500">
                         <th className="p-5 text-right font-black text-xs border-b-2 border-slate-200">شرح کالا / خدمات</th>
                         <th className="p-5 text-center font-black text-xs border-b-2 border-slate-200">تعداد</th>
                         <th className="p-5 text-center font-black text-xs border-b-2 border-slate-200">قیمت واحد (تومان)</th>
                         <th className="p-5 text-center font-black text-xs border-b-2 border-slate-200">جمع کل (تومان)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {showPrintModal.items.map((item, i) => (
                         <tr key={i} className="group">
                            <td className="p-5 text-sm font-black text-slate-800">{item.name}</td>
                            <td className="p-5 text-center font-black text-sm text-slate-600">{toPersianNumbers(item.quantity)}</td>
                            <td className="p-5 text-center font-black text-sm text-slate-600">{toPersianNumbers(formatWithCommas(item.price))}</td>
                            <td className="p-5 text-center font-black text-sm text-indigo-600">{toPersianNumbers(formatWithCommas(item.price * item.quantity))}</td>
                         </tr>
                      ))}
                      {/* Fill empty space to maintain A4 look */}
                      {Array.from({ length: Math.max(0, 8 - showPrintModal.items.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-12"><td colSpan={4}></td></tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="mt-12">
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl rotate-12">👕</div>
                   <div>
                      <p className="text-[11px] font-black opacity-50 mb-1 tracking-widest">مبلغ نهایی قابل پرداخت (TOTAL)</p>
                      <p className="text-4xl md:text-5xl font-black text-emerald-400">{formatCurrency(showPrintModal.totalAmount)}</p>
                   </div>
                   <div className="text-left border-r border-white/10 pr-8">
                      <div className="text-[10px] font-black text-emerald-400 mb-1 uppercase tracking-widest">Verified Payment</div>
                      <div className="text-2xl font-black text-white/90">تـسـویه شـد</div>
                   </div>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-10">
                   <div className="text-center">
                      <p className="text-[10px] font-black text-slate-300 mb-10 uppercase tracking-widest">مهر و امضای فروشگاه</p>
                      <div className="w-32 h-32 border-2 border-slate-50 rounded-full mx-auto flex items-center justify-center opacity-10">
                        <span className="text-[8px] font-black rotate-45">SIRJAN POOSH STAMP</span>
                      </div>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-slate-300 mb-10 uppercase tracking-widest">امضای خریدار</p>
                      <div className="h-32 border-b border-slate-100 flex items-end justify-center pb-2">
                         <span className="text-[8px] font-bold text-slate-200 uppercase tracking-tighter">I accept the terms and conditions</span>
                      </div>
                   </div>
                </div>

                <div className="mt-16 text-center border-t border-slate-50 pt-6">
                   <p className="text-[9px] text-slate-300 font-black leading-relaxed">
                      سیرجان، مجتمع تجاری سیرجان پوش - تلفن پشتیبانی: ۰۹۱۳XXXXXXX <br/>
                      از اعتماد شما سپاسگزاریم. کالای فروخته شده در صورت سلامت کامل تا ۴۸ ساعت قابل تعویض می‌باشد.
                   </p>
                </div>
             </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
