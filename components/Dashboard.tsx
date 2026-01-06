
import React from 'react';
import { AppData } from '../types';
import { formatCurrency, toPersianNumbers } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  data: AppData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const totalProducts = data.products?.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0) || 0;
  const productTypesCount = data.products?.length || 0;
  const totalUsers = data.users?.length || 0;
  const totalInvoices = data.invoices?.length || 0;
  
  const totalInvestment = data.partners?.reduce((acc, p) => 
    acc + (p.investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0), 0) || 0;
    
  const totalRevenue = data.invoices?.reduce((acc, i) => acc + (i.totalAmount || 0), 0) || 0;
  const totalPaidDividends = data.payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;

  const lowStockProducts = data.products.filter(p => p.quantity <= 3);

  const salesMap: Record<string, number> = {};
  data.invoices.forEach(inv => {
    inv.items.forEach(item => {
      salesMap[item.name] = (salesMap[item.name] || 0) + item.quantity;
    });
  });
  const bestSeller = Object.entries(salesMap).sort((a, b) => b[1] - a[1])[0] || ["موردی یافت نشد", 0];

  const chartData = [
    { name: 'فروش', value: totalRevenue, color: '#6366f1' },
    { name: 'سرمایه', value: totalInvestment, color: '#10b981' },
    { name: 'سود', value: totalPaidDividends, color: '#f59e0b' },
  ];

  const StatCard = ({ title, value, color, icon, sub }: any) => (
    <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm flex items-center justify-between border border-gray-100 hover:shadow-lg transition-all group overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <p className="text-[8px] md:text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest truncate">{title}</p>
        <p className="text-base md:text-xl font-black text-gray-900 truncate">{value}</p>
        {sub && <p className="text-[8px] md:text-[9px] text-indigo-500 font-bold mt-0.5 truncate">{sub}</p>}
      </div>
      <div className="text-xl md:text-3xl p-2.5 md:p-4 rounded-xl md:rounded-2xl transition-transform group-hover:scale-110 mr-2 md:mr-3" style={{ backgroundColor: color + '10', color: color }}>{icon}</div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-8 animate-fadeIn pb-10 w-full">
      {/* ردیف اول: آمار کلی */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard title="سرمایه کل" value={formatCurrency(totalInvestment)} color="#10b981" icon="💰" sub={`${toPersianNumbers(data.partners.length)} شریک`} />
        <StatCard title="کل فروش" value={formatCurrency(totalRevenue)} color="#6366f1" icon="📈" sub={`${toPersianNumbers(totalInvoices)} فاکتور`} />
        <StatCard title="کل موجودی" value={toPersianNumbers(totalProducts)} color="#f59e0b" icon="👕" sub={`${toPersianNumbers(productTypesCount)} مدل`} />
        <StatCard title="کاربران" value={toPersianNumbers(totalUsers)} color="#ec4899" icon="👥" sub="فعال" />
      </div>

      {/* ردیف دوم: نمودار و بخش‌های کناری */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-[1.8rem] md:rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="text-sm md:text-lg font-black text-gray-800 mb-4 md:mb-10">📊 وضعیت مالی کل</h3>
          <div className="h-[200px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} dy={5} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-right">
                          <p className="font-black text-xs">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[5, 5, 5, 5]} barSize={30}>
                  {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-indigo-600 p-5 md:p-8 rounded-[1.8rem] md:rounded-[3rem] text-white shadow-xl relative overflow-hidden h-fit">
            <div className="relative z-10">
              <p className="text-[8px] font-black opacity-60 mb-1 uppercase tracking-widest">پرفروش‌ترین محصول</p>
              <h4 className="text-base md:text-xl font-black mb-1 truncate">{bestSeller[0]}</h4>
              <p className="text-[10px] font-bold opacity-80">{toPersianNumbers(bestSeller[1])} عدد فروش</p>
            </div>
            <div className="absolute -bottom-4 -right-4 text-6xl opacity-10">🏆</div>
          </div>

          <div className="bg-white p-5 md:p-8 rounded-[1.8rem] md:rounded-[3rem] shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-gray-800 text-xs md:text-sm">کالاهای رو به اتمام</h3>
                <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-md text-[8px] font-black">{toPersianNumbers(lowStockProducts.length)}</span>
             </div>
             <div className="space-y-2">
                {lowStockProducts.slice(0, 3).map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2.5 bg-red-50/30 rounded-xl border border-red-50">
                    <p className="text-[10px] font-black text-slate-800 truncate pr-2">{p.name}</p>
                    <span className="text-[10px] font-black text-red-600 whitespace-nowrap">{toPersianNumbers(p.quantity)} عدد</span>
                  </div>
                ))}
                {lowStockProducts.length === 0 && <p className="text-center text-[9px] text-slate-300 font-bold py-2">همه کالاها کافی هستند ✅</p>}
             </div>
          </div>
        </div>
      </div>

      {/* بخش آخرین تراکنش‌ها - بهینه شده برای اسکرول افقی موبایل */}
      <div className="bg-white p-4 md:p-8 rounded-[1.8rem] md:rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm md:text-lg font-black text-gray-800">آخرین فاکتورها</h3>
          <span className="text-[8px] font-black text-slate-400">۵ مورد آخر</span>
        </div>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full text-right min-w-[450px]">
            <thead>
              <tr className="text-slate-400 text-[8px] md:text-[10px] font-black border-b border-slate-50 uppercase tracking-widest">
                <th className="pb-3 px-2">مشتری</th>
                <th className="pb-3 px-2 text-center">تاریخ</th>
                <th className="pb-3 px-2">مبلغ فاکتور</th>
                <th className="pb-3 px-2 text-center">شناسه</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.slice(-5).reverse().map(inv => (
                <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 px-2 font-black text-slate-800 text-xs">{inv.customerName}</td>
                  <td className="py-3 px-2 text-center text-[10px] font-bold text-slate-400">{toPersianNumbers(inv.date)}</td>
                  <td className="py-3 px-2 font-black text-indigo-700 text-xs">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[9px] font-black">
                      #{toPersianNumbers(inv.id.slice(-3))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
