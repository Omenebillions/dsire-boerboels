// app/admin/reports/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAllReports();
  }, [period]);

  const fetchAllReports = async () => {
    setLoading(true);
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);

    const startDateStr = startDate.toISOString();

    try {
      const [salesRes, ordersRes, expensesRes, dogsRes, productsRes] = await Promise.all([
        supabase.from('sales').select('*').gte('sale_date', startDateStr.split('T')[0]),
        supabase.from('orders').select('*').gte('created_at', startDateStr),
        supabase.from('expenses').select('*').gte('date', startDateStr.split('T')[0]),
        supabase.from('dogs').select('*'),
        supabase.from('products').select('*')
      ]);

      const sales = salesRes.data || [];
      const orders = ordersRes.data || [];
      const expenses = expensesRes.data || [];
      const dogs = dogsRes.data || [];
      const products = productsRes.data || [];
      
      // Initialize accumulators
      let dogRevenue = 0;
      let shopRevenue = 0;
      let totalGrossProfit = 0;
      let pendingAmount = 0;

      // 1. Process Manual Sales & Dog Deposits
      sales.forEach(s => {
        const amount = Number(s.price || 0);
        
        // Track revenue by source
        if (s.item_type === 'dog') {
          dogRevenue += amount;
        } else {
          shopRevenue += amount;
        }
        
        // Calculate profit (use actual cost if available, otherwise estimate 40% margin)
        const cost = s.cost ? Number(s.cost) : amount * 0.6;
        totalGrossProfit += (amount - cost);
      });

      // 2. Process Online Orders (PawShop)
      orders.forEach(o => {
        const isPaid = ['paid', 'completed'].includes(o.payment_status?.toLowerCase());
        const total = Number(o.total_amount || 0);
        
        if (isPaid) {
          shopRevenue += total;
          
          // Calculate actual profit based on product costs
          const items = Array.isArray(o.items) ? o.items : [];
          let orderCost = 0;
          
          items.forEach((item: any) => {
            const product = products.find(p => p.id === item.product_id);
            const quantity = item.quantity || 1;
            
            if (product?.cost) {
              // Use actual cost from database
              orderCost += Number(product.cost) * quantity;
            } else {
              // Estimate 40% margin (60% cost) as fallback
              orderCost += item.price * 0.6 * quantity;
            }
          });
          
          totalGrossProfit += (total - orderCost);
        } else {
          pendingAmount += total;
        }
      });

      // 3. Pending Balances for Dogs (Expected Revenue)
      dogs.forEach(d => {
        if (d.status === 'reserved' && d.price) {
          const balance = Number(d.price) - 100000;
          pendingAmount += Math.max(0, balance);
        }
      });

      // 4. Calculate Expenses
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      
      const expensesByCat = expenses.reduce((acc: any, e) => {
        const cat = e.category || 'Other';
        acc[cat] = (acc[cat] || 0) + Number(e.amount || 0);
        return acc;
      }, {});

      // 5. Final Calculations
      const totalRevenue = dogRevenue + shopRevenue;
      const netIncome = totalGrossProfit - totalExpenses;
      const margin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

      setData({
        revenue: {
          total: totalRevenue,
          dogs: dogRevenue,
          shop: shopRevenue,
        },
        profit: {
          gross: totalGrossProfit,
          net: netIncome,
          margin: margin
        },
        expenses: {
          total: totalExpenses,
          categories: expensesByCat
        },
        pending: pendingAmount,
        inventory: {
          dogs: dogs.length,
          products: products.length,
          lowStock: products.filter((p: any) => p.stock > 0 && p.stock < 5).length,
          lowStockItems: products.filter((p: any) => p.stock > 0 && p.stock < 5).slice(0, 3)
        }
      });

    } catch (error) {
      console.error('Audit Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-black text-slate-400">CALCULATING REVENUE...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">FINANCIALS</h1>
            <p className="text-slate-500 font-medium">Business Intelligence Dashboard</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {['week', 'month', 'year'].map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)} 
                className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${
                  period === p ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {/* MAIN METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-4xl font-black text-slate-900">₦{data.revenue.total.toLocaleString()}</p>
            <div className="mt-4 flex gap-2">
              <div className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                🐕 Kennel: ₦{data.revenue.dogs.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded">
                🛒 Shop: ₦{data.revenue.shop.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expenses</p>
            <p className="text-4xl font-black text-rose-600">₦{data.expenses.total.toLocaleString()}</p>
            <p className="text-xs font-bold text-slate-400 mt-2 italic">Operating costs including inventory & utilities</p>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Net Profit</p>
            <p className="text-4xl font-black text-white">₦{data.profit.net.toLocaleString()}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold">MARGIN</span>
              <span className="text-xl font-black text-emerald-400">{data.profit.margin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* SECONDARY INSIGHTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-amber-400 p-8 rounded-3xl text-amber-950">
            <h3 className="font-black text-xl mb-1 uppercase tracking-tighter">Accounts Receivable</h3>
            <p className="text-sm font-medium opacity-80 mb-6">Uncollected balances from reserved dogs and open orders.</p>
            <p className="text-5xl font-black">₦{data.pending.toLocaleString()}</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-900 text-lg mb-4">Inventory & Stock</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-2xl font-black">{data.inventory.dogs}</p>
                <p className="text-[10px] font-bold text-slate-400">DOGS ONSITE</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-2xl font-black text-orange-600">{data.inventory.lowStock}</p>
                <p className="text-[10px] font-bold text-slate-400">LOW STOCK ITEMS</p>
              </div>
            </div>
            
            {data.inventory.lowStockItems.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Needs Restocking</p>
                {data.inventory.lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-700 font-medium">{item.name}</span>
                    <span className="font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full text-xs">
                      {item.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}