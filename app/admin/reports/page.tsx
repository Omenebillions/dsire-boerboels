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
        supabase.from('sales').select('*').gte('created_at', startDateStr),
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
      
      // --- ACCOUNTING ENGINE: REVENUE RECOGNITION ---
      
      let dogRevenue = 0;
      let manualProductRevenue = 0;
      let salesGrossProfit = 0;

      // 1. Process "Sales" Table (Dogs & Manual Entries)
      sales.forEach(s => {
        const isPaid = s.payment_status?.toLowerCase() === 'paid';
        
        // REVENUE: If reserved, only the deposit is income. If paid, the full price is income.
        const cashReceived = isPaid ? Number(s.price || s.sale_price || 0) : Number(s.deposit_amount || 0);
        
        if (s.item_type === 'dog') {
          dogRevenue += cashReceived;
          // PROFIT: Money in hand minus the cost of the dog
          salesGrossProfit += (cashReceived - Number(s.cost || 0));
        } else {
          manualProductRevenue += cashReceived;
          salesGrossProfit += Number(s.profit || (cashReceived - Number(s.cost || 0)));
        }
      });

      // 2. Process "Orders" Table (PawShop / Online Store)
      const paidOrders = orders.filter(o => 
        o.payment_status?.toLowerCase() === 'paid' || 
        o.payment_status?.toLowerCase() === 'completed'
      );
      
      const orderRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      
      let orderGrossProfit = 0;
      paidOrders.forEach(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        let orderCost = 0;
        
        items.forEach((item: any) => {
          const product = products.find((p: any) => p.id === item.product_id);
          const qty = Number(item.quantity || 1);
          
          if (product?.cost) {
            orderCost += Number(product.cost) * qty;
          } else {
            // Fallback: 40% Margin (60% Cost)
            orderCost += Number(item.price || 0) * 0.6 * qty;
          }
        });
        orderGrossProfit += (Number(order.total_amount || 0) - orderCost);
      });

      // 3. Expenses
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const expensesByCat = expenses.reduce((acc: any, e) => {
        const cat = e.category || 'Other';
        acc[cat] = (acc[cat] || 0) + Number(e.amount || 0);
        return acc;
      }, {});

      // 4. Final Financial Consolidation
      const totalRevenue = dogRevenue + manualProductRevenue + orderRevenue;
      const totalGrossProfit = salesGrossProfit + orderGrossProfit;
      const netIncome = totalGrossProfit - totalExpenses;

      // 5. Pending Balances (Money owed to you)
      const pendingAmount = sales.reduce((sum, s) => {
          if (s.payment_status?.toLowerCase() === 'paid') return sum;
          const balance = Number(s.price || s.sale_price || 0) - Number(s.deposit_amount || 0);
          return sum + balance;
        }, 0) + 
        orders.filter(o => o.payment_status?.toLowerCase() !== 'paid' && o.payment_status?.toLowerCase() !== 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      // 6. Performance Tracking
      const getTopPerformers = (type: string) => {
        const map = new Map();
        sales.filter(s => s.item_type === type && s.payment_status === 'paid').forEach(s => {
          const name = s.item_name || 'Unknown';
          const current = map.get(name) || { count: 0, revenue: 0 };
          map.set(name, { count: current.count + 1, revenue: current.revenue + Number(s.price || s.sale_price || 0) });
        });
        return Array.from(map.entries()).map(([name, stats]: any) => ({ name, ...stats }))
          .sort((a, b) => b.revenue - a.revenue).slice(0, 3);
      };

      setData({
        revenue: {
          total: totalRevenue,
          dogs: dogRevenue,
          shop: manualProductRevenue + orderRevenue,
        },
        profit: {
          gross: totalGrossProfit,
          net: netIncome,
          margin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
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
          outOfStock: products.filter((p: any) => p.stock <= 0).length,
          lowStockItems: products.filter((p: any) => p.stock > 0 && p.stock < 5).slice(0, 3)
        },
        topPerformers: {
          dogs: getTopPerformers('dog'),
          products: getTopPerformers('product')
        }
      });

    } catch (error) {
      console.error('Audit Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return (
    <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center font-bold text-slate-400 animate-pulse">
      SYNCING LEDGERS...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">FINANCIALS</h1>
            <p className="text-slate-500 font-medium">Dog Kennel & PawShop Consolidated Report</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {['week', 'month', 'year'].map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)} 
                className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${
                  period === p ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {/* FINANCIAL GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Realized Revenue</p>
            <p className="text-4xl font-black text-emerald-600">₦{data.revenue.total.toLocaleString()}</p>
            <div className="mt-6 space-y-2 border-t border-slate-50 pt-4">
               <div className="flex justify-between text-xs font-bold text-slate-500">
                 <span>Kennel</span>
                 <span>₦{data.revenue.dogs.toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-xs font-bold text-slate-500">
                 <span>PawShop</span>
                 <span>₦{data.revenue.shop.toLocaleString()}</span>
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Expenses</p>
            <p className="text-4xl font-black text-rose-600">₦{data.expenses.total.toLocaleString()}</p>
            <div className="mt-6 space-y-2 border-t border-slate-50 pt-4">
              {Object.keys(data.expenses.categories).length > 0 ? (
                Object.entries(data.expenses.categories).slice(0, 2).map(([cat, val]: any) => (
                  <div key={cat} className="flex justify-between text-xs font-bold text-slate-500 capitalize">
                    <span>{cat}</span>
                    <span>₦{val.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>No expenses</span>
                  <span>₦0</span>
                </div>
              )}
              {Object.keys(data.expenses.categories).length > 2 && (
                <div className="text-xs text-slate-400 text-right">
                  +{Object.keys(data.expenses.categories).length - 2} more
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Net Income</p>
            <p className="text-4xl font-black text-white">₦{data.profit.net.toLocaleString()}</p>
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Profit Margin</span>
               <span className="text-lg font-black text-emerald-400">{data.profit.margin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* INSIGHTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100">
            <h3 className="text-amber-900 font-black text-lg mb-2">Accounts Receivable</h3>
            <p className="text-amber-700 text-sm mb-6 leading-relaxed">
              Money currently tied up in pending dog balances and unpaid orders.
            </p>
            <p className="text-4xl font-black text-amber-900">₦{data.pending.toLocaleString()}</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-slate-900 font-black text-lg mb-6">Inventory Health</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-2xl font-black">{data.inventory.dogs}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Dogs in Kennel</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-2xl font-black text-orange-600">{data.inventory.lowStock}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Low Stock SKUs</p>
               </div>
            </div>
            
            {/* Low Stock Items List */}
            {data.inventory.lowStockItems.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-3">ITEMS NEEDING ATTENTION</p>
                <div className="space-y-2">
                  {data.inventory.lowStockItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">{item.name}</span>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                        {item.stock} left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TOP PERFORMERS - Optional Add-on */}
        {(data.topPerformers.dogs.length > 0 || data.topPerformers.products.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {data.topPerformers.dogs.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                  <span>🏆</span> Top Selling Dogs
                </h3>
                <div className="space-y-3">
                  {data.topPerformers.dogs.map((dog: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0">
                      <span className="font-medium">{dog.name}</span>
                      <span className="font-bold text-emerald-600">₦{dog.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.topPerformers.products.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                  <span>🏆</span> Top Selling Products
                </h3>
                <div className="space-y-3">
                  {data.topPerformers.products.map((product: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0">
                      <span className="font-medium">{product.name}</span>
                      <span className="font-bold text-emerald-600">₦{product.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}