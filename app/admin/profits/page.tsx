// app/admin/profits/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProfitPage() {
  const [period, setPeriod] = useState('month');
  const [sales, setSales] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    revenue: 0,
    cost: 0,
    profit: 0,
    dogSales: 0,
    productSales: 0
  });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const { data } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      setSales(data);
      
      const dogSales = data.filter(s => s.item_type === 'dog');
      const productSales = data.filter(s => s.item_type === 'product');
      
      setSummary({
        revenue: data.reduce((sum, s) => sum + s.sale_price, 0),
        cost: data.reduce((sum, s) => sum + (s.cost || 0), 0),
        profit: data.reduce((sum, s) => sum + (s.profit || 0), 0),
        dogSales: dogSales.reduce((sum, s) => sum + s.sale_price, 0),
        productSales: productSales.reduce((sum, s) => sum + s.sale_price, 0)
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Profit Calculator</h1>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded ${
                period === p ? 'bg-black text-white' : 'bg-white border'
              }`}
            >
              {p === 'week' ? 'Last 7 Days' : p === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              ₦{summary.revenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="text-3xl font-bold text-red-600">
              ₦{summary.cost.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Net Profit</p>
            <p className="text-3xl font-bold text-blue-600">
              ₦{summary.profit.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Margin</p>
            <p className="text-3xl font-bold">
              {summary.revenue ? Math.round((summary.profit / summary.revenue) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Dog Sales</h2>
            <p className="text-2xl font-bold text-green-600">
              ₦{summary.dogSales.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              {sales.filter(s => s.item_type === 'dog').length} dogs sold
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Product Sales</h2>
            <p className="text-2xl font-bold text-green-600">
              ₦{summary.productSales.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              {sales.filter(s => s.item_type === 'product').length} products sold
            </p>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-bold p-6 border-b">Recent Sales</h2>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-right">Sale Price</th>
                <th className="p-3 text-right">Cost</th>
                <th className="p-3 text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-t">
                  <td className="p-3">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {sale.item_type === 'dog' ? '🐕 Dog' : '🛍️ Product'}
                  </td>
                  <td className="p-3">{sale.customer_name}</td>
                  <td className="p-3 text-right">₦{sale.sale_price.toLocaleString()}</td>
                  <td className="p-3 text-right">₦{sale.cost?.toLocaleString() || 0}</td>
                  <td className="p-3 text-right font-bold text-green-600">
                    ₦{sale.profit?.toLocaleString() || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}