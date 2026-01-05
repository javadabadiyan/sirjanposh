
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
    { name: 'ارزش کالاها', value: totalInventoryValue },
    { name: 'کل سرمایه', value: totalInvestment },
    { name: 'کل فروش', value: totalRevenue },
  ];

  const StatCard = ({ title, value, color, icon }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between border-b-4" style={{ borderColor: color }}>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="text-4xl" style={{ color: color }}>{icon}</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="ارزش موجودی انبار" value={formatCurrency(totalInventoryValue)} color="#6366f1" icon="📦" />
        <StatCard title="کل سرمایه شرکا" value={formatCurrency(totalInvestment)} color="#10b981" icon="💰" />
        <StatCard title="تعداد فاکتورها" value={toPersianNumbers(totalInvoices)} color="#f59e0b" icon="📄" />
        <StatCard title="کل مبلغ فروش" value={formatCurrency(totalRevenue)} color="#ec4899" icon="📈" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6">گزارش وضعیت مالی</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val) => toPersianNumbers(Math.round(val / 1000000)) + ' م'} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : index === 1 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6">سهم شرکا از کل سرمایه</h3>
          <div className="space-y-6">
            {data.partners.map(partner => {
              const share = totalInvestment > 0 ? (partner.investment / totalInvestment) * 100 : 0;
              return (
                <div key={partner.id}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{partner.name}</span>
                    <span className="text-sm text-gray-500">{toPersianNumbers(share.toFixed(1))}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div 
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <p className="text-xs text-left mt-1 text-gray-400">{formatCurrency(partner.investment)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-4">آخرین فاکتورهای صادر شده</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b text-gray-400 text-sm">
                <th className="py-3 px-4">مشتری</th>
                <th className="py-3 px-4">تاریخ</th>
                <th className="py-3 px-4">مبلغ</th>
                <th className="py-3 px-4 text-center">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.slice(-5).reverse().map(inv => (
                <tr key={inv.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 font-medium">{inv.customerName}</td>
                  <td className="py-4 px-4 text-gray-500">{inv.date}</td>
                  <td className="py-4 px-4 font-bold">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">پرداخت شده</span>
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
