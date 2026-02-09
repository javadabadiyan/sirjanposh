
// Fix: Use namespace import for React to resolve JSX intrinsic element errors
import * as React from 'react';
import { useState } from 'react';
import { AppData, Product, User } from '../types';
import { formatCurrency, toPersianNumbers, getCurrentJalaliDate, parseRawNumber, toEnglishDigits, formatWithCommas } from '../utils/formatters';
import DatePicker from './DatePicker';
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
  const [isImporting, setIsImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate()
  });

  const calculateTotalCost = () => parseRawNumber(formData.buyPrice) + parseRawNumber(formData.shippingCost);
  const calculateFinalPrice = () => {
    const total = calculateTotalCost();
    const margin = parseRawNumber(formData.marginPercent);
    return Math.round(total + (total * (margin / 100)));
  };

  const getSoldCount = (productId: string) => {
    return data.invoices.reduce((acc, inv) => {
      const item = inv.items.find(i => i.productId === productId);
      return acc + (item ? item.quantity : 0);
    }, 0);
  };

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedCode = toEnglishDigits(formData.code).trim();
    const duplicateProduct = data.products.find(p => 
      toEnglishDigits(p.code).trim() === normalizedCode && p.id !== (editingProduct?.id || '')
    );

    if (duplicateProduct) {
      const confirmDuplicate = confirm(`⚠️ هشدار: کد کالای "${toPersianNumbers(formData.code)}" قبلاً برای محصول "${duplicateProduct.name}" ثبت شده است. آیا مایلید کالا با کد تکراری ثبت شود؟`);
      if (!confirmDuplicate) return;
    }

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      code: toPersianNumbers(formData.code),
      name: formData.name,
      buyPrice: parseRawNumber(formData.buyPrice),
      shippingCost: parseRawNumber(formData.shippingCost),
      marginPercent: parseRawNumber(formData.marginPercent),
      quantity: parseRawNumber(formData.quantity),
      sellPrice: calculateFinalPrice(),
      date: toPersianNumbers(formData.date || getCurrentJalaliDate()),
      registeredBy: editingProduct ? editingProduct.registeredBy : currentUser.username
    };

    const updatedProducts = editingProduct 
      ? data.products.map(p => p.id === editingProduct.id ? newProduct : p)
      : [...(data.products || []), newProduct];

    setData({ ...data, products: updatedProducts });
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleNumericChange = (field: string, value: string) => {
    const cleanValue = toEnglishDigits(value).replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: cleanValue }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const filtered = data.products.filter(p => 
      p.name.includes(searchTerm) || toPersianNumbers(p.code).includes(toPersianNumbers(searchTerm))
    );
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const bulkDelete = () => {
    if (!confirm(`آیا از حذف ${toPersianNumbers(selectedIds.length)} کالا به صورت دائمی اطمینان دارید؟`)) return;
    setData({
      ...data,
      products: data.products.filter(p => !selectedIds.includes(p.id))
    });
    setSelectedIds([]);
  };

  const exportToExcel = () => {
    const targetProducts = selectedIds.length > 0 
      ? data.products.filter(p => selectedIds.includes(p.id))
      : data.products;

    const wsData = targetProducts.map(p => {
      const sold = getSoldCount(p.id);
      const profitPerUnit = p.sellPrice - (p.buyPrice + p.shippingCost);
      return {
        'کد کالا': toEnglishDigits(p.code),
        'نام کالا': p.name,
        'قیمت خرید اصلی (تومان)': p.buyPrice,
        'هزینه کرایه (تومان)': p.shippingCost,
        'قیمت تمام شده (تومان)': (p.buyPrice + p.shippingCost),
        'مبلغ سود خالص هر عدد (تومان)': profitPerUnit,
        'درصد سود (%)': p.marginPercent,
        'قیمت نهایی فروش (تومان)': p.sellPrice,
        'موجودی فعلی': p.quantity,
        'تعداد فروخته شده': sold,
        'کل ورودی انبار': p.quantity + sold,
        'ثبت کننده': p.registeredBy || 'مدیر سیستم',
        'تاریخ ثبت': toEnglishDigits(p.date)
      };
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory_SirjanPoosh");
    XLSX.writeFile(wb, `Inventory_Report_${toEnglishDigits(getCurrentJalaliDate()).replace(/\//g, '-')}.xlsx`);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'کد کالا': '1001',
        'نام کالا': 'تیشرت نخی طرح‌دار',
        'قیمت خرید': '150000',
        'هزینه کرایه': '5000',
        'درصد سود': '30',
        'موجودی': '10',
        'تاریخ ثبت': getCurrentJalaliDate()
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "SirjanPoosh_Import_Template.xlsx");
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

        const newProducts: Product[] = rawData.map((row: any, index) => {
          const buyPrice = parseRawNumber(row['قیمت خرید'] || 0);
          const shippingCost = parseRawNumber(row['هزینه کرایه'] || 0);
          const marginPercent = parseRawNumber(row['درصد سود'] || 0);
          const totalCost = buyPrice + shippingCost;
          const sellPrice = Math.round(totalCost + (totalCost * (marginPercent / 100)));

          return {
            id: (Date.now() + index).toString(),
            code: toPersianNumbers(row['کد کالا'] || ''),
            name: String(row['نام کالا'] || 'کالای بدون نام'),
            buyPrice,
            shippingCost,
            marginPercent,
            quantity: parseRawNumber(row['موجودی'] || 0),
            sellPrice,
            date: toPersianNumbers(row['تاریخ ثبت'] || getCurrentJalaliDate()),
            registeredBy: currentUser.username
          };
        });

        if (newProducts.length === 0) throw new Error('فایل اکسل خالی است یا فرمت اشتباه دارد.');

        setData({ ...data, products: [...data.products, ...newProducts] });
        alert(`✅ تعداد ${toPersianNumbers(newProducts.length)} کالا با موفقیت وارد شد.`);
      } catch (err: any) {
        alert('❌ خطا در خواندن فایل اکسل: ' + err.message);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filtered = (data.products || []).filter(p => 
    p.name.includes(searchTerm) || toPersianNumbers(p.code).includes(toPersianNumbers(searchTerm))
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn pb-32 w-full">
      {/* نوار ابزار حذف دسته‌جمعی */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 backdrop-blur-xl px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 border border-white/10 animate-slide-up no-print">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">انتخاب شده</span>
            <span className="text-white font-black text-xl">{toPersianNumbers(selectedIds.length)} کالا</span>
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="flex gap-3">
            <button onClick={bulkDelete} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-red-500/20 active:scale-95">🗑️ حذف دسته‌جمعی</button>
            <button onClick={() => setSelectedIds([])} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95">انصراف</button>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-stretch gap-4 bg-white p-5 md:p-7 rounded-[2.2rem] md:rounded-[3rem] shadow-sm border border-slate-100">
        <div className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <input type="text" placeholder="جستجوی نام یا کد کالا..." className="w-full pr-12 py-4.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-sm shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
          </div>
          <button 
            onClick={toggleSelectAll} 
            className={`px-5 py-4.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap ${selectedIds.length === filtered.length && filtered.length > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {selectedIds.length === filtered.length && filtered.length > 0 ? '✓ لغو انتخاب' : '📋 انتخاب همه'}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => { setEditingProduct(null); setFormData({ code: '', name: '', buyPrice: '', shippingCost: '', marginPercent: '', quantity: '', date: getCurrentJalaliDate() }); setShowModal(true); }} className="bg-indigo-600 text-white px-8 py-4.5 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 text-sm">+ کالا جدید</button>
          
          <div className="flex gap-2">
            <div className="relative overflow-hidden bg-emerald-600 text-white px-5 py-4.5 rounded-2xl font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
              <input type="file" accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleExcelImport} disabled={isImporting} />
              <span className="text-lg">📥</span>
              <span className="text-xs whitespace-nowrap">{isImporting ? 'در حال بارگذاری...' : 'ورود دسته جمعی'}</span>
            </div>
            
            <button onClick={downloadTemplate} className="bg-slate-100 text-slate-600 px-5 py-4.5 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-2" title="دانلود نمونه اکسل">
              <span className="text-lg">📄</span>
              <span className="text-[10px] hidden sm:inline">نمونه اکسل</span>
            </button>
            
            <button onClick={exportToExcel} className="bg-blue-600 text-white px-5 py-4.5 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center text-lg" title="خروجی گزارش انبار">
              📊
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filtered.map(p => {
          const sold = getSoldCount(p.id);
          const totalInventory = p.quantity + sold;
          const isLowStock = p.quantity <= 3;
          const unitProfit = p.sellPrice - (p.buyPrice + p.shippingCost);
          const isSelected = selectedIds.includes(p.id);

          return (
            <div key={p.id} onClick={() => toggleSelect(p.id)} className={`bg-white p-5 md:p-7 rounded-[1.8rem] md:rounded-[3rem] border-2 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent'}`}>
              <div className={`absolute top-0 right-0 w-1.5 h-full transition-colors ${isSelected ? 'bg-indigo-600' : isLowStock ? 'bg-red-500 animate-pulse' : 'bg-slate-200'}`}></div>
              
              {/* چک باکس بصری */}
              <div className={`absolute top-5 left-5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
                {isSelected && <span className="text-white text-xs">✓</span>}
              </div>

              <div className="flex justify-between items-start mb-4 md:mb-6 mt-4">
                <div className="space-y-1 overflow-hidden pr-2">
                  <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">{toPersianNumbers(p.code)}</span>
                  <h4 className="font-black text-slate-800 text-base md:text-lg leading-tight truncate">{p.name}</h4>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[8px] text-slate-400 font-bold">ثبت: {toPersianNumbers(p.date)}</p>
                    <p className="text-[8px] text-indigo-400 font-black">توسط: {p.registeredBy || 'ناشناس'}</p>
                  </div>
                </div>
                {isLowStock && !isSelected && (
                  <div className="bg-red-100 text-red-600 p-1.5 rounded-lg text-sm md:text-lg animate-bounce shrink-0">⚠️</div>
                )}
              </div>

              <div className="bg-slate-50 rounded-[1.2rem] md:rounded-[2rem] p-3 md:p-5 mb-4 md:mb-6 border border-slate-100">
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="border-l border-slate-200">
                    <p className="text-[7px] md:text-[9px] font-black text-slate-400 mb-1">ورودی</p>
                    <p className="text-[10px] md:text-xs font-black text-slate-600">{toPersianNumbers(totalInventory)}</p>
                  </div>
                  <div className="border-l border-slate-200">
                    <p className="text-[7px] md:text-[9px] font-black text-indigo-400 mb-1">فروش</p>
                    <p className="text-[10px] md:text-xs font-black text-indigo-700">{toPersianNumbers(sold)}</p>
                  </div>
                  <div>
                    <p className={`text-[7px] md:text-[9px] font-black mb-1 ${isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>مانده</p>
                    <p className={`text-sm md:text-base font-black ${isLowStock ? 'text-red-600' : 'text-emerald-600'}`}>{toPersianNumbers(p.quantity)}</p>
                  </div>
                </div>
              </div>

              <div className="mb-5 bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800">
                 <div className="grid grid-cols-2 text-[9px] font-black text-slate-400 border-b border-slate-800/50">
                    <div className="p-2 border-l border-slate-800/50">عنوان</div>
                    <div className="p-2">مبلغ (تومان)</div>
                 </div>
                 <div className="grid grid-cols-2 text-[10px] border-b border-slate-800/30">
                    <div className="p-2 border-l border-slate-800/30 font-bold">قیمت خرید</div>
                    <div className="p-2 font-black text-slate-200">{formatCurrency(p.buyPrice).replace(' تومان', '')}</div>
                 </div>
                 <div className="grid grid-cols-2 text-[10px] border-b border-slate-800/30">
                    <div className="p-2 border-l border-slate-800/30 font-bold">هزینه کرایه</div>
                    <div className="p-2 font-black text-slate-200">{formatCurrency(p.shippingCost).replace(' تومان', '')}</div>
                 </div>
                 <div className="grid grid-cols-2 text-[10px] bg-emerald-950/30">
                    <div className="p-2 border-l border-slate-800/30 font-black text-emerald-400">سود هر واحد</div>
                    <div className="p-2 font-black text-emerald-400">{formatCurrency(unitProfit).replace(' تومان', '')}</div>
                 </div>
              </div>
              
              <div className="flex justify-between items-center mb-5 px-1">
                <div>
                  <p className="text-[8px] font-black text-slate-400">قیمت نهایی فروش</p>
                  <p className="text-base md:text-lg font-black text-indigo-600">{formatCurrency(p.sellPrice)}</p>
                </div>
                <div className="bg-indigo-50 px-2 py-1 rounded-lg">
                  <p className="text-[10px] font-black text-indigo-700">{toPersianNumbers(p.marginPercent)}٪ سود</p>
                </div>
              </div>

              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditingProduct(p); setFormData({ code: p.code, name: p.name, buyPrice: p.buyPrice.toString(), shippingCost: p.shippingCost.toString(), marginPercent: p.marginPercent.toString(), quantity: p.quantity.toString(), date: p.date }); setShowModal(true); }} className="flex-[2] bg-slate-100 text-slate-700 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 min-h-[44px]">📝 ویرایش</button>
                <button onClick={() => { if(confirm('حذف کالا؟')) setData({...data, products: data.products.filter(item => item.id !== p.id)}) }} className="flex-1 bg-red-50 text-red-500 px-3 rounded-xl md:rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all min-h-[44px]">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/90 backdrop-blur-md safe-padding no-print">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-2xl md:rounded-[2.5rem] shadow-2xl relative z-[1100] flex flex-col animate-fadeIn overflow-hidden">
            <div className="px-5 py-4 md:px-10 md:py-6 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg md:text-xl font-black text-slate-900">{editingProduct ? 'ویرایش کالا' : 'ثبت کالای جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl text-xl transition-all shadow-sm">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 md:p-10 bg-slate-50/30">
              <form id="product-form" onSubmit={saveProduct} className="space-y-4 md:space-y-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 mr-2">کد کالا</label>
                    <input required className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold text-center" value={toPersianNumbers(formData.code)} onChange={e => setFormData({...formData, code: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 mr-2">نام دقیق لباس</label>
                    <input required className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 mr-2">تعداد فعلی</label>
                    <input required type="text" className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-black text-center text-lg text-indigo-700" value={toPersianNumbers(formData.quantity)} onChange={e => handleNumericChange('quantity', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <DatePicker label="تاریخ ثبت" value={formData.date} onChange={val => setFormData({...formData, date: val})} accentColor="indigo" />
                  </div>
                </div>

                <div className="p-4 md:p-6 bg-white rounded-2xl border-2 border-slate-100 shadow-inner space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 text-center block">قیمت خرید</label><input required type="text" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center text-xs" value={toPersianNumbers(formatWithCommas(formData.buyPrice))} onChange={e => handleNumericChange('buyPrice', e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 text-center block">هزینه کرایه</label><input type="text" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center text-xs" value={toPersianNumbers(formatWithCommas(formData.shippingCost))} onChange={e => handleNumericChange('shippingCost', e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 text-center block">درصد سود</label><input type="text" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center text-base text-emerald-600" value={toPersianNumbers(formData.marginPercent)} onChange={e => handleNumericChange('marginPercent', e.target.value)} /></div>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 text-white flex flex-col items-center gap-2 border-2 border-indigo-600/20 text-center">
                    <div className="text-xs">قیمت تمام شده: <span className="font-black">{formatCurrency(calculateTotalCost())}</span></div>
                    <div className="w-full bg-white/5 p-3 rounded-lg border border-white/10">
                      <p className="text-[8px] font-black text-emerald-400 mb-0.5">سود واحد: <span className="font-bold">{formatCurrency(calculateFinalPrice() - calculateTotalCost())}</span></p>
                      <p className="text-xl md:text-2xl font-black text-emerald-400">{formatCurrency(calculateFinalPrice())}</p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-5 py-4 md:px-10 md:py-6 bg-white border-t border-slate-100 flex gap-2 shrink-0">
              <button type="submit" form="product-form" className="flex-2 bg-indigo-600 text-white py-4 rounded-xl font-black text-base md:text-lg shadow-xl hover:bg-indigo-700 transition-all active:scale-95">✅ تایید و ثبت</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-500 px-3 rounded-xl font-black hover:bg-slate-200 text-xs">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
