
import React, { useState, useRef } from 'react';
import { AppData, Invoice, InvoiceItem, Product } from '../types';
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
    setInvoiceDate(inv.date);
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

    // کپی از محصولات فعلی برای به‌روزرسانی موجودی
    let updatedProducts = [...data.products];

    // اگر در حال ویرایش هستیم، ابتدا موجودی فاکتور قبلی را برمی‌گردانیم
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

    // کسر موجودی کالاهای فاکتور جدید/ویرایش شده
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
      customerPhone,
      items,
      totalAmount: items.reduce((acc, i) => acc + (i.price * i.quantity), 0),
      date: invoiceDate || getCurrentJalaliDate()
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

    // بازگرداندن موجودی کالاها به انبار
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

  const filtered = data.invoices.filter(i => i.customerName.includes(searchTerm) || i.customerPhone?.includes(searchTerm)).reverse();

  return (
    <div className="space-y-6 animate-slide-up pb-24 px-4 lg:px-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
        <div className="relative w-full md:w-96">
          <input placeholder="🔍 جستجو (مشتری یا شماره تماس)..." className="w-full pr-12 py-4 bg-slate-100/50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
        </div>
        <button onClick={() => { setEditingInvoice(null); setCustomerName(''); setCustomerAddress(''); setCustomerPhone(''); setInvoiceDate(getCurrentJalaliDate()); setItems([]); setShowModal(true); }} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 text-lg">+ صدور فاکتور جدید</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(inv => (
          <div key={inv.id} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 hover:shadow-2xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600 group-hover:w-4 transition-all"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black text-indigo-500 mb-1 uppercase tracking-widest">فاکتور #{toPersianNumbers(inv.id.slice(-4))}</p>
                <h4 className="text-xl font-black text-slate-800">{inv.customerName}</h4>
                {inv.customerPhone && <p className="text-[10px] font-bold text-slate-400 mt-1">{toPersianNumbers(inv.customerPhone)}</p>}
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{toPersianNumbers(inv.date)}</span>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-2xl mb-8">
              <p className="text-[9px] font-black text-slate-400 mb-1">مبلغ نهایی</p>
              <p className="text-2xl font-black text-emerald-600">{formatCurrency(inv.totalAmount)}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowPrintModal(inv)} className="flex-1 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all">👁️ مشاهده</button>
              <button onClick={() => handleEdit(inv)} className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all">📝 ویرایش</button>
              <button onClick={() => deleteInvoice(inv.id)} className="bg-red-50 text-red-500 px-4 py-3 rounded-xl font-black text-sm">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg flex items-center justify-center p-0 md:p-4 z-[100]">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-4xl md:rounded-[3.5rem] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="text-3xl bg-indigo-600 p-3 rounded-2xl">📜</div>
                <div>
                  <h3 className="text-2xl font-black">{editingInvoice ? 'ویرایش فاکتور' : 'صدور فاکتور جدید'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Invoicing System v2</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-2xl hover:bg-red-500 transition-all">&times;</button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2">نام مشتری</label>
                  <input placeholder="نام مشتری..." className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 shadow-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2">شماره تماس</label>
                  <input placeholder="۰۹۱۲..." className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 shadow-sm text-center" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2">آدرس مشتری</label>
                  <input placeholder="آدرس..." className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 shadow-sm" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2">تاریخ ثبت</label>
                  <input 
                    placeholder="۱۴۰۳/۰۱/۰۱"
                    className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-center text-indigo-600 outline-none focus:border-indigo-500 shadow-sm" 
                    value={invoiceDate} 
                    onChange={e => setInvoiceDate(e.target.value)} 
                  />
                </div>
              </div>

              <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-xl shadow-indigo-200">
                <h4 className="text-white font-black mb-6 flex items-center gap-2">🛒 افزودن کالا به لیست</h4>
                <div className="flex flex-col md:flex-row gap-4">
                  <select className="flex-1 p-5 rounded-2xl font-black outline-none shadow-inner" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                    <option value="">🛒 انتخاب از انبار کالا...</option>
                    {data.products.map(p => <option key={p.id} value={p.id} disabled={p.quantity <= 0}>{p.name} ({formatCurrency(p.sellPrice)}) - موجود: {toPersianNumbers(p.quantity)}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" min="1" className="w-24 p-5 rounded-2xl text-center font-black shadow-inner" value={qty} onChange={e => setQty(Number(e.target.value))} />
                    <button onClick={addItem} className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95">افزودن</button>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                <table className="w-full text-right">
                  <thead className="bg-slate-900 text-white">
                    <tr className="text-[11px] font-black uppercase">
                      <th className="p-5">شرح کالا</th>
                      <th className="p-5 text-center">تعداد</th>
                      <th className="p-5 text-center">قیمت واحد</th>
                      <th className="p-5">جمع</th>
                      <th className="p-5 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-bold">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-5 font-black">{item.name}</td>
                        <td className="p-5 text-center">{toPersianNumbers(item.quantity)}</td>
                        <td className="p-5 text-center text-xs">{formatCurrency(item.price)}</td>
                        <td className="p-5 font-black text-indigo-600">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="p-5 text-center">
                          <button onClick={() => setItems(items.filter((_,i)=>i!==idx))} className="text-red-400 hover:text-red-600 text-xl font-black">×</button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-300 font-black">هنوز کالایی به فاکتور اضافه نشده است.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">جمع کل قابل پرداخت:</p>
                <div className="text-4xl font-black text-indigo-950">{formatCurrency(items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}</div>
              </div>
              <button onClick={saveInvoice} className="w-full md:w-auto bg-emerald-500 text-white px-16 py-6 rounded-[2rem] font-black text-2xl shadow-2xl shadow-emerald-200 hover:bg-emerald-600 hover:-translate-y-1 transition-all active:scale-95">تایید و ثبت فاکتور ✅</button>
            </div>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-100/90 backdrop-blur-md z-[200] p-4 lg:p-10 overflow-auto flex flex-col items-center">
           <div className="max-w-4xl w-full flex flex-wrap justify-center gap-4 no-print mb-10">
            <button onClick={() => window.print()} className="flex-1 md:flex-none bg-slate-900 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2">🖨️ چاپ مستقیم</button>
            <button onClick={exportJPG} className="flex-1 md:flex-none bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2">📸 خروجی عکس (JPG)</button>
            <button onClick={exportPDF} className="flex-1 md:flex-none bg-red-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2">📄 خروجی PDF</button>
            <button onClick={() => setShowPrintModal(null)} className="flex-1 md:flex-none bg-white text-slate-500 px-10 py-4 rounded-2xl font-black border-2 border-slate-200">بازگشت</button>
          </div>
          
          <div ref={invoiceRef} className="invoice-container w-full max-w-[210mm] min-h-[297mm] p-12 lg:p-20 rounded-lg bg-white shadow-2xl relative mb-20 border-t-[20px] border-slate-900">
             <div className="flex justify-between items-start mb-20">
                <div>
                   <h1 className="text-6xl font-black text-slate-900 mb-2">سیرجان پوش</h1>
                   <p className="text-slate-400 font-bold tracking-[0.3em]">SIRJAN POOSH RETAIL</p>
                </div>
                <div className="text-left bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 min-w-[250px]">
                   <h2 className="text-3xl font-black text-indigo-600 mb-4 text-center">فـاکـتـور فـروش</h2>
                   <div className="space-y-2 text-sm font-bold">
                      <div className="flex justify-between"><span>شماره:</span><span className="font-black text-slate-800">{toPersianNumbers(showPrintModal.id.slice(-4))}</span></div>
                      <div className="flex justify-between"><span>تاریخ:</span><span className="font-black text-slate-800">{toPersianNumbers(showPrintModal.date)}</span></div>
                   </div>
                </div>
             </div>

             <div className="mb-12 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                <p className="text-xs opacity-50 mb-2">اطلاعات خریدار:</p>
                <p className="text-3xl font-black mb-1">{showPrintModal.customerName}</p>
                {showPrintModal.customerPhone && (
                  <p className="text-lg font-black text-emerald-400 mb-2">{toPersianNumbers(showPrintModal.customerPhone)}</p>
                )}
                {showPrintModal.customerAddress && (
                  <p className="text-sm font-bold opacity-75 mt-2 border-t border-white/10 pt-2">آدرس: {showPrintModal.customerAddress}</p>
                )}
             </div>

             <table className="w-full mb-12 border-collapse overflow-hidden rounded-[2rem]">
                <thead><tr className="bg-slate-100 text-slate-500 text-sm"><th className="p-6 text-right">شرح کالا</th><th className="p-6 text-center">تعداد</th><th className="p-6 text-center">قیمت واحد (تومان)</th><th className="p-6 text-center">جمع کل</th></tr></thead>
                <tbody className="divide-y-2 divide-slate-50">
                   {showPrintModal.items.map((item, i) => (
                      <tr key={i} className="font-bold text-lg"><td className="p-6">{item.name}</td><td className="p-6 text-center">{toPersianNumbers(item.quantity)}</td><td className="p-6 text-center">{toPersianNumbers(formatWithCommas(item.price))}</td><td className="p-6 text-center font-black text-indigo-600">{toPersianNumbers(formatWithCommas(item.price * item.quantity))}</td></tr>
                   ))}
                </tbody>
             </table>

             <div className="flex justify-between items-center bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
                <div>
                   <p className="text-xs opacity-50 uppercase tracking-widest mb-1">مبلغ نهایی فاکتور:</p>
                   <p className="text-5xl font-black text-emerald-400">{formatCurrency(showPrintModal.totalAmount)}</p>
                </div>
                <div className="text-left opacity-30 italic font-black text-xl">تراکنش با موفقیت ثبت شد</div>
             </div>
             
             <div className="mt-20 pt-10 border-t-2 border-dashed border-slate-100 flex justify-around text-center">
                <div><p className="font-black text-slate-300 uppercase text-[10px] mb-8">محل مهر و امضای فروشگاه</p><div className="w-40 h-40 border-4 border-slate-50 rounded-full mx-auto opacity-10"></div></div>
                <div><p className="font-black text-slate-300 uppercase text-[10px] mb-8">امضای خریدار</p><div className="w-40 h-2 opacity-10 bg-slate-200 mt-20"></div></div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
