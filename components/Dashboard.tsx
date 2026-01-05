
import React from 'react';
import { AppData } from '../types';
import { formatCurrency, toPersianNumbers } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  data: AppData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const totalInventoryValue = data.products.reduce((acc, p) => acc + (p.sellPrice * p.quantity), 0);
  const totalInvestment = data.partners.reduce((acc, p) => acc + p.investment, 0);
  const totalInvoices = data.invoices.length;
  const totalRevenue = data.invoices.reduce((acc, i) => acc + i.totalAmount, 0);

  const chartData = [
    { name: 'ارزش انبار', value: totalInventoryValue },
    { name: 'سرمایه', value: totalInvestment },
    { name: 'فروش', value: totalRevenue },
  ];

  const StatCard = ({ title, value, color, icon, trend }: any) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center justify-between border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
      <div className="relative z-10">
        <p className="text-xs font-black text-gray-400 mb-1 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        {trend && <span className="text-[10px] text-green-500 font-black mt-2 inline-block">+{toPersianNumbers(trend)}٪ رشد</span>}
      </div>
      <div className="text-4xl p-4 rounded-3xl transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: color + '10', color: color }}>{icon}</div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700" style={{ backgroundColor: color }}></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="ارزش موجودی" value={formatCurrency(totalInventoryValue)} color="#6366f1" icon="📦" />
        <StatCard title="سرمایه کل" value={formatCurrency(totalInvestment)} color="#10b981" icon="💰" />
        <StatCard title="فاکتورها" value={toPersianNumbers(totalInvoices)} color="#f59e0b" icon="📄" />
        <StatCard title="کل فروش" value={formatCurrency(totalRevenue)} color="#ec4899" icon="📈" trend="۱۲" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-black text-gray-800">تحلیل وضعیت مالی</h3>
            <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">گزارش لحظه‌ای</span>
          </div>
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-indigo-950 p-4 rounded-2xl shadow-2xl border border-white/10">
                          <p className="text-indigo-200 text-[10px] font-black mb-1">{payload[0].payload.name}</p>
                          <p className="text-white font-black">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[15, 15, 15, 15]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : index === 1 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Partners Shares */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-8">سهم مشارکت</h3>
          <div className="space-y-8">
            {data.partners.map(partner => {
              const share = totalInvestment > 0 ? (partner.investment / totalInvestment) * 100 : 0;
              return (
                <div key={partner.id} className="group">
                  <div className="flex justify-between mb-3">
                    <span className="font-black text-gray-700 text-sm group-hover:text-indigo-600 transition-colors">{partner.name}</span>
                    <span className="text-xs text-gray-400 font-black">{toPersianNumbers(share.toFixed(1))}%</span>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-4 p-1 border border-gray-100">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 relative" 
                      style={{ width: `${share}%` }}
                    >
                       <div className="absolute top-0 right-0 h-full w-2 bg-white/20 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-2 mr-1">{formatCurrency(partner.investment)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Latest Invoices Table */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="text-lg font-black text-gray-800 mb-6">آخرین تراکنش‌ها</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                <th className="pb-4 px-4">مشتری</th>
                <th className="pb-4 px-4 text-center">تاریخ</th>
                <th className="pb-4 px-4">مبلغ نهایی</th>
                <th className="pb-4 px-4 text-center">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.invoices.slice(-5).reverse().map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-all duration-300 group">
                  <td className="py-5 px-4 font-black text-gray-800">{inv.customerName}</td>
                  <td className="py-5 px-4 text-center text-xs text-gray-400 font-bold">{toPersianNumbers(inv.date)}</td>
                  <td className="py-5 px-4 font-black text-indigo-900">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-5 px-4 text-center">
                    <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black group-hover:bg-green-600 group-hover:text-white transition-colors">موفق</span>
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
