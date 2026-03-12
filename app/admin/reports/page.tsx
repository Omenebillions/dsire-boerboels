"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'collections'>('overview');
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<any>(null);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
      const [salesRes, ordersRes, expensesRes, dogsRes] = await Promise.all([
        supabase.from('sales').select('*').gte('sale_date', startDateStr.split('T')[0]),
        supabase.from('orders').select('*').gte('created_at', startDateStr),
        supabase.from('expenses').select('*').gte('date', startDateStr.split('T')[0]),
        supabase.from('dogs').select('*')
      ]);

      const sales = salesRes.data || [];
      const orders = ordersRes.data || [];
      const expenses = expensesRes.data || [];
      const dogs = dogsRes.data || [];
      
      let dogRevenue = 0;
      let shopRevenue = 0;
      let pendingTotal = 0;
      let collectionsList: any[] = [];

      sales.forEach(s => {
        if (s.item_type === 'dog') dogRevenue += Number(s.price || 0);
        else shopRevenue += Number(s.price || 0);
      });

      dogs.filter(d => d.status === 'reserved').forEach(d => {
        const balance = (Number(d.price) || 0) - 100000;
        pendingTotal += balance;
        collectionsList.push({ id: d.id, type: 'dog', name: d.name, subtext: 'Dog Balance Due', amount: balance });
      });

      orders.filter(o => !['paid', 'completed'].includes(o.payment_status?.toLowerCase())).forEach(o => {
        const total = Number(o.total_amount || 0);
        pendingTotal += total;
        collectionsList.push({ id: o.id, type: 'order', name: `Order #${o.id.toString().slice(-4)}`, subtext: o.customer_name || 'Web Customer', amount: total });
      });

      setData({
        revenue: { total: dogRevenue + shopRevenue, dogs: dogRevenue, shop: shopRevenue },
        expenses: { total: expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) },
        pending: pendingTotal,
      });
      setPendingItems(collectionsList);

    } catch (error) {
      console.error('Audit Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearItem = async (item: any) => {
    const today = new Date().toISOString().split('T')[0];
    if (item.type === 'dog') {
      await supabase.from('dogs').update({ status: 'sold' }).eq('id', item.id);
      await supabase.from('sales').insert([{
        item_type: 'dog', item_id: item.id, item_name: item.name,
        price: item.amount, payment_status: 'paid', sale_date: today,
        notes: `Balance cleared via Bulk/Collection`
      }]);
    } else {
      await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', item.id);
    }
  };

  const handleBulkClear = async () => {
    if (!confirm(`Are you sure you want to clear all ${pendingItems.length} pending balances? This assumes all cash has been received.`)) return;
    setLoading(true);
    await Promise.all(pendingItems.map(item => clearItem(item)));
    await fetchAllReports();
    setLoading(false);
  };

  const filteredItems = pendingItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.subtext.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black animate-pulse">RECALCULATING LEDGERS...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic">REPORTS</h1>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setActiveTab('overview')} className={`text-xs font-black uppercase tracking-widest pb-1 transition-all ${activeTab === 'overview' ? 'text-slate-900 border-b-4 border-slate-900' : 'text-slate-400'}`}>Overview</button>
              <button onClick={() => setActiveTab('collections')} className={`text-xs font-black uppercase tracking-widest pb-1 transition-all ${activeTab === 'collections' ? 'text-slate-900 border-b-4 border-slate-900' : 'text-slate-400'}`}>Collections ({pendingItems.length})</button>
            </div>
          </div>
        </header>

        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* ... (Overview Cards Same as Before) ... */}
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Realized Revenue</p>
                <p className="text-4xl font-black text-slate-900">₦{data.revenue.total.toLocaleString()}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Expenses</p>
                <p className="text-4xl font-black text-rose-600">₦{data.expenses.total.toLocaleString()}</p>
              </div>
              <div className="bg-slate-900 p-8 rounded-3xl shadow-xl cursor-pointer" onClick={() => setActiveTab('collections')}>
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1 underline">Pending Receivables</p>
                <p className="text-4xl font-black text-white">₦{data.pending.toLocaleString()}</p>
              </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-900 flex flex-col md:flex-row justify-between gap-4">
              <input 
                type="text" 
                placeholder="Search collection items..." 
                className="bg-slate-800 text-white text-xs p-3 rounded-xl border-none w-full md:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                onClick={handleBulkClear}
                className="bg-emerald-500 text-white text-[10px] font-black px-6 py-3 rounded-xl hover:bg-emerald-400 transition uppercase tracking-widest"
              >
                Bulk Clear All (₦{data.pending.toLocaleString()})
              </button>
            </div>
            
            <div className="divide-y">
              {filteredItems.map((item, idx) => (
                <div key={idx} className="p-6 flex justify-between items-center hover:bg-slate-50 transition">
                  <div>
                    <p className="font-black text-slate-900 uppercase">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{item.subtext}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="text-lg font-black text-slate-900">₦{item.amount.toLocaleString()}</p>
                    <button onClick={() => { clearItem(item); fetchAllReports(); }} className="text-[10px] font-black text-emerald-600 hover:underline uppercase">Received</button>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && <div className="p-20 text-center text-slate-400 font-bold uppercase">No items found</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}