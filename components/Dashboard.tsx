
import React from 'react';
import { AppData } from '../types';
import { formatCurrency, toPersianNumbers } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  data: AppData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // محاسبات پایه
  const totalProducts = data.products?.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0) || 0;
  const productTypesCount = data.products?.length || 0;
  const totalUsers = data.users?.length || 0;
  const totalInvoices = data.invoices?.length || 0;
  
  const totalInvestment = data.partners?.reduce((acc, p) => 
    acc + (p.investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0), 0) || 0;
    
  const totalRevenue = data.invoices?.reduce((acc, i) => acc + (i.totalAmount || 0), 0) || 0;
  const totalPaidDividends = data.payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;

  // پیدا کردن پرفروش‌ترین کالا
  const salesMap: Record<string, number> = {};
  data.invoices.forEach(inv => {
    inv.items.forEach(item => {
      salesMap[item.name] = (salesMap[item.name] || 0) + item.quantity;
    });
  });
  const bestSeller = Object.entries(salesMap).sort((a, b) => b[1] - a[1])[0] || ["موردی یافت نشد", 0];

  // دیتای نمودار مقایسه‌ای
  const chartData = [
    { name: 'فروش کل', value: totalRevenue, color: '#6366f1' },
    { name: 'سرمایه', value: totalInvestment, color: '#10b981' },
    { name: 'سود پرداختی', value: totalPaidDividends, color: '#f59e0b' },
  ];

  const StatCard = ({ title, value, color, icon, sub }: any) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center justify-between border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      <div>
        <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">{title}</p>
        <p className="text-xl font-black text-gray-900">{value}</p>
        {sub && <p className="text-[10px] text-indigo-500 font-bold mt-1">{sub}</p>}
      </div>
      <div className="text-3xl p-4 rounded-2xl transition-transform group-hover:scale-110" style={{ backgroundColor: color + '10', color: color }}>{icon}</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* ردیف اول: آمارهای کلیدی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="سرمایه کل شرکا" value={formatCurrency(totalInvestment)} color="#10b981" icon="💰" sub={`تعداد شرکا: ${toPersianNumbers(data.partners.length)} نفر`} />
        <StatCard title="کل فروش (فاکتورها)" value={formatCurrency(totalRevenue)} color="#6366f1" icon="📈" sub={`تعداد فاکتور: ${toPersianNumbers(totalInvoices)} عدد`} />
        <StatCard title="تعداد کل اجناس" value={toPersianNumbers(totalProducts)} color="#f59e0b" icon="👕" sub={`تنوع کالا: ${toPersianNumbers(productTypesCount)} مدل`} />
        <StatCard title="کاربران سیستم" value={toPersianNumbers(totalUsers)} color="#ec4899" icon="👥" sub="دسترسی‌های فعال" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* نمودار اصلی */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-10 flex items-center gap-2">📊 وضعیت مالی ماهانه</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 900, fill: '#64748b' }} dy={10} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                          <p className="font-black">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={50}>
                  {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* سایدبار داشبورد */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-black opacity-60 mb-2 uppercase">پرفروش‌ترین کالا</p>
              <h4 className="text-2xl font-black mb-1">{bestSeller[0]}</h4>
              <p className="text-sm font-bold opacity-80">{toPersianNumbers(bestSeller[1])} عدد فروخته شده</p>
            </div>
            <div className="absolute -bottom-6 -right-6 text-9xl opacity-10">🏆</div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 mb-6">سهم سود شرکا</h3>
            <div className="space-y-6">
              {data.partners.map(p => {
                const pInv = p.investments?.reduce((s, i) => s + i.amount, 0) || 0;
                const share = totalInvestment > 0 ? (pInv / totalInvestment) * 100 : 0;
                return (
                  <div key={p.id}>
                    <div className="flex justify-between text-xs font-black mb-2">
                      <span className="text-gray-600">{p.name}</span>
                      <span className="text-indigo-600">{toPersianNumbers(share.toFixed(1))}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${share}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* جدول آخرین فاکتورها */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-gray-800">آخرین فاکتورهای صادر شده</h3>
          <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black">نمایش ۵ مورد آخر</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black border-b border-slate-50">
                <th className="pb-4 px-4">مشتری</th>
                <th className="pb-4 px-4 text-center">تاریخ</th>
                <th className="pb-4 px-4">مبلغ فاکتور</th>
                <th className="pb-4 px-4 text-center">کد رهگیری</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.slice(-5).reverse().map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-4 font-black">{inv.customerName}</td>
                  <td className="py-5 px-4 text-center text-xs font-bold text-slate-400">{toPersianNumbers(inv.date)}</td>
                  <td className="py-5 px-4 font-black text-indigo-700">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-5 px-4 text-center">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black">
                      #{toPersianNumbers(inv.id.slice(-4))}
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
