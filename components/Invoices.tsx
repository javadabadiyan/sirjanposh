
// Fix: Use namespace import for React to resolve JSX intrinsic element errors
import * as React from 'react';
import { useState, useRef } from 'react';
import { AppData, Invoice, InvoiceItem, Product, User } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, formatWithCommas, toEnglishDigits, parseRawNumber } from '../utils/formatters';
import DatePicker from './DatePicker';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const filtered = data.invoices.filter(i => 
      i.customerName.includes(searchTerm) || 
      toPersianNumbers(i.customerPhone || '').includes(toPersianNumbers(searchTerm))
    );
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(i => i.id));
    }
  };

  const bulkDeleteInvoices = () => {
    if (!confirm(`آیا از حذف ${toPersianNumbers(selectedIds.length)} فاکتور و بازگشت خودکار تمامی کالاها به انبار اطمینان دارید؟`)) return;

    let updatedProducts = [...data.products];
    const invoicesToDelete = data.invoices.filter(inv => selectedIds.includes(inv.id));

    invoicesToDelete.forEach(inv => {
      inv.items.forEach(soldItem => {
        const prodIdx = updatedProducts.findIndex(p => p.id === soldItem.productId);
        if (prodIdx > -1) {
          updatedProducts[prodIdx] = {
            ...updatedProducts[prodIdx],
            quantity: updatedProducts[prodIdx].quantity + soldItem.quantity
          };
        }
      });
    });

    setData({
      ...data,
      invoices: data.invoices.filter(inv => !selectedIds.includes(inv.id)),
      products: updatedProducts
    });
    setSelectedIds([]);
  };

  const downloadInvoiceTemplate = () => {
    const templateData = [
      {
        'نام مشتری': 'علی علوی',
        'شماره تماس': '09120000000',
        'آدرس': 'سیرجان، بلوار اصلی',
        'کد کالا': '1001',
        'تعداد': '2',
        'تاریخ': getCurrentJalaliDate()
      },
      {
        'نام مشتری': 'علی علوی',
        'شماره تماس': '09120000000',
        'آدرس': 'سیرجان، بلوار اصلی',
        'کد کالا': '1002',
        'تعداد': '1',
        'تاریخ': getCurrentJalaliDate()
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices_Template");
    XLSX.writeFile(wb, "SirjanPoosh_Invoice_Import_Template.xlsx");
  };

  const exportAllInvoicesToExcel = () => {
    const targetInvoices = selectedIds.length > 0 
      ? data.invoices.filter(inv => selectedIds.includes(inv.id))
      : data.invoices;

    const wsData = targetInvoices.flatMap(inv => 
      inv.items.map(item => ({
        'شناسه فاکتور': toEnglishDigits(inv.id),
        'تاریخ': toEnglishDigits(inv.date),
        'نام مشتری': inv.customerName,
        'شماره تماس': toEnglishDigits(inv.customerPhone || ''),
        'آدرس': inv.customerAddress,
        'نام کالا': item.name,
        'تعداد': item.quantity,
        'قیمت واحد (تومان)': item.price,
        'جمع ردیف (تومان)': item.price * item.quantity,
        'جمع کل فاکتور (تومان)': inv.totalAmount,
        'ثبت کننده': inv.registeredBy
      }))
    );

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices_Report");
    XLSX.writeFile(wb, `Invoices_Report_${toEnglishDigits(getCurrentJalaliDate()).replace(/\//g, '-')}.xlsx`);
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) throw new Error('فایل اکسل خالی است.');

        const groups: Record<string, any[]> = {};
        rawData.forEach((row: any) => {
          const key = `${row['نام مشتری']}_${row['تاریخ']}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(row);
        });

        const newInvoices: Invoice[] = [];
        let currentProducts = [...data.products];
        let errors: string[] = [];

        Object.values(groups).forEach((groupRows, index) => {
          const firstRow = groupRows[0];
          const invoiceItems: InvoiceItem[] = [];
          let totalAmount = 0;

          groupRows.forEach(row => {
            const productCode = toEnglishDigits(String(row['کد کالا'] || '')).trim();
            const product = currentProducts.find(p => toEnglishDigits(p.code).trim() === productCode);
            const quantity = parseRawNumber(row['تعداد']);

            if (!product) {
              errors.push(`کالایی با کد ${productCode} برای مشتری ${row['نام مشتری']} یافت نشد.`);
              return;
            }

            if (product.quantity < quantity) {
              errors.push(`موجودی کالای ${product.name} برای فاکتور ${row['نام مشتری']} کافی نیست.`);
              return;
            }

            const prodIdx = currentProducts.findIndex(p => p.id === product.id);
            currentProducts[prodIdx] = { ...currentProducts[prodIdx], quantity: currentProducts[prodIdx].quantity - quantity };

            invoiceItems.push({
              productId: product.id,
              name: product.name,
              quantity: quantity,
              price: product.sellPrice
            });
            totalAmount += product.sellPrice * quantity;
          });

          if (invoiceItems.length > 0) {
            newInvoices.push({
              id: (Date.now() + index).toString(),
              customerName: firstRow['نام مشتری'],
              customerPhone: toPersianNumbers(firstRow['شماره تماس'] || ''),
              customerAddress: firstRow['آدرس'] || '',
              items: invoiceItems,
              totalAmount,
              date: toPersianNumbers(firstRow['تاریخ'] || getCurrentJalaliDate()),
              registeredBy: currentUser.username
            });
          }
        });

        if (errors.length > 0) {
          alert('⚠️ برخی ردیف‌ها با خطا مواجه شدند:\n' + errors.join('\n'));
        }

        if (newInvoices.length > 0) {
          setData({
            ...data,
            invoices: [...data.invoices, ...newInvoices],
            products: currentProducts
          });
          alert(`✅ تعداد ${toPersianNumbers(newInvoices.length)} فاکتور با موفقیت از اکسل وارد شد.`);
        }
      } catch (err: any) {
        alert('❌ خطا در پردازش اکسل: ' + err.message);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const captureInvoice = async () => {
    if (!invoiceRef.current) return null;
    await document.fonts.ready;
    const originalTransform = invoiceRef.current.style.transform;
    invoiceRef.current.style.transform = 'none';
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 4, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      return canvas;
    } finally {
      invoiceRef.current.style.transform = originalTransform;
    }
  };

  const downloadJPG = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureInvoice();
      if (!canvas) return;
      const link = document.createElement('a');
      const safeName = toEnglishDigits(showPrintModal?.customerName || 'Customer').replace(/\s+/g, '_');
      link.download = `Invoice_${safeName}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.98);
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureInvoice();
      if (!canvas) return;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a5', compress: true });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
      const safeName = toEnglishDigits(showPrintModal?.customerName || 'Customer').replace(/\s+/g, '_');
      pdf.save(`Invoice_${safeName}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = data.invoices.filter(i => 
    i.customerName.includes(searchTerm) || 
    toPersianNumbers(i.customerPhone || '').includes(toPersianNumbers(searchTerm))
  ).reverse();

  return (
    <div className="space-y-6 animate-slide-up pb-32">
      {/* نوار ابزار حذف دسته‌جمعی */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 backdrop-blur-xl px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 border border-white/10 animate-slide-up no-print">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">انتخاب شده</span>
            <span className="text-white font-black text-xl">{toPersianNumbers(selectedIds.length)} فاکتور</span>
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="flex gap-3">
            <button onClick={bulkDeleteInvoices} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-red-500/20 active:scale-95">🗑️ حذف گروهی و بازگشت به انبار</button>
            <button onClick={() => setSelectedIds([])} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95">انصراف</button>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-white p-5 md:p-6 rounded-[2.2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 no-print">
        <div className="relative w-full md:flex-1 flex gap-2">
          <div className="relative flex-1">
            <input placeholder="🔍 جستجوی مشتری یا شماره تماس..." className="w-full pr-12 py-4.5 bg-slate-50 border-none rounded-2xl font-bold outline-none shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          </div>
          <button 
            onClick={toggleSelectAll} 
            className={`px-5 py-4.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap ${selectedIds.length === filtered.length && filtered.length > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {selectedIds.length === filtered.length && filtered.length > 0 ? '✓ لغو انتخاب' : '📋 انتخاب همه'}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => { setEditingInvoice(null); setCustomerName(''); setCustomerAddress(''); setCustomerPhone(''); setInvoiceDate(getCurrentJalaliDate()); setItems([]); setShowModal(true); }} className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4.5 rounded-[1.5rem] font-black shadow-xl hover:bg-indigo-700 text-sm min-h-[56px] transition-all active:scale-95">
            + صدور فاکتور
          </button>
          
          <div className="flex gap-2">
            <button onClick={exportAllInvoicesToExcel} className="bg-blue-600 text-white px-5 py-4.5 rounded-2xl font-black hover:bg-blue-700 shadow-xl transition-all active:scale-95 flex items-center justify-center text-lg" title="خروجی اکسل گزارش">
              📊
            </button>
            
            <div className="relative overflow-hidden bg-emerald-600 text-white px-5 py-4.5 rounded-2xl font-black hover:bg-emerald-700 shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer min-h-[56px]">
              <input type="file" accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleExcelImport} disabled={isImporting} />
              <span className="text-lg">📥</span>
              <span className="text-xs whitespace-nowrap">{isImporting ? 'در حال بارگذاری...' : 'ورود از اکسل'}</span>
            </div>
            
            <button onClick={downloadInvoiceTemplate} className="bg-slate-100 text-slate-600 px-5 py-4.5 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-2 min-h-[56px]" title="دانلود قالب اکسل فاکتور">
              <span className="text-lg">📄</span>
              <span className="text-[10px] hidden sm:inline">نمونه</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        {filtered.map(inv => {
          const isSelected = selectedIds.includes(inv.id);
          return (
            <div key={inv.id} onClick={() => toggleSelect(inv.id)} className={`bg-white p-7 md:p-8 rounded-[2.5rem] shadow-sm border-2 transition-all relative cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-50/10 shadow-xl' : 'border-slate-100 hover:shadow-xl'}`}>
              <div className={`absolute top-0 right-0 w-2 h-full rounded-r-full transition-colors ${isSelected ? 'bg-indigo-600' : 'bg-indigo-100'}`}></div>
              
              {/* چک باکس بصری */}
              <div className={`absolute top-5 left-5 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 bg-white'}`}>
                {isSelected && <span className="text-white text-xs">✓</span>}
              </div>

              <div className="flex justify-between items-start mb-6 mt-4">
                <div className="overflow-hidden">
                  <p className="text-[9px] font-black text-indigo-500 mb-1">فاکتور #{toPersianNumbers(inv.id.slice(-4))}</p>
                  <h4 className="text-xl font-black text-slate-800 truncate">{inv.customerName}</h4>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">{toPersianNumbers(inv.date)}</span>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100/50">
                <p className="text-[9px] font-black text-slate-400 mb-1">مبلغ نهایی</p>
                <p className="text-2xl font-black text-emerald-600 truncate">{formatCurrency(inv.totalAmount)}</p>
              </div>
              <div className="flex gap-2.5" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowPrintModal(inv)} className="flex-1 bg-indigo-50 text-indigo-600 py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all">👁️ نمایش</button>
                <button onClick={() => handleEdit(inv)} className="flex-1 bg-blue-50 text-blue-600 py-3.5 rounded-2xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all">📝 ویرایش</button>
                <button onClick={() => deleteInvoice(inv.id)} className="bg-red-50 text-red-500 px-4 rounded-2xl font-black text-sm transition-all active:scale-90">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 z-[2000] overflow-y-auto no-print">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-4xl md:rounded-[3.5rem] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="text-lg md:text-2xl font-black">{editingInvoice ? 'ویرایش فاکتور' : 'صدور فاکتور جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-2xl hover:bg-red-500 transition-all">&times;</button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 mr-2 uppercase">نام مشتری</label><input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none" value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 mr-2 uppercase">شماره تماس</label><input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none text-center" value={toPersianNumbers(customerPhone)} onChange={e => setCustomerPhone(e.target.value)} /></div>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1"><label className="text-[10px] font-black text-slate-500 mr-2 uppercase">آدرس</label><input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} /></div>
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
          <div className="max-w-[148mm] w-full flex flex-wrap justify-between items-center gap-4 mb-8 bg-white/10 p-4 rounded-3xl border border-white/10 no-print">
            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all flex items-center gap-2">
                <span>🖨️ چاپ فاکتور (A5)</span>
              </button>
              <button onClick={downloadPDF} disabled={isExporting} className="bg-red-500 text-white px-5 py-3 rounded-2xl font-black text-xs hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50">
                <span>📄 دانلود PDF</span>
              </button>
              <button onClick={downloadJPG} disabled={isExporting} className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50">
                <span>🖼️ دانلود عکس</span>
              </button>
            </div>
            <button onClick={() => setShowPrintModal(null)} className="w-10 h-10 flex items-center justify-center bg-white/20 text-white rounded-xl hover:bg-red-500 transition-all text-xl font-light">&times;</button>
          </div>

          <div className="invoice-preview-wrapper w-full flex justify-center pb-20">
            <div ref={invoiceRef} id="printable-invoice" className="invoice-preview-container bg-white flex flex-col rtl-fix">
              <div className="flex justify-between items-start mb-10 pt-4">
                <div className="rtl-fix">
                   <h1 className="text-4xl font-black text-slate-900 mb-1 leading-none">سیرجان پوش</h1>
                </div>
                <div className="bg-slate-50 p-4 rounded-[1.5rem] border-2 border-slate-100 min-w-[140px] text-center rtl-fix">
                   <h2 className="text-base font-black text-indigo-600 mb-2 border-b border-indigo-100 pb-1">فاکتور فروش</h2>
                   <div className="space-y-1.5 text-[10px] font-black">
                      <div className="flex justify-between gap-4 text-slate-400"><span>شماره:</span><span className="text-slate-900">{toPersianNumbers(showPrintModal.id.slice(-4))}</span></div>
                      <div className="flex justify-between gap-4 text-slate-400"><span>تاریخ:</span><span className="text-slate-900">{toPersianNumbers(showPrintModal.date)}</span></div>
                   </div>
                </div>
             </div>

             <div className="mb-8 rtl-fix">
                <div className="bg-slate-900 p-6 rounded-[1.8rem] text-white shadow-xl relative overflow-hidden">
                   <div className="relative z-10 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                        <div className="space-y-1 flex-1">
                          <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">مشتری گرامی (Buyer)</p>
                          <p className="text-xl font-black text-white leading-tight break-words">{showPrintModal.customerName}</p>
                        </div>
                        {showPrintModal.customerPhone && (
                          <div className="bg-emerald-500 text-slate-900 px-4 py-2 rounded-xl font-black text-xs shadow-lg shrink-0 h-fit">
                             {toPersianNumbers(showPrintModal.customerPhone)} 📞
                          </div>
                        )}
                      </div>
                      {showPrintModal.customerAddress && (
                        <div className="space-y-1">
                          <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">نشانی ارسال (Address)</p>
                          <p className="text-[12px] font-bold text-slate-300 leading-relaxed break-words">{showPrintModal.customerAddress}</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             <div className="flex-1 overflow-hidden rtl-fix">
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                   <thead>
                      <tr className="bg-slate-50 text-slate-500">
                         <th className="p-3 text-right font-black text-[10px] border-b-2 border-slate-100" style={{ width: '45%' }}>شرح کالا</th>
                         <th className="p-3 text-center font-black text-[10px] border-b-2 border-slate-100" style={{ width: '15%' }}>تعداد</th>
                         <th className="p-3 text-center font-black text-[10px] border-b-2 border-slate-100" style={{ width: '20%' }}>فی</th>
                         <th className="p-3 text-center font-black text-[10px] border-b-2 border-slate-100" style={{ width: '20%' }}>جمع کل</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {showPrintModal.items.map((item, i) => (
                         <tr key={i}>
                            <td className="p-3 text-[11px] font-black text-slate-800 break-words whitespace-normal leading-relaxed">{item.name}</td>
                            <td className="p-3 text-center font-black text-[11px] text-slate-600">{toPersianNumbers(item.quantity)}</td>
                            <td className="p-3 text-center font-black text-[10px] text-slate-600">{toPersianNumbers(formatWithCommas(item.price))}</td>
                            <td className="p-3 text-center font-black text-[11px] text-indigo-600">{toPersianNumbers(formatWithCommas(item.price * item.quantity))}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="mt-8 shrink-0 rtl-fix">
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl mb-10">
                   <div>
                      <p className="text-[9px] font-black opacity-40 mb-1 uppercase tracking-widest">مبلغ نهایی (TOTAL)</p>
                      <p className="text-2xl font-black text-emerald-400">{formatCurrency(showPrintModal.totalAmount)}</p>
                   </div>
                   <div className="text-left border-r border-white/10 pr-6">
                      <div className="text-[8px] font-black text-emerald-400 mb-1 uppercase tracking-widest">PAYMENT STATUS</div>
                      <div className="text-base font-black text-white/90">تـسـویه شـد</div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-12 px-4">
                   <div className="text-center relative">
                      <p className="text-[10px] font-black text-slate-400 mb-12 uppercase tracking-widest">مهر و امضای فروشگاه</p>
                      <div className="w-20 h-20 border-2 border-slate-50 rounded-full mx-auto flex items-center justify-center opacity-5">
                        <span className="text-[10px] font-black rotate-45 tracking-[0.2em]">SEAL</span>
                      </div>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 mb-12 uppercase tracking-widest">امضای خریدار</p>
                      <div className="h-20 border-b-2 border-slate-50 flex items-end justify-center pb-2">
                         <span className="text-[9px] font-bold text-slate-100 uppercase tracking-tighter italic opacity-20">Customer Signature</span>
                      </div>
                   </div>
                </div>

                <div className="text-center border-t border-slate-100 pt-8 pb-4">
                   <p className="text-[13px] text-slate-800 font-black leading-loose">
                      از خرید شما سپاسگزاریم. <br/>
                      ممنون از اینکه سیرجان پوش را انتخاب کردید.
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
